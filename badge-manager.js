
/* CHIMPS RUNNERS — Owner Badge Manager (Path A / static GitHub Pages)
   Compatible with window.ChimpsID and window.CHIMPS_CONFIG.
   Owner private keys are encrypted locally with PBKDF2 + AES-GCM. This file never uploads keys.
   IMPORTANT: client-side permissions are not server security; Path A has no authoritative server. */
(function () {
  'use strict';
  const ID = window.ChimpsID, CFG = window.CHIMPS_CONFIG;
  if (!ID || !CFG || !CFG.badges) return;

  const assignable = Object.keys(CFG.badges).filter(k => CFG.badges[k] && CFG.badges[k].assignable);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const el = document.createElement('div'); el.id = 'chimps-badge-manager';
  el.style.cssText = 'display:none;position:fixed;inset:0;z-index:9998;overflow:auto;background:#000d;padding:12px;color:#efffea;font:14px system-ui,Arial,sans-serif;';
  const toast = document.createElement('div');
  toast.style.cssText = 'display:none;position:fixed;z-index:10000;bottom:18px;left:50%;transform:translateX(-50%);max-width:92vw;padding:11px 15px;border-radius:12px;background:#173d27;border:1px solid #79b77a;color:#eaffdf;font:14px system-ui;';
  const style = document.createElement('style');
  style.textContent = `#chimps-badge-manager *{box-sizing:border-box}#chimps-badge-manager .bm-card{max-width:620px;margin:0 auto;background:#10271d;border:2px solid #72a66e;border-radius:16px;padding:16px;box-shadow:0 12px 45px #0008}#chimps-badge-manager h2{color:#b9ff9d;margin:8px 0 12px}#chimps-badge-manager h3{color:#d7ffd0;margin:16px 0 8px}#chimps-badge-manager p{line-height:1.45}#chimps-badge-manager textarea,#chimps-badge-manager input[type=text],#chimps-badge-manager input[type=password]{display:block;width:100%;max-width:100%;padding:10px;margin:7px 0;border:1px solid #69966b;border-radius:9px;background:#07150d;color:#fff;font:13px ui-monospace,monospace}#chimps-badge-manager textarea{resize:vertical}#chimps-badge-manager button{border:1px solid #72a66e;background:#1b4729;color:white;border-radius:10px;padding:10px 12px;margin:4px 5px 4px 0;font-weight:700}#chimps-badge-manager button.secondary{background:#263b32}#chimps-badge-manager button.danger{background:#6a2828;border-color:#b66}#chimps-badge-manager .bm-row{border-top:1px solid #426b4a;padding:10px 0}#chimps-badge-manager label{display:inline-flex;align-items:center;gap:4px;margin:4px 10px 4px 0;font-size:13px}#chimps-badge-manager small{color:#b8d0b8;overflow-wrap:anywhere}#chimps-badge-manager .bm-note{padding:10px;border:1px solid #587a58;border-radius:10px;background:#0a1c12;margin:10px 0}#chimps-badge-manager summary{padding:8px 0;color:#caffbd;font-weight:700}#chimps-badge-manager .bm-top{display:flex;align-items:center;justify-content:space-between;gap:10px}#chimps-badge-manager .bm-pill{display:inline-block;padding:3px 8px;border:1px solid #71966c;border-radius:99px;font-size:11px}`;
  document.head.appendChild(style); document.body.append(el, toast);

  let draft = [], signedOutput = '', recoveryEntries = [], toastTimer = null;
  const owner = () => ID.owner;
  const say = (msg, bad) => { toast.textContent = msg; toast.style.borderColor = bad ? '#c66' : '#79b77a'; toast.style.display = 'block'; clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.style.display = 'none', 4200); };
  const get = id => { const n = el.querySelector('#' + id); return n ? n.value : ''; };
  const download = (filename, content, type) => { const blob = new Blob([content], {type:type || 'text/plain'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); };
  const copy = async text => { try { await navigator.clipboard.writeText(text); } catch (e) { const t = document.createElement('textarea'); t.value = text; t.style.position='fixed'; t.style.opacity='0'; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); } };
  const loadDraft = () => { try { const d = JSON.parse(localStorage.getItem('chimps.draft.v1')); if (Array.isArray(d)) return sanitizePlayers(d); } catch (e) {} return sanitizePlayers(ID.published ? ID.published() : []); };
  const saveDraft = () => { try { localStorage.setItem('chimps.draft.v1', JSON.stringify(draft)); } catch (e) { say('Could not save draft on this device.', true); } };
  function sanitizePlayers(rows) {
    if (!Array.isArray(rows)) return [];
    const seen = new Set(), out = [];
    rows.forEach(p => {
      if (!p || typeof p.id !== 'string' || !p.id || seen.has(p.id)) return;
      seen.add(p.id);
      const badges = Array.isArray(p.badges) ? [...new Set(p.badges.filter(b => assignable.includes(b)))] : [];
      out.push({id:p.id, name:String(p.name || 'Player').replace(/[<>]/g,'').slice(0,24), badges});
    });
    return out;
  }
  function shell(body) {
    el.innerHTML = '<div class="bm-card"><div class="bm-top"><strong style="font-size:19px;letter-spacing:1px;color:#b9ff9d">🐒 BADGE MANAGER</strong><button class="secondary" data-action="close">CLOSE</button></div>' + body + '</div>';
  }
  function ownerSetupScreen() {
    el.style.display = 'block';
    const O = owner();
    if (!O.stored()) {
      shell('<h2>Create your Owner key</h2><p>This creates your Owner signing key on this device. Choose a passphrase with at least 8 characters. Keep the passphrase and encrypted backup safe.</p><input id="newPass" type="password" placeholder="Passphrase (8+ characters)" autocomplete="new-password"><input id="newPass2" type="password" placeholder="Repeat passphrase"><button data-action="create">CREATE OWNER KEY</button><div class="bm-note">Do not share your passphrase or backup. GitHub Pages cannot keep a private key secret if you publish it in a file.</div>');
      return;
    }
    const pub = O.pubText ? O.pubText() : '';
    const backup = O.backupText ? O.backupText() : '';
    shell('<h2>Owner key setup</h2><p><b>1.</b> Copy the PUBLIC key into <code>chimps-config.js</code> as the value of <code>ownerPublicKey</code>. It is safe to publish the public key.</p><textarea id="publicKey" rows="4" readonly>'+esc(pub)+'</textarea><button data-action="copy" data-field="publicKey">COPY PUBLIC KEY</button><p><b>2.</b> Save your encrypted Owner backup in two safe places. You need the passphrase to restore it.</p><textarea id="ownerBackup" rows="5" readonly>'+esc(backup)+'</textarea><button data-action="copy" data-field="ownerBackup">COPY BACKUP</button><button data-action="downloadBackup">SAVE BACKUP FILE</button><p><b>3.</b> Test the backup now.</p><textarea id="testBackup" rows="3" placeholder="Paste your COB1. backup here"></textarea><input id="testPass" type="password" placeholder="Backup passphrase"><button data-action="testBackup">TEST BACKUP</button><div class="bm-note">After updating <code>chimps-config.js</code> and waiting for GitHub Pages to redeploy, reload the game and unlock Owner mode.</div>');
  }
  function unlockScreen() {
    el.style.display = 'block';
    shell('<h2>Unlock Owner mode</h2><p>Enter the passphrase for the Owner key stored on this device.</p><input id="unlockPass" type="password" placeholder="Owner passphrase" autocomplete="current-password"><button data-action="unlock">UNLOCK</button><details><summary>Restore an Owner backup</summary><textarea id="restoreBackup" rows="4" placeholder="Paste COB1. backup"></textarea><input id="restorePass" type="password" placeholder="Backup passphrase"><button data-action="restore">RESTORE BACKUP</button></details><details><summary>Lost your old Owner key? Recovery instructions</summary><p>Use the recovery panel after creating a replacement key. If you have lost the old private key, the old registry signature cannot be recreated. Recovered player records must be checked by you before signing again.</p><button data-action="showRecovery">OPEN RECOVERY HELP</button></details>');
  }
  function managerScreen() {
    const info = ID.regInfo ? ID.regInfo() : {version:0,verified:false};
    const rows = draft.map(p => '<div class="bm-row bm-player" data-search="'+esc((p.name+' '+p.id).toLowerCase())+'"><div><b>'+esc(p.name)+'</b><br><small>'+esc(p.id)+'</small> <button class="danger" data-action="remove" data-id="'+esc(p.id)+'">REMOVE</button></div><div>'+assignable.map(k => '<label><input type="checkbox" data-action="badgeToggle" data-id="'+esc(p.id)+'" data-badge="'+esc(k)+'"'+(p.badges.includes(k)?' checked':'')+'> '+esc(CFG.badges[k].emoji||'')+' '+esc(CFG.badges[k].label||k)+'</label>').join('')+'</div></div>').join('');
    shell('<div class="bm-note">Registry version: <b>'+Number(info.version||0)+'</b> · '+(info.verified?'<span class="bm-pill">signature verified</span>':'<span class="bm-pill">not verified / empty</span>')+'<br><small>Only the Owner can sign badge changes. Co-Owner and Moderator cannot manage badges.</small></div><h3>Add a player</h3><textarea id="playerCode" rows="3" placeholder="Paste Player Code (CP1.)"></textarea><button data-action="addPlayer">ADD PLAYER</button><h3>Player list ('+draft.length+')</h3><input id="playerSearch" type="text" placeholder="Search by player name or ID"><div id="playerRows">'+(rows||'<p>No players added yet.</p>')+'</div><hr><button data-action="sign">CREATE SIGNED REGISTRY</button><button class="secondary" data-action="resetDraft">RESET DRAFT</button><button class="secondary" data-action="lock">LOCK OWNER</button><details><summary>Owner key recovery / registry recovery</summary><p>If you still have the old Owner key, unlock it and sign normally. If the old key is lost, create a replacement key and update <code>chimps-config.js</code> to its new public key before signing.</p><p>Records recovered from an old registry without its matching Owner key are <b>unverified</b>. Review every player and badge yourself; never assume the old signature is valid.</p><button data-action="loadRecovery">LOAD RECOVERED RECORDS</button><div id="recoveryArea">'+recoveryHtml()+'</div></details>'+(signedOutput?'<h3>Signed registry.json</h3><p>Copy this into <code>registry.json</code> in GitHub, commit it, and wait for Pages to redeploy.</p><textarea id="signedJson" rows="9" readonly>'+esc(signedOutput)+'</textarea><button data-action="copy" data-field="signedJson">COPY REGISTRY</button><button data-action="downloadRegistry">DOWNLOAD registry.json</button>':'') );
  }
  function recoveryHtml() {
    if (!recoveryEntries.length) return '<p>No recovery records loaded.</p>';
    return '<p><b>'+recoveryEntries.length+' record(s) loaded.</b> These are untrusted until you review them.</p><button data-action="importRecovery">ADD REVIEWED RECORDS TO DRAFT</button><button class="secondary" data-action="downloadRecovery">DOWNLOAD RECOVERY JSON</button><div>'+recoveryEntries.map(p=>'<div class="bm-row"><b>'+esc(p.name||'Player')+'</b><br><small>'+esc(p.id||'')+'</small><br>'+((Array.isArray(p.badges)?p.badges:[]).map(k=>esc((CFG.badges[k]||{}).label||k)).join(', ')||'No badges')+'</div>').join('')+'</div>';
  }
  async function createReplacement(pass) {
    if (!pass || pass.length < 8) throw new Error('Passphrase must be at least 8 characters.');
    if (!window.crypto || !crypto.subtle) throw new Error('Secure browser cryptography is unavailable. Open the game over HTTPS.');
    const subtle = crypto.subtle, enc = new TextEncoder();
    const b64 = u => { let s=''; new Uint8Array(u).forEach(c=>s+=String.fromCharCode(c)); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); };
    const kp = await subtle.generateKey({name:'ECDSA',namedCurve:'P-256'}, true, ['sign','verify']);
    const priv = await subtle.exportKey('jwk',kp.privateKey), fullPub = await subtle.exportKey('jwk',kp.publicKey);
    const pub = {kty:'EC',crv:'P-256',x:fullPub.x,y:fullPub.y};
    const salt=crypto.getRandomValues(new Uint8Array(16)), iv=crypto.getRandomValues(new Uint8Array(12));
    const material=await subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']);
    const aes=await subtle.deriveKey({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
    const cipher=await subtle.encrypt({name:'AES-GCM',iv},aes,enc.encode(JSON.stringify({priv})));
    const record={v:1,pub,box:{s:b64(salt),i:b64(iv),c:b64(cipher)}};
    try { localStorage.setItem('chimps.owner.v1',JSON.stringify(record)); } catch(e) { throw new Error('Could not store the encrypted replacement key in this browser.'); }
    return {publicKey:JSON.stringify(pub),backup:'COB1.'+b64(enc.encode(JSON.stringify(record)))};
  }
  function recoveryHelp() {
    el.style.display = 'block';
    shell('<h2>Owner key recovery</h2><div class="bm-note"><b>Before starting:</b> if your old Owner key still works, keep it. You do not need a replacement. If it is lost, the old registry signature cannot be recovered.</div><h3>Create a replacement Owner key</h3><p>Enter a NEW passphrase. This creates a new encrypted Owner key on this device and displays its public key and backup. It replaces the locally stored Owner key, so save the backup before leaving this screen.</p><input id="replacementPass" type="password" placeholder="New passphrase (8+ characters)"><input id="replacementPass2" type="password" placeholder="Repeat new passphrase"><button data-action="makeReplacement">GENERATE REPLACEMENT KEY</button><div id="replacementResult"></div><h3>After generating</h3><ol><li>Copy the displayed PUBLIC key.</li><li>Edit <code>chimps-config.js</code> on GitHub and replace <code>ownerPublicKey</code> with that public key.</li><li>Commit and wait for GitHub Pages to redeploy.</li><li>Reload the game, open <code>#owner</code>, and unlock using the new passphrase.</li><li>Load the old registry records in the recovery panel, review them, then sign a new registry.</li></ol><p><b>Important:</b> records from an old registry are only recovery suggestions when the old key is lost. Review all badge assignments before signing.</p><button data-action="backToUnlock">BACK</button>');
  }
  async function loadRecovery() {
    let rows = [];
    if (owner().recoveryPlayers) {
      rows = await Promise.resolve(owner().recoveryPlayers());
    } else {
      const response = await fetch((CFG.registryUrl || 'registry.json') + '?recovery=' + Date.now(), {cache:'no-store'});
      if (!response.ok) throw new Error('Could not read registry.json.');
      const doc = await response.json(); rows = Array.isArray(doc.players) ? doc.players : [];
    }
    recoveryEntries = sanitizePlayers(rows);
    if (!recoveryEntries.length) throw new Error('No player records were found in the old registry.');
  }
  el.addEventListener('input', e => {
    if (e.target.id !== 'playerSearch') return;
    const q=e.target.value.toLowerCase(); el.querySelectorAll('.bm-player').forEach(n=>n.style.display=!q||n.dataset.search.includes(q)?'':'none');
  });
  el.addEventListener('click', async e => {
    const btn=e.target.closest('[data-action]'); if(!btn) return;
    const action=btn.dataset.action;
    try {
      if(action==='close') close();
      else if(action==='create') {
        if(get('newPass')!==get('newPass2')) throw new Error('Passphrases do not match.');
        await owner().create(get('newPass')); ownerSetupScreen(); say('Owner key created. Copy the public key and backup.');
      }
      else if(action==='copy') { const node=el.querySelector('#'+btn.dataset.field); if(!node) return; await copy(node.value); say('Copied.'); }
      else if(action==='downloadBackup') download('chimps-owner-backup.txt', owner().backupText());
      else if(action==='testBackup') { const ok=await owner().checkBackup(get('testBackup'),get('testPass')); say(ok?'Backup decrypts and matches the current Owner key.':'Backup is valid but belongs to a different Owner key.',!ok); }
      else if(action==='unlock') { await owner().unlock(get('unlockPass')); draft=loadDraft(); signedOutput=''; recoveryEntries=[]; managerScreen(); say('Owner mode unlocked.'); }
      else if(action==='restore') { await owner().restore(get('restoreBackup'),get('restorePass')); unlockScreen(); say('Backup restored. Now unlock it.'); }
      else if(action==='showRecovery') recoveryHelp();
      else if(action==='backToUnlock') unlockScreen();
      else if(action==='makeReplacement') {
        if(get('replacementPass')!==get('replacementPass2')) throw new Error('Passphrases do not match.');
        const result=await createReplacement(get('replacementPass'));
        const area=el.querySelector('#replacementResult');
        area.innerHTML='<div class="bm-note"><b>New public key — put this in chimps-config.js:</b><textarea id="replacementPublic" rows="4" readonly>'+esc(result.publicKey)+'</textarea><button data-action="copy" data-field="replacementPublic">COPY PUBLIC KEY</button><b>Encrypted backup — save this safely:</b><textarea id="replacementBackup" rows="5" readonly>'+esc(result.backup)+'</textarea><button data-action="copy" data-field="replacementBackup">COPY BACKUP</button><button data-action="downloadReplacement">DOWNLOAD BACKUP</button><p>Now update chimps-config.js with the public key above, commit, and wait for Pages to redeploy. Then reload and unlock with your new passphrase.</p></div>';
        say('Replacement key generated. Save the backup before continuing.');
      }
      else if(action==='downloadReplacement') download('chimps-owner-replacement-backup.txt', get('replacementBackup'));
      else if(action==='addPlayer') {
        const p=await ID.parseCode(get('playerCode'));
        if(p.id===ID.ownerId()) throw new Error('The Owner cannot be added as a regular player.');
        const existing=draft.find(x=>x.id===p.id);
        if(existing) existing.name=p.name; else draft.push({id:p.id,name:p.name,badges:[]});
        saveDraft(); signedOutput=''; managerScreen(); say('Player added to the draft.');
      }
      else if(action==='remove') { draft=draft.filter(p=>p.id!==btn.dataset.id); saveDraft(); signedOutput=''; managerScreen(); }
      else if(action==='badgeToggle') {
        const p=draft.find(x=>x.id===btn.dataset.id), b=btn.dataset.badge;
        if(!p||!assignable.includes(b)) return;
        p.badges=p.badges.filter(x=>x!==b); if(btn.checked) p.badges.push(b); saveDraft(); signedOutput='';
      }
      else if(action==='sign') { signedOutput=await owner().sign(draft); managerScreen(); say('Registry signed. Copy or download registry.json.'); }
      else if(action==='resetDraft') { draft=loadDraft(); signedOutput=''; managerScreen(); say('Draft reset to the currently published list.'); }
      else if(action==='lock') { owner().lock(); signedOutput=''; unlockScreen(); say('Owner mode locked.'); }
      else if(action==='loadRecovery') { await loadRecovery(); managerScreen(); say('Loaded unverified recovery records. Review them carefully.'); }
      else if(action==='importRecovery') {
        recoveryEntries.forEach(r=>{ if(r.id===ID.ownerId()) return; const p=draft.find(x=>x.id===r.id); if(p){p.name=r.name;p.badges=[...new Set([...p.badges,...r.badges])];} else draft.push({id:r.id,name:r.name,badges:r.badges.slice()}); });
        saveDraft(); signedOutput=''; managerScreen(); say('Recovery records copied into draft. Review every badge before signing.');
      }
      else if(action==='downloadRecovery') download('chimps-recovered-players-unverified.json',JSON.stringify({warning:'UNVERIFIED RECOVERY DATA — review every entry before signing.',players:recoveryEntries},null,2),'application/json');
      else if(action==='downloadRegistry') download('registry.json',signedOutput,'application/json');
    } catch(err) { say(err && err.message ? err.message : String(err),true); }
  });
  function open() {
    if (!ID.me || !ID.me().perms || !ID.me().perms.includes('manage_badges')) {
      say('Badge Manager is Owner-only. Unlock the configured Owner key first.',true); return;
    }
    draft=loadDraft(); managerScreen(); el.style.display='block';
  }
  function close(){el.style.display='none';if(location.hash==='#owner')history.replaceState(null,'',location.pathname+location.search)}
  async function setup() {
    await ID.init();
    if (!ID.owner.configured()) ownerSetupScreen();
    else if (ID.owner.unlocked()) open();
    else unlockScreen();
  }
  window.ChimpsBadgeManager={open,close,setup};
  const checkHash=()=>{if(location.hash==='#owner'){if(ID.init)ID.init().then(()=>{if(!ID.owner.configured())ownerSetupScreen();else if(ID.owner.unlocked())open();else unlockScreen()})}};
  addEventListener('hashchange',checkHash);checkHash();
})();
