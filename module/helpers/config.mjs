export const STORYFORGE = {};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
STORYFORGE.attributes = {
  pow: 'STORYFORGE.Ability.Pow.long',
  dex: 'STORYFORGE.Ability.Dex.long',
  int: 'STORYFORGE.Ability.Int.long',
  wil: 'STORYFORGE.Ability.Wil.long',
};

STORYFORGE.attributeAbbreviations = {
  pow: 'STORYFORGE.Ability.Pow.abbr',
  dex: 'STORYFORGE.Ability.Dex.abbr',
  int: 'STORYFORGE.Ability.Int.abbr',
  wil: 'STORYFORGE.Ability.Wil.abbr',
};

STORYFORGE.weaponMasteries = {
  artillery: 'artillery',
  axes: 'axes',
  blades: 'blades',
  blunt: 'blunt',
  bows: 'bows',
  brawling: 'brawling',
  energy: "energy",
  polearms: 'polearms',
  shields: 'shields',
  whips: 'whips',
};

STORYFORGE.mastery = {
  untrained: "UNTRAINED",
  trained: "TRAINED",
  adept: "ADEPT",
  expert: "EXPERT",
  master: "MASTER",
  legend: "LEGEND",
};

STORYFORGE.damageTypes = {
  normal: "Normal",
  acid: "Acid",
  dark: "Dark",
  fire: "Fire",
  force: "Force",
  earth: "Earth",
  healing: "Healing",
  lightning: "Lightning",
  posion: "Poison",
  psychic: "Psychic",
  radiant: "Radiant",
  thunder: "Thunder",
  water: "Water",
  wind: "Wind"
};

STORYFORGE.defenses = {
  pdef: "P. Def",
  adef: "A. Def"
};

STORYFORGE.statusPositive = {
  buffed: 'Buffed',
  bolstered: 'Bolstered',
  flying: 'Flying',
  hasted: 'Hasted',
  invisible: 'Invisible',
  protected: 'Protected',
  regen: 'Regen',
  resistant: 'Resistant',
  thorns: 'Thorns',
};

STORYFORGE.statusNegative = {
  blinded: 'Blinded',
  charmed: 'Charmed',
  entropy: 'Entropy',
  exposed: 'Exposed',
  marked: 'Marked',
  shaken: 'Shaken',
  slowed: 'Slowed',
  weakened: 'Weakened',
  immobile: 'Immobile',
};

STORYFORGE.conditions = {
  broken: 'Broken',
  tapped: 'Tapped',
  prone: 'Prone',
  startled: 'Startled',
  covered: 'Flanked',
  grappled: 'Grappled',
  grappling: 'Grappling',
  hidden: 'Hidden',
  weakened: 'Sundered',
  disabled: 'Disabled',
};

STORYFORGE.statuses = {
  NewStoryforgeActorSheet: {
    positive: {
      buffed: { name: "Buffed", icon: 'systems/storyforge/assets/statuses/buffed.webp', tier: 1, persistent: false, duration: 0 },
      bolstered: { name: "Bolstered", icon: 'systems/storyforge/assets/statuses/bolstered.webp', tier: 1, persistent: false, duration: 0 },
      flying: { name: "Flying", icon: 'systems/storyforge/assets/statuses/flying.webp', tier: 1, persistent: false, duration: 0 },
      hasted: { name: "Hasted", icon: 'systems/storyforge/assets/statuses/hasted.webp', tier: 1, persistent: false, duration: 0 },
      invisible: { name: "Invisible", icon: 'systems/storyforge/assets/statuses/invisible.webp', tier: 1, persistent: false, duration: 0 },
      protected: { name: "Protected", icon: 'systems/storyforge/assets/statuses/protected-pdef.webp', tier: 1, persistent: false, duration: 0 },
      regen: { name: "Regen", icon: 'systems/storyforge/assets/statuses/regen.webp', tier: 1, persistent: false, duration: 0 },
      resistant: { name: "Resistant", icon: 'systems/storyforge/assets/statuses/resistant.webp', tier: 1, persistent: false, duration: 0 },
      thorns: { name: "Thorns", icon: "systems/storyforge/assets/statuses/flying.webp", tier: 1, persistent: false, duration: 0 },
    },
    negative: {
      blinded: { name: "Blinded", icon: 'systems/storyforge/assets/statuses/broken.webp', tier: 1, persistent: false, duration: 0 },
      charmed: { name: "Charmed", icon: 'systems/storyforge/assets/statuses/charmed.webp', tier: 1, persistent: false, duration: 0 },
      entropy: { name: "Entropy", icon: 'systems/storyforge/assets/statuses/poisoned.webp', tier: 1, persistent: false, duration: 0 },
      exposed: { name: "Exposed", icon: 'systems/storyforge/assets/statuses/exposed.webp', tier: 1, persistent: false, duration: 0 },
      immobile: { name: "Immobile", icon: 'systems/storyforge/assets/statuses/immobilized.webp', tier: 1, persistent: false, duration: 0 },
      marked: { name: "Marked", icon: 'systems/storyforge/assets/statuses/marked.webp', tier: 1, persistent: false, duration: 0 },
      shaken: { name: "Shaken", icon: 'systems/storyforge/assets/statuses/shaken.webp', tier: 1, persistent: false, duration: 0 },
      slowed: { name: "Slowed", icon: "systems/storyforge/assets/statuses/stunned.webp", tier: 1, persistent: false, duration: 0 },
      weakened: { name: "Weakened", icon: 'systems/storyforge/assets/statuses/weakened.webp', tier: 1, persistent: false, duration: 0 },
    },
    conditions: {
      broken: {name: 'Broken', icon: 'systems/storyforge/assets/statuses/old-icons/broken.webp', persistent: false, duration: 0},
      tapped: {name: 'Tapped', icon: 'systems/storyforge/assets/statuses/tapped.webp', persistent: false, duration: 0},
      stupified: {name: 'Stupified', icon: 'systems/storyforge/assets/statuses/stupified.webp', persistent: false, duration: 0},
      covered: {name: 'Covered', icon: "", persistent: false, duration: 0},
      disabled: {name: 'Disabled', icon: "", persistent: false, duration: 0},
      grappled: {name: 'Grappled', icon: "", persistent: false, duration: 0},
      grappling: {name: 'Grappling', icon: 'systems/storyforge/assets/statuses/grappling.webp', persistent: false, duration: 0},
      hidden: {name: 'Hidden', icon: "", persistent: false, duration: 0},
      prone: {name: 'Prone', icon: "", persistent: false, duration: 0},
      startled: {name: 'Startled', icon: "", persistent: false, duration: 0},
    }
  },

  RuneterraActorSheet: {
    positive: {
      buffed: { name: "Buffed", icon: 'systems/storyforge/assets/statuses/buffed.webp', tier: 1, persistent: false, duration: 0 },
      bolstered: { name: "Bolstered", icon: 'systems/storyforge/assets/statuses/bolstered.webp', tier: 1, persistent: false, duration: 0 },
      flying: { name: "Flying", icon: 'systems/storyforge/assets/statuses/flying.webp', tier: 1, persistent: false, duration: 0 },
      hasted: { name: "Hasted", icon: 'systems/storyforge/assets/statuses/hasted.webp', tier: 1, persistent: false, duration: 0 },
      invisible: { name: "Invisible", icon: 'systems/storyforge/assets/statuses/invisible.webp', tier: 1, persistent: false, duration: 0 },
      protected: { name: "Protected", icon: 'systems/storyforge/assets/statuses/protected-pdef.webp', tier: 1, persistent: false, duration: 0 },
      regen: { name: "Regen", icon: 'systems/storyforge/assets/statuses/regen.webp', tier: 1, persistent: false, duration: 0 },
      resistant: { name: "Resistant", icon: 'systems/storyforge/assets/statuses/resistant.webp', tier: 1, persistent: false, duration: 0 },
      thorns: { name: "Thorns", icon: "systems/storyforge/assets/statuses/flying.webp", tier: 1, persistent: false, duration: 0 },
    },
    negative: {
      blinded: { name: "Blinded", icon: "systems/storyforge/assets/statuses/blinded.webp", tier: 1, persistent: false, duration: 0 },
      entropy: { name: "Entropy", icon: 'systems/storyforge/assets/statuses/poisoned.webp', tier: 1, persistent: false, duration: 0 },
      exposed: { name: "Exposed", icon: "systems/storyforge/assets/statuses/blinded.webp", tier: 1, persistent: false, duration: 0 },
      marked: { name: "Marked", icon: "systems/storyforge/assets/statuses/stunned.webp", tier: 1, persistent: false, duration: 0 },
      shaken: { name: "Shaken", icon: 'systems/storyforge/assets/statuses/shaken.webp', tier: 1, persistent: false, duration: 0 },
      slowed: { name: "Slowed", icon: "systems/storyforge/assets/statuses/stunned.webp", tier: 1, persistent: false, duration: 0 },
      weakened: { name: "Weakened", icon: "systems/storyforge/assets/statuses/blinded.webp", tier: 1, persistent: false, duration: 0 },
    },
    conditions: {
      broken: {name: 'Broken', icon: 'systems/storyforge/assets/statuses/broken.webp', persistent: false, duration: 0},
      tapped: {name: 'Tapped', icon: 'systems/storyforge/assets/statuses/tapped.webp', persistent: false, duration: 0},
      charmed: {name: 'Charmed', icon: "", persistent: false, duration: 0},
      covered: {name: 'Covered', icon: "", persistent: false, duration: 0},
      grappled: {name: 'Grappled', icon: "", persistent: false, duration: 0},
      grappling: {name: 'Grappling', icon: "", persistent: false, duration: 0},
      hidden: {name: 'Hidden', icon: "", persistent: false, duration: 0},
      immobile: {name: 'Immobile', icon: "", persistent: false, duration: 0},
      prone: {name: 'Prone', icon: "", persistent: false, duration: 0},
      silenced: {name: 'Silenced', icon: "", persistent: false, duration: 0},
      sleep: {name: 'Sleep', icon: 'systems/storyforge/assets/statuses/unconcious.webp', persistent: false, duration: 0},
      startled: {name: 'Startled', icon: "", persistent: false, duration: 0},
      stunned: {name: 'Stunned', icon: "", persistent: false, duration: 0},
      stupified: {name: 'Stupified', icon: "", persistent: false, duration: 0},
    }
  },

  RedOaksActorSheet: {
    positive: {
      buffed: { name: "Buffed", icon: 'systems/storyforge/assets/statuses/buffed.webp', tier: 1, persistent: false, duration: 0 },
      bolstered: { name: "Bolstered", icon: 'systems/storyforge/assets/statuses/bolstered.webp', tier: 1, persistent: false, duration: 0 },
      flying: { name: "Flying", icon: 'systems/storyforge/assets/statuses/flying.webp', tier: 1, persistent: false, duration: 0 },
      hasted: { name: "Hasted", icon: 'systems/storyforge/assets/statuses/hasted.webp', tier: 1, persistent: false, duration: 0 },
      invisible: { name: "Invisible", icon: 'systems/storyforge/assets/statuses/invisible.webp', tier: 1, persistent: false, duration: 0 },
      protected: { name: "Protected", icon: 'systems/storyforge/assets/statuses/protected-pdef.webp', tier: 1, persistent: false, duration: 0 },
      regen: { name: "Regen", icon: 'systems/storyforge/assets/statuses/regen.webp', tier: 1, persistent: false, duration: 0 },
      resistant: { name: "Resistant", icon: 'systems/storyforge/assets/statuses/resistant.webp', tier: 1, persistent: false, duration: 0 },
      thorns: { name: "Thorns", icon: "systems/storyforge/assets/statuses/flying.webp", tier: 1, persistent: false, duration: 0 },
    },
    negative: {
      charmed: { name: "Charmed", icon: "systems/storyforge/assets/statuses/stunned.webp", tier: 1, persistent: false, duration: 0 },
      confused: { name: "Confused", icon: "systems/storyforge/assets/statuses/stunned.webp", tier: 1, persistent: false, duration: 0 },
      dazed: { name: "Dazed", icon: 'systems/storyforge/assets/statuses/shaken.webp', tier: 1, persistent: false, duration: 0 },
      decay: { name: "Decay", icon: 'systems/storyforge/assets/statuses/poisoned.webp', tier: 1, persistent: false, duration: 0 },
      exposed: { name: "Exposed", icon: "systems/storyforge/assets/statuses/blinded.webp", tier: 1, persistent: false, duration: 0 },
      marked: { name: "Marked", icon: "systems/storyforge/assets/statuses/blinded.webp", tier: 1, persistent: false, duration: 0 },
      slowed: { name: "Slowed", icon: "systems/storyforge/assets/statuses/stunned.webp", tier: 1, persistent: false, duration: 0 },
      weakened: { name: "Weakened", icon: "systems/storyforge/assets/statuses/blinded.webp", tier: 1, persistent: false, duration: 0 },
      immobile: { name: "Immobile", icon: "systems/storyforge/assets/statuses/stunned.webp", tier: 1, persistent: false, duration: 0 },
    },
    conditions: {
      broken: {name: 'Broken', icon: 'systems/storyforge/assets/statuses/broken.webp', persistent: false, duration: 0},
      tapped: {name: 'Tapped', icon: 'systems/storyforge/assets/statuses/tapped.webp', persistent: false, duration: 0},
      covered: {name: 'Covered', icon: "", persistent: false, duration: 0},
      disabled: {name: 'Disabled', icon: "", persistent: false, duration: 0},
      grappled: {name: 'Grappled', icon: "", persistent: false, duration: 0},
      grappling: {name: 'Grappling', icon: "", persistent: false, duration: 0},
      hidden: {name: 'Hidden', icon: "", persistent: false, duration: 0},
      prone: {name: 'Prone', icon: "", persistent: false, duration: 0},
      provoked: {name: 'Provoked', icon: "", persistent: false, duration: 0},
      startled: {name: 'Startled', icon: "", persistent: false, duration: 0},
      stupified: {name: 'Stupified', icon: "", persistent: false, duration: 0},
    }
  }
}