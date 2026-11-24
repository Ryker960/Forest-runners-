/* CHIMPS RUNNERS - original arm-push locomotion (A-Frame 1.6, Quest 3S WebXR).
   Loaded automatically by forest-map.js. Uses window.ForestCollider from forest-map.js.
   VR: a hand touching ground/platform/trunk "sticks"; moving it pulls the player the other way.
   Releasing keeps momentum. A / X button = jump. Non-VR: MOVE / JUMP buttons, W / Space. */
(function () {
  // ---- tunables ----
  const T = { grav: 12, drag: 2.2, maxSpeed: 7.5, jumpV: 5.2, mobileJump: 6.2, handR: .11, handBoost: .9, climbSpeed: 3, bodyR: .3, bounds: 56 };

  const scene = document.querySelector('a-scene'), P = document.getElementById('player'), cam = document.getElementById('camera'), C = window.ForestCollider;
  if (!scene || !P || !cam || !C) { console.error('Locomotion: missing scene, #player, #camera or ForestCollider (replace forest-map.js too).'); return; }
  const V = THREE.Vector3, vel = new V(), cw = new V(), hw = new V(), n = new V(), dd = new V(), tmp = new V();
  let fw = false, grounded = false;
  const hands = [];

  function jump() { if (grounded) { vel.y = scene.is('vr-mode') ? T.jumpV : T.mobileJump; grounded = false; } }

  // ---- tracked virtual hands on the existing controller entities ----
  P.querySelectorAll('[laser-controls]').forEach(el => {
    const h = { el, ready: false, had: false, touch: false, prev: new V(), cv: new V() };
    const m = document.createElement('a-sphere');
    m.setAttribute('radius', '.075'); m.setAttribute('position', '0 0 0'); m.setAttribute('color', '#b87a3d'); m.setAttribute('material', 'flatShading:true'); m.setAttribute('visible', 'false');
    el.appendChild(m); h.m = m;
    el.setAttribute('raycaster', 'objects:.clickable'); // lasers only hit shop/vent buttons, not the hands
    el.addEventListener('controllerconnected', () => { h.ready = true; m.setAttribute('visible', 'true'); });
    el.addEventListener('controllerdisconnected', () => { h.ready = false; h.had = false; m.setAttribute('visible', 'false'); });
    ['abuttondown', 'xbuttondown'].forEach(e => el.addEventListener(e, jump));
    hands.push(h);
  });

  // ---- mobile / desktop fallback controls ----
  const fb = document.getElementById('forward');
  if (fb) { fb.addEventListener('pointerdown', () => fw = true); ['pointerup', 'pointercancel', 'pointerleave'].forEach(e => fb.addEventListener(e, () => fw = false)); }
  const jb = document.getElementById('jump'); if (jb) jb.onclick = jump;
  addEventListener('keydown', e => { if (e.code === 'KeyW' || e.code === 'ArrowUp') fw = true; if (e.code === 'Space') jump(); });
  addEventListener('keyup', e => { if (e.code === 'KeyW' || e.code === 'ArrowUp') fw = false; });

  function floorAt(x, z, y) {
    let f = C.hillY(x, z);
    for (const q of C.plats) if (x > q.x1 && x < q.x2 && z > q.z1 && z < q.z2 && q.t <= y + .6) f = Math.max(f, q.t);
    return f;
  }
  // deepest overlap of a sphere (w, r) with the map; writes push-out normal to o, returns depth (0 = none)
  function contact(w, r, o) {
    let best = 0;
    const g = C.hillY(w.x, w.z) - (w.y - r); if (g > 0) { best = g; o.set(0, 1, 0); }
    for (const q of C.plats) {
      const b = q.b || 0;
      if (w.x < q.x1 - r || w.x > q.x2 + r || w.z < q.z1 - r || w.z > q.z2 + r || w.y < b - r || w.y > q.t + r) continue;
      const c = [[q.t + r - w.y, 0, 1, 0], [w.y - (b - r), 0, -1, 0], [w.x - (q.x1 - r), -1, 0, 0], [q.x2 + r - w.x, 1, 0, 0], [w.z - (q.z1 - r), 0, 0, -1], [q.z2 + r - w.z, 0, 0, 1]];
      let m = c[0]; for (const k of c) if (k[0] < m[0]) m = k;
      if (m[0] > best) { best = m[0]; o.set(m[1], m[2], m[3]); }
    }
    for (const t of C.climbs) {
      const dx = w.x - t.x, dz = w.z - t.z, d = Math.hypot(dx, dz);
      if (w.y < t.h && d < t.r + r) { const p = t.r + r - d; if (p > best) { best = p; o.set(dx / (d || 1), 0, dz / (d || 1)); } }
    }
    return best;
  }

  AFRAME.registerComponent('chimps-locomotion', {
    tick(time, dms) {
      const dt = Math.min(.05, (dms || 16) / 1000), p = P.object3D.position;
      if (p.y <= -20) return; // moderator vents: no physics
      const vr = scene.is('vr-mode'); let touching = false;

      if (vr) {
        for (const h of hands) {
          if (!h.ready) { h.had = false; continue; }
          // Use world pose for surface contact, but local controller movement for
          // the push delta so moving the player rig does not feed back into the hand.
          const lp = h.el.object3D.position;
          h.m.object3D.getWorldPosition(hw);
          const hit = contact(hw, T.handR, n);
          if (hit > 0 && h.had) {
            dd.copy(lp).sub(h.prev).applyQuaternion(P.object3D.quaternion).multiplyScalar(-T.handBoost);
            p.add(dd); p.addScaledVector(n, hit);
            tmp.copy(dd).divideScalar(dt); h.cv.lerp(tmp, .5);
            vel.copy(h.cv); touching = true;
          }
          if ((hit > 0) !== h.touch) { h.touch = hit > 0; h.m.setAttribute('color', h.touch ? '#ffd23f' : '#b87a3d'); }
          h.prev.copy(lp); h.had = true;
        }
      } else for (const h of hands) h.had = false;

      cam.object3D.getWorldPosition(cw);
      let climbing = false;
      if (!vr && fw) for (const t of C.climbs) if (p.y < t.h + .4 && Math.hypot(cw.x - t.x, cw.z - t.z) < t.r + 1.1) climbing = true;

      if (climbing) { p.y += T.climbSpeed * dt; vel.set(0, 0, 0); }
      else if (!touching) {
        vel.y -= T.grav * dt; vel.multiplyScalar(Math.max(0, 1 - T.drag * dt));
        const sp = vel.length(); if (sp > T.maxSpeed) vel.multiplyScalar(T.maxSpeed / sp);
        p.addScaledVector(vel, dt);
      } else { const sp = vel.length(); if (sp > T.maxSpeed) vel.multiplyScalar(T.maxSpeed / sp); }

      // body collisions: tree trunks, platform sides, floor
      cam.object3D.getWorldPosition(cw);
      for (const t of C.climbs) {
        const dx = cw.x - t.x, dz = cw.z - t.z, d = Math.hypot(dx, dz);
        if (p.y < t.h && d < t.r + T.bodyR) { const k = (t.r + T.bodyR - d) / (d || 1); p.x += dx * k; p.z += dz * k; }
      }
      for (const q of C.plats) {
        const b = q.b || 0, r = T.bodyR;
        if (p.y >= q.t - .25 || p.y + 1.8 < b) continue;
        if (cw.x > q.x1 - r && cw.x < q.x2 + r && cw.z > q.z1 - r && cw.z < q.z2 + r) {
          const a = [cw.x - (q.x1 - r), q.x2 + r - cw.x, cw.z - (q.z1 - r), q.z2 + r - cw.z]; let i = 0;
          for (let k = 1; k < 4; k++) if (a[k] < a[i]) i = k;
          if (i === 0) p.x -= a[0]; else if (i === 1) p.x += a[1]; else if (i === 2) p.z -= a[2]; else p.z += a[3];
          vel.x *= .3; vel.z *= .3;
        }
      }
      cam.object3D.getWorldPosition(cw);
      const fl = floorAt(cw.x, cw.z, p.y);
      grounded = p.y <= fl + .04;
      if (p.y < fl) { p.y = fl; if (vel.y < 0) vel.y = 0; grounded = true; }
      if (grounded && !touching) { vel.x *= .85; vel.z *= .85; }
      const d = Math.hypot(cw.x, cw.z); if (d > T.bounds) { const k = (d - T.bounds) / d; p.x -= cw.x * k; p.z -= cw.z * k; vel.x = vel.z = 0; }
    }
  });
  scene.setAttribute('chimps-locomotion', '');
})();
