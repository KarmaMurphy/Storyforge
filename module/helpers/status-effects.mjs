import { StoryforgeActor } from './documents/actor.mjs';
import { STORYFORGE } from '../../helpers/config.mjs';

/**
 * @param {StoryforgeActor} actor
 * @param {EffectChangeData} change
 * @param current
 * @param delta
 */
export function testEffect(actor, change){
    console.log(change.key)
}