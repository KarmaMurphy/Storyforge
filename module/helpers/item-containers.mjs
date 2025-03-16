export class ItemContainers {
    constructor() {
        this.allowedContainers = {
            "origin": ["perk"],
            "ancestry": ["trait"],
            "path": ["trait"],
            "ability": ["tag"],
            "item": ["tag"],
            "basic": ["tag"],
        };

        this.transferrableItems = {
            // "origin": ["perk"],
            //"ancestry": ["ancestry-trait"]
            "path": ["trait"]
        };
    }

    /**
     * Checks if an item type can be stored in another item type.
     */
    canStoreItem(parentType, childType) {
        return this.allowedContainers[parentType]?.includes(childType) ?? false;
    }

    /**
     * Adds a child item to a parent item's system.items object.
     */
    async storeItem(parentItem, childItem) {
        if (!this.canStoreItem(parentItem.type, childItem.type)) return false;

        // Ensure system.items is an object
        parentItem.system.items = parentItem.system.items || {};
        const newItemId = randomID(); 

        // Modify Trait items if they are being added to a Path
        if (parentItem.type === "path" && childItem.type === "trait") {
            // Ensure the child item has `system.type` set to "Path"
            if (childItem.system.type !== "Path") {
                childItem.system.type = "Path";
            }

            // Assign the source if it is not already set
            if (!childItem.system.source ||  childItem.system.source != parentItem.name) {
                childItem.system.source = parentItem.name;
            }

            // Ensure system.transfer is set to false
            //childItem.flags.storyforge.transfer = false;
        }

        // Store child item using its ID as a key
        const updatedItems = {
            ...parentItem.system.items,
            [newItemId]: {
                name: childItem.name,
                img: childItem.img,
                type: childItem.type,
                id: newItemId,
                system: childItem.system
            }
        };

        // Update parent item with new stored child item
        await parentItem.update({ "system.items": updatedItems });
        return true;
    }

    /**
     * Right-click menu for editing or deleting stored items.
     */
    createContextMenu(html, parentItem) {
        new ContextMenu(html, ".stored-item", [
            {
                name: "Edit",
                icon: '<i class="fas fa-edit"></i>',
                callback: li => {
                    const itemId = li.data("item-id");
                    this.editStoredItem(parentItem, itemId);
                }
            },
            {
                name: "Delete",
                icon: '<i class="fas fa-trash"></i>',
                callback: li => {
                    const itemId = li.data("item-id");
                    this.removeStoredItem(parentItem, itemId);
                }
            }
        ]);
    }

    /**
     * Edits a stored item by creating a temporary real instance with player ownership.
     */
    async editStoredItem(parentItem, itemId) {
        const storedItem = parentItem.system.items?.[itemId];
        if (!storedItem) return;

        const userId = game.user.id; // Get the current user ID

        // Create a real item, bypassing permission checks
        let tempItem = await Item.implementation.create({
            ...storedItem,
            ownership: { [userId]: 3 }, // Grant full ownership to the player
            flags: {
                ...storedItem.flags,
                "storyforge.parentItemId": parentItem.uuid,
                "storyforge.childItemId": itemId,
                "storyforge.temporary": true // Mark for deletion later
            },
            visible: false
        });

        // Open the sheet for the user
        tempItem.sheet.render(true);
    }


    /**
     * Removes a stored item from the parent.
     */
    async removeStoredItem(parentItem, itemId) {
        let updatedItems = { ...parentItem.system.items };
        console.log(`Deleting item ${itemId}`);

        // Setting Item as null in order to remove it
        updatedItems[itemId] = null;

        await parentItem.update({ "system.items": updatedItems });
    }

    /**
     * Handles clicking an add-child element to create a default child item.
     */
    async addChildItem(parentItem, childType, templateData = {}) {
        if (!this.canStoreItem(parentItem.type, childType)) return;

        const template = game.system.template.Item[childType] || {};

        // Generate a new unique ID for the child item
        const newItemId = randomID(); 

        const newItem = {
            id: newItemId,
            name: `New ${childType}`,
            img: "icons/svg/item-bag.svg",
            type: childType,
            system: foundry.utils.mergeObject(template, templateData || {})
        };

        // If the parent is a Path and the child is a Trait, update system.type and system.source
        if (parentItem.type === "path" && childType === "trait") {
            if (newItem.system.type !== "Path") {
                newItem.system.type = "Path";
            }

            if (!newItem.system.source || newItem.system.source != parentItem.name) {
                newItem.system.source = parentItem.name;
            }

            // Ensure system.transfer is set to false
            //newItem.flags.storyforge.transfer = false;
        }

        // Ensure system.items is an object and store the new item
        let updatedItems = { ...parentItem.system.items, [newItemId]: newItem };

        // Use item.update() to properly store the new item
        await parentItem.update({ "system.items": updatedItems });
    }

}

Hooks.on("updateItem", async (item, changes, options, userId) => {
    const parentItemId = item.getFlag("storyforge", "parentItemId");
    const childItemId = item.getFlag("storyforge", "childItemId");
    if (!parentItemId || !childItemId) return;

    // Retrieve parent item
    const parentItem = await fromUuid(parentItemId);
    if (!parentItem) return;

    // Update stored item in object structure
    let updatedItems = { ...parentItem.system.items };
    if (!updatedItems[childItemId]) return;

    updatedItems[childItemId] = {
        ...updatedItems[childItemId],
        ...item.toObject()
    };

    await parentItem.update({ "system.items": updatedItems });

    console.log(`Updated stored item "${updatedItems[childItemId].name}" inside "${parentItem.name}".`);
});


/**
 * Listens for when temporary items are closed and deletes them.
 */
Hooks.on("closeItemSheet", async (app, html) => {
    const item = app.object;
    if (!item.getFlag("storyforge", "temporary")) return;

    console.log(`Deleting temporary item: ${item.name}`);
    await item.delete();
});

/**
 * Hides temporary items in the Items Directory by applying CSS dynamically.
 */
Hooks.on("renderItemDirectory", async (app, html, data) => {
    html.find(".directory-item").each((_, element) => {
        const itemId = element.dataset.documentId;
        const item = game.items.get(itemId);

        // If the item is marked as temporary, hide it
        if (item?.getFlag("storyforge", "temporary")) {
            console.log("LOGGED!", element)
            element.setAttribute("class", "directory-item document item temporary-item");
        }
    });
});

/**
 * Deletes all temporary items upon Foundry startup.
 */
Hooks.once("ready", async function () {
    console.log("Checking for temporary items to delete...");

    const temporaryItems = game.items.filter(item => item.getFlag("storyforge", "temporary"));

    if (temporaryItems.length > 0) {
        console.log(`Deleting ${temporaryItems.length} temporary items...`);
        for (let item of temporaryItems) {
            await item.delete();
            console.log(`Deleted temporary item: ${item.name} (ID: ${item.id})`);
        }
    } else {
        console.log("No temporary items found.");
    }
});

/**
 * Automatically transfers stored items to the Actor when a Parent Item is updated.
 */
/* Hooks.on("updateItem", async (item, changes, options, userId) => {
    // Ensure the item is inside an Actor and has stored items
    if (!item.parent || !(item.parent instanceof Actor) || !item.system.items) return;

    const actor = item.parent;
    const itemContainers = new ItemContainers();

    console.log(`Detected update to Parent Item: ${item.name}, triggering transferToActor() for ${actor.name}`);

    await itemContainers.transferToActor(actor, item);
}); */

/**
 * Hook: When a Parent Item is deleted from an Actor, remove its transferred stored items.
 */
/* Hooks.on("deleteItem", async (item, options, userId) => {
    if (!item.parent || !(item.parent instanceof Actor)) return;

    console.log(`Detected deletion of Parent Item: ${item.name} from Actor: ${item.parent.name}`);
    
    const itemContainers = new ItemContainers();
    await itemContainers.removeAllTransferred(item.parent, item);
}); */

/**
 * Hook: When an embedded Parent Item is updated, check for transferable stored items.
 */
Hooks.on("updateItem", async (item, changes, options, userId) => {
    if (!item.parent || !(item.parent instanceof Actor)) return;
    
    let actor = item.parent;
    let transfer = false;

    // ✅ Ensure only the triggering client executes the function
    if (userId !== game.user.id) return;

    // ✅ Case 1: If the updated item is a Path, check if any stored Trait had its transfer flag set to true
    if (item.type === "path" && changes?.system?.items) {
        for (const [storedItemId, storedChanges] of Object.entries(changes.system.items)) {
            if (foundry.utils.hasProperty(storedChanges, "flags.storyforge.transfer")) {
                console.log(`(DEBUG) Trait '${storedItemId}' in Path '${item.name}' transfer flag set to true. Checking for transfer.`);
                transfer = true;
                break; // Exit loop early if at least one trait was updated for transfer
            }
        }
    }

    // ✅ Case 2: If the updated item is a non-Path Parent Item, check for stored item transfers
    if (item.type !== "path" && item.system?.items) {
        console.log(`(DEBUG) Parent Item '${item.name}' updated. Checking for stored item transfers.`);
        transfer = true;
    }

    // ✅ Prevent multiple triggers in quick succession
    if (options._transferHandled) return;
    options._transferHandled = true;

    if (transfer) {
        await actor.handleStoredItemTransfers(item);
    }
});


/**
 * Hook: When an embedded Parent Item is deleted, remove its transferred stored items.
 */
Hooks.on("deleteItem", async (item, options, userId) => {
    if (!item.parent || !(item.parent instanceof Actor)) return;

    //console.log(`Detected deletion of Parent Item: ${item.name}, removing transferred items.`);
    await item.parent.handleStoredItemTransfers(item);
});
