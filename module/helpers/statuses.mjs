import { STORYFORGE } from "../helpers/config.mjs";

/**
 * Retrieves the status effects applicable to a specific actor's sheet type.
 * 
 * @param {Actor} actor - The actor whose status effects should be returned.
 * @returns {Array} - The list of status effects for this actor.
 */
export function getStatusEffectsForActor(actor) {
	if (!actor || !actor.system || !actor.system.statuses) return [];

	const sheetClass = actor.getFlag("storyforge", "sheetClass") || "NewStoryforgeActorSheet";
	const statusSet = STORYFORGE.statuses[sheetClass] || STORYFORGE.statuses.NewStoryforgeActorSheet;

	// Combine positive, negative, and condition statuses
	const applicableStatuses = {
		...statusSet.positive,
		...statusSet.negative,
		...statusSet.conditions
	};

	// Convert to Foundry's expected format
	return Object.entries(applicableStatuses).map(([key, status]) => ({
		id: key,
		name: status.name,
		icon: status.icon || "icons/svg/aura.svg", // Default icon if missing
		changes: [],
		duration: {},
		overlay: false
	}));
}

/**
 * @type {ActiveEffectData[]}
 */
export const statusEffects = [
    { id: 'broken', name: 'Broken', icon: 'systems/storyforge/assets/statuses/broken.webp' },
    { id: 'tapped', name: 'Tapped', icon: 'systems/storyforge/assets/statuses/tapped.webp' },
    { id: 'blinded', name: 'Blinded', icon: 'systems/storyforge/assets/statuses/blinded.webp' },
    { id: 'bolstered', name: 'Bolstered', icon: 'systems/storyforge/assets/statuses/bolstered.webp' },
    { id: 'buffed', name: 'Buffed', icon: 'systems/storyforge/assets/statuses/buffed.webp' },
    { id: 'charmed', name: 'Charmed', icon: 'systems/storyforge/assets/statuses/charmed.webp' },
    { id: 'decay', name: 'Decay', icon: 'systems/storyforge/assets/statuses/entropy.webp' },
    { id: 'disabled', name: 'Disabled', icon: 'systems/storyforge/assets/statuses/silenced.webp' },
    { id: 'entropy', name: 'Entropy', icon: 'systems/storyforge/assets/statuses/entropy.webp' },
    { id: 'exposed', name: 'Exposed', icon: 'systems/storyforge/assets/statuses/exposed.webp' },
    { id: 'grappled', name: 'Grappled', icon: 'systems/storyforge/assets/statuses/grappled.webp' },
    { id: 'grappling', name: 'Grappling', icon: 'systems/storyforge/assets/statuses/grappling.webp' },
    { id: 'flying', name: 'Flying', icon: 'systems/storyforge/assets/statuses/flying.webp' },
    { id: 'hasted', name: 'Hasted', icon: 'systems/storyforge/assets/statuses/hasted.webp' },
    { id: 'immobile', name: 'Immobilized', icon: 'systems/storyforge/assets/statuses/immobilized.webp' },
    { id: 'invisible', name: 'Invisible', icon: 'systems/storyforge/assets/statuses/invisible.webp' },
    { id: 'marked', name: 'Marked', icon: 'systems/storyforge/assets/statuses/marked.webp' },
    { id: 'poisoned', name: 'Poisoned', icon: 'systems/storyforge/assets/statuses/poisoned.webp' },
    { id: 'prone', name: 'Prone', icon: 'systems/storyforge/assets/statuses/prone.webp' },
    { id: 'protected', name: 'Protected', icon: 'systems/storyforge/assets/statuses/protected-pdef.webp' },
    { id: 'provoked', name: 'Provoked', icon: 'systems/storyforge/assets/statuses/provoked.webp' },
    { id: 'regen', name: 'Regeneration', icon: 'systems/storyforge/assets/statuses/regen.webp' },
    { id: 'resistant', name: 'Resistant', icon: 'systems/storyforge/assets/statuses/resistant.webp' },
    { id: 'shaken', name: 'Shaken', icon: 'systems/storyforge/assets/statuses/shaken.webp' },
    { id: 'silenced', name: 'Silenced', icon: 'systems/storyforge/assets/statuses/silenced.webp' },
    { id: 'sleep', name: 'Sleep', icon: 'systems/storyforge/assets/statuses/unconsious.webp' },
    { id: 'slowed', name: 'Slowed', icon: 'systems/storyforge/assets/statuses/slowed.webp' },
    { id: 'startled', name: 'Startled', icon: 'systems/storyforge/assets/statuses/startled.webp' },
    { id: 'stunned', name: 'Stunned', icon: 'systems/storyforge/assets/statuses/stunned.webp' },
    { id: 'stupified', name: 'Stupified', icon: 'systems/storyforge/assets/statuses/stupified.webp' },
    { id: 'thorns', name: 'Thorns', icon: 'systems/storyforge/assets/statuses/thorns.webp' },
    { id: 'weakened', name: 'Weakened', icon: 'systems/storyforge/assets/statuses/weakened.webp'}
];

export const StatusTemplate = {
	name: "",            // Name of the status
	tier: 1,             // Current tier of the status
	isPersistent: false, // Whether the status is persistent
	expiresAt: null,     // Expiration turn
};