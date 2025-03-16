Hooks.on("storyforgeLootboxReady", function () {
    console.log("Storyforge Lootbox System: Loaded");
});

// Register Context Menu for Rollable Tables
Hooks.on("getRollTableDirectoryEntryContext", (html, options) => {
    options.push({
        name: "Roll as Storyforge Lootbox",
        icon: '<i class="fas fa-box"></i>',
        callback: (li) => {
        const rollTableId = li.data("documentId");
        const rollTable = game.tables.get(rollTableId);

        if (rollTable) {
            new StoryforgeLootboxApp(rollTable).render(true);
        } else {
            ui.notifications.error("Lootbox: RollTable not found!");
        }
        }
    });

    options.push({
        name: "Roll Storyforge Lootbox for Player",
        icon: '<i class="fas fa-user-plus"></i>',
        condition: () => game.system.id === "storyforge" && game.user.isGM,
        callback: (li) => openPlayerLootboxDialog(li.data("documentId"))
    });
});
  
  
export class StoryforgeLootboxApp extends Application {
    constructor(rollTable, lootboxItem = null, options = {}) {
      super(options);
      this.rollTable = rollTable;
      let lootboxItemName;
      let lootboxRarity;
      if (lootboxItem){
        lootboxItemName = lootboxItem.name;
      }
      this.lootboxItemName = lootboxItemName; // Store the item name if provided
      this.results = [];
      this.originalPermissions = new Map(); // Store original permissions
      this.owner = game.user.id; // Store the ID of the user who owns this app
    }
  
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        id: "lootbox-app",
        title: "Lootbox",
        template: "systems/storyforge/templates/lootbox/storyforge-lootbox.hbs",
        width: 400,
        height: "auto",
        classes: ["lootbox-app"],
        dragDrop: [{dragSelector: ".lootbox-item", dropSelector: null}]
      });
    }

    canUserModify(user, action) {
        // Allow only the app owner or a GM to modify the app
        return user.id === this.owner || user.isGM;
    }
  
    async getData() {
        console.log(this);
        const resolveNestedRollTable = async (tableResult) => {
          if (
            tableResult.type === CONST.TABLE_RESULT_TYPES.DOCUMENT &&
            tableResult.documentCollection === "RollTable"
          ) {
            const nestedTable = game.tables.get(tableResult.documentId);
            if (nestedTable) {
              const nestedResult = await nestedTable.draw({ recursive: true, displayChat: false });
              return resolveNestedRollTable(nestedResult.results[0]);
            }
          }
          return tableResult;
        };
      
        const resolveCompendiumEntry = async (documentCollection, documentId) => {
          const pack = game.packs.get(documentCollection);
          if (!pack) return null;
          const document = await pack.getDocument(documentId);
          return document;
        };
      
        this.results = await Promise.all(
          Array.from({ length: 3 }, async () => {
            const result = await this.rollTable.draw({ recursive: false, displayChat: false });
            return resolveNestedRollTable(result.results[0]);
          })
        );
      
        // Filter results for valid items or actors
        const documents = await Promise.all(this.results.map(async (result) => {
            const { documentCollection, documentId } = result;
          if (result.type === CONST.TABLE_RESULT_TYPES.DOCUMENT || result.type === CONST.TABLE_RESULT_TYPES.COMPENDIUM) {
      
            // Handle compendium entries
            if (documentCollection.includes(".")) {
              return await resolveCompendiumEntry(documentCollection, documentId);
            }
      
            // Handle in-world Items or Actors
            if (documentCollection === "Item") return game.items.get(documentId);
            if (documentCollection === "Actor") return game.actors.get(documentId);
          }
          return null;
        }));
      
        // Show an error notification if no valid documents are found
        const validDocuments = documents.filter(Boolean);
        if (!validDocuments.length) {
          ui.notifications.error(`The Lootbox roll from "${this.rollTable.name}" did not return any valid results.`);
          this.close();
          return {};
        }
      
        // Update ownership for the user
        for (const doc of validDocuments) {
          const currentPermissions = foundry.utils.deepClone(doc.system.permission);
          this.originalPermissions.set(doc.id, currentPermissions);
      
          await game.system.socket.executeAsGM(
            "updateOwnership",
            doc.id,
            game.user.id,
            CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
          );
        }

        const gmUsers = game.users.filter(u => u.isGM && u.active);
        if (gmUsers.length > 0) {
        const resultsData = (await Promise.all(
            this.results.filter(r => r.type === CONST.TABLE_RESULT_TYPES.DOCUMENT || r.type === CONST.TABLE_RESULT_TYPES.COMPENDIUM).map(async (r) => {
                const { documentCollection, documentId } = r;
    
                // Handle compendium entries
                console.log(documentCollection)
                if (documentCollection.includes(".")) {
                    const pack = game.packs.get(documentCollection);
                if (!pack) return null;
                const doc = await pack.getDocument(documentId);
                return doc
                    ? { id: doc.id, name: doc.name, img: doc.img, type: doc.documentName, collection: documentCollection }
                    : null;
                }
    
                // Handle in-world Items and Actors
                const collection = documentCollection === "Item" ? game.items : game.actors;
                const doc = collection.get(documentId);
                return doc
                ? { id: doc.id, name: doc.name, img: doc.img, type: doc.documentName, collection: null }
                : null;
            })
        )).filter(Boolean);
        

        // Render chat content using the lootbox-gm-message.hbs template
        const chatContent = await renderTemplate("modules/lootbox/templates/lootbox-gm-message.hbs", {
            playerName: game.user.name,
            tableName: this.rollTable.name,
            results: resultsData
        });

        // Send a whisper to all GMs
        ChatMessage.create({
            content: chatContent,
            whisper: gmUsers.map(u => u.id)
        });
        }

        return {
            tableName: this.lootboxItemName || this.rollTable.name,
            results: validDocuments.map(doc => ({
                id: doc.id,
                name: doc.name,
                img: doc.img,
                type: doc.documentName, // Specify the type (Item or Actor)
                collection: doc.compendium ? doc.compendium.metadata.id : null, // Include collection for compendium entries
                rarity: doc.type === "item" ? doc.system?.rarity || "Unknown" : null
            })),
        };
    }
      
  
    activateListeners(html) {
    super.activateListeners(html);
    
        // Handle clicking on items or actors
        html.find(".lootbox-item").on("click", async (event) => {
            event.preventDefault();
        
            const docId = event.currentTarget.dataset.id;
            const docType = event.currentTarget.dataset.type;
            const collection = event.currentTarget.dataset.collection;
            console.log(collection);
        
            let doc;
            if (collection) {
                // Handle compendium entries
                const pack = game.packs.get(collection);
                if (!pack) {
                    ui.notifications.error("The compendium could not be found.");
                    return;
                }
                doc = await pack.getDocument(docId);
            } else {
                // Handle in-world Items or Actors
                const gameCollection = docType === "Item" ? game.items : game.actors;
                doc = gameCollection.get(docId);
            }
        
            if (!doc) {
                ui.notifications.error("The document could not be found.");
                return;
            }
        
            // Open the document's sheet
            doc.sheet.render(true);
        });
    
        // Drag-and-drop functionality for Items and Actors
        html.find(".lootbox-item").each((i, el) => {
            const docId = el.dataset.id;
            const docType = el.dataset.type;
            const collection = el.dataset.collection;
        
            let doc;
            if (collection && collection.includes(".")) {
                // Handle compendium entries
                const [packName, packId] = collection.split(".");
                const pack = game.packs.get(packName);
                doc = pack ? { uuid: `${packName}.${docId}` } : null;
            } else {
            // Handle in-world Items or Actors
                const gameCollection = docType === "Item" ? game.items : game.actors;
                doc = gameCollection.get(docId);
            }
        
            if (doc) {
            el.setAttribute("draggable", true);
            el.addEventListener("dragstart", (ev) => {
                // Create drag data for Items and Actors
                const dragData = {
                type: docType,
                uuid: doc.uuid,
                };
                ev.dataTransfer.setData("text/plain", JSON.stringify(dragData));
            });
            }
        });
    
        // Close Lootbox when an item is dragged
        html.on("dragend", () => {
            this.close();
        });
    }
      
      
}

// Function to Handle "Roll Storyforge Lootbox for Player"
function openPlayerLootboxDialog(rollTableId) {
    const rollTable = game.tables.get(rollTableId);
    if (!rollTable) {
    ui.notifications.error("Lootbox: RollTable not found!");
    return;
    }

    const players = game.users.filter(u => u.active && !u.isGM);
    if (players.length === 0) {
    ui.notifications.warn("No active players available.");
    return;
    }

    new Dialog({
    title: "Roll Storyforge Lootbox for Player",
    content: `
        <form>
        <div class="form-group">
            <label for="player">Select Player:</label>
            <select id="player" name="player">
            ${players.map(p => `<option value="${p.id}">${p.name}</option>`).join("")}
            </select>
        </div>
        </form>
    `,
    buttons: {
        roll: {
        label: "Roll",
        callback: async (html) => {
            const playerId = html.find("#player").val();
            game.socket.emit("system.storyforge", {
            action: "renderLootbox",
            rollTableId: rollTable.id,
            userId: playerId
            });

            new StoryforgeLootboxApp(rollTable).render(true);
        }
        },
        cancel: {
        label: "Cancel"
        }
    },
    default: "roll"
    }).render(true);
}

Hooks.on("renderChatMessage", (message, html, data) => {
    html.find(".lootbox-result-link").on("click", async (event) => {
        const docId = event.currentTarget.dataset.id;
        const docType = event.currentTarget.dataset.type;
        const collection = event.currentTarget.dataset.collection;
        console.log(collection);

        let doc;
        if (collection) {
        // Handle compendium entries
        const pack = game.packs.get(collection);
        if (!pack) {
            ui.notifications.error("The compendium could not be found.");
            return;
        }
        doc = await pack.getDocument(docId);
        } else {
        // Handle in-world Items or Actors
        const gameCollection = docType === "Item" ? game.items : game.actors;
        doc = gameCollection.get(docId);
        }

        if (!doc) {
        ui.notifications.error("The document could not be found.");
        return;
        }

        // Open the document's sheet
        doc.sheet.render(true);
    });
});
  
Hooks.once("socketlib.ready", () => {
    game.system.socket = socketlib.registerSystem('storyforge');
    game.system.socket.register("updateOwnership", async (itemId, userId, level) => {
            const item = game.items.get(itemId);
            if (item) {
            await item.update({
                [`ownership.${userId}`]: level
            });
        }
    });
});

// Handle Socket Event to Render Lootbox for Players
Hooks.once("socketlib.ready", () => {
    game.system.socket = socketlib.registerSystem("storyforge");
    game.system.socket.register("renderLootbox", async ({ rollTableId, userId }) => {
        if (game.user.id === userId) {
            const rollTable = game.tables.get(rollTableId);
            if (rollTable) {
            new StoryforgeLootboxApp(rollTable).render(true);
            }
        }
    });
});