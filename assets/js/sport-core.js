export const rx=(sets,reps,rest=90,rir=2,kind='reps')=>({sets,reps,rest,rir,kind});
export const ex=(id,name,category,muscles,prescription,extra={})=>({id,name,category,muscles,prescription,equipment:extra.equipment||'gym',difficulty:extra.difficulty||'intermediate',skill:extra.skill||'',optional:!!extra.optional,cues:extra.cues||[],alternatives:extra.alternatives||[],note:extra.note||''});

export const SPORT_CYCLE=['Push A','Pull A','Legs A','Rest A','Push B','Pull B','Legs B','Rest B'];

export const MUSCLE_LABELS={
 chest:'Pectoraux',frontDelt:'Deltoïde antérieur',sideDelt:'Deltoïde latéral',rearDelt:'Deltoïde postérieur',triceps:'Triceps',serratus:'Dentelé',
 lats:'Grand dorsal',upperBack:'Haut/milieu du dos',traps:'Trapèzes',biceps:'Biceps',forearms:'Avant-bras',grip:'Grip',neck:'Cou',
 quads:'Quadriceps',hamstrings:'Ischios',glutes:'Fessiers',adductors:'Adducteurs',calves:'Mollets gastrocnémien',soleus:'Soléaire',tibialis:'Tibial antérieur',
 abs:'Abdos',obliques:'Obliques',lowerBack:'Lombaires'
};

export const BODYWEIGHT_LADDERS={
 pullup:[
  {label:'Suspension active',sets:3,reps:'20-40 sec',kind:'time',rest:90,rir:2,next:'Tenir 3×40 sec proprement.'},
  {label:'Tractions négatives',sets:4,reps:'3-5',kind:'reps',rest:120,rir:2,next:'Descente de 5 sec sur chaque rep.'},
  {label:'Tractions assistées',sets:4,reps:'5-8',kind:'reps',rest:120,rir:2,next:'Réduire progressivement l’assistance.'},
  {label:'Tractions strictes',sets:4,reps:'3-6',kind:'reps',rest:150,rir:2,next:'Atteindre 4×6 strictes.'},
  {label:'Tractions strictes volume',sets:4,reps:'6-10',kind:'reps',rest:150,rir:2,next:'Atteindre 4×10 strictes.'},
  {label:'Tractions lestées',sets:4,reps:'4-8',kind:'reps',rest:180,rir:2,next:'Ajouter 1 à 2,5 kg.'}
 ],
 chinup:[
  {label:'Suspension supination',sets:3,reps:'20-40 sec',kind:'time',rest:90,rir:2,next:'Tenir 3×40 sec proprement.'},
  {label:'Chin-ups négatifs',sets:4,reps:'3-5',kind:'reps',rest:120,rir:2,next:'Descente de 5 sec.'},
  {label:'Chin-ups assistés',sets:4,reps:'5-8',kind:'reps',rest:120,rir:2,next:'Réduire l’assistance.'},
  {label:'Chin-ups stricts',sets:4,reps:'3-6',kind:'reps',rest:150,rir:2,next:'Atteindre 4×6.'},
  {label:'Chin-ups stricts volume',sets:4,reps:'6-10',kind:'reps',rest:150,rir:2,next:'Atteindre 4×10.'},
  {label:'Chin-ups lestés',sets:4,reps:'4-8',kind:'reps',rest:180,rir:2,next:'Ajouter 1 à 2,5 kg.'}
 ],
 pushup:[
  {label:'Pompes inclinées',sets:3,reps:'8-15',kind:'reps',rest:90,rir:2,next:'Abaisser le support.'},
  {label:'Pompes strictes',sets:3,reps:'6-12',kind:'reps',rest:90,rir:2,next:'Atteindre 3×12.'},
  {label:'Pompes strictes volume',sets:3,reps:'12-20',kind:'reps',rest:90,rir:2,next:'Atteindre 3×20.'},
  {label:'Pompes pieds surélevés',sets:3,reps:'6-12',kind:'reps',rest:120,rir:2,next:'Atteindre 3×12.'},
  {label:'Pompes lestées',sets:4,reps:'6-10',kind:'reps',rest:150,rir:2,next:'Ajouter 1 à 2,5 kg.'},
  {label:'Pompes archer',sets:3,reps:'5-8 / côté',kind:'reps',rest:150,rir:2,next:'Contrôle total.'}
 ],
 dip:[
  {label:'Dips assistés',sets:3,reps:'6-10',kind:'reps',rest:120,rir:2,next:'Réduire l’assistance.'},
  {label:'Dips stricts',sets:3,reps:'4-8',kind:'reps',rest:150,rir:2,next:'Atteindre 3×8.'},
  {label:'Dips stricts volume',sets:3,reps:'8-12',kind:'reps',rest:150,rir:2,next:'Atteindre 3×12.'},
  {label:'Dips lestés',sets:4,reps:'5-8',kind:'reps',rest:180,rir:2,next:'Ajouter 1 à 2,5 kg.'},
  {label:'Dips lestés volume',sets:4,reps:'8-10',kind:'reps',rest:180,rir:2,next:'Augmenter le lest.'},
  {label:'Dips lestés force',sets:5,reps:'3-6',kind:'reps',rest:180,rir:2,next:'Progression lente.'}
 ],
 pike:[
  {label:'Pike hold',sets:3,reps:'20-30 sec',kind:'time',rest:90,rir:2,next:'Tenir 3×30 sec.'},
  {label:'Pike push-up partiel',sets:3,reps:'5-8',kind:'reps',rest:120,rir:2,next:'Augmenter l’amplitude.'},
  {label:'Pike push-up complet',sets:3,reps:'6-10',kind:'reps',rest:120,rir:2,next:'Atteindre 3×10.'},
  {label:'Pike pieds surélevés',sets:3,reps:'5-8',kind:'reps',rest:150,rir:2,next:'Atteindre 3×8.'},
  {label:'Handstand push-up assisté',sets:4,reps:'3-6',kind:'reps',rest:180,rir:2,next:'Amplitude contrôlée.'},
  {label:'Handstand push-up',sets:4,reps:'3-6',kind:'reps',rest:180,rir:2,next:'Aucune rep forcée.'}
 ]
};
