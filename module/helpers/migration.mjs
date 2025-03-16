export const MIGRATION_VERSION = "1.0.18";

// Migration script for updating mastery structure and key property
export async function migrateMasteryStructure() {
  console.log("Starting data migration...");

  // Loop through all actors in the game
  for (let actor of game.actors) {
    console.log(`Updating actor: ${actor.name}`);
    let updatedData = {};
    let attributes = actor.system.attributes;
    let statuses = actor.system.statuses || {};

      // Ensure `system.statuses` is reset to an empty object
    updatedData["system.statuses"] = {};

    // Define the attributes to update
    const attributeKeys = ["pow", "dex", "int", "wil"];

    // Update each specified attribute's mastery structure
    attributeKeys.forEach((key) => {
      if (attributes[key]?.mastery) {
        updatedData[`system.attributes.${key}.mastery`] = {
          rank: "Trained",
          points: attributes[key].mastery.points || 0,
          trained: attributes[key].mastery.trained || 0,
          actual: attributes[key].mastery.actual || 0,
        };
      }
    });

    // Update the `key` property to the new structure if needed
    if (typeof actor.system.key === "string") {
      updatedData["system.key"] = { stat: "POW", mod: 0 };
    }

    if (typeof actor.system.deflect === "string") {
      updatedData["system.key"] = { value: 0, bonus: 0 };
    }

    // Apply the updates if any changes were made
    if (Object.keys(updatedData).length > 0) {
      await actor.update(updatedData);
      console.log(`Updated actor: ${actor.name}`);
    }
  }

  for (let actor of game.actors) {
    // Update embedded items within the actor
    for (let item of actor.items) {
      if (item.type === "ability" || item.type === "basic" || item.type === "item") {
          console.log(`Updating embedded item: ${item.name} on actor: ${actor.name}`);
          let updatedItemData = {};
          let actions = item.system.actions;

          updatedItemData["system.actions"] = {
              reaction: {},
              standard: {},
              quick: {}
          };

          const actionKeys = ["reaction", "standard", "quick"];

          for (let key of actionKeys) {
              if (actions[key]) {
                  let max, value;
                  if (key === "standard") {
                      max = 4;
                      value = 1;
                  } else if (key === "reaction") {
                      max = 1;
                      value = 0;
                  } else if (key === "quick") {
                      max = 1;
                      value = 0;
                  }

                  updatedItemData[`system.actions.${key}`] = {
                      value: actions[key].value || value,
                      max: actions[key].max || max,
                  };
              }
          }

          if (Object.keys(updatedItemData).length > 0) {
              await item.update(updatedItemData);
              console.log(`Updated embedded item: ${item.name} on actor: ${actor.name}`);
          }
      }
  }
  }

  for (let item of game.items) {
    if (item.type === "ability" || item.type === "basic" || item.type === "item") {
      console.log(`Updating actor: ${item.name}`);
      let updatedData = {};
      let actions = item.system.actions;

      // Ensure the new structure is initialized
      updatedData["system.actions"] = {
        reaction: {},
        standard: {},
        quick: {}
      };

      // Define the attributes to update
      const actionKeys = ["reaction", "standard", "quick"];

      // Migrate positive status effects
      for (let key of actionKeys) {
        console.log(item.name, actions);
        if (actions[key]) {
          let max;
          let value;
          if (key === "standard"){
            max = 4;
            value = 1;
          } else if (key === "reaction"){
            max = 1;
            value = 0;
          } else if (key === "quick"){
            max = 1;
            value = 0;
          }

          updatedData[`system.actions.${key}`] = {
              value: actions[key].value || value,
              max: actions[key].max || max,
          };
        }
      }

      // Apply the updates if any changes were made
      if (Object.keys(updatedData).length > 0) {
        await item.update(updatedData);
        console.log(`Updated actor: ${item.name}`);
      }
    }
  }

  console.log("Actor & Item data migration complete.");
}

