import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class StoryforgeActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {

    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['storyforge', 'sheet', 'actor'],
      template: 'systems/storyforge/templates/actor/actor-sheet.hbs',
      width: 680,
      height: 600,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.char-body',
          initial: 'combat',
        },
      ],
    });
  }

  /** @override */
  get template() {
    return `systems/storyforge/templates/actor/actor-${this.actor.type}-sheet.hbs`;
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

    this._prepareUniversalData(context);

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
      
      this.render().position.width = 500;

      //console.log(this.render());
    }

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
  }
  
  _prepareCharacterData(context) {
    for (let [k, v] of Object.entries(context.system.masteries)) {
      v.label = CONFIG.STORYFORGE.weaponMasteries[k] ?? k;
    }
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
    const weapons = [];
    const rearGuard = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      i.system.description == TextEditor.enrichHTML(i.system.description);

      // Append to gear.
      if (i.type === 'item' && i.system.type != 'Weapon') {
        gear.push(i);
        i.system.filter = actorData.filter.items;
      }
      else if (i.type === 'item' && i.system.type === 'Weapon'){
        weapons.push(i);
        i.system.saveDC = Number(actorData.save.value) + (Number(i.system.mastery.value)/2);

        if (i.system.equip == true || "Equipped"){
          basics.push(i);
        }
      }
      // Append to Traits.
      else if (i.type === 'trait') {
        traits.push(i);
        i.system.filter = actorData.filter.traits;
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
        abilities.push(i);
        i.system.saveDC = Number(actorData.save.value) + Number(i.system.rank);
        i.system.rollMod = i.system.rankMod + +actorData.key.mod + +i.system.check.bonus;

        i.system.filter = actorData.filter.abilities;

        if (i.system.type === "Rear-Guard"){
          rearGuard.push(i);
        }
      }
      // Append to spells.
      else if (i.type === 'spell') {
        if (i.system.spellLevel != undefined) {
          spells[i.system.spellLevel].push(i);
        }
      }
      // Apend to basics
      else if (i.type === 'basic'){
        basics.push(i);
        i.system.saveDC = Number(actorData.save.value) + (Number(i.system.mastery.value)/2);
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
    context.weapons = weapons;
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

    // Render the item sheet for viewing/editing prior to the editable check.
    html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    // Rollable attributes.
    html.on('click', '.rearGuard', this._onRoll.bind(this));

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
      });
    });

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

    new ContextMenu(html, ".item-context", this.itemContextMenu);
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

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */

  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;

        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      } 
      else if (dataset.rollType == 'special') {
        const itemId = element.closest('.item').dataset.itemId;
        const specialRank = element.closest('.specialization').dataset.specialRank;

        const item = this.actor.items.get(itemId);
        if (item) return item.specialRoll(specialRank);
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      return this.actor.roll(dataset);
    }
  }
}
