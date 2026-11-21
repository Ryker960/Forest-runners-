# Forest Runners setup

The GitHub project now contains the browser prototype and a PlayFab CloudScript backend example.

## 1. Publish the website
In the GitHub repository, open **Settings → Pages**. Choose **Deploy from a branch**, select **main** and **/(root)**, then Save. Wait for GitHub Pages to finish deploying.

## 2. Create / configure PlayFab
1. Sign in to PlayFab Game Manager and create a title.
2. Copy the **Title ID**.
3. Open `index.html` and replace `YOUR_PLAYFAB_TITLE_ID` in `config.titleId` with that public Title ID.
4. Do not put your PlayFab Secret Key in the website. The browser must never contain the Secret Key.

## 3. Set up secure roles
1. Let the game sign in once, then copy your PlayFab ID shown in the status line.
2. Open `cloudscript/ForestRunnersCloudScript.js`.
3. Replace `REPLACE_WITH_OWNER_PLAYFAB_ID` with your PlayFab ID.
4. Add moderator PlayFab IDs to `FOREST_RUNNERS_MODERATOR_IDS`.
5. Add trial moderator IDs only to `FOREST_RUNNERS_TRIAL_MOD_IDS`. Trial moderators get a badge only and are not allowed into vents or tools.
6. Add beta tester, content creator, and I Met The Owner IDs to their matching lists.
7. In PlayFab Game Manager, upload/publish this CloudScript in Automation → CloudScript. The function names must match exactly:
   - `GetForestRunnersRole`
   - `VerifyModeratorVentAccess`
   - `BanPlayer`
   - `KickPlayer`

Roles are decided on the server. Do not accept role names from browser storage or user input.

## 4. Ban and kick status
- Ban Hammer is server-checked and calls PlayFab's BanUsers API. Only owner/moderator IDs can use it. Moderators cannot ban the owner or another moderator.
- Kick Hammer is intentionally disabled until the game has a real multiplayer room service. A static browser page cannot securely remove another player from a shared room by itself.
- The forest scene is currently a single-player prototype. Online rooms, voice chat, and true Gorilla Tag arm-swing locomotion are not implemented yet.

## 5. Test checklist
- Sign in and confirm the status shows a PlayFab ID.
- Confirm your badge appears after CloudScript is published.
- Confirm a trial moderator sees only the Trial Moderator badge.
- Confirm a normal player cannot enter the vents.
- Test bans with a test account before using moderation on real players.
