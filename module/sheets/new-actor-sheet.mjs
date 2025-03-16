import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';
import {StoryforgeLootboxApp} from '../helpers/storyforge-lootbox.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class NewStoryforgeActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['storyforge', 'sheet', 'actorV2'],
      template: 'systems/storyforge/templates/actor/actor-sheet.hbs',
      width: 650,
      height: 680,
      resizable: false,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-main',
          initial: 'combat',
        },
        {
          navSelector: '.bio-tabs',
          contentSelector: '.char-bios',
          initial: 'public',
        },
        {
          navSelector: '.combat-tabs',
          contentSelector: '.combat-sub-header',
          initial: 'stats',
        },
        {
          navSelector: '.basics-tabs',
          contentSelector: '.basics-container',
          initial: 'stats',
        },
        {
          navSelector: '.equipment-tabs',
          contentSelector: '.equipment',
          initial: 'stats',
        },
        {
          navSelector: '.sidebar-tabs',
          contentSelector: '.page-favorites',
          initial: 'favorites',
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
  async getData() {
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
      await this._prepareItems(context);
      this._preparePaths(context);
      this._prepareCharacterData(context);
      this._setSheet(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      await this._prepareItems(context);
      
      this.render().position.width = 500;
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(
      // A generator that returns all effects stored on the actor
      // as well as any items
      this.actor.allApplicableEffects()
    );

    const user = game.user.id;
    const userOwnership = actorData.ownership[user];
    if (userOwnership == 1 || userOwnership == 2){
      console.log("Viewer!")
      this.position.width = 520;
      this.position.height = 200;
    }
    // console.log(user, userOwnership)

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

    delete context.system.attributes.death;
  }
  
  _prepareCharacterData(context) {
    let skillSum = 0;
    let saveSum = 0;
    let equipmentSum = 0;

    for (let [k, v] of Object.entries(context.system.attributes)) {
      if (v.mastery){
        saveSum += +v.mastery.points;
      }
    }

    for (let [k, v] of Object.entries(context.system.masteries)) {
      v.label = CONFIG.STORYFORGE.weaponMasteries[k] ?? k;
      equipmentSum += +v.points;
    }

    for (const key of context.skills){
      skillSum += +key.system.mastery.points;
    }

    let sum = +skillSum + +saveSum + +equipmentSum;

    let masteryRange = Math.abs(context.system.mastery.value - context.system.mastery.max);
    context.masteryRange = masteryRange;
    context.skillPoints = skillSum;
    context.savePoints = saveSum;
    context.equipmentPoints = equipmentSum;
    
    this.actor.update({"system.mastery.value": sum})
  }

  _setSheet(context){
    const currentSheet = this.constructor.name;
    const storedSheet = this.actor.getFlag("storyforge", "sheetClass");

    if (currentSheet !== storedSheet) {
      this.actor.setFlag("storyforge", "sheetClass", currentSheet);
      console.log(`Updated actor sheet class to: ${currentSheet}`);
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  async _prepareItems(context) {
    let actorData = this.actor.system;
    let actorImg = this.actor.img;

    // Gather all Origins
    const origins = [];
    const ancestry = [];

    // Initialize containers.
    const gear = [];
    const currencies = [];
    // const basics = [];
    const basics = {
      slot1: [],
      slot2: [],
      slot3: [],
      slot4: [],
      free: [],
    };
    const bonds = [];
    const abilities = {
      Awakened: [],
      Core: [],
      Learned: [],
      Training: [],
    };
    const traits = {
      Path: {},
      Other: [],
    };
    //const paths = {};
    const trackers = [];
    const perks = [];
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
    const favorites = [];
    
    const abilityCount = [];
    const basicCount = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      i.system.descriptionHTML == await TextEditor.enrichHTML(i.system.description, {async: true, documents: true})

      // Append to gear.
      if (i.type === "item"){
        if (i.system.equip == true){
          if (i.system.type === "Weapon"){
            i.system.saveDC = Number(actorData.save.value) + (Number(i.system.mastery.value)/2);

            equipment[i.system.type].push(i);
            basics[i.system.slot].push(i);
            basicCount.push(i);
          } else if (i.system.type === "Accessory"){
            equipment[i.system.type].push(i);
          } else if (i.system.type === "Armor"){
            equipment[i.system.type].push(i);
          } else if (i.system.type === "Shield"){
            equipment.Weapon.push(i);
            basics[i.system.slot].push(i);
          } else {
            gear.push(i);
          }
        } else {
          gear.push(i);
        }
      }
      // Append to Traits.
      else if (i.type === 'trait') {
         if (i.system.type === "Path" || i.system.type === "Class"){
          let source = i.system.source;

          if (!traits.Path[source]) {
            traits.Path[source] = [];
          }
          traits.Path[source].push(i)

        } else {
          traits['Other'].push(i);
        }
      }
      // Append to Perks.
      else if (i.type === 'perk') {
        perks.push(i);
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

        let type = i.system.type;

          if (!abilities[type]) {
            abilities[type] = [];
          }

        if (i.system.type != undefined){
          abilities[type].push(i);
        } else {
          abilities['Core'].push(i);
        }

        abilityCount.push(i);

        if (i.system.rearGuard === true){
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
        // basics.push(i);
        i.system.saveDC = Number(actorData.save.value) + (Number(i.system.mastery.value)/2);
        if (i.system.type != undefined){
          basics[i.system.slot].push(i);
        } else {
          basics[free].push(i);
        }
        basicCount.push(i);
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
      else if (i.type === 'origin'){
        if (origins.length < 1){
          origins.push(i);
        } else {
          ui.notifications.warn("Characters can only have One Origin.");
        }
        
      }
      else if (i.type === 'ancestry'){
        if (ancestry.length < 1){
          ancestry.push(i);
        } else {
          ui.notifications.warn("Characters can only have One Ancestry.");
        }
        
      }
      else if (i.type === "lootbox") {
        gear.push(i);
      } else if (i.type === 'path') {
        let name = i.name;

        if (!traits.Path[name]) {
          traits.Path[name] = [];
        }
        traits.Path[name].push(i)
      }

      if (i.system.favorite === true){
        favorites.push(i);
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
    // context.paths = paths;
    context.perks = perks;
    context.specializations = specializations;
    context.resources = resources;
    context.skills = skills;
    context.spells = spells;
    context.equipment = equipment;
    context.rearGuard = rearGuard;
    context.origins = origins;
    context.ancestry = ancestry;
    context.abilityCount = abilityCount;
    context.basicCount = basicCount;
    context.favorites = favorites;

    // Gather all Perks granted by Origins
    context.originPerks = [];
    /* for (let origin of origins) {
      context.originPerks.push(...origin.items.filter(i => i.type === "perk"));
    } */
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _preparePaths(context){
    // Ensure traits.Path exists
    if (context.traits && context.traits.Path) {
      for (const key in context.traits.Path) {
          const pathItems = context.traits.Path[key];

          // Find the first Path item
          const firstPathItem = pathItems.find(item => item.type === "path");
          context.traits.Path[key].firstPath = firstPathItem || null; // Attach it to the Handlebars context

          // If no Path exists, find the highest rank among Traits
          if (!firstPathItem) {
            let highestRank = 0;
            pathItems.forEach(item => {
                if (item.type === "trait" && item.system.rank > highestRank) {
                    highestRank = item.system.rank;
                }
            });

            // Store the highest rank as `fallbackRank`
            context.traits.Path[key].rank = highestRank;
        }
      }
    }
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

    // focusout test
    html.on('focus', '.life-input', function(){ this.select(); });
    html.on('focus', '.input', function(){ this.select(); });
    html.on('focus', '.resource-input', function(){ this.select(); });
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
    })

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

      let actor = this.actor;

      let health = actor.system.health;
      let healthRecover = +health.max - +health.value;

      let spirit = actor.system.spirit;
      let spiritRecover = +spirit.max - +spirit.value;

      let recovery = actor.system.recovery.value;

      const myContent = `
        <form class="storyforge">
          <div class="dialog-box actorV2">
            <div class="chat-header">
              <div class="chat-img">
                  <img src="${actor.img}" title="${actor.name}" class="chat-img">
              </div>
              <div class="chat-titles">
                  <span class="chat-title">TAKING A FULL REST?</span>
                  <span class="chat-subtitle">You'll recover: ${healthRecover} Health, ${spiritRecover} Spirit and from ${recovery} Stress!</span>
                  
              </div>
            </div>

            <div class="dialog-options">
              <div>
                <input id="resetRest" type="checkbox" name="resetRest" checked/>
                <span> Reset Quick Rests? </span>
              </div>
            </div>
          </div>
        </form>
      `;

      new Dialog({
        title: "Test Dialog",
        content: myContent,
        buttons: {
         rest: {
          icon: '<i class="fas fa-bed"></i>',
          label: "Rest",
          callback: (html) => this._fullRest(html),
         },
         cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => close
         }
        },
        default: "one"
       }).render(true);
    });

    html.on('click', '.quick-rest', (ev) => {
      console.log("Quick Rest Clicked!");
      let actor = this.actor;

      let health = this.actor.system.health;
      let healthRecover = Math.ceil(+health.max/2);
      let healthRemainder = +health.max - +health.value;

      if (healthRecover >= healthRemainder){
        healthRecover = healthRemainder;
      }

      let spirit = this.actor.system.spirit;
      let spiritRecover = Math.ceil(+spirit.max/2);
      let spiritRemainder = +spirit.max - +spirit.value;

      if (spiritRecover >= spiritRemainder){
        spiritRecover = spiritRemainder;
      }

      
      let recovery = actor.system.recovery.quick;

      const myContent = `
        <form class="storyforge">
          <div class="dialog-box actorV2">
            <div class="chat-header">
              <div class="chat-img">
                  <img src="${actor.img}" title="${actor.name}" class="chat-img">
              </div>
              <div class="chat-titles">
                  <span class="chat-title">TAKING A QUCIK REST?</span>
                  <span class="chat-subtitle">You'll recover: ${healthRecover} Health, ${spiritRecover} Spirit and from ${recovery} Stress!</span>
              </div>
            </div>

            <div class="dialog-options">
              <div>
                <input id="consumeRest" type="checkbox" name="consumeRest" checked/>
                <span> Consume Quick Rest? </span>
              </div>
            </div>

          </div>
        </form>
      `;

      new Dialog({
        title: "Test Dialog",
        content: myContent,
        buttons: {
         rest: {
          icon: '<i class="fas fa-bed"></i>',
          label: "Rest",
          callback: (html) => this._quickRest(html),
         },
         cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => close
         }
        },
        default: "one"
       }).render(true);
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

    html.on('click', '.item-favorite', (ev) => {
      event.preventDefault();
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      let element = ev.currentTarget;
      let field = element.dataset.field;
      let value = !item.system.favorite;
      console.log("CLICKED!")

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

    html.on('click', '.skill-bubble', (event) => {
      event.preventDefault();
      const li = $(event.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      let element = event.currentTarget;
      let points = element.dataset.points;
      let value = element.dataset.value;

      if (item.system.mastery.points == value){
        value--;
      }

      console.log(points)

      return item.update({[points]: value})
    })

    html.on('contextmenu', '.skill-bubble', (event) => {
      event.preventDefault();
      const li = $(event.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      let element = event.currentTarget;
      let field = element.dataset.trained;
      let value = element.dataset.value;
      console.log(value);
      
      if (item.system.mastery.trained == value){
        value--;
      }
      
      let points = item.system.mastery.points;
      let trained = +value - +points;

      if (trained < 0){
        trained  = 0;
      }

      console.log(item);
      console.log(trained);

      return item.update({ [field]: trained})
    })

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
      event.preventDefault();
      let element = ev.currentTarget;
      let actor = this.actor;
      let field = element.dataset.field;
      let value = eval(`actor.${field}`);
      let newValue = !value;

      return this.actor.update({[field] : newValue})
    })

    // Listen for the Initiative Roll Button Click
    html.on("click", ".roll-init", async (event) => {
      event.preventDefault();
      const actor = this.actor;
      console.log(actor);
      if (!actor) return;

      // Check if the actor has an active token in the current scene
      const token = canvas.tokens.placeables.find(t => t.actor?.id === actor.id);
      if (!token) {
          ui.notifications.warn("This actor has no token in the scene.");
          return;
      }

      // Get the current combat tracker
      let combat = game.combats.active;
      if (!combat) {
          // Create a new combat encounter if one doesn’t exist
          combat = await game.combats.documentClass.create({});
      }

      // Check if the token is already in the initiative tracker
      let combatant = combat.combatants.find(c => c.tokenId === token.id);
      if (!combatant) {
          combatant = await combat.createEmbeddedDocuments("Combatant", [{
              tokenId: token.id,
              actorId: actor.id,
              sceneId: game.scenes.active?.id,
              initiative: null
          }]);
      }

      // Roll Initiative for the Token
      await combat.rollInitiative(combatant.id);
    });

    // In case the Lootbox Modle is active
    html.on("click", ".lootbox", async (ev) => {
      ev.preventDefault();
      const itemId = $(ev.currentTarget).data("itemId");
      const lootboxItem = this.actor.items.get(itemId);

      if (!lootboxItem) return;

      const rolltableId = lootboxItem.system.rolltable;
      const rollTable = game.tables.get(rolltableId);
      console.log(rolltableId, rollTable)

      if (!rollTable) {
          return ui.notifications.error("RollTable not found!");
      }

      new StoryforgeLootboxApp(rollTable, lootboxItem).render(true);

      // Reduce quantity by 1
      let newQuantity = Math.max(0, lootboxItem.system.quantity - 1);

      if (newQuantity === 0) {
          await lootboxItem.delete();
      } else {
          await lootboxItem.update({ "system.quantity": newQuantity });
      }
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
      const actor = this.actor;
      await this.settingsDialog(actor)

    });

    new ContextMenu(html, ".item-context", this.itemContextMenu);
    new ContextMenu(html, ".basic-context", this.itemContextMenu);
    new ContextMenu(html, ".currency-context", this.currencyMenu);

    /* const myDialog = new Dialog({
      title: "Test Dialog",
      content: "<p>You must choose either Option 1, or Option 2</p>",
      buttons: {
       one: {
        icon: '<i class="fas fa-check"></i>',
        label: "Option One",
        callback: () => console.log("Chose One")
       },
       two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Option Two",
        callback: () => console.log("Chose Two")
       }
      },
      default: "two",
      render: html => console.log("Register interactivity in the rendered dialog"),
      close: html => console.log("This always is logged no matter which option is chosen")
     });

    html.on('click', '.combat-name', (ev) => {
      ev.preventDefault();
      myDialog.render(true);
    }) */
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

  _fullRest(event) {
    console.log("Full Rest Clicked!");
      const health = this.actor.system.health;
      const spirit = this.actor.system.spirit;
      const stress = Number(this.actor.system.stress.value) || 0;
      const recovery = Number(this.actor.system.recovery.value) || 0;
      let newHP = health.max;
      let newSP = spirit.max;
      let newStress = Math.max(0, stress - recovery)

      const counterCheck = event.find("input#resetRest:checked").val();

      if (counterCheck){
        this.actor.update({
          "system.shortRests": 2
        });
      }

      // const value = event.find("input#myInputID").val();

      this.actor.update({
        "system.health.value": newHP,
        "system.spirit.value": newSP,
        "system.health.edit": newHP,
        "system.spirit.edit": newSP,
        "system.stress.value": newStress
      });
      ui.notifications.info("You Full Rested!")
  }

  _quickRest(event) {
    console.log("Quick Rest Clicked!");
      const health = this.actor.system.health;
      const spirit = this.actor.system.spirit;
      const counter = this.actor.system.shortRests;
      const stress = Number(this.actor.system.stress.value) || 0;
      const recovery = Number(this.actor.system.recovery.quick) || 0;
      let newStress = Math.max(0, stress - recovery)

      const counterCheck = event.find("input#consumeRest:checked").val();
      let newCounter;

      if (counterCheck){
        if (counter<= 0){
          ui.notifications.error("You're out of Quick Rests!")
          return
        } else {
          newCounter = +counter - 1;

          if (newCounter <= 0){
            newCounter = 0;
          }
        }
      }

      let hpRegen = Math.ceil(+health.max/2);
      let spRegen = Math.ceil(+spirit.max/2);
      let newHP = +health.value + hpRegen;
      let newSP = +spirit.value + spRegen;

      if (newHP > health.max){
        newHP = health.max;
        //console.log("HP Triggered!")
      }

      if (newSP > spirit.max){
        newSP = spirit.max;
        //console.log("SP Triggered!")
      }

      /* console.log("Starting: " + health.value + " HP " + spirit.value + " SP")
      console.log("Max: " + health.max + " HP " + spirit.max + " SP")
      console.log("Regen: " + hpRegen + " HP " + spRegen + " SP")
      console.log("New: " + newHP + " HP " + newSP + " SP") */

      this.actor.update({
        "system.health.value": newHP,
        "system.spirit.value": newSP,
        "system.health.edit": newHP,
        "system.spirit.edit": newSP,
        "system.shortRests": newCounter,
        "system.stress.value": newStress
      });
      ui.notifications.info("You Quick Rested!")
  }

  async FullRest (event) {
    const template = await renderTemplate("systems/storyforge/templates/dialog/dialog-full-rest.hbs", {});
    const actor = this;

    return new Promise(resolve => {
      const data = {
        title: "Full Rest",
        content: template,
        buttons: {
          rest: {
           icon: '<i class="fas fa-bed"></i>',
           label: "Rest",
           callback: html => resolve(this._fullRest(html[0].querySelector("form")))
          },
          cancel: {
           icon: '<i class="fas fa-times"></i>',
           label: "Cancel",
           callback: () => close
          }
         },
         default: "rest",
         actor: actor
      }

      let cardData = {
        actor: actor,
      };

      new Dialog(data, cardData).render(true);
    });
  }

  /* async _onDropItem(event, data) {
    event.preventDefault();

    // Parse the dropped item data
    let droppedItem;
    try {
        droppedItem = await fromUuid(data.uuid);
    } catch (err) {
        return ui.notifications.error("Invalid item drop data.");
    }

    if (!droppedItem) return;

    // Check if an item with the same name already exists in the actor's inventory
    const existingItem = this.actor.items.find(i => i.name === droppedItem.name);

    // Define which item types are allowed to merge quantity
    const mergeableTypes = ["item", "currency", "lootbox"];

    if (existingItem) {
        if (mergeableTypes.includes(droppedItem.type)) {
            // Merge the quantity values if it's a mergeable type
            let newQuantity = existingItem.system.quantity + droppedItem.system.quantity;
            await existingItem.update({ "system.quantity": newQuantity });
        } else {
            // Prevent adding non-mergeable duplicate items
            return ui.notifications.warn(`An item named "${droppedItem.name}" already exists and cannot be merged.`);
        }
    } else {
        // No existing item found, add the new item normally
        await this.actor.createEmbeddedDocuments("Item", [droppedItem.toObject()]);
    }
  } */



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
      } else  if (dataset.rollType == 'trait') {
        const itemId = element.closest('.item').dataset.itemId;

        const item = this.actor.items.get(itemId);
        if (item) return item.traitRoll();
      } else  if (dataset.rollType == 'perk') {
        const itemId = element.closest('.item').dataset.itemId;

        const item = this.actor.items.get(itemId);
        if (item) return item.perkRoll();
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
