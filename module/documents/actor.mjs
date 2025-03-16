import { ItemContainers } from "../helpers/item-containers.mjs";
import { STORYFORGE } from "../helpers/config.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class StoryforgeActor extends Actor {
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the actor source data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.storyforge || {};

    delete systemData.attributes.death;


    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.

    this._prepareUniversalData(actorData);
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
    this._applyOriginPerks();
    //this._handleStoredItemTransfers();
  }

  /**
   * Prepare Character type specific data
   */
  _prepareUniversalData(actorData) {

    // Make modifications to data here. For example:
    const systemData = actorData.system;

    delete systemData.attributes.firearms;
    this._prepareStatuses(actorData);


    const stats = ['pow', 'dex', 'int', 'wil'];

    let pow = +systemData.attributes.pow.value;
    let dex = +systemData.attributes.dex.value;
    let int = +systemData.attributes.int.value;
    let wil = +systemData.attributes.wil.value;

    let lvl = +systemData.level;
    let health = systemData.health;
    let spirit = systemData.spirit;
    let saveBonus = systemData.save.bonus;
    let init = systemData.init;

    let critDamage = 1 + +systemData.critDamage.bonus + Math.floor(pow/2);
    let statusTier = +systemData.statusTier.bonus + Math.floor(int/2) + Math.ceil(lvl/6);

    
    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, attribute] of Object.entries(systemData.attributes)) {
      let mastery = attribute.mastery;

      if (mastery){
        let points = +mastery.points || 0;
        let trained = +mastery.trained || 0;
    
        let actual = +points + +trained || 0;
        if (actual > 5){
          actual = 5;
        }
    
        attribute.mastery.actual = actual;

        /* Coverting mastery text into a number value */
        switch (attribute.mastery.actual){
          case 1: 
            mastery.rank = "Trained";
            attribute.save = 2 + +attribute.value;
            break;
          case 2: 
            mastery.rank = "Adept";
            attribute.save = 4 + +attribute.value;
            break;
          case 3: 
            mastery.rank = "Expert";
            attribute.save = 6 + +attribute.value;
            break;
          case 4: 
            mastery.rank = "Master";
            attribute.save = 8 + +attribute.value;
            break;
          case 5: 
            mastery.rank = "Legend";
            attribute.save = 10 + +attribute.value;
            break;
          default:
            mastery.rank = "Untrained";
            attribute.save = 0 + +attribute.value;
        }
      }
      
    }
    
    systemData.tier = Math.ceil(lvl/6);

    init.value = Number(int) + Number(init.bonus);

    systemData.critDamage.value = critDamage;
    systemData.statusTier.value = statusTier;
  }

  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;
    const systemData = actorData.system;
    let sKey = systemData.sKey;
    let skillStat = systemData.skill.stat;
    let skillMod = +systemData.skill.mod;
    let lvl = +systemData.level;
    let keyStat = systemData.key.stat;

    let pow = +systemData.attributes.pow.value;
    let dex = +systemData.attributes.dex.value;
    let int = +systemData.attributes.int.value;
    let wil = +systemData.attributes.wil.value;

    delete systemData.masteries.firearms;
    delete systemData.masteries.improvised;
    //console.log(systemData.masteries);

    let free = 1 +  +systemData.free.bonus + Math.floor(dex/2);
    let recovery = 1 +  +systemData.recovery.bonus + Math.floor(wil/2);
    systemData.recovery.quick = Math.ceil(+recovery / 2);
    systemData.actions.quick.max = free;

    switch (keyStat) {
      case 'POW':
        systemData.key.mod = pow;
        break;
      case 'DEX':
        systemData.key.mod = dex;
        break;
      case 'INT':
        systemData.key.mod = int;
        break;
      case 'WIL':
        systemData.key.mod = wil;
        break;
      default: 0
    }

    let keyMod = +systemData.key.mod;
    let saveBonus = systemData.save.bonus;
    systemData.save.value = 10 + Number(keyMod) + Number(saveBonus);
    
    let health = systemData.health;
    let spirit = systemData.spirit;
    health.max = Number(health.origin) + Number(health.bonus) + (lvl * (pow + dex + Number(health.lvl)));
    spirit.max = Number(spirit.origin) + Number(spirit.bonus) + (lvl * (int + wil + Number(spirit.lvl)));

    systemData.hpBar = (+health.value / +health.max) * 100;
    systemData.spBar = (+spirit.value / +spirit.max) * 100;

    let protectedStatus = +systemData.statuses.positive.protected.tier;
    let marked = +systemData.statuses.negative.marked.tier;

    
    systemData.free.value = free;
    systemData.recovery.value = recovery;

    systemData.mastery.max = 7 + (lvl-1);

    let defBase = systemData.def.base;
    let defBonus = systemData.def.bonus;
    systemData.def.value = Number(defBase) + Number(defBonus) + Number(pow) + Number(dex) + protectedStatus - marked;
    systemData.def.crit = Number(systemData.def.value) + 10;

    let arcBase = systemData.arc.base;
    let arcBonus = systemData.arc.bonus;
    systemData.arc.value = 10 + Number(arcBonus) + Number(wil) + Number(int) + protectedStatus - marked;
    systemData.arc.crit = Number(systemData.arc.value) + 10;

    let deflect = systemData.deflect.bonus;
    systemData.deflect.value = deflect;
    

    switch (skillStat) {
      case 'POW':
        systemData.skill.mod = pow;
        break;
      case 'DEX':
        systemData.skill.mod = dex;
        break;
      case 'INT':
        systemData.skill.mod = int;
        break;
      case 'WIL':
        systemData.skill.mod = wil;
        break;
      default: 0
    }

    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, mastery] of Object.entries(systemData.masteries)) {
      let points = +mastery.points || 0;
      let trained = +mastery.trained || 0;
  
      let actual = +points + +trained || 0;
      if (actual > 5){
        actual = 5;
      }
  
      mastery.actual = actual;
      
      /* Coverting mastery text into a number value */
      switch (mastery.actual){
        case 1: 
          mastery.rank = "Trained";
          mastery.value = 2;
          break;
        case 2: 
          mastery.rank = "Adept";
          mastery.value = 4;
          break;
        case 3: 
          mastery.rank = "Expert";
          mastery.value = 6;
          break;
        case 4: 
          mastery.rank = "Master";
          mastery.value = 8;
          break;
        case 5: 
          mastery.rank = "Legend";
          mastery.value = 10;
          break;
        default:
          mastery.rank = "Untrained";
          mastery.value = 0;
      }
    }

    // Get all Origin items
    const origins = this.items.filter(i => i.type === "origin");

    // Ensure Perks from Origins are applied
    for (let origin of origins) {
      const storedPerks = origin.items?.filter(i => i.type === "perk") || [];
      for (let perk of storedPerks) {
        if (!this.items.find(i => i.name === perk.name)) {
          this.createEmbeddedDocuments("Item", [perk.toObject()]);
        }
      }
    }
    
  }
  
  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    systemData.xp = systemData.cr * systemData.cr * 100;

    let pow = +systemData.attributes.pow.value;
    let dex = +systemData.attributes.dex.value;
    let int = +systemData.attributes.int.value;
    let wil = +systemData.attributes.wil.value;
    let lvl = +systemData.level;
    let tier = +systemData.tier;
    let addons = systemData.addons;
    
    let actions = systemData.actions;
    let statuses = systemData.statuses;
    let hasted = 0;
    let slowed = 0;
    if (statuses.positive.hasted.active) hasted = 1;
    if (statuses.negative.slowed.active) slowed = -1;
    actions.standard.max = 1 + actions.standard.bonus + hasted + slowed;
    actions.quick.max = 1 + actions.quick.bonus;
    actions.reaction.max = 0 + actions.reaction.bonus;

    const type = systemData.type;
    let health = systemData.health;
    let spirit = systemData.spirit;
    let partySize = +systemData.partySize;

    let defBase = systemData.def.base;
    let defBonus = systemData.def.bonus;
    

    let arcBase = systemData.arc.base;
    let arcBonus = systemData.arc.bonus;

    let protectedStatus = +systemData.statuses.positive.protected.tier;
    let marked = +systemData.statuses.negative.marked.tier;

    let deflect = (Number(systemData.deflect.bonus) + Number(dex) * Number(tier));

    
    let recovery = 1 +  +systemData.recovery.bonus + Math.floor(wil/3);
    systemData.recovery.value = recovery;

    systemData.key.mod = Math.max(pow, dex, int, wil);

    let keyMod = +systemData.key.mod;
    let saveBonus = systemData.save.bonus;
    systemData.save.value = 10 + Number(keyMod) + Number(saveBonus);

    addons.max = 6 + lvl;

    if (type === "Adversary"){

      health.max = Number(health.origin) + Number(health.bonus) + (lvl * (pow + dex + Number(health.lvl)));
      spirit.max = Number(spirit.origin) + Number(spirit.bonus) + (lvl * (int + wil + Number(spirit.lvl)));
      systemData.def.value = Number(defBase) + Number(defBonus) + Number(pow) + Number(dex) + Number(protectedStatus) - Number(marked);
      systemData.def.crit = Number(systemData.def.value) + 10;
      systemData.arc.value = 10 + Number(arcBonus) + Number(wil) + Number(int) + Number(protectedStatus) - Number(marked);
      systemData.arc.crit = Number(systemData.arc.value) + 10;
      systemData.deflect.value = deflect;

    } else if (type === "Swarm"){

      health.max = Math.ceil((Number(health.origin) + Number(health.bonus) + (lvl * (pow + dex + Number(health.lvl)))) / 10);
      spirit.max = Number(spirit.origin) + Number(spirit.bonus) + (lvl * (int + wil + Number(spirit.lvl)));
      systemData.def.value = Number(defBase) + Number(defBonus) + Number(pow) + Number(dex) + Number(protectedStatus) - Number(marked);
      systemData.def.crit = Number(systemData.def.value) + 10;
      systemData.arc.value = 10 + Number(arcBonus) + Number(wil) + Number(int) + Number(protectedStatus) - Number(marked);
      systemData.arc.crit = Number(systemData.arc.value) + 10;
      systemData.deflect.value = 0;

    } else if (type === "Elite"){

      health.max = Math.ceil((Number(health.origin) + Number(health.bonus) + (lvl * (pow + dex + Number(health.lvl)))) * 2);
      spirit.max = Math.ceil((Number(spirit.origin) + Number(spirit.bonus) + (lvl * (int + wil + Number(spirit.lvl)))) * 2);
      systemData.def.value = Number(defBase) + Number(defBonus) + Number(pow) + Number(dex) + 1 + Number(protectedStatus) - Number(marked);
      systemData.def.crit = Number(systemData.def.value) + 10;
      systemData.arc.value = 10 + Number(arcBonus) + Number(wil) + Number(int) + 1 + Number(protectedStatus) - Number(marked);
      systemData.arc.crit = Number(systemData.arc.value) + 10;
      systemData.deflect.value = Number(deflect) + Number(tier);
      actions.standard.max = 2 + actions.standard.bonus + hasted + slowed;
      
    } else if (type === "Solo"){

      health.max = Math.ceil((Number(health.origin) + Number(health.bonus) + (lvl * (pow + dex + Number(health.lvl)))) * Number(partySize));
      spirit.max = Math.ceil((Number(spirit.origin) + Number(spirit.bonus) + (lvl * (int + wil + Number(spirit.lvl)))) * (Number(partySize) / 2));
      systemData.def.value = Number(defBase) + Number(defBonus) + Number(pow) + Number(dex) + 1 + Number(protectedStatus) - Number(marked);
      systemData.def.crit = Number(systemData.def.value) + 10;
      systemData.arc.value = 10 + Number(arcBonus) + Number(wil) + Number(int) + 1 + Number(protectedStatus) - Number(marked);
      systemData.arc.crit = Number(systemData.arc.value) + 10;
      systemData.deflect.value = Number(deflect) + Number(tier);
      
    } else {

      health.max = Number(health.origin) + Number(health.bonus) + (lvl * (pow + dex + Number(health.lvl)));
      spirit.max = Number(spirit.origin) + Number(spirit.bonus) + (lvl * (int + wil + Number(spirit.lvl)));
      systemData.def.value = Number(defBase) + Number(defBonus) + Number(pow) + Number(dex) + Number(protectedStatus) - Number(marked);
      systemData.def.crit = Number(systemData.def.value) + 10;
      systemData.arc.value = 10 + Number(arcBonus) + Number(wil) + Number(int) + Number(protectedStatus) - Number(marked);
      systemData.arc.crit = Number(systemData.arc.value) + 10;
      systemData.deflect.value = deflect;

    }

    systemData.hpBar = (+health.value / +health.max) * 100;
    systemData.spBar = (+spirit.value / +spirit.max) * 100;


  }

  /**
   * Prepare Status specific data.
   */
  async _prepareStatuses(actorData){
    const sheetClass = this.getFlag("storyforge", "sheetClass") || "NewStoryforgeActorSheet";
    const systemData = actorData.system;

    // Use the correct status set (fallback to NewStoryforgeActorSheet if unrecognized)
    const statusSet = STORYFORGE.statuses[sheetClass] || STORYFORGE.statuses.NewStoryforgeActorSheet;

    // Ensure statuses are initialized
    if (!systemData.statuses.positive) systemData.statuses.positive = {};
    if (!systemData.statuses.negative) systemData.statuses.negative = {};
    if (!systemData.statuses.conditions) systemData.statuses.conditions = {};

    // Apply the correct status set
    for (let [key, status] of Object.entries(statusSet.positive)) {
      if (!systemData.statuses.positive[key]) {
        systemData.statuses.positive[key] = { ...status, active: false };
      }
    }

    for (let [key, status] of Object.entries(statusSet.negative)) {
      if (!systemData.statuses.negative[key]) {
        systemData.statuses.negative[key] = { ...status, active: false };
      }
    }

    for (let [key, status] of Object.entries(statusSet.conditions)) {
      if (!systemData.statuses.conditions[key]) {
        systemData.statuses.conditions[key] = { ...status, active: false};
      }
    }

    // Remove any statuses that are not in the current sheet's valid status set
    systemData.statuses.positive = Object.keys(systemData.statuses.positive)
    .filter((key) => statusSet.positive.hasOwnProperty(key))
    .sort()
    .reduce((obj, key) => {
      obj[key] = systemData.statuses.positive[key];
      return obj;
    }, {});

    systemData.statuses.negative = Object.keys(systemData.statuses.negative)
      .filter((key) => statusSet.negative.hasOwnProperty(key))
      .sort()
      .reduce((obj, key) => {
        obj[key] = systemData.statuses.negative[key];
        return obj;
    }, {});

    systemData.statuses.conditions = Object.keys(systemData.statuses.conditions)
      .filter((key) => statusSet.conditions.hasOwnProperty(key)).sort((a, b) => {
        if (a === "broken") return -1;
        if (b === "broken") return 1;
        if (a === "tapped") return -1;
        if (b === "tapped") return 1;
        return a.localeCompare(b);
      })
      .reduce((obj, key) => {
        obj[key] = systemData.statuses.conditions[key];
        return obj;
    }, {});
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // Starts off by populating the roll data with `this.system`
    const data = {...super.getRollData()};

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.attributes) {
      for (let [k, v] of Object.entries(data.attributes)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    // Add level for easier access, or fall back to 0.
    if (data.level) {
      data.lvl = data.level ?? 0;
    }

    data.Key = data.key.mod ?? 0;
    data.sKey = data.skill.mod ?? 0;
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }

  /* async roll(){
    let label = dataset.label ? `Rolling ${dataset.label}` : '';
    let roll = new Roll(dataset.roll, this.actor.getRollData());

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: label,
      rollMode: game.settings.get('core', 'rollMode'),
    });
  } */

  chatTemplate = "systems/storyforge/templates/chat/chat-actor-roll.hbs";
  narrativeTemplate = "systems/storyforge/templates/chat/chat-actor-roll.hbs";

  async roll(dataset) {
    const actor = this;
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    let label = dataset.label;
    let subtitle = dataset.subtitle;
    console.log(dataset);

    // Initialize chat data.
    const formula = this.system.formula;
    console.log(formula);
    // Retrieve roll data.
    const rollData = this.getRollData();

    // Invoke the roll and submit it to chat.
    const roll = new Roll(dataset.roll, this.getRollData());
    console.log(roll.formula + " = " + roll.result);
    let chatData = {
      speaker: speaker,
      rollMode: rollMode,
      //flavor: label
    }

    let cardData = {
      ...this.getRollData(),
      actor: actor,
      check: roll,
      name: label,
      subtitle: subtitle
    };

    //console.log(this.actor.getRollData())
    await roll.evaluate();
    chatData.content = await renderTemplate(this.chatTemplate, cardData);
    console.log(roll);

    // If you need to store the value first, uncomment the next line.
    // const result = await roll.evaluate();
    // roll.toMessage(chatData);
    await ChatMessage.applyRollMode(chatData, rollMode)
    ChatMessage.create(chatData);
    return roll;
  }

  async getCombatActionOptions(action, actionType, subtitle, desc, tracker){
    const actor = this;
    const skills = []

    const narrative = li => actionType === "narrative";
    const combat = li => actionType === "combat";

    for (let i of actor.items) {
      // Append to skills.
      if (i.type === 'skill') {
        skills.push(i);
      }
    }

    const cardData = {
      ...this.getRollData(),
      actor: this,
      actionType: actionType,
      tracker: tracker,
      name: action,
      subtitle: subtitle,
      desc: desc,
      skills: skills,
    }

    const myContent = await renderTemplate("systems/storyforge/templates/dialog/dialog-combat-actions.hbs", cardData);

    if (actionType === "narrative"){
      return new Promise(resolve => {
        const data = {
          title:"Skill Check",
          content: myContent,
          buttons: {
            narrative: {
              icon: '<i class="fas fa-dice-d20"></i>',
              label: "Roll",
              callback: html => resolve(this._processNarrativeActionOptions(html[0].querySelector("form")))
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
    
    else if (actionType === "combat"){
      return new Promise(resolve => {
        const data = {
          title:"Skill Check",
          content: myContent,
          buttons: {
            narrative: {
              icon: '<i class="fas fa-dice-d20"></i>',
              label: "Roll",
              callback: html => resolve(this._processCombatActionOptions(html[0].querySelector("form")))
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

  }

  _processNarrativeActionOptions(form) {
    // Get the selected skill option
    const skillSelect = form.querySelector('select[name="skill"]');
    const selectedOption = skillSelect.options[skillSelect.selectedIndex];

    // Extract skill name from data-skill attribute
    const skillName = selectedOption.getAttribute("data-skill") || "";

    return {
      attribute: form.attribute.value,
      skillValue: form.skill.value,
      skillName: skillName,
    }
  }

  _processCombatActionOptions(form) {
    let reactionSum = 0;
    let reactionCheck;
    let standardSum = 0;
    let standardCheck;
    let quickSum = 0;
    let quickCheck;

    reactionCheck = form.querySelector(`input[name="reaction"]`).checked;
    if (reactionCheck)  reactionSum += 1;

    let standards = ["standard1", "standard2", "standard3", "standard4"];
    for (let v of standards) {
      standardCheck = form.querySelector(`input[name="${v}"]`).checked;
      if (standardCheck) standardSum += 1;
    }

    quickCheck = form.querySelector(`input[name="quick"]`).checked;
    if (quickCheck)  quickSum += 1;

    console.log("Reaction:", reactionSum, "Standard:", standardSum, "Quick:", quickSum)

    return {
      attribute: form.attribute.value,
      reaction: reactionSum,
      standard: standardSum,
      quick: quickSum,
    }
  }

  async actionRoll(dataset) {
    const actor = this;
    let name;
    let description;
    let subtitle;
    let actionTracker = {
      reaction: 0,
      standard: 0,
      quick: 0
    };
    let actorActions = {
      reaction: actor.system.actions.reaction.value,
      standard: actor.system.actions.standard.value,
      quick: actor.system.actions.quick.value
    }
    let actionDialog;
    let formula;

    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    let rollMode = game.settings.get('core', 'rollMode');

    const action = dataset.action;
    const actionType = dataset.actionType;

    if (actionType === "narrative"){
      if (action === "convince"){
        name = "Convince";
        subtitle = "Narrative Action";
        description = `
          <p>When trying to convince a character, you must first decide on your approach. Your approach determines the drawbacks and successes of the action.</p>
  
          <p><strong>Complication.</strong> The character may want something in return from you.</p>
          
          <p><strong>Fumble.</strong> They character'll only help if you do what they want in return first. </p>
  
          <p><strong>Success.</strong> You convince the character to do something for you.</p>
        `;
      } else if (action === "clash"){
        name = "Clash";
        subtitle = "Narrative Action";
        description = `
          <p><strong>Complication.</strong> You gain 1 Stress. (Could be more depending on the situation)</p>
          <p><strong>Fumble.</strong> Gain 1 Benefit and 1 additional Stress.</p>
          <p><strong>Success.</strong> Gain 1 Benefit.</p>
          <p><strong>Success (Every 10+).</strong> Gain an additional Benefit.</p>
          <div class="action-options"> BENEFITS </div>
          <ul>
            <li>You hurt them. (They become HURT. If they get hurt again, they are defeated).</li>
            <li>You drive them away.</li>
            <li>You leave an impression of your choice on them.</li>
          </ul>
        `;
      } else if (action === "insight"){
        name = "Gain Insight";
        subtitle = "Narrative Action";
        description = `
          <p><strong>Complication.</strong> The Storymaster may ask you to expose a piece of information. </p>
          <p><strong>Success.</strong> You can ask one question from below.</p>
          <p><strong>Success (Every 5+).</strong> You can ask an additional question from below.
          <div class="action-options"> QUESTIONS </div>
          <ul>
          <li>What recently happened here?</li>
          <li>What is about to happen here?</li>
          <li>How can I _________?</li>
          <li>What seems strange here?</li>
          <li>What is being concealed here?</li>
          <li>Who or what is in charge here?</li>
          <li>What is safe or vulnerable here?</li>
          <li>What is useful to me?</li>
          </ul>
        `;
      } else if (action === "helpout") {
        name = "Help Out";
        subtitle = "Narrative Action";
        description = `
          <p>You help out another player character.</p>
  
          <p><strong>Complication.</strong> You expose yourself to danger or trouble if there is any. </p>
          
          <p><strong>Success.</strong> You grant them a +2 on their next roll. </p>
  
          <p><strong>Success (Every 5+).</strong> They gain an additional +1 on their roll. </p>
        `;
      } else if (action === "unseen") {
        name = "Move Unseen";
        subtitle = "Narrative Action";
        description = `
          <p>You try to get to a location unseen.</p>
  
          <p><strong>Complication.</strong> You leave something behind evidence of your intrusion. </p>
          
          <p><strong>Fumble.</strong> You get into the location you were attempting to get into, but cannot get out the same way you came in.</p>
  
          <p><strong>Success.</strong> You do what you set out to do.</p>
        `;
      } else if (action === "overcome") {
        name = "Overcome Obstacle";
        subtitle = "Narrative Action";
        description = `
          <p>You attempt to overcome a challenge.</p>
  
          <p><strong>Complication.</strong> Your Storymaster determines the complication of this action before you take it. You can choose to not take this action once learning the complication, but before you roll the check.</p>
          
          <p><strong>Fumble.</strong> The Storymaster offers you a hard choice.</p>
  
          <p><strong>Success.</strong> You do what you set out to do.</p>
        `;
      } else if (action === "danger") {
        name = "Defy Danger";
        subtitle = "Narrative Action";
        description = `
          <p>When trying to convince a character, you must first decide on your approach. Your approach determines the drawbacks and successes of the action.</p>
  
          <p><strong>Complication.</strong> The character may want something in return from you.</p>
          
          <p><strong>Fumble.</strong> They character'll only help if you do what they want in return first. </p>
  
          <p><strong>Success.</strong> You convince the character to do something for you.</p>
        `;
      } else if (action === "unleash") {
        name = "Unleash Power";
        subtitle = "Narrative Action";
        description = `
          <p>You attempt to unleash your power to help you in a situation, allowing you to overcome a obstacle supernaturally</p>
  
          <p><strong>Complication.</strong> Unleashing your powers cost you Spirit. Your Storymaster will determine the cost before you take this action. You can choose to not take this action once learning the complication, but before you roll the check.</p>
          
          <p><strong>Fumble.</strong> The Storymaster offers you a hard choice.</p>
  
          <p><strong>Success.</strong> You are successful at using your powers, you get your desired outcome.</p>
        `;
      }

      actionDialog = await this.getCombatActionOptions(action, actionType, subtitle, description, null);
    } 
    
    else if (actionType === "combat"){
      if (action === "ability"){
        name = "Ability Action";
        subtitle = "0-3 Actions • 1/Round Per Ability"
        description = `
          <p>Whenever you take the Ability Action, you can use one of your abilities. You can only use each ability once per round unless stated otherwise.</p>
        `;
      } else if (action === "analyze"){
        name = "Analyze Action";
        subtitle = "1 Action"
        actionTracker.standard = 1;
        description = `
          <p>Whenever you take the Analyze Action, make DC 10 INT check on a character within a short range of you. On a success, chose an Analyze Option to apply to the target.</p>
  
          <div class="action-options"> ANALYZE OPTIONS </div>
          
          <ul>
            <li><strong>Examine.</strong> Learn either the Target’s Health, it’s Immunities and resistances or it’s vulnerabilities. </li>
            <li><strong>Predict.</strong> The next action against this character gains Edge.</li>
            <li><strong>Spot.</strong> A HIDDEN character is no longer is HIDDEN.</li>
          </ul>
        `;
      } else if (action === "basic"){
        name = "Basic Action";
        subtitle = "1 Action"
        actionTracker.standard = 1;
        description = `
          <p>Whenever you take the Basic Action, you can use a Basic Ability or make an attack with a Weapon or Unarmed Strike. </p>
          <p><strong>Unarmed Strike.</strong> <em>KEY</em> Accuracy | 1d6 + <em>KEY</em> damage.</p>
        `;
      } else if (action === "hide"){
        name = "Hide Action";
        subtitle = "1 Action • 1/round";
        actionTracker.standard = 1;
        description = `
          <p>Whenever you take the Hide Acton, you gain the <em>HIDDEN</em> condition. This lasts until the start of your next turn, or until you use an Action.</p>
        `;
      } else if (action === "influence"){
        name = "Influence Action";
        subtitle = "1 Action • 1/round • Close";
        actionTracker.standard = 1;
        description = `
          <p>Whenever you take the Influence Action, you can choose an Influence Option from below. If used on an unwilling target, make a Contested WIL check to see if you succeed. </p>
  
          <div class="action-options"> INFLUENCE OPTIONS </div>
          
          <ul>
            <li><strong>Help.</strong> The target gets Edge on their next Check.</li>
            <li><strong>Hinder.</strong> The target gains Snag on their next Check.</li>
          </ul>
        `;
      } else if (action === "interact"){
        name = "Interact Action";
        subtitle = "1 Action";
        actionTracker.standard = 1;
        rollMode = game.settings.get('core', 'rollMode');
        description = `
          <p>Whenever you use the Interact Action, you can use with an object or item on the field or stowed in your inventory. Additionally, you can switch an Equipped Item for a Stowed Item.</p>
        `;
      } else if (action === "maneuver"){
        name = "Maneuver Action";
        subtitle = "1 Action";
        actionTracker.standard = 1;
        description = `
          <p>When taking the Maneuver Action, make contested MIG check against an adjacent target’s MIG or DEX. On a success, choose a Maneuver from below to apply to the target.</p>
  
          <div class="action-options"> MANEUVER OPTIONS </div>
          
          <ul>
            <li><strong>Disarm.</strong> The target gain the DISARMED condition on a piece of Equipment.</li>
            <li><strong>Grapple.</strong> The target gains the GRAPPLED condition, and you gain the GRAPPLING condition.</li>
            <li><strong>Knockdown.</strong> The target is knocked PRONE. </li>
            <li><strong>Shove.</strong> The target is moved a number of spaces equal to your MIG.</li>
          </ul>
        `;
      } else if (action === "move"){
        name = "Move Action";
        subtitle = "1 Action";
        actionTracker.standard = 1;
        description = `
          <p>Whenever you take the Move Action, you gain a Movement equal to your Speed. You can move a number of space equal to your total Movement. You can also spend Movement to do Movement Options.</p>
  
          <div class="action-options"> MOVEMENT OPTIONS </div>
          
          <ul>
            <li><strong>Disengage.</strong> You can spend movement equal to half your Speed to gain the DISENGAGED condition for the rest of your turn. </li>
            <li><strong>Jump.</strong> You can spend 2 Movement to Jump, moving a number of space equal to your MIG.</li>
          </ul>
        `;
      } else if (action === "resist"){
        name = "Resist Action";
        subtitle = "1 Action";
        actionTracker.standard = 1;
        description = `
          <p>Whenever you use the Resist Action, you can remove ${actor.system.recovery.quick} Status Effect on yourself or an adjacent Ally.</p>
        `;
      } else if (action === "reactive"){
        name = "Reactive Strike";
        subtitle = "Reaction • 1/round";
        actionTracker.reaction = 1;
        description = `
          <p><strong>Trigger.</strong> An enemy leave your Zone of Control, or you take damage.</p>
          <p><strong>Effect.</strong> Make a Basic Attack against the enemy that triggered this reaction.</p>
        `;
      } else if (action === "reactDefend"){
        name = "Defend Reaction";
        subtitle = "Reaction • 1/round";
        actionTracker.reaction = 1;
        description = `
          <p><strong>Trigger.</strong> You are targeted by an action or fail a saving throw. </p>
          <p><strong>Effect.</strong> Make a Defend Check with an appropriate Attribute against the triggering save or check. If your Defend Check is greater or equal to the check or save, you are unaffected by the Action.</p>
        `;
      }

      actionDialog = await this.getCombatActionOptions(action, actionType, subtitle, description, actionTracker);
    }

    let attribute = actionDialog.attribute;
    let attributeVal;
    let skillValue = actionDialog.skillValue;

    switch (attribute){
      case "POW":
        attributeVal = actor.system.attributes.pow.value
        break;
      case "DEX":
        attributeVal = actor.system.attributes.dex.value
        break;
      case "INT":
        attributeVal = actor.system.attributes.int.value
        break;
      case "WIL":
        attributeVal = actor.system.attributes.wil.value
        break;
      default:
        attributeVal = actor.system.attributes.pow.value
    }

    if (actionType === "narrative"){
      formula = actor.system.roll + "+" + attributeVal + "+" + skillValue;
    } 
    else if (actionType === "combat") {
      formula = actor.system.roll + "+" + attributeVal;

      if (actionDialog.standard >= 1){
        actorActions.standard -= actionDialog.standard;

        if (actorActions.standard < 0){
          ui.notifications.error("You do not have enough Standard Actions to do this");
          return;
        } else {
          actor.update({"system.actions.standard.value": actorActions.standard});
        }
      }

      if (actionDialog.reaction >= 1){
        actorActions.reaction -= actionDialog.reaction; //0 - 1

        if (actorActions.reaction < 0){
          actor.update({"system.actions.reaction.value": 0});

          actorActions.standard -= (actorActions.reaction * -1);

          if (actorActions.standard < 0){
            ui.notifications.error("You do not have enough Reactions or Standard Actions to do this");
            return;
          } else {
            actor.update({"system.actions.standard.value": actorActions.standard});
          }
        } else {
          actor.update({"system.actions.reaction.value": 0});
        }
      }

      if (actionDialog.quick >= 1){
        actorActions.quick -= actionDialog.quick; //0 - 1

        if (actorActions.quick < 0){
          actor.update({"system.actions.quick.value": 0});

          actorActions.standard -= (actorActions.quick * -1);

          if (actorActions.standard < 0){
            ui.notifications.error("You do not have enough Quick Actions or Standard Actions to do this");
            return;
          } else {
            actor.update({"system.actions.standard.value": actorActions.standard});
          }
        } else {
          actor.update({"system.actions.quick.value": actorActions.quick});
        }
      }
    }

    

    // Invoke the roll and submit it to chat.
    const roll = new Roll(formula, this.getRollData());

    let chatData = {
      speaker: actor.name,
      rollMode: rollMode,
      //flavor: label
    }

    let cardData = {
      ...this.getRollData(),
      actor: this,
      name: name,
      description: description,
      subtitle: subtitle,
      check: roll,
      details: actionDialog
    };

    await roll.evaluate();

    chatData.content = await renderTemplate(this.narrativeTemplate, cardData);
    
    await ChatMessage.applyRollMode(chatData, rollMode)
    ChatMessage.create(chatData);
    return roll;
  }

  /**
   * Add Perks from any Origins equipped on this Actor.
   */
  async _applyOriginPerks() {
    let origins = this.items.filter(i => i.type === "origin");

    // ✅ Step 1: Enforce only one Origin per Actor
    if (origins.length > 1) {
        console.warn("An Actor can only have one Origin. Removing extras...");

        // Keep the first Origin, remove others
        const originsToRemove = origins.slice(1).map(o => o.id);
        await this.deleteEmbeddedDocuments("Item", originsToRemove);

        // ✅ Refresh the origins list after deletion
        origins = [origins[0]];
    }

    // Gather the list of Perk IDs from the single allowed Origin
    // const perksFromOrigins = origins.length ? origins[0].system.perks.map(p => p.id) : [];
    const perksFromOrigins = origins.flatMap(origin => origin.system.perks.map(p => p.id));

    // ✅ Step 2: Track existing Perks added by an Origin
    let existingPerks = this.items.filter(i => i.type === "perk" && i.flags.originId);

    // ✅ Step 3: Remove Perks that are no longer in the Origin (Orphan Perks)
    let orphanPerks = existingPerks.filter(perk => !perksFromOrigins.includes(perk.flags.originId));
    if (orphanPerks.length > 0) {
        console.log(`Removing ${orphanPerks.length} orphaned Perks`);
        await this.deleteEmbeddedDocuments("Item", orphanPerks.map(p => p.id));
        

        // ✅ Refresh Perk list after deletion
        existingPerks = this.items.filter(i => i.type === "perk" && i.flags.originId);
    }

    // ✅ Step 4: Remove duplicate Perks (keep only one copy)
    const seenPerks = new Set();
    const duplicatesToRemove = [];

    for (let perk of existingPerks) {
        if (seenPerks.has(perk.flags.originId)) {
            console.log(`Marking duplicate Perk for removal: ${perk.name}`);
            duplicatesToRemove.push(perk.id);
        } else {
            seenPerks.add(perk.flags.originId);
        }
    }

    if (duplicatesToRemove.length > 0) {
        console.log(`Removing ${duplicatesToRemove.length} duplicate Perks`);
        await this.deleteEmbeddedDocuments("Item", duplicatesToRemove);

        // ✅ Refresh Perk list again after deletion
        existingPerks = this.items.filter(i => i.type === "perk" && i.flags.originId);
    }

    // ✅ Step 5: Add missing Perks from the Origin (if they don't exist already)
    for (let origin of origins) {
      for (let perkData of origin.system.perks) {
        if (!existingPerks.some(i => i.flags.originId === perkData.id)) {
            console.log(`Adding Perk: ${perkData.name} from Origin: ${origins[0].name}`);
            await this.createEmbeddedDocuments("Item", [{
                name: perkData.name,
                type: "perk",
                img: perkData.img,
                system: {
                    rank: {
                        value: perkData.rank.value,
                        one: perkData.rank.one,
                        two: perkData.rank.two,
                        three: perkData.rank.three
                    }
                },
                flags: { originId: perkData.id }
            }]);

            // ✅ Refresh Perk list after adding a new one
            existingPerks = this.items.filter(i => i.type === "perk" && i.flags.originId);
        }
      }
    }
  }

  /**
   * Removes duplicate items from an Actor, keeping only one copy of each item.
   * If an item has `system.quantity`, it merges the quantity into the kept item.
   */
  async removeDuplicateItems(itemTypes = []) {
    const actor = this;
    
    console.log(`(DEBUG) Checking for duplicate items on '${actor.name}'`);

    let itemMap = new Map();
    let duplicatesToRemove = [];

    // Iterate through all items on the actor
    for (let item of actor.items) {
        // If filtering by type, check if item type is allowed
        if (itemTypes.length > 0 && !itemTypes.includes(item.type)) continue;

        // Check if the item name has already been seen
        if (itemMap.has(item.name)) {
            let keptItem = itemMap.get(item.name);

            console.log(`(DEBUG) Duplicate found: '${item.name}'`);

            // If both have quantity, merge the quantities
            if (keptItem.system?.quantity !== undefined && item.system?.quantity !== undefined) {
                console.log(`(DEBUG) Merging quantity: ${keptItem.system.quantity} + ${item.system.quantity}`);
                let newQuantity = keptItem.system.quantity + item.system.quantity;

                // Update the kept item's quantity
                await keptItem.update({ "system.quantity": newQuantity });
            }

            // Mark the duplicate for removal
            duplicatesToRemove.push(item.id);
        } else {
            itemMap.set(item.name, item); // Keep track of the first instance
        }
    }

    // Delete duplicate items
    if (duplicatesToRemove.length > 0) {
        console.log(`(DEBUG) Removing ${duplicatesToRemove.length} duplicate items from '${actor.name}'`);
        await actor.deleteEmbeddedDocuments("Item", duplicatesToRemove);
    } else {
        console.log(`(DEBUG) No duplicates found on '${actor.name}'`);
    }
  }


  /**
   * Handles transferring and removing stored items from an Actor Sheet when needed.
   * - Checks if an item is transferrable from `item-containers.mjs`.
   * - Transfers stored items that meet the conditions.
   * - Removes transferred items when needed.
   */
  async handleStoredItemTransfers(parentItem) {
    if (!parentItem || !parentItem.system.items) return;
    
    const actor = this;
    const itemContainers = new ItemContainers();

    console.log(`Checking transferable items for Parent Item: ${parentItem.name} on Actor: ${actor.name}`);

    // Step 1: Remove orphaned transferred items if the Parent Item was deleted
    if (!actor.items.some(i => i.id === parentItem.id)) {
        console.log(`Parent Item '${parentItem.name}' removed. Deleting all transferred items.`);
        let transferredItems = actor.items.filter(i => i.flags?.parentItemId === parentItem.id);
        if (transferredItems.length > 0) {
            await actor.deleteEmbeddedDocuments("Item", transferredItems.map(i => i.id));
        }
        return; // No need to continue since the Parent Item is gone
    }

    // Step 2: Iterate through stored items in the Parent Item
    for (let [storedItemId, storedItem] of Object.entries(parentItem.system.items)) {
        if (!storedItem) continue; // Skip null or undefined stored items

        // Check if the item should be transferred
        let shouldTransfer = false;

        // If the Parent Item is a Path, only transfer Traits with `flags.storyforge.transfer = true`
        if (parentItem.type === "path" && storedItem.type === "trait") {
            shouldTransfer = storedItem.flags?.storyforge?.transfer === true;
        }
        // Otherwise, check if the stored item type is allowed for transfer
        else if (itemContainers.transferrableItems[parentItem.type]?.includes(storedItem.type)) {
            shouldTransfer = true;
        }

        // If transfer conditions are not met, check if we need to remove an already transferred item
        console.log(storedItem.name)
        let existingItem = actor.items.find(i => i.name === storedItem.name);
        if (!shouldTransfer && existingItem) {
            console.log(`Removing '${storedItem.name}' as it is no longer transferable.`);
            await actor.deleteEmbeddedDocuments("Item", [existingItem.id]);
            continue;
        }

        // If transfer is allowed and item does not already exist, transfer it
        if (shouldTransfer && !existingItem) {
            console.log(`Transferring '${storedItem.name}' to '${actor.name}'.`);
            await actor.createEmbeddedDocuments("Item", [{
                name: storedItem.name,
                type: storedItem.type,
                img: storedItem.img,
                system: storedItem.system,
                flags: { parentItemId: parentItem.id, storedItemId: storedItemId }
            }]);
        }
    }

    // Step 3: Remove orphaned transferred items that were removed from the Parent Item
    let orphanedItems = actor.items.filter(i => i.flags?.parentItemId === parentItem.id && !parentItem.system.items[i.flags.storedItemId]);
    if (orphanedItems.length > 0) {
        console.log(`Removing ${orphanedItems.length} orphaned transferred items from '${actor.name}'.`);
        await actor.deleteEmbeddedDocuments("Item", orphanedItems.map(i => i.id));
    }
  }

}

/* Hooks.on("updateActor", async (actor, changes, options, userId) => {
  console.log(`(DEBUG) Actor '${actor.name}' updated, checking for duplicates.`);
  await actor.removeDuplicateItems(); // Runs for all item types
}); */