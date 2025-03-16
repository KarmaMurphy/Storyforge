// Import document classes.
import { StoryforgeActor } from './documents/actor.mjs';
import { StoryforgeItem } from './documents/item.mjs';
// Import sheet classes.
import { NewStoryforgeActorSheet } from './sheets/new-actor-sheet.mjs';
import { NewStoryforgeNPCSheet, createBasic } from './sheets/new-npc-sheet.mjs';
import { RuneterraActorSheet } from "./sheets/runeterra-actor-sheet.mjs";
import { RedOaksActorSheet } from "./sheets/redoaks-actor-sheet.mjs";
import { StoryforgeItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { STORYFORGE } from './helpers/config.mjs';
import { getStatusEffectsForActor, statusEffects } from './helpers/statuses.mjs';
import { bondSync } from './helpers/bonds.mjs';
import { MIGRATION_VERSION, migrateMasteryStructure } from './helpers/migration.mjs';
import { StoryforgeCombat } from './helpers/combat.mjs';
import { StoryforgeCombatant } from './helpers/combatant.mjs';
import * as Chat from './helpers/chat.mjs'
import "./helpers/storyforge-lootbox.mjs";
import { CompendiumBrowser } from "./helpers/compendium-browser.mjs";


/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.storyforge = {
    StoryforgeCombat,
    StoryforgeCombatant,
    StoryforgeActor,
    StoryforgeItem,
    rollItemMacro,
  };

  // Add custom constants for configuration.
  CONFIG.STORYFORGE = STORYFORGE;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d20 + @init.value',
    decimals: 2,
  };

  // Register status effects
	CONFIG.ActiveEffect.legacyTransferral = false;
	CONFIG.statusEffects = statusEffects;
	CONFIG.specialStatusEffects.DEFEATED = 'defeated';
	CONFIG.specialStatusEffects.FLY = 'flying';

  // Define custom Document classes
  CONFIG.Actor.documentClass = StoryforgeActor;
  CONFIG.Item.documentClass = StoryforgeItem;
  CONFIG.Combat.documentClass = StoryforgeCombat;
  CONFIG.Combatant.documentClass = StoryforgeCombatant;

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('storyforge', NewStoryforgeActorSheet, {
    types: ["character"],
    makeDefault: true,
    label: 'STORYFORGE.SheetLabels.Actor',
  });
  Actors.registerSheet('storyforge', NewStoryforgeNPCSheet, {
    types: ["npc"],
    makeDefault: true,
    label: 'Playtest Sheet',
  });
  Actors.registerSheet('storyforge', RuneterraActorSheet, {
    types: ["character"],
    label: 'Runeterra Sheet',
  });
  Actors.registerSheet('storyforge', RedOaksActorSheet, {
    types: ["character"],
    label: 'Red Oaks Sheet',
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('storyforge', StoryforgeItemSheet, {
    makeDefault: true,
    label: 'STORYFORGE.SheetLabels.Item',
  });
  /* Hooks.on("renderTokenHUD", async (app, html, data) => {
    const actor = game.actors.get(data.actorId);
    if (!actor) return;
  
    // Find the status effect container
    const statusIcons = html.find(".status-effects");
  
    // Add tiers to the status icons
    statusIcons.children().each((index, elem) => {
      const effectKey = $(elem).attr("data-status-id"); // Assuming each effect has an id
      if (!effectKey) return;
  
      // Retrieve the status tier from the actor's data
      const statusEffect = actor.system.statuses.positive[effectKey] || actor.system.statuses.negative[effectKey];
      if (!statusEffect) return;
  
      // Create the tier badge
      const tierBadge = document.createElement("span");
      tierBadge.classList.add("status-tier-badge");
      tierBadge.innerText = statusEffect.tier || 1;
      elem.appendChild(tierBadge);
    });
  }); */

  // Register System Settings
  
  await game.settings.register('storyforge', 'migrationVersion', {
    name: 'Migration Version',
    scope: 'world',
    config: false,
    type: String,
    default: "0.0.0",
  });

  // Global theme setting (GM-only)
  game.settings.register("storyforge", "globalTheme", {
    name: "Global UI Theme",
    hint: "The GM sets the default theme for all players. Individual players can override it.",
    scope: "world", // World setting (GM sets it)
    config: true,
    type: String,
    choices: {
        "default": "Default Theme",
        "lyoko": "Lyoko Theme",
        "red-oaks": "Red Oaks Theme",
        "league": "League Theme",
        "dreg": "DREG Theme",
        "grimmdark": "Grimmdark Theme",
        "pink": "Pink Theme"
    },
    default: "default",
    restricted: true, // Only GM can change this
    onChange: () => applyTheme() // Reapply when changed
  });

  // Client override theme setting (per player)
  game.settings.register("storyforge", "clientTheme", {
    name: "Personal UI Theme",
    hint: "You can override the global theme set by the GM. Choose 'Use Global Theme' to follow the GM's choice.",
    scope: "client", // Client setting (per player)
    config: true,
    type: String,
    choices: {
        "global": "Use Global Theme",
        "default": "Default Theme",
        "lyoko": "Lyoko Theme",
        "red-oaks": "Red Oaks Theme",
        "league": "League Theme",
        "dreg": "DREG Theme",
        "grimmdark": "Grimmdark Theme",
        "pink": "Pink Theme"
    },
    default: "global",
    onChange: () => applyTheme() // Reapply when changed
  });
  applyTheme();

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

// If Equals handlebar helper
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('ifeq', function (a, b, options) {
  if (a == b) { return options.fn(this); }
  return options.inverse(this);
});

Handlebars.registerHelper('ifnoteq', function (a, b, options) {
  if (a != b) { return options.fn(this); }
  return options.inverse(this);
});

// Loop a number of times
Handlebars.registerHelper('loop', function(n, s, block) {
  var accum = '';

  for(var i = s; i <= n; ++i) {
      block.data.index = i;
      block.data.first = i === s;
      block.data.last = i === (n - 1);
      accum += block.fn(this);
  }
  return accum;
});

Handlebars.registerHelper("add", (num1, num2) => Number(num1) + Number(num2));
Handlebars.registerHelper("sub", (num1, num2) => Number(num1) - Number(num2));
Handlebars.registerHelper("mul", (num1, num2) => Number(num1) * Number(num2));
Handlebars.registerHelper("div", (num1, num2) => (Number(num2) !== 0 ? Number(num1) / Number(num2) : 0));


Handlebars.registerHelper({
  or() {
      return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
  }
});

Handlebars.registerHelper("subtract", function(a, b) {
  let total = a - b;
  if (total <= 0){
    return 0;
  } else {
    return a - b;
  }
});

Handlebars.registerHelper("critFormula", function(damage, crit, deflect) {
  let total = damage + crit - deflect;
  if (total <= 0){
    return 0;
  } else {
    return total;
  }
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => {
    createItemMacro(data, slot);
    return false;
  
  });

  const currentVersion = game.settings.get('storyforge', 'migrationVersion') || "0.0.0";

  if (isNewerVersion(MIGRATION_VERSION, currentVersion)) {
    console.log(`Running migrations for version ${MIGRATION_VERSION}...`);
    await migrateMasteryStructure();
    console.log("Migration complete.");

    // Save the migration version
    await game.settings.set('storyforge', 'migrationVersion', MIGRATION_VERSION);
  }

  // Register the hook inside Foundry
  Hooks.on("updateItem", StoryforgeItem.onUpdatePerk);

  // Register status effects for all actors on startup
	//game.actors.forEach(actor => registerDynamicStatusEffects(actor));

  bondSync();
  createBasic();
  Hooks.call("storyforgeLootboxReady");
  game.storyforge.compendiumBrowser = new CompendiumBrowser();
  // StoryforgeCombat.initializeHooks();

  applyTheme();
});

/* -------------------------------------------- */
/*  Other Hooks                                 */
/* -------------------------------------------- */

// Hooks.on("updateActor", async (actor, changes) => {
//   // Check if the `effects` array was updated
//   if (changes.effects) {
//       const previousEffects = actor._source.effects || [];
//       const newEffects = changes.effects;

//       // Find newly added effects
//       const addedEffects = newEffects.filter(effect => !previousEffects.includes(effect));

//       if (addedEffects.length > 0) {
//           console.log("Added status effects to actor:", addedEffects);

//           // Call the custom hook for each new effect
//           const tokens = canvas.tokens.placeables.filter(t => t.actor?.id === actor.id);
//           for (const effect of addedEffects) {
//               for (const token of tokens) {
//                   Hooks.call("applyStatusEffect", token, effect);
//               }
//           }
//       }
//   }
// });


/* Hooks.on("applyActiveEffect", protectedPDef)

function protectedPDef (actor, change){
  //console.log(change)
  if (change.key !== "system.def.bonus") return;
  //console.log(change.key, actor);
  const actorData = actor.system;
  const def = +actorData.def.bonus || 0;
  const tier = +actorData.attributes.int.value || 0;
  console.log(actorData)
  console.log(def, tier);
  actorData.def.bonus += tier;
  console.log(actorData.def.bonus);
} */

/* Hooks.on("applyActiveEffect", testEffect2)

function testEffect2(actor, change){
  console.log(change.key)
  console.log(actor, change)
  let actor = actor.system;
  console
};
 */

Hooks.on("getChatLogEntryContext", Chat.addChatMessageContextOptions);

Hooks.on("endCombatantTurn", async (combat, combatant) => {
  if (!combatant?.actor) return;

  await combatant.actor.update({
      "system.actions.standard.value": combatant.actor.system.actions.standard.max,
      "system.actions.reaction.value": combatant.actor.system.actions.reaction.max,
      "system.actions.quick.value": combatant.actor.system.actions.quick.max
  });
});

Hooks.on("renderTokenHUD", async (app, html, data) => {
  const token = canvas.tokens.get(data._id);
  if (!token || !token.actor) return;

  const actor = token.actor;
  if (!actor.system || !actor.system.statuses) return;

  // Get the status set for this specific actor's sheet
  const sheetClass = actor.getFlag("storyforge", "sheetClass") || "NewStoryforgeActorSheet";
  const statusSet = STORYFORGE.statuses[sheetClass] || STORYFORGE.statuses.NewStoryforgeActorSheet;

  // Extract all statuses this actor **can** have (not just active ones)
  const validStatuses = new Set([
      ...Object.keys(statusSet.positive || {}),
      ...Object.keys(statusSet.negative || {}),
      ...Object.keys(statusSet.conditions || {})
  ]);

  // Find the status effects container in the HUD
  const statusContainer = html.find(".status-effects");

  // Clear existing icons
  statusContainer.empty();

  // Add only the statuses valid for this actor's sheet
  for (const effect of statusEffects) {
      if (validStatuses.has(effect.id)) {
          const effectIcon = $(`<img class="effect-control" src="${effect.icon}" data-tooltip="${effect.name}" data-status-id="${effect.id}"/>`);
          statusContainer.append(effectIcon);
      }
  }
});

Hooks.on("renderTokenHUD", async (app, html, data) => {
  const token = canvas.tokens.get(data._id);
  if (!token || !token.actor) return;

  await html.find(".effect-control").on("click", async (event) => {
    event.preventDefault();

    const effectIcon = event.currentTarget.dataset.statusId;
    let statuses = await token.actor.statuses;
    let isActive = !statuses.has(effectIcon); // Corrected negation
    const actor = token.actor;
    let statusDialog;

    // Find the status effect in the actor's system data
    let statusUpdated = false;
    let updates = {};

    const updateStatusActive = async (statusGroup, path) => {
      console.log(statusGroup);
      for (let [statusKey, status] of Object.entries(statusGroup)) {
        if (statusKey === effectIcon) {
          status.active = isActive;

          if (isActive) {
            // Wait for the dialog to resolve before continuing
            statusDialog = await activateStatusDialog(actor, status, statusKey);
            if (statusDialog) {
              status.tier = statusDialog.tier;
              status.persistent = statusDialog.persistent;
            } else {
              status.tier = 0;
              status.persistent = true;
            }
          }

          updates[`${path}.${statusKey}.name`] = status.name || statusKey.toUpperCase();
          updates[`${path}.${statusKey}.active`] = isActive;
          updates[`${path}.${statusKey}.tier`] = status.tier;
          updates[`${path}.${statusKey}.persistent`] = status.persistent;
          statusUpdated = true;
        }
      }
    };

    // Await both status updates before calling actor.update()
    await updateStatusActive(actor.system.statuses.positive, "system.statuses.positive");
    await updateStatusActive(actor.system.statuses.negative, "system.statuses.negative");

    if (statusUpdated) {
      console.log("Updating Actor:", updates);
      await actor.update(updates);
    }
  });
});


async function activateStatusDialog(actor, status, statusName) {
  const cardData = {
    actor: actor,
    status: status,
    statusName: statusName,
  }

  const myContent = await renderTemplate("systems/storyforge/templates/dialog/dialog-activate-status.hbs", cardData);

  return new Promise(resolve => {
    const data = {
      title:"Skill Check",
      content: myContent,
      buttons: {
        narrative: {
          icon: '<i class="fas fa-dice-d20"></i>',
          label: "Add",
          callback: html => resolve(_processStatusOptions(html[0].querySelector("form")))
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => close
        }
      },
      default: "roll"
    }

    new Dialog(data, {width: 300}).render(true);
  });
}

function _processStatusOptions(form) {
  let persistent = form.querySelector(`input[name="persistentToggle"]`).checked

  return {
    persistent: persistent,
    tier: form.statusTier.value,
  }
}

// Function to Apply Theme
function applyTheme() {
  // Get the GM's global theme
  const globalTheme = game.settings.get("storyforge", "globalTheme");

  // Get the player's personal theme setting
  const clientTheme = game.settings.get("storyforge", "clientTheme");

  // Determine which theme to apply (client override > global setting)
  const themeToApply = clientTheme === "global" ? globalTheme : clientTheme;

  // Remove all theme classes before applying the new one
  document.documentElement.classList.remove("default", "lyoko", "red-oaks", "league", "dreg", "grimmdark", "pink");
  document.documentElement.classList.add(themeToApply);
}

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.storyforge.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'storyforge.itemMacro': true },
    });
  }

  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}

