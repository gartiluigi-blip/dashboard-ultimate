import { SPORT_CYCLE, MUSCLE_LABELS, BODYWEIGHT_LADDERS } from './sport-core.js';
import { PUSH_LIBRARY, PUSH_PROGRAM } from './sport-push.js';
import { PULL_LIBRARY, PULL_PROGRAM } from './sport-pull.js';
import { LEGS_LIBRARY, LEGS_PROGRAM } from './sport-legs.js';

export { SPORT_CYCLE, MUSCLE_LABELS, BODYWEIGHT_LADDERS };
export const SPORT_LIBRARY=[...PUSH_LIBRARY,...PULL_LIBRARY,...LEGS_LIBRARY];
export const SPORT_PROGRAM={...PUSH_PROGRAM,...PULL_PROGRAM,...LEGS_PROGRAM};
export const FLEX_LEVELS=[];
