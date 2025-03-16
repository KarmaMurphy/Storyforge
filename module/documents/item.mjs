/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class StoryforgeItem extends Item {

  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
    this.storedItemsCleanUp();
    const itemData = this;
    const actorData = this.actor;

    this._prepareActionData(itemData);
    this._prepareGearData(itemData, actorData);
    this._prepareBasicData(itemData);
    this._prepareSkillData(itemData);
    this._preparePerkData(itemData);
    this._prepareBondData(itemData);
    this._prepareTagData(itemData);

    if (itemData.type === "origin") {
      this._prepareOriginData(itemData, actorData);
    }

    if (itemData.type === "path") {
      this._calculatePathRank(itemData, actorData);
    }
  }

    /**
   * Prepare Character type specific data
   */
  _prepareActionData(itemData) {
    if (itemData.type !== 'ability') return;
    const systemData = itemData.system;

    let rank = systemData.rank;
    let base = rank;
    let newSP;
    let spTotal;
    systemData.tags = systemData.tags || {};
    //let tagTotal = Number(systemData.tag1.value) + Number(systemData.tag2.value) + Number(systemData.tag3.value) + Number(systemData.tag4.value) + Number(systemData.tag5.value) + Number(systemData.tag6.value) + Number(systemData.tag7.value) + Number(systemData.tag8.value) + Number(systemData.tag9.value) + Number(systemData.tag10.value) + Number(systemData.tag11.value) + Number(systemData.tag12.value);
    //console.log(tagTotal);
    //let sp = base + tagTotal;

    systemData.rankMod = rank * 2;

    // systemData.formula = "@actor.roll + @actor.key.mod +  @rankMod + @check.bonus"

    let rollCheck = systemData.check.value;
    let damageCheck = systemData.damage.value;
    if (rollCheck === "check" || rollCheck === "barrage" || rollCheck === "true" || damageCheck === "true"){
      systemData.showRoll = true;
    }

    // if (rank < 1){
    //   base = 1;
    //   sp = 1 + Number(tagTotal); //if rank is 0, SP = 1 + Tag Total.
    // } else {
    //   sp = base + Number(tagTotal); //if rank is greater than 0, SP = Rank + Tag Total.
    // }
    
    // if (sp <= base){
    //   systemData.sp = base;
    // } else {
    //   systemData.sp = sp;
    // }

  }

  _prepareGearData(itemData, actorData) {
    if (itemData.type !== 'item') return;
    const systemData = itemData.system;

    /* if (systemData.type === "Armor" || systemData.type === "Accessory"){
      systemData.actions.standard.value = 0;
    } */

    let mastery = itemData.system.mastery;
    switch (systemData.mastery.rank){
      case "Trained": 
        mastery.value = 2;
        break;
      case "Adept": 
        mastery.value = 4;
        break;
      case "Expert": 
        mastery.value = 6;
        break;
      case "Master": 
        mastery.value = 8;
        break;
      case "Legend": 
        mastery.value = 10;
        break;
      case "Artillery": 
        mastery.value = "@actor.masteries.artillery.value";
        break;
      case "Axes": 
        mastery.value = "@actor.masteries.axes.value";
        break;
      case "Blades": 
        mastery.value = "@actor.masteries.blades.value";
        break;
      case "Blunt": 
        mastery.value = "@actor.masteries.blunt.value";
        break;
      case "Bows": 
        mastery.value = "@actor.masteries.bows.value";
        break;
      case "Brawling": 
        mastery.value = "@actor.masteries.brawling.value";
        break;
      case "Energy": 
        mastery.value = "@actor.masteries.energy.value";
        break;
      case "Polearms": 
        mastery.value = "@actor.masteries.polearms.value";
        break;
      case "Shields": 
        mastery.value = "@actor.masteries.shields.value";
        break;
      case "Whips": 
        mastery.value = "@actor.masteries.whips.value";
        break;
      default:
        systemData.mastery.value = 0;
    }

    let rollCheck = systemData.check.value;
    let damageCheck = systemData.damage.value;
    if (rollCheck === "check" || rollCheck === "barrage" || rollCheck === "true" || damageCheck === "true"){
      systemData.showRoll = true;
      //console.log(itemData.name + ": " + systemData.showRoll);
    }

    if (systemData.type === "Weapon" || systemData.type === "Shield" || systemData.type === "Armor" || systemData.type === "Accessory"){
      systemData.equippable = true;
    }

    if (systemData.type === "Weapon" || systemData.type === "Shield"){
      systemData.holdable = true;
    }

    // systemData.formula = "@actor.roll + @actor.key.mod + "+ mastery.value +" + @check.bonus";
  }

  _prepareBasicData(itemData) {
    if (itemData.type !== 'basic') return;
    const systemData = itemData.system;
    systemData.actions.reaction.value = 0;

    let mastery = itemData.system.mastery;
    itemData.system.mastery.value = mastery.value;
    switch (systemData.mastery.rank){
      case "Trained": 
        mastery.value = 2;
        break;
      case "Adept": 
        mastery.value = 4;
        break;
      case "Expert": 
        mastery.value = 6;
        break;
      case "Master": 
        mastery.value = 8;
        break;
      case "Legend": 
        mastery.value = 10;
        break;
      case "Artillery": 
        mastery.value = "@actor.masteries.artillery.value";
        break;
      case "Axes": 
        mastery.value = "@actor.masteries.axes.value";
        break;
      case "Blades": 
        mastery.value = "@actor.masteries.blades.value";
        break;
      case "Blunt": 
        mastery.value = "@actor.masteries.blunt.value";
        break;
      case "Bows": 
        mastery.value = "@actor.masteries.bows.value";
        break;
      case "Brawling": 
        mastery.value = "@actor.masteries.brawling.value";
        break;
      case "Energy": 
        mastery.value = "@actor.masteries.energy.value";
        break;
      case "Polearms": 
        mastery.value = "@actor.masteries.polearms.value";
        break;
      case "Shields": 
        mastery.value = "@actor.masteries.shields.value";
        break;
      case "Whips": 
        mastery.value = "@actor.masteries.whips.value";
        break;
      default:
        systemData.mastery.value = 0;
    }

    let rollCheck = systemData.check.value;
    let damageCheck = systemData.damage.value;
    if (rollCheck === "true" || damageCheck === "true"){
      systemData.showRoll = true;
    }
  }

  _prepareSkillData(itemData) {
    if (itemData.type !== 'skill') return;
    const systemData = itemData.system;

    systemData.formula = "@actor.roll + @actor.sKey + @mastery.value"

    let mastery = itemData.system.mastery;
    let points = mastery.points;
    let trained = mastery.trained;

    let actual = +points + +trained;
    if (actual > 5){
      actual = 5;
    }

    itemData.system.mastery.actual = actual;

    switch (itemData.system.mastery.actual){
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

  _preparePerkData(itemData) {
    if (itemData.type !== 'perk') return;
    const systemData = itemData.system;
    let rank = +systemData.rank.value;
    let one = systemData.rank.one;
    let two = systemData.rank.two;
    let three = systemData.rank.three;

    if (rank === 1){
      systemData.rank.desc = one;
    } else if (rank === 2){
      systemData.rank.desc = two;
    } else if (rank === 3){
      systemData.rank.desc = three;
    }
  }

  _prepareBondData(itemData) {
    if (itemData.type !== 'bond') return;
    const systemData = itemData.system;
    let rank = +systemData.rank
    let bonus = rank * 2;
    //console.log("Rank " + rank + " | +" + bonus)

    itemData.system.bonus = bonus;
  }

  _prepareOriginData(itemData, actorData) {
    if (!this.system.perks) {
      this.update({"system.perks": []});
    }
  }

  _prepareTagData(itemData){
    if (itemData.type !== 'tag') return;
    const systemData = itemData.system;
    
  }

  /**
   * Cleans up system.items by removing any entries that are set to null.
   */
  storedItemsCleanUp() {
    if (!this.system.items) return;

    for (let itemId in this.system.items) {
        if (this.system.items[itemId] === null || typeof this.system.items[itemId] !== "object") {
            delete this.system.items[itemId]; // Directly deletes from the object
        }
    }
  }

  /**
   * Updates the Path's system.rank based on the highest rank of active Traits.
   */
  _calculatePathRank(itemData, actorData) {
    if (!itemData.system.items) return;

    let highestActiveRank = 0;

    for (let [_, trait] of Object.entries(itemData.system.items)) {
        if (trait.type === "trait" && trait.flags?.storyforge?.transfer) {
            highestActiveRank = Math.max(highestActiveRank, trait.system.rank);
        }
    }

    // Update the Path’s system.rank
    if (itemData.system.rank !== highestActiveRank) {
        this.update({ "system.rank": highestActiveRank });
    }

    // Determine maxRank for activation based on actor's level
    if (actorData) {
        let level = actorData.system.level;
        let maxRank = 1;

        if (level >= 5 && itemData.system.rank >= 1) maxRank = 2;
        if (level >= 9 && itemData.system.rank >= 2) maxRank = 3;

        this.update({ "system.maxRank": maxRank });
    }
  }

  /**
   * Add a Perk to an Origin's stored Perks array.
   * @param {Item} perk The perk being added.
   */
  async addPerk(perk) {
    if (this.type !== "origin") return;
    const newPerkEntry = {
      id: perk.id,
      name: perk.name,
      img: perk.img,
      rank: {
        value: perk.system.rank.value,
        one: perk.system.rank.one,
        two: perk.system.rank.two,
        three: perk.system.rank.three
      }
    };
    await this.update({"system.perks": [...this.system.perks, newPerkEntry]});
  }

  /**
   * Remove a Perk from an Origin.
   * @param {string} perkId The ID of the perk to remove.
   */
  async removePerk(perkId) {
    if (this.type !== "origin") return;
    const perkID = perkId[0].dataset.perkId;
    const newPerks = this.system.perks.filter(perk => perk.id !== perkID);
    await this.update({"system.perks": newPerks});
  }

  /**
   * Open the stored Perk in a Sheet.
   * @param {string} perkId The ID of the perk to open.
   */
  async openPerk(perkId) {
    console.log(perkId[0].dataset.perkId);
    const perkID = perkId[0].dataset.perkId;
    const perk = game.items.get(perkID);
    if (perk) {
      perk.sheet.render(true);
    } else {
      ui.notifications.warn("Perk not found in the game.");
    }
  }

  /**
   * Hook into item updates to ensure Perks inside Origins are updated.
   */
  static async onUpdatePerk(perk, updates, options, userId) {
    if (perk.type !== "perk") return;

    // Find all Origins that contain this Perk
    const origins = game.items.filter(item => 
        item.type === "origin" && item.system.perks.some(p => p.id === perk.id)
    );

    if (origins.length === 0) return;

    for (let origin of origins) {
        const updatedPerks = origin.system.perks.map(p => {
            if (p.id === perk.id) {
                return {
                    ...p,
                    name: updates.name || p.name,  // Update Name if changed
                    img: updates.img || p.img,  // Update IMG if changed
                    rank: {
                        value: updates["system.rank.value"] ?? p.rank.value,
                        one: updates["system.rank.one"] ?? p.rank.one,
                        two: updates["system.rank.two"] ?? p.rank.two,
                        three: updates["system.rank.three"] ?? p.rank.three
                    }
                };
            }
            return p;
        });

        // Update the Origin's perks
        await origin.update({ "system.perks": updatedPerks });

        console.log(`Updated Perk ${perk.name} inside Origin ${origin.name}`);
    }
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @override
   */
  getRollData() {
    // Starts off by populating the roll data with `this.system`
    const rollData = {...super.getRollData()};

    // Quit early if there's no parent actor
    if (!this.actor) return rollData;

    // If present, add the actor's roll data
    rollData.actor = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.system);

    return rollData;
  }

  chatTemplate = {
    "ability": "systems/storyforge/templates/chat/chat-item-roll.hbs",
    "basic": "systems/storyforge/templates/chat/chat-item-roll.hbs",
    "item": "systems/storyforge/templates/chat/chat-item-roll.hbs",
    "trait": "systems/storyforge/templates/chat/chat-item-roll.hbs",
    "tracker": "systems/storyforge/templates/chat/chat-action.hbs",
    "perk": "systems/storyforge/templates/chat/chat-item-roll.hbs",
    "skill": "systems/storyforge/templates/chat/chat-skill-roll.hbs",
    "specialization": "systems/storyforge/templates/chat/chat-special.hbs",
  };

  async getCombatActionOptions(item, type, tracker){

    const cardData = {
      ...this.getRollData(),
      item: this,
      type: type,
      tracker: tracker,
      name: item.name,
    }

    const myContent = await renderTemplate("systems/storyforge/templates/dialog/dialog-advance-actions.hbs", cardData);

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

  _processCombatActionOptions(form) {
    let reactionSum = 0;
    let reactionCheck;
    let standardSum = 0;
    let standardCheck;
    let quickSum = 0;
    let quickCheck;
    let spConsume;
    let damageDie = `${form.bonusDamageValue.value}`+`${form.bonusDamageFace.value}`;
    console.log(damageDie);

    if (this.type === "ability") {
      spConsume = form.querySelector(`input[name="spToggle"]`).checked;
    }

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
      reaction: reactionSum,
      standard: standardSum,
      quick: quickSum,
      check: form.checkBonus.value,
      save: form.saveBonus.value,
      damage: form.damageBonus.value,
      die: damageDie,
      spConsume: spConsume
    }
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this;
    const type = item.type;
    let name;
    let actionTracker = {
      reaction: 0,
      standard: 0,
      quick: 0
    };
    let itemActions = {
      reaction: item.system.actions.reaction.value,
      standard: item.system.actions.standard.value,
      quick: item.system.actions.quick.value
    }
    let actorActions = {
      reaction: this.actor.system.actions.reaction.value,
      standard: this.actor.system.actions.standard.value,
      quick: this.actor.system.actions.quick.value
    }
    let actionDialog =  {
      reaction: item.system.actions.reaction.value,
      standard: item.system.actions.standard.value,
      quick: item.system.actions.quick.value,
      check: 0,
      save: 0,
      damage: 0,
      die: 0,
      spConsume: true
    };

    if (!event.shiftKey && !event.ctrlKey){
      if (type === "ability" || type === "item" && item.system.type !== "Armor" && item.system.type !== "Accessory" || type === "basic" ){
          
        console.log(item.system.type)
        actionDialog = await this.getCombatActionOptions(item, type, itemActions);

      }
    }

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `Rolling ${item.name}`;
    const formula = this.system.formula;
    let damage = this.system.damage;

    const actor = this.actor;
    //let damage = this.system.damage.roll;
    let targets = await Array.from(game.user.targets)
    let targetDeflect = targets.map(a => a.actor.system.def.bonus);
    let special;

    let dieOne = damage.die.one.num + "d" + damage.die.one.face;
    let critOne = damage.die.one.num * damage.die.one.face;
    let dieTwo;
    let critTwo;
    let dieThree;
    let critThree;
    if (damage.die.two.num >= 1){
      dieTwo = damage.die.two.num + "d" + damage.die.two.face;
      critTwo = damage.die.two.num * damage.die.two.face;
    } else {
      dieTwo = 0;
      critTwo = 0;
    }
    if (damage.die.three.num >= 1){
      dieThree = damage.die.three.num + "d" + damage.die.three.face;
      critThree = damage.die.three.num * damage.die.three.face;
    } else {
      dieThree = 0;
      critThree = 0;
    }

    const damageFormula = dieOne + "+" + damage.bonus + "+" + damage.stat + "+" + actionDialog.damage + "+" + dieTwo + "+" + dieThree + "+" + actionDialog.die;
    // const critFormula = critOne + critTwo + critThree + +damage.bonus + " + " + actor.system.critDamage.value + "d8 + " + damage.stat;
    const critFormula = actor.system.critDamage.value + "d8";
    console.log("Roll: " + damageFormula + ", Crit: " + critFormula);
    
    

    console.log("Deflect: " + targetDeflect);

    // If there's no roll data, send a chat message.
    if (!formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: "systems/storyforge/templates/chat/chat-item-roll.hbs" ?? '',
      });

    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();
      // Invoke the roll and submit it to chat.
      const positive = actor.system.statuses.positive;
      const negative = actor.system.statuses.negative;
      const bolstered = positive.bolstered.tier;
      const shaken = negative.shaken.tier;
      const slowed = actionDialog.reaction >= 1 ? negative.slowed.tier : 0; 
      const hasted = actionDialog.reaction >= 1 ? positive.hasted.tier : 0;
      let statusBonus = Math.max(bolstered, hasted);
      let statusPenalty = Math.max(shaken, slowed)

      console.log(bolstered, shaken, slowed, hasted, statusBonus, statusPenalty);

      
      let newFormula = `${formula} + ${actionDialog.check} + ${statusBonus} - ${statusPenalty}`
      const roll = new Roll(newFormula, rollData);
      const damageRoll = new Roll(damageFormula, rollData);
      const crit = new Roll(critFormula, rollData);
      console.log(roll);
      let newActionTracker = {
        standard: actionDialog.standard,
        reaction: actionDialog.reaction,
        quick: actionDialog.quick,
      }

      let chatData = {
        speaker: speaker,
        rollMode: rollMode,
        sound: "",
        //flavor: label
      }

      let cardData = {
        ...this.getRollData(),
        item: this,
        actor: actor,
        checkRoll: roll,
        damageRoll: damageRoll,
        targets: targets,
        targetDeflect: targetDeflect,
        special: special,
        crit: crit,
        tracker: newActionTracker,
      };

      //console.log(this.actor);

      if (!event.ctrlKey){
        if (type === "ability" || type === "item" && item.system.type !== "Armor" && item.system.type !== "Accessory" || type === "basic" ){
          if (actionDialog.standard >= 1){
            console.log(actorActions, actionDialog)
            actorActions.standard -= actionDialog.standard;
            console.log(actorActions);
      
            if (actorActions.standard < 0){
              ui.notifications.error("You do not have enough Standard Actions to do this");
              return;
            }/*  else {
              actor.update({"system.actions.standard.value": actorActions.standard});

            } */
          }
      
          if (actionDialog.reaction >= 1){
            actorActions.reaction -= actionDialog.reaction; //0 - 1
            console.log(actorActions);
      
            if (actorActions.reaction < 0){
              // actor.update({"system.actions.reaction.value": 0});
      
              actorActions.standard -= (actorActions.reaction * -1);
              actorActions.reaction = 0;
              console.log(actorActions);
      
              if (actorActions.standard < 0){
                ui.notifications.error("You do not have enough Reactions or Standard Actions to do this");
                return;
              }/*  else {
                actor.update({"system.actions.standard.value": actorActions.standard});
              } */
            }/*  else {
              actor.update({"system.actions.reaction.value": 0});
            } */
          }
      
          if (actionDialog.quick >= 1){
            actorActions.quick -= actionDialog.quick; //0 - 1
            console.log(actorActions);
      
            if (actorActions.quick < 0){
              actor.update({"system.actions.quick.value": 0});
      
              actorActions.standard -= (actorActions.quick * -1);
              actorActions.quick = 0;
              console.log(actorActions);
      
              if (actorActions.standard < 0){
                ui.notifications.error("You do not have enough Quick Actions or Standard Actions to do this");
                return;
              }/* else {
                actor.update({"system.actions.standard.value": actorActions.standard});
              } */
            }/* else {
              actor.update({"system.actions.quick.value": actorActions.quick});
            } */
          }

          /* let updateActions = await game.system.socket.executeAsGM("updateActions", actor.id, actionDialog, actorActions, game.user.id);
          console.log(updateActions)
          if (actorActions.standard < 0 || updateActions < 0){
            return;
          } */
        }
      }

      let spirit = actor.system.spirit.value;
      let cost = this.system.sp;
      let newSP = spirit - cost;

      if (actionDialog.spConsume && this.type === "ability" && !event.ctrlKey){

        /* if (newSP > 0){
          actor.update({
            "system.spirit.value": newSP,
            "system.spirit.edit": newSP
          });
        } else  */if ( newSP <= 0){
          newSP = 0;
          //actor.update({"system.spirit.value": 0});
        }
      }

      

      console.log(actorActions, actor, actor.isToken);
      if (!actor.isToken){
        await game.system.socket.executeAsGM("updateActor", actor.uuid, actorActions, newSP, false);
      } else {
        console.log("TOKEN");
        await game.system.socket.executeAsGM("updateActor", actor.token.uuid, actorActions, newSP, true);
      }
      
      /* actor.update({
        "system.actions.standard.value": actorActions.standard,
        "system.actions.reaction.value": actorActions.reaction,
        "system.actions.quick.value": actorActions.quick,
        "system.spirit.value": newSP,
        "system.spirit.edit": newSP
      }) */

      if (event.ctrlKey && this.type === "ability") {
        console.log("Array Name: " + this.chatTemplate[this.type])
        this.chatTemplate[this.type] = "systems/storyforge/templates/chat/chat-roll.hbs";
        console.log("New Array Name: " + this.chatTemplate[this.type])
      } else if (this.type === "ability") {
        this.chatTemplate[this.type] = "systems/storyforge/templates/chat/chat-item-roll.hbs";
      }

      if (this.type === "item"){
        let charges = this.system.charges.value;
        let qt = this.system.quantity;
        let newCharges = Number(charges) - 1;
        let newQT = Number(qt) - 1;

        if (event.shiftKey && this.system.charges.value >= 1){
          if (newCharges <= 0 && newQT > 0 && this.system.type == "Consumable"){ // If the new Charges is less than or equal to 0 and the new QT is more than 0,
            newCharges = this.system.charges.max;

            this.update({"system.charges.value": newCharges}); // Set Charges to Charges Max
            this.update({"system.quantity": newQT}); // Subtract 1 from Quantity

          } else if (newCharges <= 0 && newQT == 0 && this.system.type == "Consumable"){ // If the new Charges is less than or equal to 0 and the new QT is equal to 0,
            this.update({"system.charges.value": newCharges}); // Subtract 1 from Charges
            this.update({"system.quantity": newQT}); // Subtract 1 from Quantity

          } else if (newCharges >= 0) {
            this.update({"system.charges.value": newCharges});
          }
        } else if (event.shiftKey && this.system.charges.value <= 0){
          if (qt > 0 && this.system.type == "Consumable"){
            this.update({"system.quantity": newQT});
          }
        }
      }

      if (this.type === "specialization"){
        const element = this.currentTarget;
        //const dataset = element.dataset;
        console.log(element);
        console.log(dataset);

        const specialRank = element.closest('.specialization');//.dataset.specialRank;
        console.log(specialRank);

        if (specialRank === "one"){
          special = this.system.tier.one;
          return special;
        } else if (specialRank === "two") {
          special = this.system.tier.two;
          return special;
        } else if (specialRank === "three") {
          special = this.system.tier.three;
          return special;
        }
      }

      //console.log(this.actor.getRollData())
      await roll.evaluate();
      await crit.evaluate();
      await damageRoll.evaluate();

      console.log(damageRoll);
      console.log(crit);
      
      console.log(roll.terms[0].results);
      chatData.content = await renderTemplate(this.chatTemplate[this.type], cardData);

      // If you need to store the value first, uncomment the next line.
      // const result = await roll.evaluate();
      roll.toMessage(chatData);
      return roll;
    }
  }

  async specialRoll(specialRank) {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `Rolling ${item.name}`;
    const formula = this.system.formula;
    const actor = this.actor;
    let rank = specialRank;
    console.log(rank);
    let special;
    let newRank;

    if (rank === "one"){
      special = this.system.tier.one;
      newRank = "Rank 1";
    } else if (rank === "two"){
      special = this.system.tier.two;
      newRank = "Rank 2";
    } else if (rank === "three"){
      special = this.system.tier.three;
      newRank = "Rank 3";
    }

    console.log(special);
  
    // Retrieve roll data.
    const rollData = this.getRollData();

    // Invoke the roll and submit it to chat.
    const roll = new Roll(formula, rollData);
    let chatData = {
      speaker: speaker,
      rollMode: rollMode,
    }

    let cardData = {
      ...this.getRollData(),
      item: this,
      actor: actor,
      special: special,
      rank: newRank,
    };

    //console.log(this.actor.getRollData())
    await roll.evaluate();
    chatData.content = await renderTemplate(this.chatTemplate[this.type], cardData);

    // If you need to store the value first, uncomment the next line.
    // const result = await roll.evaluate();
    roll.toMessage(chatData);
    return roll;
  }

  async GetSkillCheckOptions(skillType){
    const item = this;
    const actor = this.actor;
    const template = `
      <form class="storyforge">
        <div class="dialog-box">
          <div class="chat-header">
              <div class="chat-img">
                  <img src="${actor.img}" title="${item.name}" class="chat-img">
              </div>
              <div class="chat-titles">
                  <span class="chat-title">Rolling: ${item.name}</span>
                  <span class="chat-subtitle">
                    <select name="attribute" class="storyforge-select">
                      <option>POW</option>
                      <option>DEX</option>
                      <option>INT</option>
                      <option>WIL</option>
                    </select>
                    Skill Check Attribute?
                  </span>
              </div>
          </div>
        </div>
    </form>
  `;

    return new Promise(resolve => {
      const data = {
        title:"Skill Check",
        content: template,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d20"></i>',
            label: "Roll",
            callback: html => resolve(this._processSkillCheck(html[0].querySelector("form")))
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
            callback: () => close
          }
        },
        default: "roll"
      }

      new Dialog(data, null).render(true);
    });

  }

  _processSkillCheck(form) {
    return {
      attribute: form.attribute.value
    }
  }

  async skillRoll(event) {
    const item = this;
    const actor = this.actor;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `Rolling ${item.name}`;
    // const formula = this.system.formula;
    

    let skillDialog = await this.GetSkillCheckOptions();
    let attribute = skillDialog.attribute;
    let attributeVal;
    console.log(attribute);

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
    
    const formula = actor.system.roll + "+" + attributeVal + "+" + item.system.mastery.value;

    // If there's no roll data, send a chat message.
    if (!formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: "systems/storyforge/templates/chat/chat-action.hbs" ?? '',
      });

    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(formula, rollData);
      console.log(roll);
      let chatData = {
        speaker: speaker,
        rollMode: rollMode,
        //flavor: label
      }

      let cardData = {
        ...this.getRollData(),
        item: this,
        actor: actor,
        attribute: attribute,
        check: roll,
      };

      //console.log(this.actor);

      //console.log(this.actor.getRollData())
      await roll.evaluate();
      
      console.log(roll.terms[0].results);
      chatData.content = await renderTemplate(this.chatTemplate[this.type], cardData);

      // If you need to store the value first, uncomment the next line.
      // const result = await roll.evaluate();
      roll.toMessage(chatData);
      return roll;
    }
  }

  async traitRoll(dataset) {
    const item = this;
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const actor = this.actor;
    
    console.log(dataset);
    
    const rollData = this.getRollData();

    // Invoke the roll and submit it to chat.

    let chatData = {
      speaker: speaker,
      rollMode: rollMode,
      //flavor: label
    }

    let cardData = {
      ...this.getRollData(),
        item: this,
        actor: actor,
    };

    chatData.content = await renderTemplate(this.chatTemplate[this.type], cardData);

    console.log(chatData);
    await ChatMessage.applyRollMode(chatData, rollMode)
    ChatMessage.create(chatData);
  }

  async perkRoll(dataset) {
    const item = this;
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const actor = this.actor;
    let desc;

    /* if (item.system.rank.value = 1){
      desc = item.system.rank.one;
    } else if (item.system.rank.value = 2){
      desc = item.system.rank.two;
    } else if (item.system.rank.value = 3){
      desc = item.system.rank.three;
    } */
    
    console.log(dataset);
    // Invoke the roll and submit it to chat.

    let chatData = {
      speaker: speaker,
      rollMode: rollMode,
      //flavor: label
    }

    let cardData = {
      ...this.getRollData(),
        item: this,
        actor: actor
    };

    chatData.content = await renderTemplate(this.chatTemplate[this.type], cardData);

    console.log(chatData);
    await ChatMessage.applyRollMode(chatData, rollMode)
    ChatMessage.create(chatData);
  }
 
}



/**
 * Listens for clicks on stored tags in chat and opens a read-only dialog box.
 */
Hooks.on("renderChatMessage", (app, html, data) => {
  html.find(".show-tag").on("click", async (event) => {
      event.preventDefault();
      console.log("TRIGGERED!");

      const tagId = event.currentTarget.dataset.tagId;
      const parentId = event.currentTarget.dataset.parentId;
      const actorId = event.currentTarget.dataset.actorId;
      
      // Get the actor that owns the item
      const actor = game.actors.get(actorId);
      if (!actor) {
          console.warn(`Actor with ID ${actorId} not found.`);
          return;
      }

      // Find the parent item within the actor's embedded items
      const parentItem = actor.items.get(parentId);
      if (!parentItem) {
          console.warn(`Parent item with ID ${parentId} not found in actor ${actor.name}.`);
          return;
      }

      // Find the stored tag inside the parent's system.items
      if (!parentItem.system.items || !parentItem.system.items[tagId]) {
          console.warn(`Tag with ID ${tagId} not found in parent item ${parentItem.name}.`);
          return;
      }

      // Duplicate the stored tag for display
      const storedTag = foundry.utils.duplicate(parentItem.system.items[tagId]);
      openReadOnlyTagDialog(storedTag);
  });
});


/**
 * Opens a read-only dialog for a stored tag item.
 */
async function openReadOnlyTagDialog(tag) {
  const templatePath = `systems/storyforge/templates/item/item-${tag.type}-sheet.hbs`;

  // Render the template with read-only fields
  tag.system.descriptionHTML = await TextEditor.enrichHTML(tag.system.description, {async: true, documents: true});
  const content = await renderTemplate(templatePath, { item: tag, system: tag.system });
  const dialogOptions = {
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
  } 

  // Make all inputs readonly
  const modifiedContent = content.replace(/<input /g, '<input readonly ')
                                 .replace(/<textarea /g, '<textarea readonly ')
                                 .replace(/<select /g, '<select disabled ');

  new Dialog({
    title: `Viewing: ${tag.name}`,
    content: modifiedContent,
    buttons: {}, // No buttons, auto-saves on close
    close: () => {}
  }, dialogOptions).render(true);
}

Hooks.once("socketlib.ready", () => {
  game.system.socket = socketlib.registerSystem('storyforge');
  game.system.socket.register("updateSP", async (actorId, newSP, userId) => {
    const actor = fromUuidSync(actorId);

    if (newSP > 0){
      actor.update({
        "system.spirit.value": newSP,
        "system.spirit.edit": newSP
      });
    } else if ( newSP <= 0){
      actor.update({"system.spirit.value": 0});
    }
  });

  game.system.socket.register("updateActions", async (actorId, actionDialog, actorActions, userId) => {
    const actor = game.actors.get(actorId);

    if (actionDialog.standard >= 1){
      console.log(actorActions, actionDialog)
      actorActions.standard -= actionDialog.standard;
      console.log(actorActions);

      if (actorActions.standard < 0){
        ui.notifications.error("You do not have enough Standard Actions to do this");
        return actorActions.standard;
      } else {
        actor.update({"system.actions.standard.value": actorActions.standard});
      }
    }

    if (actionDialog.reaction >= 1){
      actorActions.reaction -= actionDialog.reaction; //0 - 1
      console.log(actorActions);

      if (actorActions.reaction < 0){
        actor.update({"system.actions.reaction.value": 0});

        actorActions.standard -= (actorActions.reaction * -1);
        console.log(actorActions);

        if (actorActions.standard < 0){
          ui.notifications.error("You do not have enough Reactions or Standard Actions to do this");
          return actorActions.standard;
        } else {
          actor.update({"system.actions.standard.value": actorActions.standard});
        }
      } else {
        actor.update({"system.actions.reaction.value": 0});
      }
    }

    if (actionDialog.quick >= 1){
      actorActions.quick -= actionDialog.quick; //0 - 1
      console.log(actorActions);

      if (actorActions.quick < 0){
        actor.update({"system.actions.quick.value": 0});

        actorActions.standard -= (actorActions.quick * -1);
        console.log(actorActions);

        if (actorActions.standard < 0){
          ui.notifications.error("You do not have enough Quick Actions or Standard Actions to do this");
          return actorActions.standard;
        } else {
          actor.update({"system.actions.standard.value": actorActions.standard});
        }
      } else {
        actor.update({"system.actions.quick.value": actorActions.quick});
      }
    }
  });

  game.system.socket.register("updateActor", async (actorId, actorActions, newSP, isToken) => {
    let actor = fromUuidSync(actorId);
    if (!actor) return;
    console.log(actor);

    if (isToken){
      actor = actor.sheet.actor;
    }

    actor.update({
      "system.actions.standard.value": actorActions.standard,
      "system.actions.reaction.value": actorActions.reaction,
      "system.actions.quick.value": actorActions.quick,
      "system.spirit.value": newSP,
      "system.spirit.edit": newSP
    })

    console.log(actor, actor.system.spirit);
  });
});