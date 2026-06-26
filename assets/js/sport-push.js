import { ex, rx } from './sport-core.js';

export const PUSH_LIBRARY=[
 ex('incline_db_press','Développé incliné haltères','push',{chest:1,frontDelt:.45,triceps:.45},rx(3,'6-10',150,2),{cues:['omoplates stables','poignets neutres'],alternatives:['flat_db_press','weighted_pushup']}),
 ex('weighted_pushup','Pompes progressives','push',{chest:1,triceps:.55,frontDelt:.4,serratus:.35},rx(3,'6-12',120,2),{equipment:'bodyweight',skill:'pushup',alternatives:['incline_db_press','dip_progression']}),
 ex('landmine_press','Landmine press unilatéral','push',{frontDelt:1,chest:.35,triceps:.35,serratus:.25},rx(3,'8-12',120,2),{alternatives:['pike_progression','flat_db_press']}),
 ex('cable_fly_mid','Écarté poulie','push',{chest:1},rx(2,'10-15',75,2),{alternatives:['low_high_fly']}),
 ex('lateral_raise','Élévations latérales','push',{sideDelt:1},rx(3,'12-20',75,2),{alternatives:['cable_lateral_raise']}),
 ex('rope_pressdown','Extension triceps corde','push',{triceps:1},rx(3,'10-15',75,2),{alternatives:['overhead_triceps']}),
 ex('scap_pushup','Scapular push-up / dentelé','push',{serratus:1,chest:.2},rx(2,'12-20',60,3),{equipment:'bodyweight',alternatives:['serratus_wall_slide']}),
 ex('dip_progression','Dips progressifs','push',{chest:.8,triceps:1,frontDelt:.35},rx(3,'4-10',150,2),{equipment:'bodyweight',skill:'dip',alternatives:['weighted_pushup','flat_db_press']}),
 ex('flat_db_press','Développé haltères plat','push',{chest:1,triceps:.5,frontDelt:.4},rx(3,'6-10',150,2),{alternatives:['incline_db_press','weighted_pushup']}),
 ex('pike_progression','Pike / handstand push-up progressif','push',{frontDelt:1,triceps:.45,serratus:.25},rx(3,'5-10',150,2),{equipment:'bodyweight',skill:'pike',alternatives:['landmine_press']}),
 ex('low_high_fly','Écarté poulie bas vers haut','push',{chest:1},rx(2,'10-15',75,2),{alternatives:['cable_fly_mid']}),
 ex('overhead_triceps','Extension triceps au-dessus de la tête','push',{triceps:1},rx(3,'10-15',75,2),{alternatives:['rope_pressdown']}),
 ex('serratus_wall_slide','Wall slide dentelé','push',{serratus:1,frontDelt:.2},rx(2,'10-15',60,3),{equipment:'bodyweight',alternatives:['scap_pushup']}),
 ex('cable_lateral_raise','Élévation latérale poulie','push',{sideDelt:1},rx(3,'12-20',75,2),{alternatives:['lateral_raise']})
];

export const PUSH_PROGRAM={
 'Push A':['incline_db_press','weighted_pushup','landmine_press','cable_fly_mid','lateral_raise','rope_pressdown','scap_pushup'],
 'Push B':['dip_progression','flat_db_press','pike_progression','low_high_fly','cable_lateral_raise','overhead_triceps','serratus_wall_slide']
};
