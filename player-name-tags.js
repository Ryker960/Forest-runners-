/* CHIMPS RUNNERS - floating player name and badge tags.
   Multiplayer code can register remote A-Frame player entities with
   ChimpsNameTags.upsert(entity, playerId, displayName). */
(function(){
 'use strict';
 const ID=window.ChimpsID, CFG=window.CHIMPS_CONFIG;
 if(!ID||!CFG)return;
 const clean=s=>String(s||'Player').replace(/[<>]/g,'').slice(0,24);
 function badgesFor(id){
   if(id===ID.me().id)return ID.me().badges||[];
   const entry=(ID.published()||[]).find(p=>p.id===id);
   return entry?(entry.badges||[]):[];
 }
 function labelText(name,id){
   const lines=[clean(name)];
   const badges=badgesFor(id).map(k=>CFG.badges[k]).filter(Boolean);
   if(badges.length)lines.push(badges.map(b=>b.emoji+' '+b.label).join('  ·  '));
   return lines.join('\\n');
 }
 function upsert(entity,id,name){
   if(typeof entity==='string')entity=document.querySelector(entity);
   if(!entity||!entity.appendChild)return null;
   let tag=entity.querySelector(':scope > [data-chimps-name-tag]');
   if(!tag){tag=document.createElement('a-entity');tag.setAttribute('data-chimps-name-tag','');tag.setAttribute('position','0 2.55 0');tag.setAttribute('text',{value:'',align:'center',anchor:'center',baseline:'center',color:'#ffffff',width:5,wrapCount:34,shader:'msdf'});tag.setAttribute('look-at','#camera');entity.appendChild(tag)}
   tag.setAttribute('text','value',labelText(name,id));
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
