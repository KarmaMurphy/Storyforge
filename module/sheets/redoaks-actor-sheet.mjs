import { NewStoryforgeActorSheet } from './new-actor-sheet.mjs';

export class RedOaksActorSheet extends NewStoryforgeActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["storyforge", "sheet", "actorV2"],
      template: "systems/storyforge/templates/sheets/red-oaks-actor-sheet.hbs",
    });
  }

  /** Override `_prepareItems()` to exclude NewStoryforgeActorSheet's implementation */
  /* _prepareItems(actorData) {
    console.log("RedOaksActorSheet | Using custom _prepareItems()");
    
    // Custom logic for preparing items in Red Oaks
    const systemData = actorData.system;
  } */
}