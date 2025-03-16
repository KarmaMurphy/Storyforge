/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Actor partials.
    'systems/storyforge/templates/actor/parts/actor-features.hbs',
    'systems/storyforge/templates/actor/parts/actor-items.hbs',
    'systems/storyforge/templates/actor/parts/actor-spells.hbs',
    'systems/storyforge/templates/actor/parts/actor-effects.hbs',
    'systems/storyforge/templates/actor/parts/actor-header.hbs',
    'systems/storyforge/templates/actor/pieces/actor-actions.hbs',
    'systems/storyforge/templates/actor/pieces/actor-skills.hbs',
    'systems/storyforge/templates/actor/pieces/actor-trackers.hbs',
    'systems/storyforge/templates/actor/pieces/actor-roleplay.hbs',
    'systems/storyforge/templates/actor/pieces/actor-traits.hbs',
    'systems/storyforge/templates/actor/pieces/actor-inventory.hbs',
    'systems/storyforge/templates/actor/pieces/actor-currencies.hbs',
    'systems/storyforge/templates/actor/pieces/actor-sidebar.hbs',
    'systems/storyforge/templates/actor/pieces/actor-popup.hbs',
    // Actor V2 Partials
    'systems/storyforge/templates/actorV2/parts/actor-header.hbs',
    'systems/storyforge/templates/actorV2/parts/actor-sidebar.hbs',
    'systems/storyforge/templates/actorV2/parts/actor-roleplay.hbs',
    'systems/storyforge/templates/actorV2/parts/actor-combat.hbs',
    'systems/storyforge/templates/actorV2/parts/actor-traits.hbs',
    'systems/storyforge/templates/actorV2/parts/actor-inventory.hbs',
    'systems/storyforge/templates/actorV2/parts/actor-masteries.hbs',
    'systems/storyforge/templates/actorV2/parts/actor-trackers.hbs',
    'systems/storyforge/templates/actorV2/parts/actor-popup.hbs',
    'systems/storyforge/templates/actorV2/parts/actor-effects.hbs',
    // NPC V2 Partials
    'systems/storyforge/templates/actorV2/npc-parts/npc-header.hbs',
    'systems/storyforge/templates/actorV2/npc-parts/npc-sidebar.hbs',
    'systems/storyforge/templates/actorV2/npc-parts/npc-roleplay.hbs',
    'systems/storyforge/templates/actorV2/npc-parts/npc-combat.hbs',
    'systems/storyforge/templates/actorV2/npc-parts/npc-inventory.hbs',
    'systems/storyforge/templates/actorV2/npc-parts/npc-settings.hbs',
    // Runeterra Partials
    "systems/storyforge/templates/actorV2/runeterra/actor-traits.hbs",
    // Item partials
    'systems/storyforge/templates/item/parts/item-effects.hbs',
    // NPC partials
    'systems/storyforge/templates/actor/npc/npc-header.hbs',
    'systems/storyforge/templates/actor/npc/npc-bio.hbs',
    'systems/storyforge/templates/actor/npc/npc-actions.hbs',
    'systems/storyforge/templates/actor/npc/npc-inventory.hbs',
    'systems/storyforge/templates/actor/npc/npc-stats.hbs',
  ]);
};
