/* CHIMPS RUNNERS - public shared configuration. Never put a private key here. */
window.CHIMPS_CONFIG = {
  backend: 'static',
  registryUrl: 'registry.json',
  ownerPublicKey: {"kty":"EC","crv":"P-256","x":"-sopFV9NX3KkXEc8t60acWIarBc7EFGb8YOr-ARJT9Y","y":"bGPLLuopyJFYCfVGMZYI_CW3fM7MzrNxjmD5exYzgWM"},
  badges: {
    owner: {label:'Owner',emoji:'👑',rank:0,assignable:false},
    co_owner: {label:'Co-Owner',emoji:'💎',rank:1,assignable:true},
    moderator: {label:'Moderator',emoji:'🛡',rank:2,assignable:true},
    trial_mod: {label:'Trial Moderator',emoji:'🔰',rank:3,assignable:true},
    beta_tester: {label:'Beta Tester',emoji:'🧪',rank:4,assignable:true},
    content_creator: {label:'Content Creator',emoji:'🎥',rank:5,assignable:true},
    met_owner: {label:'I Met The Owner',emoji:'⭐',rank:6,assignable:true},
    chiller: {label:'Chiller',emoji:'😎',rank:7,assignable:true},
    legend: {label:'Legend',emoji:'🏆',rank:8,assignable:true},
    special_member: {label:'Special Member',emoji:'✨',rank:9,assignable:true}
  },
  permissions: {
    owner:['vents','tools','manage_badges','owner_settings'],
    co_owner:['vents','tools'],
    moderator:['vents','tools'],
    trial_mod:[]
  }
};