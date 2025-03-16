export class StoryforgeCombat extends Combat {

  _sortCombatants(a, b){
    const ia = Number.isNumeric(a.initiative) ? a.initiative : -Infinity;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -Infinity;

    let initDifference = ib - ia;
    if (initDifference != 0) {
      return initDifference
    }
    

    const typeA = a.actor.type;
    const typeB = b.actor.type;

    if (typeA != typeB) {
      if (typeA == "character") {
        return -1;
      }

      if (typeB == "character") {
        return 1;
      }
    }

    return a.tokenId - b.tokenId;
  }

  /**
   * Return the Array of combatants sorted into initiative order, breaking ties alphabetically by name.
   * @returns {Combatant[]}
   */
  setupTurns() {
    this.turns ||= [];
    //console.log(this)

    // Determine the turn order and the current turn
    const turns = this.combatants.contents.sort(this._sortCombatants);
    if ( this.turn !== null) this.turn = Math.clamp(this.turn, 0, turns.length-1);

    // Update state tracking
    let c = turns[this.turn];
    this.current = this._getCurrentState(c);

    // One-time initialization of the previous state
    if ( !this.previous ) this.previous = this.current;

    // Return the array of prepared turns
    return this.turns = turns;
  }

  async _onStartTurn(combatant) {
    console.log(combatant);
    if (!combatant?.actor) return;
    const actor = combatant.actor;
    const statuses = actor.system.statuses;
    const statusPositive = statuses.positive;
    const statusNegative = statuses.negative;

    for(let [key, status] of Object.entries(statusPositive)){
      if (status.active && !status.persistent && status.duration >= 0){
        let durationField = `system.statuses.positive.${key}.duration`;
        let durationValue = status.duration -= 1;

        await combatant.actor.update({
          [durationField]: durationValue,
        })
      }
    }

    for(let [key, status] of Object.entries(statusNegative)){
      if (status.active && !status.persistent && status.duration >= 0){
        let durationField = `system.statuses.negative.${key}.duration`;
        let durationValue = status.duration -= 1;

        await combatant.actor.update({
          [durationField]: durationValue,
        })
      }
    }
  }
  

  async _onEndTurn(combatant) {
    console.log(combatant);
    if (!combatant?.actor) return;
    const actor = combatant.actor;
    const statuses = actor.system.statuses;
    const statusPositive = statuses.positive;
    const statusNegative = statuses.negative;

    for(let [key, status] of Object.entries(statusPositive)){
      if (status.active && !status.persistent){
        if (status.duration <= 0){
          let activeState = !status.active;
          let activeField = `system.statuses.positive.${key}.active`;
          
          ui.notifications.info(`The ${key} status has ended on ${actor.name}`)
          await actor.toggleStatusEffect(key, {active: false, overlay: false})

          await combatant.actor.update({
            [activeField]: activeState,
          })
        } else {
          let durationField = `system.statuses.positive.${key}.duration`;
          let durationValue = status.duration -= 1;

          await combatant.actor.update({
            [durationField]: durationValue,
          })
        }
      }
    }

    for(let [key, status] of Object.entries(statusNegative)){
      if (status.active && !status.persistent){
        if (status.duration <= 0){
          let activeState = !status.active;
          let activeField = `system.statuses.negative.${key}.active`;

          ui.notifications.info(`The ${key} status has ended on ${actor.name}`)
          await actor.toggleStatusEffect(key, {active: false, overlay: false})

          await combatant.actor.update({
            [activeField]: activeState,
          })
          
        } else {
          let durationField = `system.statuses.negative.${key}.duration`;
          let durationValue = status.duration -= 1;

          await combatant.actor.update({
            [durationField]: durationValue,
          })
        }
      }
    }


    await combatant.actor.update({
        "system.actions.standard.value": combatant.actor.system.actions.standard.max,
        "system.actions.reaction.value": combatant.actor.system.actions.reaction.max,
        "system.actions.quick.value": combatant.actor.system.actions.quick.max
    });
  }
}

