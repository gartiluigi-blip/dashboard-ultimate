import { ex, rx } from './sport-core.js';

export const PULL_LIBRARY=[
 ex('pullup_progression','Tractions pronation · progression','pull',{lats:1,biceps:.6,forearms:.35,grip:.25},rx(4,'3-8',150,2),{equipment:'bodyweight',skill:'pullup',alternatives:['neutral_pulldown']}),
 ex('chest_supported_row','Rowing poitrine appuyée','pull',{upperBack:1,lats:.6,biceps:.35},rx(3,'6-10',150,2),{alternatives:['seal_row','one_arm_cable_row']}),
 ex('one_arm_cable_row','Rowing poulie unilatéral','pull',{lats:.9,upperBack:.6,biceps:.3},rx(3,'8-12',120,2),{alternatives:['chest_supported_row']}),
 ex('face_pull','Face pull','pull',{rearDelt:.9,upperBack:.7,traps:.35},rx(3,'12-20',75,2),{alternatives:['reverse_pec_deck']}),
 ex('reverse_pec_deck','Reverse pec deck','pull',{rearDelt:1,upperBack:.35},rx(2,'12-20',75,2),{alternatives:['rear_delt_fly']}),
 ex('incline_curl','Curl incliné','pull',{biceps:1,forearms:.2},rx(3,'8-12',90,2),{alternatives:['hammer_curl']}),
 ex('farmer_carry','Farmer carry','pull',{grip:1,forearms:.8,traps:.5,abs:.3},rx(3,'30-45 sec',90,2,'time'),{alternatives:['dead_hang']}),
 ex('chinup_progression','Chin-ups · progression','pull',{lats:.9,biceps:1,forearms:.35,grip:.2},rx(4,'3-8',150,2),{equipment:'bodyweight',skill:'chinup',alternatives:['neutral_pulldown']}),
 ex('neutral_pulldown','Tirage vertical prise neutre','pull',{lats:1,biceps:.55,upperBack:.3},rx(3,'8-12',120,2),{alternatives:['pullup_progression']}),
 ex('seal_row','Seal row / rowing poitrine appuyée','pull',{upperBack:1,lats:.5,biceps:.3},rx(3,'8-12',120,2),{alternatives:['chest_supported_row']}),
 ex('straight_arm_pulldown','Pullover poulie bras tendus','pull',{lats:1,serratus:.25},rx(2,'10-15',75,2),{alternatives:['one_arm_cable_row']}),
 ex('rear_delt_fly','Oiseau poulie ou haltères','pull',{rearDelt:1,upperBack:.25},rx(3,'12-20',75,2),{alternatives:['reverse_pec_deck']}),
 ex('hammer_curl','Curl marteau','pull',{biceps:.75,forearms:.65,grip:.2},rx(3,'8-12',90,2),{alternatives:['incline_curl']}),
 ex('reverse_wrist_curl','Extension poignets','pull',{forearms:1},rx(2,'12-20',60,2),{alternatives:['wrist_curl']}),
 ex('pronation_supination','Pronation / supination haltère léger','pull',{forearms:1},rx(2,'12-15 / côté',60,3),{alternatives:['reverse_wrist_curl']}),
 ex('neck_isometric','Cou · isométrie 4 directions','pull',{neck:1},rx(2,'15-25 sec / direction',60,4,'time'),{equipment:'bodyweight',optional:true,note:'Uniquement sans douleur. Pas de pont cervical ni charge dynamique.'})
];

export const PULL_PROGRAM={
 'Pull A':['pullup_progression','chest_supported_row','one_arm_cable_row','face_pull','reverse_pec_deck','incline_curl','farmer_carry'],
 'Pull B':['chinup_progression','neutral_pulldown','seal_row','straight_arm_pulldown','rear_delt_fly','hammer_curl','reverse_wrist_curl','pronation_supination','neck_isometric']
};
