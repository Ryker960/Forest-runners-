/* CHIMPS RUNNERS — Cosmetics Shop + Full Seasonal Cosmetics Gallery
   Shop model: assets/CHIMPS_RUNNERS_Cosmetics_Shop.glb
   Full cosmetics model: assets/all_gorilla_tag_season_cosmetics.glb
   The full gallery model contains 326 mesh parts. Mesh parts are not assumed to be
   326 separate purchasable/equippable cosmetics; item mapping needs the player rig.
*/
(function () {
  const scene = document.querySelector('a-scene');
  const forest = document.getElementById('forest');
  if (!scene || !forest) {
    console.error('Cosmetics: missing A-Frame scene or #forest map.');
    return;
  }

  const shopPosition = { x: 30, y: 0.24, z: 25 };
  const shopScale = 0.65;
  const shopUrl = 'assets/CHIMPS_RUNNERS_Cosmetics_Shop.glb';
  const cosmeticsUrl = 'assets/all_gorilla_tag_season_cosmetics.glb';
  const categories = ['Headwear', 'Face cosmetics', 'Shirts & body', 'Badges', 'Back accessories', 'Hand & wrist accessories'];

  const panel = document.createElement('div');
  panel.id = 'chimpsCosmeticsPanel';
  panel.style.cssText = 'display:none;position:fixed;inset:0;z-index:30;background:rgba(0,0,0,.82);align-items:center;justify-content:center;padding:18px;font:16px system-ui,Arial;color:#efffea';
  panel.innerHTML = '<div style="width:min(100%,390px);background:#10271d;border:2px solid #72a66e;border-radius:18px;padding:18px"><div style="font-size:21px;font-weight:900;color:#b9ff9d">CHIMPS RUNNERS</div><h2 id="chimpsStandTitle">Cosmetic Stand</h2><p id="chimpsStandMessage" style="line-height:1.45">Browse the full seasonal cosmetics display.</p><button id="chimpsStandClose" style="border:1px solid #72a66e;background:#1b4729;color:white;border-radius:12px;padding:11px 18px;font-weight:800">CLOSE</button></div>';
  document.body.appendChild(panel);
  panel.querySelector('#chimpsStandClose').addEventListener('click', () => panel.style.display = 'none');

  function openStand(category) {
    panel.querySelector('#chimpsStandTitle').textContent = category;
    panel.querySelector('#chimpsStandMessage').textContent = 'This is the ' + category.toLowerCase() + ' section. The complete uploaded seasonal model is displayed in the gallery. Individual item previews, prices, and equip actions need the player model and item-to-slot mapping.';
    panel.style.display = 'flex';
  }

  function addModel(parent, id, url, position, scale, label) {
    if (parent.querySelector('#' + id)) return null;
    const entity = document.createElement('a-entity');
    entity.id = id;
    entity.setAttribute('position', position);
    entity.setAttribute('scale', scale);
    entity.setAttribute('gltf-model', 'url(' + url + ')');
    entity.addEventListener('model-loaded', () => console.info(label + ' loaded.'));
    entity.addEventListener('model-error', event => console.error(label + ' failed to load. Check ' + url, event.detail));
    parent.appendChild(entity);
    return entity;
  }

  function addShop() {
    addModel(forest, 'chimpsCosmeticsShop', shopUrl,
      shopPosition.x + ' ' + shopPosition.y + ' ' + shopPosition.z,
      shopScale + ' ' + shopScale + ' ' + shopScale, 'Shop model');

    // Full uploaded cosmetics scene, displayed beside the shop.
    const gallery = addModel(forest, 'chimpsAllCosmeticsGallery', cosmeticsUrl,
      '29.25 1.02 12.5', '0.6 0.6 0.6', 'Full cosmetics gallery');
    if (gallery) gallery.setAttribute('rotation', '0 0 0');

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

    const gallerySign = document.createElement('a-text');
    gallerySign.setAttribute('value', 'SEASONAL COSMETICS GALLERY');
    gallerySign.setAttribute('position', '29.25 3.35 10.2');
    gallerySign.setAttribute('align', 'center');
    gallerySign.setAttribute('color', '#b9ff9d');
    gallerySign.setAttribute('width', '10');
    forest.appendChild(gallerySign);
  }

  if (scene.hasLoaded) addShop();
  else scene.addEventListener('loaded', addShop, { once: true });
})();
