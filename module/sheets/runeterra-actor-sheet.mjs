import { NewStoryforgeActorSheet } from './new-actor-sheet.mjs';

export class RuneterraActorSheet extends NewStoryforgeActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["storyforge", "sheet", "actorV2"],
      template: "systems/storyforge/templates/sheets/runeterra-character-sheet.hbs",
    });
  }

  /** @override */
  get template() {
    return `systems/storyforge/templates/actorV2/runeterra-${this.actor.type}-sheet.hbs`;
  }

  /** Override `_prepareItems()` to exclude NewStoryforgeActorSheet's implementation */
  _/* prepareItems(actorData) {
    console.log("RuneterraActorSheet | Using custom _prepareItems()");
    
    // Custom logic for preparing items in Runeterra
    const systemData = actorData.system;
  } */
}