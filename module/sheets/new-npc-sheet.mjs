import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class NewStoryforgeNPCSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {

    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['storyforge', 'sheet', 'actorV2', 'npc'],
      template: 'systems/storyforge/templates/actor/actor-sheet.hbs',
      width: 520,
      height: 200, // "auto"
      resizable: false,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.npc',
          initial: 'combat',
        },
        {
          navSelector: '.npc-bio-tabs',
          contentSelector: '.sheet-v2',
          initial: 'public',
        },
      ],
    });
  }

  /** @override */
  get template() {
    return `systems/storyforge/templates/actorV2/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */
  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.data;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;
    
    this._prepareItems(context);
    this._prepareUniversalData(context);

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(
      // A generator that returns all effects stored on the actor
      // as well as any items
      this.actor.allApplicableEffects()
    );

    return context;
  }
  
  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareUniversalData(context) {
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.system.attributes)) {
      v.label = game.i18n.localize(CONFIG.STORYFORGE.attributeAbbreviations[k]) ?? k;
    }
    
    for (let [k, v] of Object.entries(context.system.statuses.positive)) {
      v.label = CONFIG.STORYFORGE.statusPositive[k] ?? k;
    }

    for (let [k, v] of Object.entries(context.system.statuses.negative)) {
      v.label = CONFIG.STORYFORGE.statusNegative[k] ?? k;
    }

    
    let addonSum = -3;
    const altform = context.system.altForm;

    for (const [k, i] of Object.entries(context.abilities)){
      if (i.system.type === "Core"){
        addonSum += 3;
      }
    }

    for (let [k, v] of Object.entries(context.traits)) {
      if(v.system.cost) {
        addonSum += Number(v.system.cost);
      }
    }

    this.actor.update({"system.addons.value": addonSum})
  }


  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    let actorData = this.actor.system;
    let actorImg = this.actor.img;

    // Initialize containers.
    const gear = [];
    const currencies = [];
    const basics = [];
    const bonds = [];
    const abilities = [];
    const traits = [];
    const trackers = [];
    const specializations = [];
    const resources = [];
    const skills = [];
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
    };
    const equipment = {
      Accessory: [],
      Armor: [],
      Weapon: [],
    };
    const rearGuard = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      i.system.description == TextEditor.enrichHTML(i.system.description);

      // Append to gear.
      if (i.type === "item"){
        if (i.system.equip == true){
          if (i.system.type === "Weapon"){
            i.system.saveDC = Number(actorData.save.value) + (Number(i.system.mastery.value)/2);

            equipment[i.system.type].push(i);
            // basics.push(i);
          } else if (i.system.type === "Accessory"){
            equipment[i.system.type].push(i);
          } else if (i.system.type === "Armor"){
            equipment[i.system.type].push(i);
          } else {
            gear.push(i);
          }
        } else {
          gear.push(i);
        }
      }
      // Append to Traits.
      else if (i.type === 'trait') {
        traits.push(i);
      }
      // Append to Specializations.
      else if (i.type === 'specialization') {
        specializations.push(i);
      }
      // Append to Specializations.
      else if (i.type === 'skill') {
        skills.push(i);
        i.system.rollMod = Number(i.system.mastery.value) + Number(actorData.skill.mod);
      }
      // Append to features.
      else if (i.type === 'ability') {
        // abilities.push(i);
        i.system.saveDC = Number(actorData.save.value) + Number(i.system.rank);
        i.system.rollMod = i.system.rankMod + +actorData.key + +i.system.check.bonus;
        i.system.edit = actorData.edit;

        if (i.system.rearGuard === true){
          rearGuard.push(i);
        }

        abilities.push(i);
      }
      // Append to spells.
      else if (i.type === 'spell') {
        if (i.system.spellLevel != undefined) {
          spells[i.system.spellLevel].push(i);
        }
      }
      // Apend to basics
      else if (i.type === 'basic'){
        // basics.push(i);
        i.system.saveDC = Number(actorData.save.value) + (Number(i.system.mastery.value)/2);
        basics.push(i);
      }
      // Apend to currencies
      else if (i.type === 'currency'){
        currencies.push(i);
      }
      // Apend to bonds
      else if (i.type === 'bond'){
        i.system.actorImg = actorImg;
        bonds.push(i);
      }
      // Apend to tracks
      else if (i.type === 'tracker'){
        trackers.push(i);
      }
      // Apend to tracks
      else if (i.type === 'resource'){
        resources.push(i);
      }
    }

    // Assign and return
    context.gear = gear;
    context.currencies = currencies;
    context.basics = basics;
    context.abilities = abilities;
    context.bonds = bonds;
    context.trackers = trackers;
    context.traits = traits;
    context.specializations = specializations;
    context.resources = resources;
    context.skills = skills;
    context.spells = spells;
    context.equipment = equipment;
    context.rearGuard = rearGuard;
  }

  /* -------------------------------------------- */

  itemContextMenu = [
    {
        name: "Edit",
        icon: '<i class="fas fa-cog"><i>',
        callback: element => {
            const item = this.actor.items.get(element.data('itemId'));
            item.sheet.render(true);
        }
    },
    {
        name: "Delete",
        icon: '<i class="fas fa-trash"><i>',
        callback: element => {
          const item = this.actor.items.get(element.data('itemId'));
          item.delete();
        }
    }
  ] 

  basicContextMenu = [
    {
        name: "Edit",
        icon: '<i class="fas fa-cog"><i>',
        callback: element => {
            const item = this.actor.items.get(element.data('itemId'));
            item.sheet.render(true);
        }
    }
  ] 

  currencyMenu = [
    {
        name: "Delete",
        icon: '<i class="fas fa-trash"><i>',
        callback: element => {
          const item = this.actor.items.get(element.data('itemId'));
          item.delete();
        }
    }
  ] 

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.on('click', '.show-img', (ev) => {
      const img = this.actor.img;

      new ImagePopout(img, {
        title: this.actor.name,
      }).render(true);

    });

    // Render the item sheet for viewing/editing prior to the editable check.
    html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    // Rollable attributes.
    html.on('click', '.rearGuard', this._onRoll.bind(this));

    html.on('click', '.item-favorite', (ev) => {
      event.preventDefault();
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      let element = ev.currentTarget;
      let field = element.dataset.field;
      let value = !item.system.rearGuard;
      console.log("CLICKED!")

      return item.update({[field] : value})
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    html.on('change', '.inline-edit', (event) => {
      event.preventDefault();
      const li = $(event.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      let element = event.currentTarget;
      let field = element.dataset.field;

      return item.update({ [field]: element.value})
    })

    // Add Inventory Item
    html.on('click', '.item-create', this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.on('click', '.item-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    html.on('focus', '.life-input', function(){ this.select(); });
    html.on('focusout', '.health-edit', (ev) => {
      const oldValue = +this.actor.system.health.value;
      let newValue;
      const li = $(ev.currentTarget);
      const edit = li[0].value;

      if (edit.includes("-") || edit.includes("+")){
        newValue = oldValue + +edit;
      } else {
        newValue = edit;
      }

      if (newValue >= 0){
        this.actor.update({
          "system.health.value": newValue,
          "system.health.edit": newValue,
        });
      } else if (newValue < 0){
        this.actor.update({
          "system.health.value": 0,
          "system.health.edit": 0,
        });
      }
    });

    html.on('focusout', '.spirit-edit', (ev) => {
      const oldValue = +this.actor.system.spirit.value;
      let newValue;
      const li = $(ev.currentTarget);
      const edit = li[0].value;

      if (edit.includes("-") || edit.includes("+")){
        newValue = oldValue + +edit;
      } else {
        newValue = edit;
      }

      if (newValue >= 0){
        this.actor.update({
          "system.spirit.value": newValue,
          "system.spirit.edit": newValue,
        });
      } else if (newValue < 0){
        this.actor.update({
          "system.spirit.value": 0,
          "system.spirit.edit": 0,
        });
      }

    })

    html.on('keypress', '.life-input', (ev) => {
      if (ev.keyIdentifier=='U+000A' || ev.keyIdentifier=='Enter' || ev.keyCode==13){
        ev.preventDefault();
        console.log("SUMBIT CHECK!");
      }
    })

    // Active Effect management
    html.on('click', '.effect-control', (ev) => {
      const row = ev.currentTarget.closest('li');
      const document =
        row.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    // Rollable attributes.
    html.on('click', '.rollable', this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    }

    html.on('click', '.full-rest', (ev) => {
      console.log("Full Rest Clicked!");
      const health = this.actor.system.health;
      const spirit = this.actor.system.spirit;

      let newHP = health.max;
      let newSP = spirit.max;

      this.actor.update({
        "system.health.value": newHP,
        "system.spirit.value": newSP,
        "system.health.edit": newHP,
        "system.spirit.edit": newSP,
      });
    });

    html.on('click', '.quick-rest', (ev) => {
      console.log("Quick Rest Clicked!");
      const health = this.actor.system.health;
      const spirit = this.actor.system.spirit;

      let hpRegen = Math.ceil(Number(health.max)/2);
      let spRegen = Math.ceil(Number(spirit.max)/2);
      let newHP = health.value + hpRegen;;
      let newSP = spirit.value + spRegen;

      if (newHP > health.max){
        newHP = health.max;
      } else {
        newHP = health.value + hpRegen;
      }

      if (newSP > spirit.max){
        newSP = spirit.max;
      } else {
        newSP = spirit.value + spRegen;
      }

      this.actor.update({
        "system.health.value": newHP,
        "system.spirit.value": newSP,
        "system.health.edit": newHP,
        "system.spirit.edit": newSP,
      });
    });

    html.on('click', '.edge', (ev) => {
      ev.preventDefault();
      const oldRoll = this.actor.system.roll;
      let newRoll;

      if (oldRoll === "2d20kh"){
        newRoll = "1d20";
      } else {
        newRoll = "2d20kh"
      }

      this.actor.update({
        "system.roll": newRoll,
      });
    })

    html.on('click', '.snag', (ev) => {
      ev.preventDefault();
      const oldRoll = this.actor.system.roll;
      let newRoll;

      if (oldRoll === "2d20kl"){
        newRoll = "1d20";
      } else {
        newRoll = "2d20kl"
      }

      this.actor.update({
        "system.roll": newRoll,
      });
    })

    html.on('click', '.track-select', (ev) => {
      event.preventDefault();
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      let element = ev.currentTarget;
      let field = element.dataset.field;
      let value = element.dataset.value;

      if (item.system.rank.value == value){
        value--;
      }

      return item.update({[field] : value})
    });

    html.on('click', '.capability-armor', (ev) => {
      event.preventDefault();
      let element = ev.currentTarget;
      let value = element.dataset.value;

      if (this.actor.system.capability.armor == value){
        value--;
      }

      this.actor.update({
        "system.capability.armor": value,
      });
    });

    html.on('click', '.capability-weapon', (ev) => {
      event.preventDefault();
      let element = ev.currentTarget;
      let value = element.dataset.value;

      if (this.actor.system.capability.weapon == value){
        value--;
      }

      this.actor.update({
        "system.capability.weapon": value,
      });
    });

    html.on('click', '.sidebar-toggle', (ev) => {
      ev.preventDefault();
      const oldToggle = this.actor.system.sidebar;
      let newToggle = !oldToggle;

      this.actor.update({
        "system.sidebar": newToggle,
      });
    })

    html.on('click', '.mastery-bubble', (event) => {
      event.preventDefault();
      const li = $(event.currentTarget).parents('.item');
      let actor = this.actor;
      let element = event.currentTarget;
      let points = element.dataset.points; //system.attributes.pow.mastery.points
      let pointsTotal = eval(`actor.${points}`);
      let value = element.dataset.value;

      console.log(points); //system.attributes.pow.mastery.points

      if (pointsTotal == value){
        value--;
      }

      this.actor.update({[points]: value})
    })

    html.on('contextmenu', '.mastery-bubble', (event) => {
      event.preventDefault();
      const li = $(event.currentTarget).parents('.item');
      let actor = this.actor;
      let element = event.currentTarget;
      let field = element.dataset.trained;
      let fieldTotal = eval(`actor.${field}`);
      let value = element.dataset.value;
      let points = element.dataset.points;
      let pointsTotal = eval(`actor.${points}`);

      console.log("Value: " + value + "Points: " + pointsTotal);
      console.log("Trained Start: " + fieldTotal)
      
      let trained = +value - +pointsTotal;

      if (trained < 0){
        trained  = 0;
      }

      console.log(trained);

      this.actor.update({ [field]: trained})
    })

    html.on('click', '.action-bubble', (ev) => {
      event.preventDefault();
      let actor = this.actor;
      let element = ev.currentTarget;
      let action = element.dataset.action;
      let actionTotal = eval(`actor.${action}`);
      let value = +element.dataset.value;

      if (actionTotal == value){
        value--;
      }

      this.actor.update({[action] : value})
    });

    html.on('contextmenu', '.status', async (ev) => {
      ev.preventDefault();
      let element = ev.currentTarget;
      let actor = this.actor;
      const status = element.dataset.field;
      const category = element.dataset.category;
      let name = element.dataset.name.toLowerCase();
      console.log(name)

      let field = `${element.dataset.field}`;

      let activeState = eval(`actor.${element.dataset.field}.active`);
      activeState = !activeState;
      
      let durationValue;
      let activateDialog;
      let persistentValue;
      let tierValue;

      if (activeState){
        if (category === "status"){
          activateDialog = await this.activateStatusDialog(actor, status, name);
        }
        persistentValue = category === "status" ? activateDialog.persistent : true;
        tierValue = category === "status" ?  activateDialog.tier : 0;

        durationValue = 1;
        await actor.toggleStatusEffect(name, {active: true, overlay: false})
      } else {
        durationValue = -1;
        await actor.toggleStatusEffect(name, {active: false, overlay: false})
      }

      /* let value = eval(`actor.${field}`);
      let newValue = !value; */

      return this.actor.update({
        [field]: {
          name: element.dataset.name,
          tier: tierValue,
          persistent: persistentValue,
          active: activeState,
          duration: durationValue
        }
      })
    })

    html.on('click', '.persistent', (ev) => {
      ev.preventDefault();
      let element = ev.currentTarget;
      let actor = this.actor;
      let field = element.dataset.field;
      let value = eval(`actor.${field}`);
      let newValue = !value;

      return this.actor.update({[field] : newValue})
    })

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

    // Open Character Settings
    html.on("click", ".settings-button", async (ev) => {
      ev.preventDefault();
      const actor = this.actor;
      await this.settingsDialog(actor)

    });

    new ContextMenu(html, ".item-context", this.itemContextMenu);
    new ContextMenu(html, ".basic-context", this.basicContextMenu);
    new ContextMenu(html, ".currency-context", this.currencyMenu);
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    const itemType = header.dataset.itemtype;
    console.log(type);
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;

    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data,
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system['type'];
    delete itemData.system['itemType'];
    if (type === "ability" || type === "trait"){
      itemData.system['type'] = itemType;
    }
    console.log(itemData);
    

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  async activateStatusDialog(actor, status, statusName) {
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
            callback: html => resolve(this._processStatusOptions(html[0].querySelector("form")))
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

  async settingsDialog(actor) {
    const systemData = foundry.utils.duplicate(actor.system); // Duplicate to avoid direct modifications
    const cardData = {
        actor: actor,
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

                        await actor.update({ "system": foundry.utils.mergeObject(systemData, settingsData) });
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

  _processStatusOptions(form) {
    let persistent = form.querySelector(`input[name="persistentToggle"]`).checked

    return {
      persistent: persistent,
      tier: form.statusTier.value,
    }
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */

  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;

        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
        
      } else  if (dataset.rollType == 'trait') {
        const itemId = element.closest('.item').dataset.itemId;

        const item = this.actor.items.get(itemId);
        if (item) return item.traitRoll();

      } else if (dataset.rollType == 'special') {
        const itemId = element.closest('.item').dataset.itemId;
        const specialRank = element.closest('.specialization').dataset.specialRank;

        const item = this.actor.items.get(itemId);
        if (item) return item.specialRoll(specialRank);

      } else if (dataset.rollType == 'skill') {
        const itemId = element.closest('.item').dataset.itemId;

        const item = this.actor.items.get(itemId);
        if (item) return item.skillRoll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      return this.actor.roll(dataset);
    }

    if (dataset.action) {
      return this.actor.actionRoll(dataset);
    }
  }
}

export function createBasic (){
  // Hook into the Actor creation process
  Hooks.on("createActor", async (actor, options, userId) => {
    // Check if the actor type is 'npc'
    if (actor.type === "npc") {
      // Define the basic item to be added
      const basicItem = {
        name: "Basic Attack", // Default name for the item
        type: "basic",      // Set the item type
        data: {
          "actions.quick.value": 1,
          "actions.standard.value": 0
        }            // Add any initial data specific to the item type
      };

      const abilityItem = {
        name: "Free Ability", // Default name for the item
        type: "ability",      // Set the item type
        data: {}            // Add any initial data specific to the item type
      };

      try {
        // Create the item within the actor
        await actor.createEmbeddedDocuments("Item", [basicItem]);
        await actor.createEmbeddedDocuments("Item", [abilityItem]);
        console.log(`Basic item added to NPC: ${actor.name}`);
      } catch (err) {
        console.error(`Failed to add basic item to NPC: ${actor.name}`, err);
      }
    }
  });
}