import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';
import { ItemContainers } from "../helpers/item-containers.mjs";


/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class StoryforgeItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['storyforge', 'sheet', 'item'],
      width: 520,
      height: 109,
      resizable: false,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'description',
        },{
          navSelector: '.perks-tabs',
          contentSelector: '.perks',
          initial: 'rankone',
        },
      ],
    });
  }

  /** @override */
  get template() {
    const path = 'systems/storyforge/templates/item';
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.hbs`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.hbs`.
    return `${path}/item-${this.item.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve base data structure.
    const context = super.getData();

    //console.log(context.items)

    // Use a safe clone of the item data for further operations.
    const itemData = context.data;
    const actor = this.item.parent;

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = this.item.getRollData();

    // Add the item's data to context.data for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;

    // Ensure system.items exists
    context.system.items = context.system.items || [];

    // Pass stored items to the template
    context.storedItems = context.system.items;

    if (actor) {
      context.actor = actor
      context.altForm = actor.system.altForm;
    };

    if (itemData.type == 'item') {
      //this._prepareItemsItems(context);
      context.coreRemainder = Math.max(0, context.system.cores.max - context.system.cores.value)
    }

    if (itemData.type == 'ability') {
      this._prepareAbilityData(context);
    }

    if (itemData.type == 'item' || itemData.type == 'ability' || itemData.type == 'basic'){
      this._filterTags(context);
      this._prepareTags(context);
    }

    if (itemData.type == 'lootbox') {
      this._prepareLootboxData(context);
    }

    if (itemData.type == 'path') {
      this._preparePathTraits(context);
    }

    // Prepare active effects for easier access
    context.effects = prepareActiveEffectCategories(this.item.effects);

    
    context.system.descriptionHTML = await TextEditor.enrichHTML(context.system.description, {async: true, documents: true});

    return context;
  }

  _filterTags(context){
    let tagCount = 0;
    for (let [k, v] of Object.entries(context.system.tags)) {
      if (v) {
        tagCount += 1;
      }
    }

    /* for (let [k, v] of Object.entries(context.system.items)){
      // console.log(i, k);
      if (v != null){
        if (v.type === "tag"){
          tagCount += 1;
        }
      }
    } */
    
    this.item.update({"system.tagCount": tagCount})

    const tags = Object.entries(context.system.tags || {}).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined) acc[key] = value;
      return acc;
    }, {});

    // Assign the filtered tags back to the data
    context.system.tags = tags;
  }

  _prepareAbilityData(context) {
    let modSum = 0; // Initialize modSum to 0
    let rank = Number(context.system.rank);

    // Iterate through the tags and sum up the mods
    for (let [k, v] of Object.entries(context.system.tags)) {
      if (v) {
        modSum += Number(v.mod) || 0; // Ensure v.mod is treated as a number, default to 0 if not a number
      }
    }

    for (let [k, v] of Object.entries(context.system.items)){
      // console.log(i, k);
      if (v != null){
        if (v.type === "tag"){
          modSum += Number(v.system.mod) || 0; // Ensure v.mod is treated as a number, default to 0 if not a number
        }
      }
    }

    let SP = rank + modSum;

    // Ensure SP is at least the rank
    if (SP < rank) {
        SP = rank;
    }
    this.item.update({"system.sp": SP,})
}

  _prepareItems(context){
    let itemData = this.item.system;
    let itemImg = this.item.img;

    console.log(itemData);

    const abilities = [];
    context.items = [];
    console.log(context.items);

    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      i.system.description == TextEditor.enrichHTML(i.system.description);

      if (i.type === 'ability') {
        abilities.push(i);
      }

      if (i.type === 'item') {
        items.push(i);
      }

      context.abilities = abilities;
      context.items = items;
    }
  }

  async _prepareTags(context){
    let itemData = context.data;
    let itemImg = this.item.img;
    const itemContainers = new ItemContainers();

    const props = [];
    const cores = [];

    // Get max cores allowed
    let maxCores = itemData.system?.cores?.max || 1;

    for (let [k, i] of Object.entries(context.system.items)){
      if (!i) continue;

      if (i.type === "tag"){
        if (itemData.type === "item" && i.system.type === "Core") {
          if (cores.length >= maxCores) {
            ui.notifications.error("Sorry, this item does not have any more available Core Slots");
            await itemContainers.removeStoredItem(this.item, k);
            continue; // Skip adding this core
        }

          cores.push(i);
        } else {
          props.push(i);
        }
      }
    }

    context.props = props;
    context.cores = cores;

    if (this.item.type == 'item') {
      console.log(cores.length)
      this.item.update({"system.cores.value": context.cores.length})
    }
  }

  _preparePathTraits(context){
    let itemData = this.item.system;
    let itemImg = this.item.img;

    const traits = {
      zero: [],
      one: [],
      two: [],
      three: []
    }

    for (let [k, i] of Object.entries(context.system.items)){
      // console.log(i, k);
      if (i != null){
        if (i.type === "trait"){
          
          if (i.system.rank === 1){
            traits.one.push(i);
          } else if (i.system.rank === 2){
            traits.two.push(i);
          } else if (i.system.rank === 3){
            traits.three.push(i);
          } else {
            traits.zero.push(i);
          }
        }
      }
    }

    context.traits = traits;

    // Mapping words to numbers
    const rankMap = {
      "zero": 0,
      "one": 1,
      "two": 2,
      "three": 3
    };

    // Ensure traits.Path exists
    if (context.traits) {
        for (const key in context.traits) {
            const pathItems = context.traits[key];

            // Store numeric version of the rank
            context.traits[key].numericRank = rankMap[key] || 0;
        }
    }
  }

  _prepareLootboxData(context){
    context.isGM = game.user.isGM;

      // Get all roll tables sorted by folders
    const tables = game.tables.contents;
    const folders = game.folders.filter(f => f.type === "RollTable");

    let rollTables = [];

    // Add folder headers
    for (let folder of folders) {
  
      const folderTables = tables.filter(t => t.folder?.id === folder.id);

      if (folderTables.length > 0) {
        rollTables.push({ name: ` — ${folder.name} — `, isFolder: true });

        folderTables.forEach(table => {
          rollTables.push({ id: table.id, name: table.name, isFolder: false });
        });
      }
    }

    // Add roll tables that aren't in folders
    const rootTables = tables.filter(t => !t.folder);
    if (rootTables.length > 0) {
        rollTables.push({ name: " — No Folder — ", isFolder: true });
        rootTables.forEach(table => {
          rollTables.push({ id: table.id, name: table.name, isFolder: false });
        });
    }

    context.rollTables = rollTables;
  }

  /* -------------------------------------------- */
  itemContextMenu = [
    {
        name: "Edit",
        icon: '<i class="fas fa-cog"><i>',
        callback: (li) => this._onEditItem(li),
    },
    {
        name: "Delete",
        icon: '<i class="fas fa-trash"><i>',
        callback: (li) => this._onDeleteItem(li),
    }
  ] 

  PerkContextMenu = [
    {
        name: "Edit Perk",
        icon: '<i class="fas fa-edit"></i>',
        callback: (perkId) => this.item.openPerk(perkId)
      },
      {
        name: "Remove Perk",
        icon: '<i class="fas fa-trash"></i>',
        callback: (perkId) => this.item.removePerk(perkId)
      }
  ] 

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    const itemContainers = new ItemContainers();

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.

    html.on('click', '.effect-control', (ev) =>
      onManageActiveEffect(ev, this.item)
    );

    html.on('click', '.tagCountUp', (ev) => {
      //Need to make it so tagCount is equal to number of tags via Sum Method
      let tagCount = this.item.system.tagCount;
      tagCount++;
      let tag = `system.tags.tag${tagCount}`;
      
      let newTag = {
          name: "Tag",
          mod: 0,
          show: true
      }

      // this.item.system.tags.push(newTag);
      this.item.update({
        [tag]: newTag
      })
      //this.item.update({"system.tagCount": tagCount})
    });
    
    html.on('click', '.tagCountDown', async (ev) => {
      let tagCount = this.item.system.tagCount;
    
      // Check if there are tags to delete
      if (tagCount <= 0) {
        ui.notifications.warn("No tags left to delete!");
        return;
      }
    
      // Decrement tagCount
      const lastTagCount = tagCount;
      tagCount--;
    
      // Determine the path of the last tag to remove
      const lastTag = `system.tags.tag${lastTagCount}`;
      console.log(`Deleting: ${lastTag}`);
    
      // Update the item to remove the last tag and adjust the tag count
      await this.item.update({
        [lastTag]: null, // Remove the last tag dynamically
      });
    
      console.log("Tags after deletion:", this.item.system.tags);
    });

    html.on('click', '.action-bubble', async (ev) => {
      ev.preventDefault();
      let item = this.item;
      let element = ev.currentTarget;
      let action = element.dataset.action;
      let actionTotal = eval(`item.${action}`);
      let value = +element.dataset.value;
      console.log(action, actionTotal, value)

      if (actionTotal == value){
        console.log("Test!")
        value--;
      }

      this.item.update({[action] : value})
    });

    html.on('click', '.path-trait', async (ev) => {
      ev.preventDefault();

      const parentItem = this.item;
      const traitId = $(ev.currentTarget).closest(".stored-item").data("item-id");
      console.log(traitId)
      if (!traitId) return;

      let updatedItems = { ...parentItem.system.items };

      // Find the trait item inside the stored items
      let traitItem = updatedItems[traitId];
      if (!traitItem) return;

      // Toggle system.flags.storyforge.transfer
      const currentTransferState = traitItem.flags?.storyforge?.transfer ?? false;
      traitItem.flags = traitItem.flags || {};
      traitItem.flags.storyforge = traitItem.flags.storyforge || {};
      traitItem.flags.storyforge.transfer = !currentTransferState;

      // Update the parent item
      await parentItem.update({ "system.items": updatedItems });

      // Re-render the sheet to reflect the change
      //this.render();
    });

    if (this.item.type === "origin") {
      html.find('.item-drop-area').on("dragover", this._onDragOver.bind(this));
      html.find('.item-drop-area').on("drop", this._onDropItem.bind(this));
      // html.find('.perk-entry').contextmenu(this._onPerkContextMenu.bind(this));
    }

    /* html.find('.itemV2').on("dragover", this._onDragOver.bind(this));
    html.find('.itemV2').on("drop", this._onDropItem.bind(this)); */

    // Handle drag-and-drop for storing items inside other items
    html.on("drop", async (event) => {
      event.preventDefault();
      console.log("DROPPED!")
      const data = JSON.parse(event.originalEvent.dataTransfer.getData("text/plain"));
      const parentItem = this.item;
      const childItem = await fromUuid(data.uuid);

      console.log(parentItem, childItem);

      if (!childItem || !itemContainers.canStoreItem(parentItem.type, childItem.type)) {
          ui.notifications.warn(`Cannot store ${childItem.type} inside ${parentItem.type}.`);
          return;
      }

      await itemContainers.storeItem(parentItem, childItem);
      await parentItem.update({ "system.items": parentItem.system.items });
      //this.render();
    });

    // Handle clicking ".add-child" to add a new child item
    html.on("click", ".add-child", async (event) => {
      const childType = event.currentTarget.dataset.childType;
      if (!childType) return;

      await itemContainers.addChildItem(this.item, childType);
      this.render();
    });

    /* html.on("change", ".inline-edit", async (event) => {
      const input = event.currentTarget;
      const li = $(input).closest(".stored-item");
      const itemId = li.data("item-id");
      const field = input.name.split(".").slice(2).join("."); // Extract field path
      const newValue = input.value;

      const storedItems = this.item.system.items;
      const storedItem = storedItems.find(i => i.id === itemId);
      if (!storedItem) return;

      // Update the stored item property
      foundry.utils.setProperty(storedItem, field, newValue);

      // Save the updated stored items array
      await this.item.update({ "system.items": storedItems });
    }); */

    // Handle editing stored items
    html.on("click", ".stored-item-edit", (event) => {
        const itemId = $(event.currentTarget).closest(".stored-item").data("item-id");
        itemContainers.editStoredItem(this.item, itemId);
    });

    // Handle deleting stored items
    html.on("click", ".stored-item-delete", async (event) => {
        const itemId = $(event.currentTarget).closest(".stored-item").data("item-id");
        await itemContainers.removeStoredItem(this.item, itemId);
        this.render();
    });

    // Open Compendium Browser
    html.on("click", ".open-compendium", async (ev) => {
      ev.preventDefault();
        
      const button = ev.currentTarget;
      const tab = button.dataset.compendiumTab || "paths"; // Default to "paths" if no tab is provided
      console.log(tab);
      
      if (!game.storyforge?.compendiumBrowser) {
          ui.notifications.warn("Compendium Browser is not available.");
          return;
      }

      // Open the compendium browser and set the active tab
      let compendiumBrowser = game.storyforge.compendiumBrowser;
      await compendiumBrowser.render(true);

      // Wait for the browser to fully render before activating the tab
      Hooks.once("renderCompendiumBrowser", (compendiumBrowser) => {
        compendiumBrowser._tabs[0].activate(tab)
      });
    });

    // Open Compendium Browser
    html.on("click", ".settings-button", async (ev) => {
      ev.preventDefault();
      const item = this.item;
      await this.settingsDialog(item)

    });


    // Right-click menu for stored items
    itemContainers.createContextMenu(html, this.item);
    
    new ContextMenu(html, ".item-context", this.itemContextMenu);
    new ContextMenu(html, ".perk-entry", this.PerkContextMenu);
  }

  /**
   * Allow drag-over to indicate the drop zone is active
   */
  _onDragOver(event) {
    event.preventDefault();
    event.originalEvent.dataTransfer.dropEffect = "move";
  }

  async _onDropItem(event) {
    event.preventDefault();
    let data;

    try {
        data = JSON.parse(event.originalEvent.dataTransfer.getData("text/plain"));
    } catch (err) {
        return ui.notifications.error("Invalid item drop data.");
    }

    const item = this.item;
    const droppedItem = await fromUuid(data.uuid);
    const droppedData = droppedItem.system;
    /* console.log(item, droppedItem, droppedData);
    await item.createEmbeddedDocuments("Item", [{
      name: droppedItem.name,
      img: droppedItem.img,
      system: droppedData
    },])

    Item.create({
      name: droppedItem.name,
      img: droppedItem.img,
      type: droppedItem.type,
      system: droppedData
    }, {parent: item})
    console.log(item); */


    if (!droppedItem || droppedItem.type !== "perk") {
        return ui.notifications.warn("Only Perk items can be added to Origins.");
    }

    // Restrict to ONE Perk in an Origin
    if (this.item.type === "origin" && this.item.system.perks.length >= 1) {
        console.warn("An Origin can only have one Perk. Replacing existing Perk...");
        await this.item.update({ "system.perks": [] }); // Remove existing Perk
    }

    // Add the Perk to the Origin
    await this.item.update({
        "system.perks": [{
            id: droppedItem.id,
            name: droppedItem.name,
            img: droppedItem.img,
            rank: {
                value: droppedItem.system.rank.value,
                one: droppedItem.system.rank.one,
                two: droppedItem.system.rank.two,
                three: droppedItem.system.rank.three
            }
        }]
    });

    ui.notifications.info(`Added ${droppedItem.name} to Origin.`);
  }

  _onPerkContextMenu(event) {
    event.preventDefault();
    const perkId = event.currentTarget.dataset.perkId;

    new ContextMenu(event, [
      {
        name: "Edit Perk",
        icon: '<i class="fas fa-edit"></i>',
        callback: () => this.item.openPerk(perkId)
      },
      {
        name: "Remove Perk",
        icon: '<i class="fas fa-trash"></i>',
        callback: () => this.item.removePerk(perkId)
      }
    ]).render(true);
  }

  async settingsDialog(item) {
    const systemData = foundry.utils.duplicate(item.system); // Duplicate to avoid direct modifications
    const cardData = {
        item: item,
        system: systemData
    };

    const myContent = await renderTemplate("systems/storyforge/templates/dialog/dialog-settings.hbs", cardData);

    return new Promise(resolve => {
        const dialog = new Dialog({
            title: "Character Settings",
            content: myContent,
            buttons: {
                update: {
                    icon: '<i class="fa-solid fa-arrow-up-from-bracket"></i>',
                    label: "Update",
                    callback: async (html) => {
                        let formData = new FormData(html[0].querySelector("form"));
                        let settingsData = {};

                        // Convert form data into an object
                        formData.forEach((value, key) => {
                            settingsData[key] = value;
                        });

                        console.log("(DEBUG) Updating Character Settings:", settingsData);

                        await item.update({ "system": foundry.utils.mergeObject(systemData, settingsData) });
                        resolve(true);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => resolve(false)
                }
            },
            default: "cancel",
            render: (html) => {
                // Optional: Pre-fill the dialog with existing values
                Object.entries(systemData).forEach(([key, value]) => {
                    html.find(`[name="${key}"]`).val(value);
                });
            }
        }, { width: 400 });

        dialog.render(true);
    });
  }
}
