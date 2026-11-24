/* CHIMPS RUNNERS - original arm-push locomotion (A-Frame 1.6, Quest 3S controllers, no hand tracking).
   Loaded automatically by forest-map.js. Uses window.ForestCollider from forest-map.js.
   A hand touching ground / platform / trunk stays planted; moving the controller pulls the body the other way.
   Releasing keeps momentum. A / X = jump. Add ?debug to the address to see a live readout in VR. */
(function () {
  const T = { grav: 9.8, drag: .25, maxSpeed: 9, jumpV: 5.5, mobileJump: 6.2, handR: .12, handBoost: 1, maxStep: .5, maxPush: .15, climbSpeed: 3, bodyR: .3, bounds: 56 };

  const scene = document.querySelector('a-scene'), P = document.getElementById('player'), cam = document.getElementById('camera'), C = window.ForestCollider;
  if (!scene || !P || !cam || !C) { console.error('Locomotion: missing scene, #player, #camera or ForestCollider (replace forest-map.js too).'); return; }
  const V = THREE.Vector3, vel = new V(), cw = new V(), hw = new V(), hr = new V(), n = new V(), dd = new V(), tmp = new V(), acc = new V();
  let fw = false, grounded = false, frame = 0;
  const hands = [];

  function jump() { if (grounded) { vel.y = scene.is('vr-mode') ? T.jumpV : T.mobileJump; grounded = false; } }

  // ---- tracked virtual hands: spheres parented to the controller entities, so they sit exactly on the controllers ----
  P.querySelectorAll('[laser-controls]').forEach(el => {
    const cfg = el.getAttribute('laser-controls'), h = { el, name: (cfg && cfg.hand) || '?', evt: false, had: false, touch: false, prev: new V(), cv: new V() };
    const m = document.createElement('a-sphere');
    m.setAttribute('radius', '.075'); m.setAttribute('color', '#b87a3d'); m.setAttribute('material', 'flatShading:true'); m.setAttribute('visible', 'false');
    el.appendChild(m); h.m = m;
    el.setAttribute('raycaster', 'objects:.clickable');
    el.addEventListener('controllerconnected', () => { h.evt = true; });
    el.addEventListener('controllerdisconnected', () => { h.evt = false; h.had = false; });
    ['abuttondown', 'xbuttondown'].forEach(e => el.addEventListener(e, jump));
    hands.push(h);
  });
  // A controller counts as present if the event fired, A-Frame has bound an input source, or the pose has moved off the origin.
  function present(h) {
    const tc = h.el.components && h.el.components['tracked-controls'];
    return h.evt || !!(tc && tc.controller) || h.el.object3D.position.lengthSq() > 1e-6;
  }

  const fb = document.getElementById('forward');
  if (fb) { fb.addEventListener('pointerdown', () => fw = true); ['pointerup', 'pointercancel', 'pointerleave'].forEach(e => fb.addEventListener(e, () => fw = false)); }
  const jb = document.getElementById('jump'); if (jb) jb.onclick = jump;
  addEventListener('keydown', e => { if (e.code === 'KeyW' || e.code === 'ArrowUp') fw = true; if (e.code === 'Space') jump(); });
  addEventListener('keyup', e => { if (e.code === 'KeyW' || e.code === 'ArrowUp') fw = false; });

  let dbg = null;
  if (/[?&]debug/.test(location.search)) {
    dbg = document.createElement('a-text');
    dbg.setAttribute('position', '0 -.3 -1'); dbg.setAttribute('width', '1.4'); dbg.setAttribute('align', 'center'); dbg.setAttribute('color', '#ffff66');
    cam.appendChild(dbg);
  }

  function floorAt(x, z, y) {
    let f = C.hillY(x, z);
    for (const q of C.plats) if (x > q.x1 && x < q.x2 && z > q.z1 && z < q.z2 && q.t <= y + .6) f = Math.max(f, q.t);
    return f;
  }
  // deepest overlap of a sphere (w, r) with the map; writes the push-out normal to o and returns the depth (0 = none)
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
      const vr = scene.is('vr-mode'); let touching = false, cnt = 0, live = 0;
      acc.set(0, 0, 0);

      if (vr) {
        for (const h of hands) {
          const ok = present(h); h.m.setAttribute('visible', ok ? 'true' : 'false');
          if (!ok) { h.had = false; continue; }
          live++;
          h.el.object3D.getWorldPosition(hw);
          hr.copy(hw).sub(p);
          const hit = contact(hw, T.handR, n);
          if (hit > 0 && h.had) {
            dd.copy(hr).sub(h.prev).multiplyScalar(-T.handBoost);
            const mag = dd.length(); if (mag > T.maxStep) dd.multiplyScalar(T.maxStep / mag);
            p.add(dd); p.addScaledVector(n, Math.min(hit, T.maxPush));
            tmp.copy(dd).divideScalar(Math.max(dt, 1 / 90)); h.cv.lerp(tmp, .5);
            acc.add(h.cv); cnt++; touching = true;
          }
          if ((hit > 0) !== h.touch) { h.touch = hit > 0; h.m.setAttribute('color', h.touch ? '#ffd23f' : '#b87a3d'); }
          h.prev.copy(hr); h.had = true;
        }
        if (cnt) vel.copy(acc).divideScalar(cnt);
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

      if (dbg && (++frame % 10 === 0)) dbg.setAttribute('value', (vr ? 'VR' : 'flat') + ' hands:' + live + '/' + hands.length + '\n' +
        hands.map(h => h.name[0].toUpperCase() + (present(h) ? (h.touch ? ' TOUCH' : ' ok') : ' --')).join('  ') + '\nspeed ' + vel.length().toFixed(1) + ' y ' + p.y.toFixed(2));
    }
  });
  scene.setAttribute('chimps-locomotion', '');
})();