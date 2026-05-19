/* data.js — constantes, ressources, rotation semaine, livres */
'use strict';

window.D = (function () {

  var DAYS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];

  var ROTATION = {
    lundi:    ['EPFC Python','Coding exercices','Néerlandais','Sport Pull'],
    mardi:    ['EPFC Linux/OS','IoT lab','Lecture','Sport Push'],
    mercredi: ['EPFC Architecture','Réparation électronique','IA','Core + Souplesse'],
    jeudi:    ['EPFC SQL','Coding projet','Néerlandais','Sport Legs'],
    vendredi: ['EPFC Web/JS','IoT ou Réparation catch-up','Échecs','Mobilité'],
    samedi:   ['Long study block','Vinted','Sport Full Body','Famille/flexible'],
    dimanche: ['Weekly review','Révision','Planning','Stretch']
  };

  /* PPL Day mapping by weekday */
  var SPORT_DAY = {
    lundi:    { type: 'pull',      label: 'Pull',          emoji: '🏋️' },
    mardi:    { type: 'push',      label: 'Push',          emoji: '💪' },
    mercredi: { type: 'core',      label: 'Core + Souplesse', emoji: '🧘' },
    jeudi:    { type: 'legs',      label: 'Legs',          emoji: '🦵' },
    vendredi: { type: 'push',      label: 'Push',          emoji: '💪' },
    samedi:   { type: 'fullbody',  label: 'Full Body',     emoji: '🔥' },
    dimanche: { type: 'off',       label: 'OFF',           emoji: '😴' }
  };

  var BOOKMARKS = [
    { id:'epfc',    label:'EPFC',       icon:'🎓', ph:'Python ch.3 · exercice 2.7' },
    { id:'code',    label:'Code',       icon:'💻', ph:'CodingBat Warmup-2 · fix_teen' },
    { id:'nl',      label:'Néerlandais',icon:'🇳🇱', ph:'Taalgarage A1.2 · leçon 4' },
    { id:'lecture', label:'Lecture',    icon:'📚', ph:'livre p.147' },
    { id:'chess',   label:'Échecs',     icon:'♟️', ph:'Chessable lesson 8' },
    { id:'ai',      label:'IA',         icon:'🤖', ph:'Fast.ai lesson 2 · 12:34' },
    { id:'repair',  label:'Réparation', icon:'🔧', ph:'How to Diagnose ch.2 · multimètre' },
    { id:'iot',     label:'IoT',        icon:'🌐', ph:'ESP32 GPIO · capteur · MQTT' }
  ];

  var FOCUS_DOMAINS = [
    'EPFC','CODE','NL','IA','LECTURE','VINTED','RÉPARATION','IOT','AUTRE'
  ];

  var LOG_FIELDS = [
    { id:'epfc_min',    label:'EPFC',        unit:'min',   type:'number' },
    { id:'code_min',    label:'Code',         unit:'min',   type:'number' },
    { id:'nl_min',      label:'Néerlandais',  unit:'min',   type:'number' },
    { id:'anki',        label:'Anki',         unit:'cartes',type:'number' },
    { id:'lecture_pg',  label:'Lecture',      unit:'pages', type:'number' },
    { id:'sport',       label:'Sport',        unit:'fait',  type:'select', options:['','✓ Fait','✗ Non','🔄 Partiel'] },
    { id:'chess',       label:'Échecs',       unit:'parties',type:'number' },
    { id:'vinted',      label:'Vinted',       unit:'actions',type:'number' },
    { id:'repair_min',  label:'Réparation',   unit:'min',   type:'number' },
    { id:'iot_min',     label:'IoT',          unit:'min',   type:'number' },
    { id:'humeur',      label:'Humeur',       unit:'',      type:'select', options:['','💪 Motivé','😐 Neutre','😴 Fatigué','🔥 En feu'] },
    { id:'notes',       label:'Notes',        unit:'',      type:'text',   wide:true }
  ];

  var STUDY_TABS = [
    { id:'epfc_prog', label:'EPFC' },
    { id:'python',    label:'Python' },
    { id:'linux',     label:'Linux/OS' },
    { id:'archi',     label:'Architecture' },
    { id:'sql',       label:'SQL' },
    { id:'web',       label:'Web/JS' },
    { id:'coding',    label:'Coding' },
    { id:'ia',        label:'IA' },
    { id:'repair',    label:'Réparation' },
    { id:'iot_s',     label:'IoT' },
    { id:'reseau',    label:'Réseaux' },
    { id:'nl',        label:'Néerlandais' }
  ];

  /* Study matières mapped to routine keywords, for auto-complete detection */
  var STUDY_ROUTINE_MAP = {
    'epfc python':       'python',
    'coding exercices':  'coding',
    'coding projet':     'coding',
    'long study block':  'epfc_prog',
    'ia':                'ia',
    'épfc linux':        'linux',
    'epfc linux/os':     'linux',
    'epfc architecture': 'archi',
    'epfc sql':          'sql',
    'epfc web/js':       'web',
    'néerlandais':       'nl',
    'lecture':           'lecture_pg',
    'iot lab':           'iot_s',
    'iot ou réparation catch-up': 'iot_s',
    'réparation électronique': 'repair',
    'révision':          'epfc_prog'
  };

  var RESOURCES = {
    python: [
      'Think Python, 3rd Edition',
      'Python Crash Course, 3rd Edition',
      'Fluent Python',
      'Automate the Boring Stuff with Python',
      'Python Testing with pytest'
    ],
    linux: [
      'How Linux Works, 3rd Edition',
      'Learning Modern Linux',
      'Linux Pocket Guide',
      'UNIX and Linux System Administration Handbook'
    ],
    archi: [
      'Code: The Hidden Language of Computer Hardware and Software',
      'Computer Organization and Design',
      'Practical Electronics for Inventors'
    ],
    sql: [
      'Learning SQL',
      'SQL Cookbook',
      'Practical SQL',
      'Database Design for Mere Mortals'
    ],
    web: [
      'JavaScript: The Definitive Guide',
      'Learning JavaScript Design Patterns',
      'Web Development with Node and Express'
    ],
    ia: [
      'Hands-On Machine Learning',
      'AI Engineering',
      'Machine Learning Design Patterns',
      'Practical Deep Learning'
    ],
    repair: [
      'How to Diagnose and Fix Everything Electronic',
      'Practical Electronics for Inventors',
      'Make: Electronics',
      'Troubleshooting Electronic Equipment'
    ],
    iot_s: [
      'Arduino Cookbook',
      'Raspberry Pi Cookbook',
      'Getting Started with the Internet of Things',
      'Designing Connected Products',
      'IoT in Action'
    ],
    reseau: [
      'Computer Networking: A Top-Down Approach',
      'Network Warrior',
      'Network Programmability and Automation'
    ]
  };

  var SPORT = {
    push: [
      { name:'Pompes inclinées',    type:'reps' },
      { name:'Pompes strictes',     type:'reps' },
      { name:'Dips assistés',       type:'reps' },
      { name:'Développé machine',   type:'kg' },
      { name:'Épaules latérales',   type:'kg' }
    ],
    pull: [
      { name:'Tractions assistées', type:'reps' },
      { name:'Tractions négatives', type:'reps' },
      { name:'Rowing inversé',      type:'reps' },
      { name:'Tirage machine',      type:'kg' },
      { name:'Dead hang',           type:'sec' }
    ],
    legs: [
      { name:'Split squat',         type:'reps' },
      { name:'Squat tempo',         type:'reps' },
      { name:'Fentes arrière',      type:'reps' },
      { name:'Leg press',           type:'kg' },
      { name:'Mollets',             type:'reps' }
    ],
    core: [
      { name:'Dead bug',            type:'sec' },
      { name:'Side plank',          type:'sec' },
      { name:'Hollow hold',         type:'sec' }
    ],
    souplesse: [
      { name:'90/90',               type:'sec' },
      { name:'Frog stretch',        type:'sec' },
      { name:'Couch stretch',       type:'sec' },
      { name:'PNF contraction/relax',type:'sec'},
      { name:'Progression grand écart', type:'sec' }
    ],
    fullbody: [
      { name:'Pompes strictes',     type:'reps' },
      { name:'Tractions assistées', type:'reps' },
      { name:'Split squat',         type:'reps' },
      { name:'Rowing inversé',      type:'reps' },
      { name:'Dead bug',            type:'sec' },
      { name:'Frog stretch',        type:'sec' }
    ]
  };

  /* ── BOOKS CATALOGUE ── */
  var BOOKS = [
    /* Concentration & Deep Work */
    { id:'deepwork',      title:'Deep Work',                  author:'Cal Newport',       category:'Concentration & Deep Work', pages:304  },
    { id:'flow',          title:'Flow',                       author:'Csikszentmihalyi',  category:'Concentration & Deep Work', pages:336  },
    { id:'shallows',      title:'The Shallows',               author:'Nicholas Carr',     category:'Concentration & Deep Work', pages:276  },

    /* Science */
    { id:'briefhistory',  title:'A Brief History of Time',    author:'Stephen Hawking',   category:'Science',                   pages:212  },
    { id:'selfishgene',   title:'The Selfish Gene',           author:'Richard Dawkins',   category:'Science',                   pages:360  },
    { id:'sapiens',       title:'Sapiens',                    author:'Yuval Noah Harari', category:'Science',                   pages:443  },
    { id:'cosmos',        title:'Cosmos',                     author:'Carl Sagan',        category:'Science',                   pages:365  },

    /* Psychologie & Habitudes */
    { id:'thinkfast',     title:'Thinking Fast and Slow',     author:'Daniel Kahneman',   category:'Psychologie & Habitudes',   pages:499  },
    { id:'atomichabits',  title:'Atomic Habits',              author:'James Clear',       category:'Psychologie & Habitudes',   pages:319  },
    { id:'powerofhabit',  title:'The Power of Habit',         author:'Charles Duhigg',    category:'Psychologie & Habitudes',   pages:371  },

    /* Charisme & Communication */
    { id:'howtowinfriends',title:'How to Win Friends',        author:'Dale Carnegie',     category:'Charisme & Communication',  pages:288  },
    { id:'influence',     title:'Influence',                  author:'Robert Cialdini',   category:'Charisme & Communication',  pages:336  },
    { id:'charismamyth',  title:'The Charisma Myth',          author:'Olivia Fox Cabane', category:'Charisme & Communication',  pages:272  },

    /* Santé & Sommeil */
    { id:'whywesleep',    title:'Why We Sleep',               author:'Matthew Walker',    category:'Santé & Sommeil',           pages:368  },
    { id:'thebody',       title:'The Body',                   author:'Bill Bryson',       category:'Santé & Sommeil',           pages:464  },

    /* Physique */
    { id:'sixpieces',     title:'Six Easy Pieces',            author:'Richard Feynman',   category:'Physique',                  pages:176  },
    { id:'elegantuniverse',title:'The Elegant Universe',      author:'Brian Greene',      category:'Physique',                  pages:448  },

    /* Finance */
    { id:'fastlane',      title:'The Millionaire Fastlane',   author:'MJ DeMarco',        category:'Finance',                   pages:339  },
    { id:'psychmoney',    title:'The Psychology of Money',    author:'Morgan Housel',     category:'Finance',                   pages:256  },
    { id:'richdad',       title:'Rich Dad Poor Dad',          author:'Robert Kiyosaki',   category:'Finance',                   pages:336  }
  ];

  /* Unique categories in order */
  var BOOK_CATEGORIES = [
    'Concentration & Deep Work',
    'Science',
    'Psychologie & Habitudes',
    'Charisme & Communication',
    'Santé & Sommeil',
    'Physique',
    'Finance'
  ];

  var PRIORITY_CATEGORIES = ['Étude','Sport','Travail','Projet','Admin','Autre'];

  function todayRotation() {
    var day = DAYS[new Date().getDay()];
    return { day: day, tasks: ROTATION[day] || [] };
  }

  function todaySportDay() {
    var day = DAYS[new Date().getDay()];
    return SPORT_DAY[day] || { type:'off', label:'OFF', emoji:'😴' };
  }

  /* ── ROUTINE METADATA — catégorie, durée estimée, ressource ── */
  var ROUTINE_META = {
    'epfc python':            { cat:'study',  min:90,  hint:'EPFC + Think Python / Python Crash Course', icon:'🎓' },
    'coding exercices':       { cat:'code',   min:60,  hint:'CodingBat / LeetCode Easy', icon:'💻' },
    'coding projet':          { cat:'code',   min:90,  hint:'Projet perso ou portfolio GitHub', icon:'💻' },
    'néerlandais':            { cat:'study',  min:45,  hint:'Taalgarage + Anki deck NL', icon:'🇳🇱' },
    'sport pull':             { cat:'sport',  min:60,  hint:'Tractions assistées, rowing, dead hang', icon:'🏋️' },
    'sport push':             { cat:'sport',  min:60,  hint:'Pompes inclinées, dips, développé', icon:'💪' },
    'sport legs':             { cat:'sport',  min:60,  hint:'Split squat, fentes, leg press, mollets', icon:'🦵' },
    'sport full body':        { cat:'sport',  min:60,  hint:'Push + Pull + Legs condensé', icon:'🔥' },
    'core + souplesse':       { cat:'health', min:45,  hint:'Dead bug, side plank, hollow hold + 90/90', icon:'🧘' },
    'mobilité':               { cat:'health', min:30,  hint:'90/90, frog stretch, couch stretch, PNF', icon:'🦵' },
    'stretch':                { cat:'health', min:30,  hint:'Étirements passifs + foam roller', icon:'🧘' },
    'epfc linux':             { cat:'study',  min:90,  hint:'EPFC + How Linux Works', icon:'🎓' },
    'epfc architecture':      { cat:'study',  min:90,  hint:'EPFC + Computer Organization & Design', icon:'🎓' },
    'epfc sql':               { cat:'study',  min:90,  hint:'EPFC + Learning SQL / Practical SQL', icon:'🎓' },
    'epfc web':               { cat:'study',  min:90,  hint:'EPFC + MDN + JS Definitive Guide', icon:'🎓' },
    'long study block':       { cat:'study',  min:180, hint:'Bloc intensif EPFC + exercices + révision', icon:'📚' },
    'révision':               { cat:'study',  min:60,  hint:'Anki + relire notes de cours', icon:'📖' },
    'iot lab':                { cat:'tech',   min:90,  hint:'Arduino/ESP32 + IoT in Action', icon:'🌐' },
    'iot ou réparation':      { cat:'repair', min:90,  hint:'ESP32/Arduino OU reprise réparation en cours', icon:'🔧' },
    'réparation électronique':{ cat:'repair', min:90,  hint:'How to Diagnose + multimètre + composants', icon:'🔧' },
    'ia':                     { cat:'tech',   min:90,  hint:'Fast.ai / Hands-On ML / AI Engineering', icon:'🤖' },
    'lecture':                { cat:'loisir', min:45,  hint:'Bibliothèque → onglet Lecture', icon:'📚' },
    'échecs':                 { cat:'loisir', min:45,  hint:'Chessable puzzles + Lichess + analyse', icon:'♟️' },
    'vinted':                 { cat:'admin',  min:45,  hint:'Lister articles, répondre messages, expédier', icon:'🛍' },
    'famille':                { cat:'perso',  min:120, hint:'Activité famille ou récupération libre', icon:'👨‍👩‍👧' },
    'weekly review':          { cat:'admin',  min:60,  hint:'Bilan semaine + objectifs pour lundi', icon:'📊' },
    'planning':               { cat:'admin',  min:30,  hint:'Remplir calendrier + to-do semaine à venir', icon:'📅' }
  };

  /* ── Blocs de pratique quotidienne — présents TOUS les jours ── */
  var DAILY_PRACTICE = [
    {
      id: 'ia',
      label: 'IA / Machine Learning',
      icon: '🤖',
      cat: 'tech',
      min: 30,
      defaultPriority: 'A',
      hint: 'Fast.ai, Hands-On ML, AI Engineering — 30 min minimum par jour',
      studyMat: 'ia',
      subtasks: ['Lire 1 chapitre / suivre 1 leçon', 'Implémenter un concept vu', 'Prendre des notes Anki']
    },
    {
      id: 'coding',
      label: 'Coding Practice',
      icon: '💻',
      cat: 'code',
      min: 30,
      defaultPriority: 'A',
      hint: 'LeetCode Easy/Medium · CodingBat · 1 exercice minimum par jour',
      studyMat: 'coding',
      subtasks: ['Lire l\'énoncé sans regarder la solution', 'Coder de tête d\'abord', 'Optimiser + noter complexité']
    },
    {
      id: 'repair',
      label: 'Réparation électronique',
      icon: '🔧',
      cat: 'repair',
      min: 60,
      defaultPriority: 'B',
      hint: 'Avancer sur le projet en cours · How to Diagnose + multimètre',
      studyMat: 'repair',
      subtasks: ['Diagnostic / mesure', 'Tester composants', 'Réparer / souder', 'Documenter avancement']
    },
    {
      id: 'chess',
      label: 'Échecs',
      icon: '♟️',
      cat: 'loisir',
      min: 20,
      defaultPriority: 'B',
      hint: 'Chessable puzzles + 1 partie Lichess + analyser ses erreurs',
      studyMat: null,
      subtasks: ['10 puzzles Chessable', '1 partie lente (15+10)', 'Analyser erreurs avec stockfish']
    }
  ];

  /* Steps for Réparation tracking */
  var REPAIR_STEPS = [
    '🔍 Diagnostic initial',
    '🧰 Ouvrir et inspecter',
    '⚡ Tester composants',
    '🔧 Réparer / remplacer',
    '✅ Vérifier fonctionnement',
    '📝 Documenter'
  ];

  function getRoutineMeta(taskLabel) {
    var lower = taskLabel.toLowerCase().trim();
    var keys = Object.keys(ROUTINE_META);
    for (var i = 0; i < keys.length; i++) {
      if (lower.indexOf(keys[i]) >= 0) return ROUTINE_META[keys[i]];
    }
    return { cat:'autre', min:null, hint:'', icon:'▸' };
  }

  function isRepairTask(taskLabel) {
    var l = taskLabel.toLowerCase();
    return l.indexOf('réparation') >= 0 || l.indexOf('reparation') >= 0;
  }

  /* Detect study matière from routine task label */
  function taskToStudyMatiere(taskLabel) {
    var lower = taskLabel.toLowerCase().trim();
    var keys = Object.keys(STUDY_ROUTINE_MAP);
    for (var i = 0; i < keys.length; i++) {
      if (lower.indexOf(keys[i]) >= 0) return STUDY_ROUTINE_MAP[keys[i]];
    }
    return null;
  }

  /* Is this a sport-related task? */
  function taskIsSport(taskLabel) {
    var lower = taskLabel.toLowerCase();
    return lower.indexOf('sport') >= 0 || lower.indexOf('push') >= 0 ||
      lower.indexOf('pull') >= 0 || lower.indexOf('legs') >= 0 ||
      lower.indexOf('full body') >= 0 || lower.indexOf('souplesse') >= 0 ||
      lower.indexOf('mobilité') >= 0 || lower.indexOf('core') >= 0 ||
      lower.indexOf('stretch') >= 0;
  }

  /* ── SPORT PROGRAM (v5) ── */
  var SPORT_PROGRAM = {
    push1: {
      label: 'Push 1',
      focus: 'Poitrine · épaules · triceps',
      warmup: ['Rotations articulaires 2 min','Band pull-aparts 2x15','Pompes faciles 2x10','1 série légère du premier exercice'],
      exercises: [
        { id:'push1_pushups_warmup', name:'Pompes échauffement', category:'bodyweight', type:'reps', sets:2, reps:'10-15', restSec:45, targetRPE:6, equipment:'bodyweight', c7Risk:'low', safeAlternative:'Pompes inclinées', progressionRule:'Add reps until 2x20, then harder variation.' },
        { id:'push1_incline_db_press', name:'Développé haltères incliné', category:'chest', type:'kg', sets:4, reps:'8-12', restSec:90, targetRPE:7, equipment:'dumbbells', c7Risk:'medium', safeAlternative:'Développé machine assis', progressionRule:'When all sets hit 12 reps, add 1-2 kg.' },
        { id:'push1_machine_press', name:'Développé machine assis', category:'chest', type:'kg', sets:3, reps:'8-12', restSec:90, targetRPE:7, equipment:'machine', c7Risk:'low', safeAlternative:'Pompes inclinées', progressionRule:'Controlled tempo, no neck tension.' },
        { id:'push1_lateral_raise', name:'Élévations latérales', category:'shoulders', type:'kg', sets:4, reps:'12-20', restSec:60, targetRPE:8, equipment:'dumbbells', c7Risk:'low', safeAlternative:'Élévations latérales poulie légère', progressionRule:'Add reps before weight.' },
        { id:'push1_assisted_dips', name:'Dips assistés ou bench dips', category:'triceps', type:'reps', sets:3, reps:'max propre', restSec:90, targetRPE:8, equipment:'bodyweight', c7Risk:'medium', safeAlternative:'Extension triceps corde', progressionRule:'No shoulder pain. Add reps slowly.' },
        { id:'push1_triceps_rope', name:'Extension triceps corde', category:'triceps', type:'kg', sets:3, reps:'10-15', restSec:60, targetRPE:7, equipment:'cable', c7Risk:'low', safeAlternative:'Extension élastique', progressionRule:'Strict elbows, add reps then kg.' },
        { id:'push1_plank', name:'Planche', category:'core', type:'sec', sets:3, reps:'30-60 sec', restSec:45, targetRPE:7, equipment:'bodyweight', c7Risk:'low', safeAlternative:'Dead bug', progressionRule:'Add 5 sec per week.' }
      ]
    },
    pull1: {
      label: 'Pull 1',
      focus: 'Dos · biceps · arrière épaules',
      warmup: ['Rotations épaules 2 min','Scapular pulls légers 2x8','Band pull-aparts 2x15','1 série légère tirage vertical'],
      exercises: [
        { id:'pull1_assisted_pullup', name:'Tractions assistées ou tirage vertical', category:'back', type:'kg_or_reps', sets:4, reps:'6-10', restSec:90, targetRPE:7, equipment:'machine/bodyweight', c7Risk:'medium', safeAlternative:'Tirage vertical machine prise neutre', progressionRule:'Reduce assistance or add reps.' },
        { id:'pull1_chest_supported_row', name:'Rowing machine poitrine appuyée', category:'back', type:'kg', sets:4, reps:'8-12', restSec:90, targetRPE:7, equipment:'machine', c7Risk:'low', safeAlternative:'Rowing poulie basse prise neutre', progressionRule:'Prefer chest-supported to protect neck/lower back.' },
        { id:'pull1_facepull', name:'Face pulls', category:'rear_delts', type:'kg', sets:3, reps:'15-20', restSec:60, targetRPE:7, equipment:'cable', c7Risk:'low', safeAlternative:'Band face pulls', progressionRule:'Slow control, squeeze rear delts.' },
        { id:'pull1_biceps_curl', name:'Curl biceps', category:'biceps', type:'kg', sets:3, reps:'10-12', restSec:60, targetRPE:8, equipment:'dumbbells', c7Risk:'low', safeAlternative:'Curl câble', progressionRule:'No swinging.' },
        { id:'pull1_dead_hang', name:'Dead hang assisté', category:'grip', type:'sec', sets:3, reps:'10-30 sec', restSec:60, targetRPE:6, equipment:'bar', c7Risk:'medium', safeAlternative:'Farmer hold léger sans tension cervicale', progressionRule:'Stop if nerve symptoms or neck tension.' }
      ]
    },
    legs1: {
      label: 'Legs 1',
      focus: 'Quads · fessiers · gainage',
      warmup: ['Mobilité hanches 2 min','Squat poids du corps 2x10','Fentes arrière 1x8/jambe','1 série légère leg press'],
      exercises: [
        { id:'legs1_leg_press', name:'Leg press', category:'quads', type:'kg', sets:4, reps:'10-15', restSec:90, targetRPE:7, equipment:'machine', c7Risk:'low', safeAlternative:'Goblet squat léger', progressionRule:'Add reps then weight.' },
        { id:'legs1_split_squat', name:'Split squat', category:'legs', type:'reps_or_kg', sets:3, reps:'8-12/jambe', restSec:75, targetRPE:7, equipment:'bodyweight/dumbbells', c7Risk:'low', safeAlternative:'Fentes arrière', progressionRule:'Bodyweight first, then dumbbells.' },
        { id:'legs1_leg_curl', name:'Leg curl', category:'hamstrings', type:'kg', sets:3, reps:'10-15', restSec:75, targetRPE:7, equipment:'machine', c7Risk:'low', safeAlternative:'Hip bridge', progressionRule:'Controlled eccentric.' },
        { id:'legs1_calves', name:'Mollets', category:'calves', type:'kg_or_reps', sets:4, reps:'15-25', restSec:45, targetRPE:8, equipment:'machine/bodyweight', c7Risk:'low', safeAlternative:'Mollets debout poids du corps', progressionRule:'Pause at top and bottom.' }
      ]
    },
    push2: {
      label: 'Push 2',
      focus: 'Épaules safe · pecs · triceps · poids du corps',
      warmup: ['Rotations épaules','Band external rotation 2x15','Pompes inclinées 2x10'],
      exercises: [
        { id:'push2_strict_pushups', name:'Pompes strictes', category:'bodyweight', type:'reps', sets:4, reps:'max propre', restSec:75, targetRPE:8, equipment:'bodyweight', c7Risk:'low', safeAlternative:'Pompes inclinées', progressionRule:'Progress to decline push-ups after 4x20.' },
        { id:'push2_seated_press', name:'Développé machine ou haltères assis', category:'shoulders', type:'kg', sets:3, reps:'8-12', restSec:90, targetRPE:7, equipment:'machine/dumbbells', c7Risk:'medium', safeAlternative:'Machine convergente ou landmine press léger', progressionRule:'No overhead barbell press.' },
        { id:'push2_diamond_or_rope', name:'Pompes diamant ou triceps pushdown', category:'triceps', type:'reps_or_kg', sets:3, reps:'8-15', restSec:75, targetRPE:8, equipment:'bodyweight/cable', c7Risk:'low', safeAlternative:'Extension triceps corde', progressionRule:'Use cable if wrists/shoulders complain.' },
        { id:'push2_lateral_raise', name:'Élévations latérales', category:'shoulders', type:'kg', sets:4, reps:'15-20', restSec:60, targetRPE:8, equipment:'dumbbells', c7Risk:'low', safeAlternative:'Poulie basse unilatérale', progressionRule:'Strict form.' }
      ]
    },
    pull2: {
      label: 'Pull 2',
      focus: 'Dos · biceps · posture',
      warmup: ['Scapular activation','Band pull-aparts','Tirage léger 1 série'],
      exercises: [
        { id:'pull2_chinups', name:'Chin-ups assistés ou tirage supination', category:'back', type:'kg_or_reps', sets:4, reps:'6-10', restSec:90, targetRPE:7, equipment:'machine/bodyweight', c7Risk:'medium', safeAlternative:'Tirage supination machine', progressionRule:'Reduce assistance slowly.' },
        { id:'pull2_low_row', name:'Rowing poulie basse', category:'back', type:'kg', sets:4, reps:'8-12', restSec:90, targetRPE:7, equipment:'cable', c7Risk:'low', safeAlternative:'Rowing machine poitrine appuyée', progressionRule:'Neutral neck.' },
        { id:'pull2_reverse_pecdeck', name:'Oiseau ou reverse pec deck', category:'rear_delts', type:'kg', sets:3, reps:'12-20', restSec:60, targetRPE:7, equipment:'machine/dumbbells', c7Risk:'low', safeAlternative:'Band pull-aparts', progressionRule:'Posture work.' },
        { id:'pull2_hammer_curl', name:'Curl marteau', category:'biceps', type:'kg', sets:3, reps:'10-12', restSec:60, targetRPE:8, equipment:'dumbbells', c7Risk:'low', safeAlternative:'Curl câble corde', progressionRule:'No swinging.' }
      ]
    },
    legs2: {
      label: 'Legs 2',
      focus: 'Posterior chain · fessiers · mobilité',
      warmup: ['Hip circles','Glute bridge 2x12','Good morning poids du corps 1x12'],
      exercises: [
        { id:'legs2_hip_thrust', name:'Hip thrust machine ou haltère', category:'glutes', type:'kg', sets:4, reps:'8-12', restSec:90, targetRPE:7, equipment:'machine/dumbbell', c7Risk:'low', safeAlternative:'Glute bridge au sol', progressionRule:'Add reps then kg.' },
        { id:'legs2_rdl_light', name:'Romanian deadlift haltères léger', category:'hamstrings', type:'kg', sets:3, reps:'8-12', restSec:90, targetRPE:6, equipment:'dumbbells', c7Risk:'medium', safeAlternative:'Leg curl machine', progressionRule:'Only if neutral spine and no nerve symptoms.' },
        { id:'legs2_stepups', name:'Step-ups', category:'legs', type:'reps_or_kg', sets:3, reps:'10/jambe', restSec:75, targetRPE:7, equipment:'bodyweight/dumbbells', c7Risk:'low', safeAlternative:'Fentes arrière', progressionRule:'Control knee tracking.' },
        { id:'legs2_pallof', name:'Pallof press anti-rotation', category:'core', type:'kg', sets:3, reps:'10-15/côté', restSec:45, targetRPE:7, equipment:'cable/band', c7Risk:'low', safeAlternative:'Side plank', progressionRule:'Core stability.' }
      ]
    },
    rest: {
      label: 'Repos actif',
      focus: 'Marche · mobilité · récupération',
      warmup: [],
      exercises: [
        { id:'rest_walk', name:'Marche ou vélo doux', category:'recovery', type:'min', sets:1, reps:'20-40 min', restSec:0, targetRPE:3, equipment:'none', c7Risk:'low', safeAlternative:'Marche courte 10 min', progressionRule:'Recovery only.' },
        { id:'rest_flex_short', name:'Souplesse courte', category:'mobility', type:'min', sets:1, reps:'15-25 min', restSec:0, targetRPE:4, equipment:'none', c7Risk:'low', safeAlternative:'Respiration + mobilité douce', progressionRule:'Use flexibility module.' }
      ]
    }
  };

  var BODYWEIGHT_PROGRESSIONS = {
    pushups:  { label:'Pompes',    icon:'🤸', levels:['Incline push-up','Knee push-up','Strict push-up','Decline push-up','Diamond push-up','Archer push-up'] },
    pullups:  { label:'Tractions', icon:'🏋️', levels:['Dead hang','Scapular pull','Negative pull-up','Assisted pull-up','Strict pull-up','Chin-up / weighted later'] },
    dips:     { label:'Dips',      icon:'💪', levels:['Bench dip assisted','Bench dip strict','Parallel dip negative','Assisted dip','Strict dip','Weighted dip later'] },
    legs:     { label:'Jambes',    icon:'🦵', levels:['Box squat','Bodyweight squat','Split squat','Bulgarian split squat','Pistol squat assisté','Pistol squat'] },
    core:     { label:'Gainage',   icon:'⚡', levels:['Dead bug','Plank 30s','Plank 60s','Side plank 45s','Hollow hold','Hanging knee raise'] },
    mobility: { label:'Mobilité',  icon:'🧘', levels:['Daily 5 min mobility','Deep squat 60s','Deep squat 3 min','Forward fold floor touch','Pike advanced','Split progression'] }
  };

  var SOUPLESSE_LEVELS = [
    { level:0, label:'Déverrouiller le corps', duration:'6 semaines', routineMin:15,
      milestones:['Forward fold proche chevilles','Deep squat 60s avec support','Papillon mieux ouvert','Fente basse 45s sans douleur','Child pose confortable'],
      routine:['Forward fold debout 45s','Fente basse droite 45s','Fente basse gauche 45s','Pigeon droit 45s','Pigeon gauche 45s','Papillon assis 60s','Deep squat hold 60s','Calf stretch 30s par jambe','Doorway chest stretch 30s x2','Cat-Cow 10 reps','Hip circles 10 x2']
    },
    { level:1, label:'Fondations', duration:'mois 2-3', routineMin:20,
      milestones:['Doigts touchent le sol','Deep squat 3 min','Straddle 110°+','Half split 60s chaque jambe','Papillon genoux à 15 cm du sol'],
      routine:['Half split droit 60s','Half split gauche 60s','Lizard lunge droit 45s','Lizard lunge gauche 45s','Straddle assis 60s','Pike assis 60s','Frog stretch 60s','Thread the needle 30s par côté']
    },
    { level:2, label:'Intermédiaire PNF', duration:'mois 4-6', routineMin:25,
      milestones:['Paumes au sol','Pike avancé','Front split à 20-25 cm','Middle split à 30 cm','Pigeon complet'],
      routine:['PNF hamstring 3 cycles par jambe','PNF hip flexor 3 cycles par jambe','Pancake progression 90s','Frog stretch 90s','Front split supported 60s par côté','Middle split supported 60s'],
      pnfLocked:false
    },
    { level:3, label:'Avancé', duration:'mois 7-12', routineMin:30,
      milestones:['Front split proche sol','Pancake avancé','Middle split profond','Pont partiel contrôlé'],
      routine:['Front split progression 90s par côté','Middle split progression 90s','Pancake deep 120s','Bridge prep 60s','PNF adductors','Active flexibility lifts']
    },
    { level:4, label:'Élite', duration:'12-24 mois', routineMin:35,
      milestones:['Grand écart contrôlé','Middle split avancé','Pont propre','Mobilité complète utilisable'],
      routine:['Full split work','Middle split work','Bridge work','Active loaded mobility','Maintenance routine']
    }
  ];

  function computeSportSessionType(anchorDate, anchorType, targetDate) {
    var cyclePattern = ['push1','pull1','rest','legs1','push2','rest','pull2','legs2','rest'];
    var anchorIdx = cyclePattern.indexOf(anchorType);
    if (anchorIdx < 0) anchorIdx = 0;
    var a = new Date(anchorDate); a.setHours(0,0,0,0);
    var t = new Date(targetDate); t.setHours(0,0,0,0);
    var diffDays = Math.round((t - a) / 86400000);
    var rawIdx = ((anchorIdx + diffDays) % 9 + 9) % 9;
    return cyclePattern[rawIdx];
  }

  /* ── CERTIFICATION SEED DATA ── */
  var CERTIFICATION_SEED = [
    /* PC/IT */
    { name:'CompTIA Tech+', provider:'CompTIA', level:'Entry', track:'pc_it',
      skills:['Hardware basics','Software basics','Networking fundamentals'],
      resources:['Professor Messer CompTIA Tech+','CompTIA Tech+ Study Guide'],
      labs:['Virtual machine setup','Basic hardware assembly'],
      proofsRequired:['Practice exam score ≥80%','Study notes doc'],
      targetDate:'', costEstimate:'$239', sequence:'0-3m',
      nextAction:'Enroll in Professor Messer course' },
    { name:'CompTIA A+', provider:'CompTIA', level:'Entry', track:'pc_it',
      skills:['PC hardware','Operating systems','Networking','Security basics','Mobile devices'],
      resources:['Professor Messer CompTIA A+','Mike Meyers CompTIA A+ Guide','Jason Dion Practice Tests'],
      labs:['Build a PC','Install OS','Troubleshoot network'],
      proofsRequired:['Both exams passed (Core 1 + Core 2)','Lab documentation'],
      targetDate:'', costEstimate:'$239×2', sequence:'0-3m',
      nextAction:'Schedule Core 1 exam' },
    /* Coding */
    { name:'PCEP', provider:'Python Institute', level:'Entry', track:'coding',
      skills:['Python basics','Variables','Control flow','Functions','Strings'],
      resources:['Python Institute PCEP materials','Think Python','Automate the Boring Stuff'],
      labs:['50 CodingBat exercises','10 mini-projects'],
      proofsRequired:['PCEP certificate','GitHub portfolio with 5+ projects'],
      targetDate:'', costEstimate:'$59', sequence:'0-3m',
      nextAction:'Complete PCEP mock exam' },
    { name:'PCAP', provider:'Python Institute', level:'Intermediate', track:'coding',
      skills:['OOP','Modules','Exceptions','File I/O','Comprehensions'],
      resources:['Python Institute PCAP materials','Fluent Python','Python Crash Course'],
      labs:['OOP project','File parser','Data processor'],
      proofsRequired:['PCAP certificate','2 intermediate Python projects on GitHub'],
      targetDate:'', costEstimate:'$295', sequence:'3-6m',
      nextAction:'Study OOP chapter' },
    { name:'PCPP1', provider:'Python Institute', level:'Advanced', track:'coding',
      skills:['Advanced OOP','Functional programming','Design patterns','Testing','Concurrency'],
      resources:['Python Institute PCPP1','Clean Code','Python Testing with pytest'],
      labs:['Design pattern implementations','Test suite for existing project'],
      proofsRequired:['PCPP1 certificate','Advanced project with tests'],
      targetDate:'', costEstimate:'$195', sequence:'6-12m',
      nextAction:'After PCAP completion' },
    /* AI */
    { name:'Azure AI-900', provider:'Microsoft', level:'Entry', track:'ai',
      skills:['AI concepts','Machine learning basics','Azure AI services','Cognitive services'],
      resources:['Microsoft Learn AI-900 path','Azure AI Fundamentals Study Guide'],
      labs:['Azure Cognitive Services demo','Automated ML experiment'],
      proofsRequired:['AI-900 certificate','Azure lab screenshots'],
      targetDate:'', costEstimate:'€165', sequence:'3-6m',
      nextAction:'Complete Microsoft Learn path' },
    { name:'Azure AI-901', provider:'Microsoft', level:'Intermediate', track:'ai',
      skills:['Custom vision','Language understanding','Bot framework','Knowledge mining'],
      resources:['Microsoft Learn AI-102 path','Designing AI Solutions on Azure'],
      labs:['Custom vision project','LUIS bot','Cognitive search'],
      proofsRequired:['AI-102 certificate','AI project portfolio'],
      targetDate:'', costEstimate:'€165', sequence:'6-12m',
      nextAction:'After AI-900' },
    { name:'AWS AI Practitioner', provider:'AWS', level:'Entry', track:'ai',
      skills:['ML on AWS','SageMaker basics','AI/ML concepts','Responsible AI'],
      resources:['AWS Skill Builder AI Practitioner','AWS AI/ML whitepapers'],
      labs:['SageMaker autopilot','Rekognition demo'],
      proofsRequired:['AWS AI Practitioner certificate','AWS lab completion'],
      targetDate:'', costEstimate:'$100', sequence:'3-6m',
      nextAction:'Start AWS Skill Builder path' },
    { name:'CompTIA Data+', provider:'CompTIA', level:'Intermediate', track:'ai',
      skills:['Data concepts','Data analytics','Data visualization','Data governance'],
      resources:['CompTIA Data+ Study Guide','Practical SQL','Tableau tutorials'],
      labs:['SQL data analysis project','Dashboard visualization'],
      proofsRequired:['Data+ certificate','Data analysis portfolio'],
      targetDate:'', costEstimate:'$239', sequence:'6-12m',
      nextAction:'Review SQL fundamentals' },
    /* IoT/Electronics */
    { name:'Arduino Certification', provider:'Arduino', level:'Entry', track:'iot_electronics',
      skills:['Arduino programming','Sensors','Actuators','Serial communication','PWM'],
      resources:['Arduino Official Docs','Arduino Cookbook','Make: Electronics'],
      labs:['5 sensor projects','1 automation project','MQTT integration'],
      proofsRequired:['Arduino cert','3 documented IoT projects','GitHub code'],
      targetDate:'', costEstimate:'$50', sequence:'0-3m',
      nextAction:'Complete 5 sensor projects' },
    { name:'IoT Lab Portfolio', provider:'Self', level:'Portfolio', track:'iot_electronics',
      skills:['ESP32','MQTT','Node-RED','Home automation','Sensor networks'],
      resources:['Getting Started with IoT','IoT in Action','Designing Connected Products'],
      labs:['Temperature monitor','Smart home automation','MQTT broker setup'],
      proofsRequired:['5 documented IoT projects','GitHub portfolio','Video demo'],
      targetDate:'', costEstimate:'€0 (materials already owned)', sequence:'3-6m',
      nextAction:'Document existing projects' },
    { name:'Electronics Repair Log', provider:'Self', level:'Portfolio', track:'iot_electronics',
      skills:['Multimeter use','Component testing','Soldering','Schematic reading','PCB repair'],
      resources:['How to Diagnose and Fix Everything Electronic','Practical Electronics for Inventors'],
      labs:['Repair log','Schematic archive','Before/after photos'],
      proofsRequired:['10 documented repairs','Repair methodology doc','Tool inventory'],
      targetDate:'', costEstimate:'€0', sequence:'0-3m',
      nextAction:'Document 3 previous repairs' },
    /* Linux/Network/Security */
    { name:'CompTIA Network+', provider:'CompTIA', level:'Entry', track:'linux_network_security',
      skills:['Network protocols','TCP/IP','Network security','Troubleshooting','Wireless'],
      resources:['Professor Messer Network+','CompTIA Network+ Study Guide','Mike Meyers Network+'],
      labs:['Home lab network setup','Packet capture with Wireshark','VLAN configuration'],
      proofsRequired:['Network+ certificate','Lab documentation'],
      targetDate:'', costEstimate:'$239', sequence:'3-6m',
      nextAction:'Study OSI model chapter' },
    { name:'CCNA', provider:'Cisco', level:'Associate', track:'linux_network_security',
      skills:['Cisco IOS','Routing','Switching','OSPF','ACLs','VLANs','WAN technologies'],
      resources:['Cisco CCNA Official Guide','Network Warrior','GNS3 labs'],
      labs:['GNS3 network simulation','Router configuration','Switch management'],
      proofsRequired:['CCNA certificate','GNS3 topology screenshots','Config docs'],
      targetDate:'', costEstimate:'$330', sequence:'6-12m',
      nextAction:'After Network+' },
    { name:'CompTIA Linux+', provider:'CompTIA', level:'Intermediate', track:'linux_network_security',
      skills:['Linux commands','File system','User management','Bash scripting','Services'],
      resources:['How Linux Works','Linux Pocket Guide','UNIX and Linux System Administration Handbook'],
      labs:['Linux server setup','Bash automation scripts','Service configuration'],
      proofsRequired:['Linux+ certificate','5 Bash scripts on GitHub'],
      targetDate:'', costEstimate:'$239', sequence:'6-12m',
      nextAction:'Practice Linux commands daily' },
    { name:'CompTIA Security+', provider:'CompTIA', level:'Intermediate', track:'linux_network_security',
      skills:['Threats','Cryptography','PKI','Identity management','Security protocols','Incident response'],
      resources:['Professor Messer Security+','CompTIA Security+ Study Guide','Jason Dion Security+'],
      labs:['Security audit','Vulnerability scan with Nessus','Firewall configuration'],
      proofsRequired:['Security+ certificate','Security audit report'],
      targetDate:'', costEstimate:'$239', sequence:'12-24m',
      nextAction:'After Linux+' },
    /* Data/Cloud */
    { name:'AWS Cloud Practitioner', provider:'AWS', level:'Entry', track:'data_cloud',
      skills:['AWS services overview','Cloud concepts','Pricing','Security basics','Support'],
      resources:['AWS Skill Builder Cloud Practitioner','AWS Cloud Practitioner Essentials'],
      labs:['AWS free tier exploration','S3 bucket','EC2 instance'],
      proofsRequired:['Cloud Practitioner certificate','AWS free tier project'],
      targetDate:'', costEstimate:'$100', sequence:'3-6m',
      nextAction:'Start AWS Skill Builder' },
    { name:'CompTIA Cloud+', provider:'CompTIA', level:'Intermediate', track:'data_cloud',
      skills:['Cloud deployment','Virtualization','Resource management','Security','Automation'],
      resources:['CompTIA Cloud+ Study Guide','Cloud Architecture Patterns'],
      labs:['Multi-cloud deployment','Automation scripts','Cost optimization'],
      proofsRequired:['Cloud+ certificate','Cloud deployment project'],
      targetDate:'', costEstimate:'$239', sequence:'12-24m',
      nextAction:'After AWS Cloud Practitioner' },
    /* Project Management */
    { name:'ITIL 4 Foundation', provider:'Axelos', level:'Entry', track:'project_management',
      skills:['ITIL concepts','Service value system','4 dimensions','Practices','Continuous improvement'],
      resources:['ITIL 4 Foundation Official Book','ITIL 4 Foundation Exam Study Guide'],
      labs:['ITIL process mapping','Service improvement plan'],
      proofsRequired:['ITIL Foundation certificate','Process documentation'],
      targetDate:'', costEstimate:'€300', sequence:'6-12m',
      nextAction:'Read ITIL 4 Foundation book' },
    { name:'CompTIA Project+', provider:'CompTIA', level:'Entry', track:'project_management',
      skills:['Project lifecycle','Scheduling','Budgeting','Risk management','Communication','Stakeholders'],
      resources:['CompTIA Project+ Study Guide','PMBOK Guide'],
      labs:['Project plan for personal project','Risk register','Stakeholder matrix'],
      proofsRequired:['Project+ certificate','Real project documentation'],
      targetDate:'', costEstimate:'$239', sequence:'12-24m',
      nextAction:'Study project lifecycle chapter' }
  ];

  /* Track filter tab definitions */
  var CERT_TRACKS = [
    { id:'all',                    label:'Tous' },
    { id:'pc_it',                  label:'PC/IT' },
    { id:'coding',                 label:'Coding' },
    { id:'ai',                     label:'AI' },
    { id:'iot_electronics',        label:'IoT' },
    { id:'linux_network_security', label:'Linux/Réseau' },
    { id:'data_cloud',             label:'Data/Cloud' },
    { id:'project_management',     label:'PM' }
  ];

  var CERT_STATUSES = ['planned','active','paused','exam_ready','passed','failed','skipped'];

  return {
    DAYS: DAYS,
    ROTATION: ROTATION,
    SPORT_DAY: SPORT_DAY,
    BOOKMARKS: BOOKMARKS,
    FOCUS_DOMAINS: FOCUS_DOMAINS,
    LOG_FIELDS: LOG_FIELDS,
    STUDY_TABS: STUDY_TABS,
    STUDY_ROUTINE_MAP: STUDY_ROUTINE_MAP,
    RESOURCES: RESOURCES,
    SPORT: SPORT,
    BOOKS: BOOKS,
    BOOK_CATEGORIES: BOOK_CATEGORIES,
    PRIORITY_CATEGORIES: PRIORITY_CATEGORIES,
    todayRotation: todayRotation,
    todaySportDay: todaySportDay,
    taskToStudyMatiere: taskToStudyMatiere,
    taskIsSport: taskIsSport,
    getRoutineMeta: getRoutineMeta,
    isRepairTask: isRepairTask,
    ROUTINE_META: ROUTINE_META,
    REPAIR_STEPS: REPAIR_STEPS,
    DAILY_PRACTICE: DAILY_PRACTICE,
    CERTIFICATION_SEED: CERTIFICATION_SEED,
    CERT_TRACKS: CERT_TRACKS,
    CERT_STATUSES: CERT_STATUSES,
    SPORT_PROGRAM: SPORT_PROGRAM,
    BODYWEIGHT_PROGRESSIONS: BODYWEIGHT_PROGRESSIONS,
    SOUPLESSE_LEVELS: SOUPLESSE_LEVELS,
    computeSportSessionType: computeSportSessionType
  };
})();
