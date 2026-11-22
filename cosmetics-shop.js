/* CHIMPS RUNNERS — Cosmetics Shop
   Loads the supplied, trimmed Sketchfab shop model and makes six display stands selectable.
   Required model path: assets/CHIMPS_RUNNERS_Cosmetics_Shop.glb
*/
(function () {
  const scene = document.querySelector('a-scene');
  const forest = document.getElementById('forest');
  if (!scene || !forest) {
    console.error('Cosmetics Shop: missing A-Frame scene or #forest map.');
    return;
  }

  const shopPosition = { x: 30, y: 0.24, z: 25 };
  const shopScale = 0.65;
  const modelUrl = 'assets/CHIMPS_RUNNERS_Cosmetics_Shop.glb';
  const categories = ['Headwear', 'Shirts', 'Badges', 'Back accessories', 'Wrist accessories', 'Seasonal cosmetics'];

  const panel = document.createElement('div');
  panel.id = 'chimpsCosmeticsPanel';
  panel.style.cssText = 'display:none;position:fixed;inset:0;z-index:30;background:rgba(0,0,0,.78);align-items:center;justify-content:center;padding:18px;font:16px system-ui,Arial;color:#efffea';
  panel.innerHTML = '<div style="width:min(100%,390px);background:#10271d;border:2px solid #72a66e;border-radius:18px;padding:18px"><div style="font-size:21px;font-weight:900;color:#b9ff9d">CHIMPS RUNNERS</div><h2 id="chimpsStandTitle">Cosmetic Stand</h2><p id="chimpsStandMessage" style="line-height:1.45">More cosmetics coming soon!</p><button id="chimpsStandClose" style="border:1px solid #72a66e;background:#1b4729;color:white;border-radius:12px;padding:11px 18px;font-weight:800">CLOSE</button></div>';
  document.body.appendChild(panel);
  panel.querySelector('#chimpsStandClose').addEventListener('click', () => panel.style.display = 'none');

  function openStand(category) {
    panel.querySelector('#chimpsStandTitle').textContent = category;
    panel.querySelector('#chimpsStandMessage').textContent = 'This stand is ready for ' + category.toLowerCase() + '. Its display model is in place. Send your cosmetic models and we can add previews, prices, and equip buttons.';
    panel.style.display = 'flex';
  }

  function addShop() {
    if (forest.querySelector('#chimpsCosmeticsShop')) return;
    const shop = document.createElement('a-entity');
    shop.id = 'chimpsCosmeticsShop';
    shop.setAttribute('position', shopPosition.x + ' ' + shopPosition.y + ' ' + shopPosition.z);
    shop.setAttribute('scale', shopScale + ' ' + shopScale + ' ' + shopScale);
    shop.setAttribute('gltf-model', 'url(' + modelUrl + ')');
    shop.addEventListener('model-loaded', () => console.info('CHIMPS RUNNERS Cosmetics Shop loaded.'));
    shop.addEventListener('model-error', event => console.error('Shop model failed to load. Check ' + modelUrl, event.detail));
    forest.appendChild(shop);

    // Stand centers measured from the uploaded GLB after recentering.
    const offsets = [[-2.86,7.52],[-4.60,5.465],[-6.435,3.275],[8.535,-2.05],[6.81,-4.11],[4.54,-6.295]];
    offsets.forEach(([ox, oz], index) => {
      const x = shopPosition.x + ox * shopScale;
      const z = shopPosition.z + oz * shopScale;
      const target = document.createElement('a-box');
      target.setAttribute('position', x + ' 1.15 ' + z);
      target.setAttribute('width', '1.25');
      target.setAttribute('height', '1.8');
      target.setAttribute('depth', '1.25');
      target.setAttribute('material', 'color:#b9ff9d;transparent:true;opacity:0.001');
      target.setAttribute('class', 'clickable');
      target.addEventListener('click', () => openStand(categories[index]));
      forest.appendChild(target);

      const label = document.createElement('a-text');
      label.setAttribute('value', categories[index].toUpperCase());
      label.setAttribute('position', x + ' 2.35 ' + z);
      label.setAttribute('align', 'center');
      label.setAttribute('color', '#ffffff');
      label.setAttribute('width', '4');
      label.setAttribute('look-at', '[camera]');
      forest.appendChild(label);
    });

    const sign = document.createElement('a-text');
    sign.setAttribute('value', 'COSMETICS SHOP');
    sign.setAttribute('position', shopPosition.x + ' 7.1 ' + (shopPosition.z + 8.2));
    sign.setAttribute('align', 'center');
    sign.setAttribute('color', '#b9ff9d');
    sign.setAttribute('width', '9');
    forest.appendChild(sign);
  }

  if (scene.hasLoaded) addShop();
  else scene.addEventListener('loaded', addShop, { once: true });
})();
