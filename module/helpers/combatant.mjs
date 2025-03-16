export class StoryforgeCombatant extends Combatant {
    /** @override */

    _getInitiativeFormula(combatant) { 
      let baseFormula = super._getInitiativeFormula(combatant);
      const actor = this.actor;

      // Solo NPCs do not roll initiative
      // if (actor.system?.type === "Solo") {
      //   return;
      // }

      return baseFormula;
    }
  }