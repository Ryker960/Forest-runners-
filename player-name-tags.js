/* CHIMPS RUNNERS - floating player name and badge tags.
   Multiplayer code can register remote A-Frame player entities with
   ChimpsNameTags.upsert(entity, playerId, displayName). */
(function(){
 'use strict';
 const ID=window.ChimpsID, CFG=window.CHIMPS_CONFIG;
 if(!ID||!CFG)return;
 if(window.AFRAME&&!AFRAME.components['chimps-face-camera'])AFRAME.registerComponent('chimps-face-camera',{tick:function(){const cam=document.getElementById('camera');if(cam&&cam.object3D)this.el.object3D.lookAt(cam.object3D.getWorldPosition(new THREE.Vector3()));}});
 const clean=s=>String(s||'Player').replace(/[<>]/g,'').slice(0,24);
 function badgesFor(id){
   if(id===ID.me().id)return ID.me().badges||[];
   const entry=(ID.published()||[]).find(p=>p.id===id);
   return entry?(entry.badges||[]):[];
 }
 function upsert(entity,id,name){
   if(typeof entity==='string')entity=document.querySelector(entity);
   if(!entity||!entity.appendChild)return null;
   let tag=entity.querySelector(':scope > [data-chimps-name-tag]');
   if(!tag){
     tag=document.createElement('a-entity');
     tag.setAttribute('data-chimps-name-tag','');
     tag.setAttribute('position','0 2.55 0');
     tag.setAttribute('chimps-face-camera','');
     const panel=document.createElement('a-box');
     panel.setAttribute('class','name-tag-panel');
     panel.setAttribute('width','3.1');
     panel.setAttribute('height','.78');
     panel.setAttribute('depth','.12');
     panel.setAttribute('radius','.08');
     panel.setAttribute('color','#10271d');
     panel.setAttribute('material','shader:standard;metalness:.25;roughness:.55');
     panel.setAttribute('position','0 0 0');
     tag.appendChild(panel);
     const outline=document.createElement('a-box');
     outline.setAttribute('width','3.18');
     outline.setAttribute('height','.86');
     outline.setAttribute('depth','.06');
     outline.setAttribute('color','#82b57d');
     outline.setAttribute('position','0 0 -.07');
     tag.appendChild(outline);
     const nameText=document.createElement('a-text');
     nameText.setAttribute('data-name-line','');
     nameText.setAttribute('align','center');
     nameText.setAttribute('anchor','center');
     nameText.setAttribute('color','#ffffff');
     nameText.setAttribute('width','4.5');
     nameText.setAttribute('position','0 .17 .075');
     nameText.setAttribute('font','mozillavr');
     tag.appendChild(nameText);
     const badgeText=document.createElement('a-text');
     badgeText.setAttribute('data-badge-line','');
     badgeText.setAttribute('align','center');
     badgeText.setAttribute('anchor','center');
     badgeText.setAttribute('color','#caffb9');
     badgeText.setAttribute('width','4');
     badgeText.setAttribute('position','0 -.17 .076');
     badgeText.setAttribute('font','mozillavr');
     tag.appendChild(badgeText);
     entity.appendChild(tag);
   }
   const badges=badgesFor(id).map(k=>CFG.badges[k]).filter(Boolean);
   tag.querySelector('[data-name-line]').setAttribute('value',clean(name));
   tag.querySelector('[data-badge-line]').setAttribute('value',badges.map(b=>b.emoji+' '+b.label).join('  •  ')||'');
   tag.dataset.playerId=String(id||'');
   return tag;
 }
 function remove(entity){
   if(typeof entity==='string')entity=document.querySelector(entity);
   const tag=entity&&entity.querySelector(':scope > [data-chimps-name-tag]');
   if(tag)tag.remove();
 }
 function refresh(){
   document.querySelectorAll('[data-player-id]').forEach(el=>{
     const id=el.getAttribute('data-player-id');
     const name=el.getAttribute('data-player-name')||'Player';
     upsert(el,id,name);
   });
 }
 window.ChimpsNameTags={upsert,remove,refresh};
 ID.on(refresh);
 ID.init().then(()=>{
   const me=ID.me(),player=document.getElementById('player');
   if(player)upsert(player,me.id,me.name);
   refresh();
 }).catch(e=>console.warn('Player name tags unavailable.',e));
})();
