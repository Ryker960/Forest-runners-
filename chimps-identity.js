/* CHIMPS RUNNERS - browser identity and signed badge registry (static Path A). */
(function(){
'use strict';
const CFG=window.CHIMPS_CONFIG,cbs=[];
const emit=()=>cbs.forEach(f=>{try{f()}catch(e){}});
if(!window.crypto||!crypto.subtle){
 console.warn('WebCrypto requires HTTPS; badges disabled.');
 window.ChimpsID={init:async()=>{},on:f=>cbs.push(f),me:()=>({id:'',name:'Chimp',code:'',badges:[],isOwner:false,perms:[]}),has:()=>false,badge:k=>CFG.badges[k],owner:{configured:()=>false,unlocked:()=>false,stored:()=>null},ownerId:()=>null};
 return;
}
const S=crypto.subtle,enc=new TextEncoder(),dec=new TextDecoder(),EC={name:'ECDSA',namedCurve:'P-256'},SIG={name:'ECDSA',hash:'SHA-256'};
const b64=u=>{let s='';new Uint8Array(u).forEach(c=>s+=String.fromCharCode(c));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const unb64=t=>{t=String(t).replace(/-/g,'+').replace(/_/g,'/');while(t.length%4)t+='=';const s=atob(t),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u};
const canon=o=>Array.isArray(o)?'['+o.map(canon).join(',')+']':o&&typeof o==='object'?'{'+Object.keys(o).sort().map(k=>JSON.stringify(k)+':'+canon(o[k])).join(',')+'}':JSON.stringify(o);
const pubOnly=j=>({kty:'EC',crv:'P-256',x:j.x,y:j.y});
async function idOf(pub){const h=await S.digest('SHA-256',enc.encode(canon(pubOnly(pub))));return Array.from(new Uint8Array(h)).slice(0,10).map(x=>x.toString(16).padStart(2,'0')).join('')}
const ls={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}};
async function pkey(pass,salt){const m=await S.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']);return S.deriveKey({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},m,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function seal(obj,pass){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),ct=await S.encrypt({name:'AES-GCM',iv},await pkey(pass,salt),enc.encode(JSON.stringify(obj)));return{s:b64(salt),i:b64(iv),c:b64(ct)}}
async function unseal(box,pass){const pt=await S.decrypt({name:'AES-GCM',iv:unb64(box.i)},await pkey(pass,unb64(box.s)),unb64(box.c));return JSON.parse(dec.decode(pt))}
function parseBackup(t){t=String(t).trim();if(!t.startsWith('COB1.'))throw Error('That is not an Owner backup.');return JSON.parse(dec.decode(unb64(t.slice(5))))}
let ownerKey=null,ownerId=null,ident=null,reg={version:0,players:[]},regOk=false,ready=null;
const ASSIGN=Object.keys(CFG.badges).filter(k=>CFG.badges[k].assignable),rank=k=>(CFG.badges[k]||{}).rank||99;
const O={
 configured:()=>!!CFG.ownerPublicKey,stored:()=>ls.get('chimps.owner.v1'),
 pubText(){const r=O.stored();return r?JSON.stringify(r.pub):''},
 backupText(){const r=O.stored();return r?'COB1.'+b64(enc.encode(JSON.stringify(r))):''},
 async create(pass){if(CFG.ownerPublicKey)throw Error('Owner is already configured.');if(O.stored())throw Error('An Owner key already exists on this device.');if(!pass||pass.length<8)throw Error('Passphrase must be at least 8 characters.');const kp=await S.generateKey(EC,true,['sign','verify']),priv=await S.exportKey('jwk',kp.privateKey),pub=pubOnly(await S.exportKey('jwk',kp.publicKey));if(!ls.set('chimps.owner.v1',{v:1,pub,box:await seal({priv},pass)}))throw Error('Could not save on this device.')},
 async checkBackup(text,pass){const r=parseBackup(text),d=await unseal(r.box,pass).catch(()=>{throw Error('Wrong passphrase or damaged backup.')});if(d.priv.x!==r.pub.x||d.priv.y!==r.pub.y)throw Error('Backup is damaged.');const s=O.stored();return!!s&&s.pub.x===r.pub.x&&s.pub.y===r.pub.y},
 async restore(text,pass){const r=parseBackup(text);await unseal(r.box,pass).catch(()=>{throw Error('Wrong passphrase or damaged backup.')});if(CFG.ownerPublicKey&&(CFG.ownerPublicKey.x!==r.pub.x||CFG.ownerPublicKey.y!==r.pub.y))throw Error('This backup does not match the Owner key in chimps-config.js.');ls.set('chimps.owner.v1',r)},
 async unlock(pass){await init();const r=O.stored();if(!r)throw Error('No Owner key on this device. Restore your backup first.');if(!CFG.ownerPublicKey)throw Error('Paste your public key into chimps-config.js first.');if(CFG.ownerPublicKey.x!==r.pub.x||CFG.ownerPublicKey.y!==r.pub.y)throw Error('This key does not match the Owner key in chimps-config.js.');const d=await unseal(r.box,pass).catch(()=>{throw Error('Wrong passphrase.')});ownerKey=await S.importKey('jwk',d.priv,EC,false,['sign']);emit()},
 unlocked:()=>!!ownerKey,lock(){ownerKey=null;emit()},
 async sign(players){if(!ownerKey)throw Error('Unlock Owner mode first.');const clean=players.map(p=>({id:String(p.id),name:String(p.name).slice(0,24),badges:p.badges.filter(b=>ASSIGN.includes(b))}));const doc={v:1,version:Math.max(reg.version||0,ls.get('chimps.maxv')||0)+1,issuedAt:new Date().toISOString(),players:clean};return JSON.stringify(Object.assign({},doc,{sig:b64(await S.sign(SIG,ownerKey,enc.encode(canon(doc))))}),null,1)}
};
async function loadReg(){reg={version:0,players:[]};regOk=false;try{const res=await fetch(CFG.registryUrl+'?t='+Date.now(),{cache:'no-store'});if(!res.ok)throw Error('Registry unavailable');const j=await res.json();if(!Array.isArray(j.players))throw Error('Bad registry');if(!j.players.length&&!j.sig){reg={version:j.version||0,players:[]};return}if(!CFG.ownerPublicKey||!j.sig)throw Error('Unsigned registry');const k=await S.importKey('jwk',CFG.ownerPublicKey,EC,false,['verify']);if(!await S.verify(SIG,k,unb64(j.sig),enc.encode(canon({v:j.v,version:j.version,issuedAt:j.issuedAt,players:j.players}))))throw Error('Invalid signature');if(j.version<(ls.get('chimps.maxv')||0))throw Error('Old registry');ls.set('chimps.maxv',j.version);reg=j;regOk=true}catch(e){console.warn('Badge registry not trusted; no badges loaded.',e)}}
function badgesOf(id){const p=(reg.players||[]).find(p=>p.id===id),b=(p?p.badges:[]).filter(x=>ASSIGN.includes(x));if(ownerId&&id===ownerId)b.push('owner');return b.filter((x,i)=>b.indexOf(x)===i).sort((a,c)=>rank(a)-rank(c))}
const permsOf=b=>{const s=new Set();b.forEach(k=>(CFG.permissions[k]||[]).forEach(p=>s.add(p)));return Array.from(s)};
async function loadIdent(){ident=ls.get('chimps.id.v1');if(!(ident&&ident.pub&&ident.priv)){const kp=await S.generateKey(EC,true,['sign','verify']);ident={pub:pubOnly(await S.exportKey('jwk',kp.publicKey)),priv:await S.exportKey('jwk',kp.privateKey),name:'Chimp'+Math.floor(1000+Math.random()*9000)};ls.set('chimps.id.v1',ident)}ident.id=await idOf(ident.pub)}
function codeOf(){const p=ownerKey?CFG.ownerPublicKey:ident.pub;return'CP1.'+b64(enc.encode(JSON.stringify({n:ident.name,x:p.x,y:p.y})))}
function me(){if(!ident)return{id:'',name:'Chimp',code:'',badges:[],isOwner:false,perms:[]};const id=ownerKey?ownerId:ident.id,b=badgesOf(id);return{id,name:ident.name,code:codeOf(),badges:b,isOwner:b.includes('owner'),perms:permsOf(b)}}
function init(){return ready||(ready=(async()=>{await loadIdent();if(CFG.ownerPublicKey)ownerId=await idOf(CFG.ownerPublicKey);await loadReg();emit()})())}
window.ChimpsID={init,on:f=>cbs.push(f),me,has:p=>me().perms.includes(p),badge:k=>CFG.badges[k],owner:O,ownerId:()=>ownerId,published:()=>JSON.parse(JSON.stringify(reg.players||[])),regInfo:()=>({version:reg.version||0,verified:regOk}),
 setName(n){ident.name=String(n).replace(/[<>]/g,'').trim().slice(0,20)||ident.name;ls.set('chimps.id.v1',ident);emit()},
 exportId:()=>'CID1.'+b64(enc.encode(JSON.stringify({pub:ident.pub,priv:ident.priv,name:ident.name}))),
 async importId(t){t=String(t).trim();if(!t.startsWith('CID1.'))throw Error('That is not an identity backup.');const d=JSON.parse(dec.decode(unb64(t.slice(5))));await S.importKey('jwk',d.priv,EC,false,['sign']);ident={pub:pubOnly(d.pub),priv:d.priv,name:String(d.name||'Chimp').replace(/[<>]/g,'').slice(0,20)};ls.set('chimps.id.v1',ident);ident.id=await idOf(ident.pub);emit()},
 async parseCode(t){t=String(t).trim();if(!t.startsWith('CP1.'))throw Error('That is not a Player Code (it starts with CP1.).');const d=JSON.parse(dec.decode(unb64(t.slice(4)))),pub={kty:'EC',crv:'P-256',x:d.x,y:d.y};await S.importKey('jwk',pub,EC,false,['verify']);return{id:await idOf(pub),name:String(d.n||'Player').replace(/[<>]/g,'').slice(0,20)}}
};
})();