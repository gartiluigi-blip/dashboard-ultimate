import { ex, rx } from './sport-core.js';

export const LEGS_LIBRARY=[
 ex('leg_press','Presse à cuisses','legs',{quads:1,glutes:.5},rx(3,'8-12',150,2),{alternatives:['goblet_squat']}),
 ex('bulgarian_split_squat','Bulgarian split squat','legs',{quads:.9,glutes:.8,adductors:.25},rx(3,'8-12 / jambe',120,2),{equipment:'bodyweight',alternatives:['reverse_lunge']}),
 ex('seated_leg_curl','Leg curl assis','legs',{hamstrings:1},rx(3,'8-12',120,2),{alternatives:['nordic_assisted']}),
 ex('hip_thrust','Hip thrust','legs',{glutes:1,hamstrings:.25},rx(3,'8-12',150,2),{alternatives:['romanian_deadlift']}),
 ex('standing_calf_raise','Mollets debout','legs',{calves:1},rx(4,'8-15',75,2),{alternatives:['seated_calf_raise']}),
 ex('tibialis_raise','Tibialis raise','legs',{tibialis:1},rx(3,'15-25',60,2),{equipment:'bodyweight'}),
 ex('pallof_press','Pallof press','core',{obliques:1,abs:.55},rx(3,'10-15 / côté',60,2),{alternatives:['side_plank']}),
 ex('ab_wheel','Ab wheel','core',{abs:1,serratus:.3,lowerBack:.2},rx(3,'6-12',90,2),{alternatives:['dead_bug']}),
 ex('romanian_deadlift','Romanian deadlift','legs',{hamstrings:1,glutes:.8,lowerBack:.35,forearms:.2},rx(3,'6-10',150,2),{alternatives:['hip_thrust']}),
 ex('reverse_lunge','Fente arrière','legs',{quads:.8,glutes:.75,adductors:.2},rx(3,'8-12 / jambe',120,2),{equipment:'bodyweight',alternatives:['bulgarian_split_squat']}),
 ex('nordic_assisted','Nordic curl assisté','legs',{hamstrings:1},rx(3,'4-8',150,2),{equipment:'bodyweight',alternatives:['seated_leg_curl']}),
 ex('seated_calf_raise','Mollets assis','legs',{soleus:1},rx(4,'10-20',75,2),{alternatives:['standing_calf_raise']}),
 ex('adductor_machine','Adducteurs machine','legs',{adductors:1},rx(3,'10-15',75,2),{alternatives:['cossack_squat']}),
 ex('hanging_knee_raise','Hanging knee raise','core',{abs:1,grip:.2},rx(3,'8-15',90,2),{equipment:'bodyweight',alternatives:['reverse_crunch']}),
 ex('side_plank','Side plank','core',{obliques:1,abs:.4},rx(3,'25-45 sec / côté',60,2,'time'),{equipment:'bodyweight',alternatives:['pallof_press']}),
 ex('zone2_walk','Zone 2 · marche inclinée ou vélo','conditioning',{calves:.1,glutes:.1},rx(1,'30-45 min',0,3,'time'),{equipment:'cardio'}),
 ex('mobility_flow','Mobilité hanches + thoracique + chevilles','mobility',{},rx(1,'12-15 min',0,3,'time'),{equipment:'floor'}),
 ex('breathing_reset','Respiration lente','mobility',{},rx(1,'5 min',0,4,'time'),{equipment:'floor'})
];

export const LEGS_PROGRAM={
 'Legs A':['leg_press','bulgarian_split_squat','seated_leg_curl','hip_thrust','standing_calf_raise','tibialis_raise','pallof_press','ab_wheel'],
 'Legs B':['romanian_deadlift','reverse_lunge','nordic_assisted','seated_calf_raise','adductor_machine','hanging_knee_raise','side_plank'],
 'Rest A':['zone2_walk','mobility_flow','breathing_reset'],
 'Rest B':['zone2_walk','mobility_flow','breathing_reset']
};
