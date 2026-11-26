
/* CHIMPS RUNNERS - Main Forest Map (original low-poly assets, Gorilla Tag-style layout)
   Loaded from index.html with: <script src="forest-map.js"></script>
   Replaces the old tree loop. Roles, badges and vent tools stay in index.html (Supabase).
   Movement/physics now lives in gorilla-locomotion.js (loaded at the bottom of this file). */
(function () {
  const F = document.getElementById('forest'), P = document.getElementById('player'),
        cam = document.getElementById('camera'), $ = id => document.getElementById(id);
  if (!F || !P || !cam) { console.error('Forest map: required #forest, #player or #camera element is missing.'); return; }
  F.innerHTML = '';
  let seed = 7; const R = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const mk = (tag, a, par) => { const e = document.createElement(tag); for (const k in a) e.setAttribute(k, a[k]); (par || F).appendChild(e); return e; };
  const plats = [], climbs = [], hills = [];
  const FS = 'flatShading:true';

  function box(x, y, z, w, h, d, c, solid = true) {
    mk('a-box', { position: `${x} ${y} ${z}`, width: w, height: h, depth: d, color: c, material: FS });
    if (solid) plats.push({ x1: x - w / 2, x2: x + w / 2, z1: z - d / 2, z2: z + d / 2, t: y + h / 2, b: y - h / 2 });
  }
  function bigTree(x, z, h, r, leaf, showCanopy = true) {
    mk('a-cylinder', { position: `${x} ${h / 2} ${z}`, radius: r, height: h, color: '#7a4a2a', 'segments-radial': 7, material: FS });
    // Keep the central treehouse interior clear; other trees retain their foliage.
    if (showCanopy) for (let i = 0; i < 4; i++) mk('a-sphere', { position: `${x + (R() - .5) * 4} ${h + 1 + R() * 2} ${z + (R() - .5) * 4}`, radius: 3 + R() * 1.5, color: leaf, 'segments-width': 6, 'segments-height': 5, material: FS });
    climbs.push({ x, z, r, h });
  }
  function pine(x, z, s) {
    mk('a-cylinder', { position: `${x} ${s} ${z}`, radius: .5 * s / 2, height: 2 * s, color: '#6b4226', 'segments-radial': 6 });
    [0, 1, 2].forEach(i => mk('a-cone', { position: `${x} ${2 * s + i * s * .9} ${z}`, 'radius-bottom': (2.4 - i * .6) * s / 2, 'radius-top': 0, height: 2.2 * s / 2 * 1.3, color: ['#2fa84f', '#3cc25a', '#58d96b'][i], 'segments-radial': 6, material: FS }));
  }
  function hillY(x, z) {
    let y = 0; for (const h of hills) { const d = Math.hypot(x - h.x, z - h.z); if (d < h.r) y = Math.max(y, h.h * Math.sqrt(1 - (d / h.r) ** 2)); } return y;
  }

  const pl = document.querySelector('a-plane'); if (pl) pl.setAttribute('color', '#4fd13b');
  const sky = document.querySelector('a-sky'); if (sky) sky.setAttribute('color', '#8fd8ff');
  const scene = document.querySelector('a-scene');
  if (scene) { scene.setAttribute('background', 'color:#8fd8ff'); scene.setAttribute('fog', 'type:linear; color:#bfe8ff; near:40; far:130'); }

  [[-25, 15, 9, 3.5], [22, 28, 11, 4], [-8, 32, 8, 3], [40, 10, 8, 2.5], [-35, 2, 7, 2.5]].forEach(([x, z, r, h]) => {
    hills.push({ x, z, r, h });
    mk('a-sphere', { position: `${x} 0 ${z}`, radius: r, scale: `1 ${h / r} 1`, color: '#63e04a', 'segments-width': 10, 'segments-height': 6, material: FS });
  });

  bigTree(0, 0, 11, 2.3, '#35b34a', false);
  box(0, 8.8, 0, 9, .4, 9, '#c58b4e');
  [[-4.4, 0, .3, 9], [4.4, 0, .3, 9], [0, -4.4, 9, .3]].forEach(([x, z, w, d]) => box(x, 10.3, z, w, 2.6, d, '#e0a860', false));
  mk('a-cone', { position: '0 13.2 0', 'radius-bottom': 7, 'radius-top': 0, height: 3.2, color: '#e5483b', 'segments-radial': 4, rotation: '0 45 0', material: FS });
  mk('a-text', { value: 'CHIMPS RUNNERS', position: '0 11.5 4.5', align: 'center', color: '#fff', width: 9 });
  [2, 4, 6].forEach((y, i) => box(2.9 * Math.cos(i * 2), y, 2.9 * Math.sin(i * 2), 1.6, .3, 1.6, '#b87a3d'));

  [[16, 0], [-16, 0], [0, 16], [0, -16]].forEach(([x, z], i) => {
    bigTree(x, z, 12, 1.6, ['#2fbf4a', '#41d35a', '#28a845', '#4bd96f'][i]);
    box(x, 8.8, z, 6, .4, 6, '#b87a3d');
    [2.2, 4.4, 6.6].forEach((y, k) => box(x + (k % 2 ? -2.4 : 2.4) * (z === 0 ? 1 : 0) + (z !== 0 ? (k % 2 ? 2.4 : -2.4) : 0), y, z + (z !== 0 ? 0 : (k % 2 ? 2.4 : -2.4)), 1.8, .3, 1.8, '#9c6633'));
  });
  // Ground-level shop hut: empty display stands for the user's own cosmetics later.
  box(12, .2, -11, 8, .4, 7, '#8b633b');
  box(12, 2.1, -14.2, 8, 3.8, .35, '#80502e');
  box(8.2, 2.1, -11, .35, 3.8, 6.4, '#80502e');
  box(15.8, 2.1, -11, .35, 3.8, 6.4, '#80502e');
  box(12, 4.05, -11, 8.5, .35, 7.2, '#a56b36');
  // Low front side panels leave a wide, walk-in entrance.
  box(9.25, 1.2, -7.8, 2.1, 2.4, .35, '#80502e');
  box(14.75, 1.2, -7.8, 2.1, 2.4, .35, '#80502e');
  box(12, .75, -12.8, 3.2, 1.1, .8, '#9b6335');
  // Empty cosmetic display plinths.
  [[9.8,-10.5],[12,-10.5],[14.2,-10.5]].forEach(([x,z]) => {
    box(x, .75, z, 1.1, .7, 1.1, '#c58b4e', false);
    mk('a-box', { position: `${x} 1.2 ${z}`, width: .75, height: .12, depth: .75, color: '#e0bd7d', material: FS });
  });
  mk('a-text', { value: 'SHOP', position: '12 4.7 -7.55', align: 'center', color: '#fff4c8', width: 7, scale: '1.4 1.4 1.4' });
  mk('a-text', { value: 'COMING SOON', position: '12 2.6 -13.95', align: 'center', color: '#ffe4a3', width: 5 });

  box(9, 8.85, 0, 7, .3, 1.8, '#d9a15f'); box(-9, 8.85, 0, 7, .3, 1.8, '#d9a15f');
  box(0, 8.85, 9, 1.8, .3, 7, '#d9a15f'); box(0, 8.85, -9, 1.8, .3, 7, '#d9a15f');
  box(16, 11.5, 8, 1.8, .3, 12, '#c98f50'); box(16, 11.5, 14.5, 3, .3, 3, '#c98f50');

  [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]].forEach(([dx, dz]) => box(30 + dx, 7, -24 + dz, .7, 14, .7, '#8a5a32', false));
  box(30, 13.8, -24, 7, .4, 7, '#c58b4e');
  box(30, 6, -24, 6, .3, 6, '#a06a38');
  mk('a-cone', { position: '30 17.2 -24', 'radius-bottom': 5.6, 'radius-top': 0, height: 3.4, color: '#5b7cff', 'segments-radial': 4, rotation: '0 45 0', material: FS });
  [[-3.2, 0], [3.2, 0], [0, -3.2], [0, 3.2]].forEach(([dx, dz]) => box(30 + dx, 14.8, -24 + dz, dx ? .25 : 7, 1.4, dx ? 7 : .25, '#e0a860', false));
  box(34.2, 7, -24, .6, 14, 1.2, '#6d4524', false);
  climbs.push({ x: 34.2, z: -24, r: .7, h: 14 });

  mk('a-cylinder', { position: '-12 .8 10', radius: 2, height: 1.6, color: '#8b5a2b', 'segments-radial': 8, material: FS });
  mk('a-circle', { position: '-12 1.61 10', radius: 1.7, rotation: '-90 0 0', color: '#d9b27c' });
  plats.push({ x1: -14, x2: -10, z1: 8, z2: 12, t: 1.6 });
  [[10, 10, 1.9], [12.5, 8.5, 1.2], [-8, -12, 1.6], [24, -6, 1.4], [-28, 24, 1.8], [6, -26, 1.5]].forEach(([x, z, r]) => {
    mk('a-dodecahedron', { position: `${x} ${r * .6} ${z}`, radius: r, color: R() > .5 ? '#9aa3ad' : '#b0a69a', material: FS });
    plats.push({ x1: x - r * .6, x2: x + r * .6, z1: z - r * .6, z2: z + r * .6, t: r * 1.2 });
  });
  for (let i = 0; i < 24; i++) { const a = R() * 6.28, d = 6 + R() * 48;
    mk('a-sphere', { position: `${Math.cos(a) * d} .6 ${Math.sin(a) * d}`, radius: .6 + R() * .6, color: ['#1f9e3f', '#2dbf55', '#6bd64a'][i % 3], 'segments-width': 6, 'segments-height': 4, material: FS }); }
  for (let i = 0; i < 36; i++) { const a = R() * 6.28, d = 4 + R() * 50;
    mk('a-sphere', { position: `${Math.cos(a) * d} .15 ${Math.sin(a) * d}`, radius: .16, color: ['#ff5c8a', '#ffd23f', '#ffffff', '#b45cff', '#ff8a3d'][i % 5], 'segments-width': 5, 'segments-height': 4 }); }

  for (let i = 0; i < 24; i++) { const a = i / 64 * 6.28, d = 58 + (i % 2) * 4; pine(Math.cos(a) * d, Math.sin(a) * d, 4 + R() * 3); }

  const cave = { x: -42, z: -30, r: 10, h: 6 };
  mk('a-sphere', { position: `${cave.x} 0 ${cave.z}`, radius: cave.r, scale: `1 ${cave.h / cave.r} 1`, color: '#6c6f78', 'segments-width': 10, 'segments-height': 6, material: FS + ';side:double' });
  mk('a-dodecahedron', { position: '-35.6 1.6 -22.6', radius: 1.7, color: '#555a63', material: FS });
  mk('a-dodecahedron', { position: '-32.2 1.6 -27', radius: 1.7, color: '#555a63', material: FS });
  mk('a-dodecahedron', { position: '-34.3 3.6 -24.9', radius: 1.5, color: '#4a4f58', material: FS });
  mk('a-text', { value: 'CAVE', position: '-34.2 4.9 -24.9', align: 'center', color: '#ffe9a8', width: 6, rotation: '0 -40 0' });
  mk('a-sphere', { position: '-42 .1 -30', radius: 1, color: '#ffcf40', material: 'emissive:#ffb300;emissiveIntensity:.6' });
  const vent = $('vent'); if (vent) vent.setAttribute('position', '-45.5 0.08 -33.5');
  const help = $('help'); if (help) help.textContent = 'VR: push your hands against the ground, trees and platforms to move and climb. A / X = jump. Phone: hold MOVE at a tree to climb. Find the cave; the vent hatch needs moderator access.';
  for (let i = 0; i < 9; i++) { const x = -18 - i * 2.2, z = -12 - i * 1.7;
    mk('a-cylinder', { position: `${x} .25 ${z}`, radius: .8, height: .5, color: '#a9743a', 'segments-radial': 7, material: FS });
    plats.push({ x1: x - .8, x2: x + .8, z1: z - .8, z2: z + .8, t: .5 });
    mk('a-sphere', { position: `${x + 2} .7 ${z - 1.5}`, radius: .9, color: '#1f9e3f', 'segments-width': 6, 'segments-height': 4 }); }
  bigTree(-30, -20, 13, 1.7, '#7be05a'); box(-30, 11.8, -20, 5.5, .4, 5.5, '#c58b4e');
  mk('a-sphere', { position: '-30 12.7 -20', radius: .5, color: '#ffd23f', material: 'emissive:#ffc400;emissiveIntensity:.7' });
  box(24, 3, 4, 5, .3, 2, '#a06a38');

  // Climbable perimeter walls with smooth, slippery top caps.
  const wallY = 6, wallH = 12, wallEdge = 54.5, wallLen = 110, wallThick = 1.1, capH = .18;
  const slippery = [];
  function perimeterWall(x, z, w, d) {
    box(x, wallY, z, w, wallH, d, '#687b7d');
    mk('a-box', { position: `${x} ${wallH + capH / 2} ${z}`, width: w + .25, height: capH, depth: d + .25,
      color: '#a9c6c9', material: 'metalness:.72;roughness:.06' });
    const x1 = x - w / 2 - .13, x2 = x + w / 2 + .13, z1 = z - d / 2 - .13, z2 = z + d / 2 + .13;
    plats.push({ x1, x2, z1, z2, t: wallH + capH, b: wallH });
    slippery.push({ x1, x2, z1, z2, y: wallH + capH });
  }
  perimeterWall(-wallEdge, 0, wallThick, wallLen);
  perimeterWall(wallEdge, 0, wallThick, wallLen);
  perimeterWall(0, -wallEdge, wallLen, wallThick);
  perimeterWall(0, wallEdge, wallLen, wallThick);
  window.ForestSlippery = slippery;

  const spawns = [[0, 10], [8, 8], [-8, 8], [10, -8], [-10, -9], [0, 22]];
  window.ForestSpawns = spawns;
  const sp = spawns[Math.floor(Math.random() * spawns.length)];
  P.object3D.position.set(sp[0], 0, sp[1]);
  spawns.forEach(([x, z]) => mk('a-ring', { position: `${x} .05 ${z}`, 'radius-inner': .5, 'radius-outer': .75, rotation: '-90 0 0', color: '#ffe14d' }));

  // Collision data for gorilla-locomotion.js (the old movement loop was removed from this file).
  window.ForestCollider = { plats, climbs, hills, hillY };
  const s = document.createElement('script'); s.src = 'gorilla-locomotion.js?v=17'; document.body.appendChild(s);
})();
