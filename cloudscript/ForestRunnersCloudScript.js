// Forest Runners - PlayFab Classic CloudScript
// Upload this file in PlayFab Game Manager > Automation > CloudScript.
// IMPORTANT: Replace the IDs below with real PlayFab IDs. Never put a SecretKey in index.html.
var FOREST_RUNNERS_OWNER_ID = "REPLACE_WITH_OWNER_PLAYFAB_ID";
var FOREST_RUNNERS_MODERATOR_IDS = [
  // "REPLACE_WITH_MODERATOR_PLAYFAB_ID"
];
var FOREST_RUNNERS_TRIAL_MOD_IDS = [
  // Trial moderators receive only the badge; they cannot enter vents or use tools.
];
var FOREST_RUNNERS_BETA_TESTER_IDS = [];
var FOREST_RUNNERS_CONTENT_CREATOR_IDS = [];
var FOREST_RUNNERS_MET_OWNER_IDS = [];

function getForestRole(playFabId) {
  if (playFabId === FOREST_RUNNERS_OWNER_ID && playFabId !== "REPLACE_WITH_OWNER_PLAYFAB_ID") return "owner";
  if (FOREST_RUNNERS_MODERATOR_IDS.indexOf(playFabId) !== -1) return "moderator";
  if (FOREST_RUNNERS_TRIAL_MOD_IDS.indexOf(playFabId) !== -1) return "trial_mod";
  if (FOREST_RUNNERS_BETA_TESTER_IDS.indexOf(playFabId) !== -1) return "beta_tester";
  if (FOREST_RUNNERS_CONTENT_CREATOR_IDS.indexOf(playFabId) !== -1) return "content_creator";
  if (FOREST_RUNNERS_MET_OWNER_IDS.indexOf(playFabId) !== -1) return "met_owner";
  return "player";
}
function isModeratorOrOwner(playFabId) {
  var role = getForestRole(playFabId);
  return role === "owner" || role === "moderator";
}
handlers.GetForestRunnersRole = function(args, context) {
  return { role: getForestRole(currentPlayerId) };
};
handlers.VerifyModeratorVentAccess = function(args, context) {
  return { allowed: isModeratorOrOwner(currentPlayerId), role: getForestRole(currentPlayerId) };
};
handlers.BanPlayer = function(args, context) {
  if (!isModeratorOrOwner(currentPlayerId)) throw "You are not allowed to use the ban hammer.";
  var targetId = String((args && args.targetPlayFabId) || "").trim();
  var duration = Number((args && args.durationHours) || 24);
  var reason = String((args && args.reason) || "Forest Runners moderation").slice(0, 200);
  if (!targetId || targetId.length > 64) throw "Enter a valid target PlayFab ID.";
  if (!isFinite(duration) || duration < 1 || duration > 87600) throw "Ban duration must be between 1 and 87600 hours.";
  if (targetId === currentPlayerId) throw "You cannot ban yourself.";
  var actorRole = getForestRole(currentPlayerId);
  var targetRole = getForestRole(targetId);
  if (targetRole === "owner") throw "The owner account cannot be banned by this tool.";
  if (actorRole === "moderator" && targetRole === "moderator") throw "Moderators cannot ban another moderator.";
  var result = server.BanUsers({ Bans: [{
    PlayFabId: targetId,
    DurationInHours: duration,
    Reason: reason
  }]});
  return { success: true, targetPlayFabId: targetId, durationHours: duration, banResult: result };
};
// A kick requires an actual connected-room implementation (PlayFab Party, Lobby,
// or a dedicated multiplayer server). This project does not yet have room hosting,
// so this handler deliberately refuses instead of pretending a player was kicked.
handlers.KickPlayer = function(args, context) {
  if (!isModeratorOrOwner(currentPlayerId)) throw "You are not allowed to use the kick hammer.";
  throw "Kick is not enabled yet: connect the game to PlayFab Lobby/Party or a dedicated server first.";
};
