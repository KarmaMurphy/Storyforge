export function bondSync(){
    // Add a hook to handle when an actor is dropped onto another actor sheet
  Hooks.on("dropActorSheetData", async (actor, sheet, data) => {
    if (data.type === "Actor") {
        console.log(actor, sheet, data.uuid)
        let sourceActorId = data.uuid.replace(/Actor./g, "");
        const sourceActor = game.actors.get(sourceActorId); // Get the source actor being dragged
        const targetActor = actor; // The actor on whose sheet the drop occurs
        console.log(sourceActor, targetActor);

        if (!sourceActor || !targetActor || sourceActor.id === targetActor.id) return;
        console.log("PASSED!")

        // Check if a bond already exists
        const sourceBondExists = sourceActor.items.some(
            (item) => item.name === `${targetActor.name}`
        );
        const targetBondExists = targetActor.items.some(
            (item) => item.name === `${sourceActor.name}`
        );

        if (!sourceBondExists && !targetBondExists) {
            // Create Bond items on both actors
            const sourceBond = await sourceActor.createEmbeddedDocuments("Item", [
            {
                name: `${targetActor.name}`,
                type: "bond",
                system: {
                description: "A bond between characters.",
                targetId: targetActor.id,
                rank: 1, // Initialize rank to a default value
                },
            },
            ]);

            const targetBond = await targetActor.createEmbeddedDocuments("Item", [
            {
                name: `${sourceActor.name}`,
                type: "bond",
                system: {
                description: "A bond between characters.",
                targetId: sourceActor.id,
                rank: 1, // Initialize rank to a default value
                },
            },
            ]);

            console.log(`Created bond items for ${sourceActor.name} and ${targetActor.name}`);
        }
    }
});

  // Sync bond updates
  Hooks.on("updateItem", async (item, updates) => {
    if (item.type === "bond" && updates?.system?.rank !== undefined) {
      const actor = item.parent; // The actor owning the bond item
      const targetActorId = item.system.targetId;
      const targetActor = game.actors.get(targetActorId);

      if (!targetActor) return;

      // Find the corresponding bond item on the target actor
      const targetBond = targetActor.items.find(
        (i) => i.type === "bond" && i.system.targetId === actor.id
      );

      if (targetBond) {
        await targetBond.update({ "system.rank": updates.system.rank });
        console.log(`Synchronized bond rank updates between ${actor.name} and ${targetActor.name}`);
      }
    }
  });
}