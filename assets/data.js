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
      warmup: ['Rotations épaules 2 min','Scapular pulls légers 2x8','Band pull-aparts 2x15','Rotation externe élastique 2x12','1 série légère tirage vertical'],
      exercises: [
        { id:'pull1_assisted_pullup', name:'Tractions assistées ou tirage vertical', category:'back', type:'kg_or_reps', sets:4, reps:'6-10', restSec:90, targetRPE:7, equipment:'machine/bodyweight', c7Risk:'medium', safeAlternative:'Tirage vertical machine prise neutre', progressionRule:'Réduire l\'assistance de 5 kg quand 4x10 propres.' },
        { id:'pull1_chest_supported_row', name:'Rowing poitrine appuyée machine', category:'back', type:'kg', sets:4, reps:'8-12', restSec:90, targetRPE:7, equipment:'machine', c7Risk:'low', safeAlternative:'Rowing poulie basse prise neutre', progressionRule:'Chest-supported protège le cou et les lombaires — préférer à tout rowing debout.' },
        { id:'pull1_db_row', name:'Rowing haltère unilatéral', category:'back', type:'kg', sets:3, reps:'8-12/bras', restSec:75, targetRPE:7, equipment:'dumbbells', c7Risk:'low', safeAlternative:'Rowing machine poitrine appuyée', progressionRule:'Coude vers le plafond, ne pas tourner le torse excessivement.' },
        { id:'pull1_facepull', name:'Face pulls câble', category:'rear_delts', type:'kg', sets:3, reps:'15-20', restSec:60, targetRPE:7, equipment:'cable', c7Risk:'low', safeAlternative:'Band face pulls', progressionRule:'Rotation externe en fin de mouvement, léger et contrôlé.' },
        { id:'pull1_biceps_curl', name:'Curl biceps haltères', category:'biceps', type:'kg', sets:3, reps:'10-12', restSec:60, targetRPE:8, equipment:'dumbbells', c7Risk:'low', safeAlternative:'Curl câble poulie basse', progressionRule:'Pas de balancement, coudes fixes.' },
        { id:'pull1_incline_curl', name:'Curl incliné haltères', category:'biceps', type:'kg', sets:2, reps:'10-12', restSec:60, targetRPE:8, equipment:'dumbbells', c7Risk:'low', safeAlternative:'Curl concentration', progressionRule:'Position inclinée isole le chef long — poids léger.' },
        { id:'pull1_dead_hang', name:'Dead hang assisté', category:'grip', type:'sec', sets:3, reps:'15-30 sec', restSec:60, targetRPE:6, equipment:'bar', c7Risk:'medium', safeAlternative:'Farmer hold léger haltères', progressionRule:'Arrêter immédiatement si symptômes nerveux ou tension cervicale.' }
      ]
    },
    legs1: {
      label: 'Legs 1',
      focus: 'Quads · fessiers · ischio · gainage',
      warmup: ['Mobilité hanches 2 min','Hip circles 10 x2','Squat poids du corps 2x10','Glute bridge 2x12','Fentes arrière 1x8/jambe','1 série légère leg press'],
      exercises: [
        { id:'legs1_leg_press', name:'Leg press', category:'quads', type:'kg', sets:4, reps:'10-15', restSec:90, targetRPE:7, equipment:'machine', c7Risk:'low', safeAlternative:'Goblet squat léger', progressionRule:'Ajouter reps jusqu\'à 15 propres puis augmenter la charge.' },
        { id:'legs1_goblet_squat', name:'Goblet squat haltère', category:'quads', type:'kg', sets:3, reps:'10-12', restSec:75, targetRPE:7, equipment:'dumbbells', c7Risk:'low', safeAlternative:'Box squat poids du corps', progressionRule:'Haltère contre la poitrine, descente profonde, genou sur le pied.' },
        { id:'legs1_split_squat', name:'Split squat bulgare haltères', category:'legs', type:'reps_or_kg', sets:3, reps:'8-10/jambe', restSec:90, targetRPE:8, equipment:'dumbbells', c7Risk:'low', safeAlternative:'Fentes arrière poids du corps', progressionRule:'Pied arrière sur banc, haltères neutres, descente contrôlée.' },
        { id:'legs1_leg_curl', name:'Leg curl couché machine', category:'hamstrings', type:'kg', sets:3, reps:'10-15', restSec:75, targetRPE:7, equipment:'machine', c7Risk:'low', safeAlternative:'Hip bridge au sol', progressionRule:'Excentrique lent (3s), pas de rotation du bassin.' },
        { id:'legs1_hip_thrust_light', name:'Hip thrust haltère léger', category:'glutes', type:'kg', sets:3, reps:'12-15', restSec:75, targetRPE:7, equipment:'dumbbells', c7Risk:'low', safeAlternative:'Glute bridge au sol', progressionRule:'Squeeze fessiers en haut, hanche complète.' },
        { id:'legs1_calves', name:'Mollets machine ou debout', category:'calves', type:'kg_or_reps', sets:4, reps:'15-20', restSec:45, targetRPE:8, equipment:'machine/bodyweight', c7Risk:'low', safeAlternative:'Mollets debout poids du corps', progressionRule:'Pause 1s en haut et en bas.' },
        { id:'legs1_dead_bug', name:'Dead bug', category:'core', type:'reps', sets:3, reps:'8/côté', restSec:45, targetRPE:6, equipment:'bodyweight', c7Risk:'low', safeAlternative:'Planche genoux', progressionRule:'Dos plat au sol, bras et jambe opposés, expirer lentement.' }
      ]
    },
    push2: {
      label: 'Push 2',
      focus: 'Épaules safe · pecs · triceps · poids du corps',
      warmup: ['Rotations articulaires épaules 2 min','Band external rotation 2x15','Scapular push-ups 2x10','Band pull-aparts 2x15','Pompes inclinées 2x10'],
      exercises: [
        { id:'push2_strict_pushups', name:'Pompes strictes', category:'bodyweight', type:'reps', sets:4, reps:'max propre', restSec:75, targetRPE:8, equipment:'bodyweight', c7Risk:'low', safeAlternative:'Pompes inclinées ou genoux', progressionRule:'Après 4x20 propres : pompes déclinées ou archer push-ups.' },
        { id:'push2_machine_press', name:'Développé machine convergent', category:'chest', type:'kg', sets:3, reps:'8-12', restSec:90, targetRPE:7, equipment:'machine', c7Risk:'low', safeAlternative:'Développé haltères neutre', progressionRule:'Serrer les poignées vers le centre, contraction maximale en haut.' },
        { id:'push2_seated_press', name:'Développé épaules machine ou haltères assis', category:'shoulders', type:'kg', sets:3, reps:'8-12', restSec:90, targetRPE:7, equipment:'machine/dumbbells', c7Risk:'medium', safeAlternative:'Landmine press ou machine convergente', progressionRule:'Pas de développé militaire barre. Amplitude partielle si inconfort épaule.' },
        { id:'push2_pec_deck', name:'Pec deck ou fly câble', category:'chest', type:'kg', sets:3, reps:'12-15', restSec:60, targetRPE:7, equipment:'machine/cable', c7Risk:'low', safeAlternative:'Fly haltères sur banc plat', progressionRule:'Isolation, léger et contrôlé. Légère flexion des coudes fixe.' },
        { id:'push2_lateral_raise', name:'Élévations latérales', category:'shoulders', type:'kg', sets:4, reps:'15-20', restSec:60, targetRPE:8, equipment:'dumbbells', c7Risk:'low', safeAlternative:'Élévations câble unilatéral', progressionRule:'Strict, pas de balancement, monter jusqu\'à hauteur épaules max.' },
        { id:'push2_diamond_or_rope', name:'Pompes diamant ou extension triceps', category:'triceps', type:'reps_or_kg', sets:3, reps:'8-15', restSec:75, targetRPE:8, equipment:'bodyweight/cable', c7Risk:'low', safeAlternative:'Extension triceps bande élastique', progressionRule:'Câble préféré si douleur poignets.' },
        { id:'push2_side_plank', name:'Gainage latéral', category:'core', type:'sec', sets:3, reps:'30-45 sec/côté', restSec:45, targetRPE:7, equipment:'bodyweight', c7Risk:'low', safeAlternative:'Planche genoux', progressionRule:'Corps droit, hanche haute, ne pas affaisser les lombaires.' }
      ]
    },
    pull2: {
      label: 'Pull 2',
      focus: 'Dos large · biceps · posture cervicale',
      warmup: ['Scapular activation 2x10','Band pull-aparts 2x20','External rotation élastique 2x12','Dead hang léger 20 sec','1 série légère tirage supination'],
      exercises: [
        { id:'pull2_chinups', name:'Chin-ups assistés ou tirage supination machine', category:'back', type:'kg_or_reps', sets:4, reps:'6-10', restSec:90, targetRPE:7, equipment:'machine/bodyweight', c7Risk:'medium', safeAlternative:'Tirage supination machine prise étroite', progressionRule:'Réduire assistance progressivement, full hang en bas.' },
        { id:'pull2_low_row', name:'Rowing poulie basse prise neutre', category:'back', type:'kg', sets:4, reps:'8-12', restSec:90, targetRPE:7, equipment:'cable', c7Risk:'low', safeAlternative:'Rowing machine poitrine appuyée', progressionRule:'Coudes proches du corps, retraction scapulaire, cou neutre.' },
        { id:'pull2_pulldown_wide', name:'Tirage vertical prise large', category:'back', type:'kg', sets:3, reps:'10-12', restSec:75, targetRPE:7, equipment:'machine', c7Risk:'low', safeAlternative:'Tirage prise neutre', progressionRule:'Tirer vers la poitrine, omoplate en rétraction/dépression.' },
        { id:'pull2_reverse_pecdeck', name:'Reverse pec deck ou oiseau haltères', category:'rear_delts', type:'kg', sets:3, reps:'15-20', restSec:60, targetRPE:7, equipment:'machine/dumbbells', c7Risk:'low', safeAlternative:'Band pull-aparts', progressionRule:'Travail postural — léger et contrôlé, retraction scapulaire.' },
        { id:'pull2_hammer_curl', name:'Curl marteau haltères', category:'biceps', type:'kg', sets:3, reps:'10-12', restSec:60, targetRPE:8, equipment:'dumbbells', c7Risk:'low', safeAlternative:'Curl câble corde neutre', progressionRule:'Prise neutre sollicite le brachio-radial.' },
        { id:'pull2_cable_curl', name:'Curl câble poulie basse', category:'biceps', type:'kg', sets:2, reps:'12-15', restSec:60, targetRPE:7, equipment:'cable', c7Risk:'low', safeAlternative:'Curl concentration haltère', progressionRule:'Tension constante tout le trajet.' },
        { id:'pull2_hollow_hold', name:'Hollow hold ou crunch anti-flexion', category:'core', type:'sec', sets:3, reps:'20-40 sec', restSec:45, targetRPE:7, equipment:'bodyweight', c7Risk:'low', safeAlternative:'Dead bug', progressionRule:'Dos plat, lombaires au sol, jambes tendues progressivement.' }
      ]
    },
    legs2: {
      label: 'Legs 2',
      focus: 'Posterior chain · fessiers · gainage anti-rotation',
      warmup: ['Hip circles 10 x2','Glute bridge 2x15','Good morning poids du corps 1x12','Mobilité cheville 1 min','Hip hinge drill 1x10'],
      exercises: [
        { id:'legs2_hip_thrust', name:'Hip thrust machine ou haltère', category:'glutes', type:'kg', sets:4, reps:'8-12', restSec:90, targetRPE:7, equipment:'machine/dumbbell', c7Risk:'low', safeAlternative:'Glute bridge bilateral au sol', progressionRule:'Squeeze fessiers en haut, hanche complète, ne pas cambrer les lombaires.' },
        { id:'legs2_rdl_light', name:'Romanian deadlift haltères léger', category:'hamstrings', type:'kg', sets:3, reps:'8-12', restSec:90, targetRPE:6, equipment:'dumbbells', c7Risk:'medium', safeAlternative:'Leg curl machine couché', progressionRule:'Uniquement si colonne neutre et aucun symptôme neurologique. Charges légères.' },
        { id:'legs2_leg_press_narrow', name:'Leg press prise étroite (hack squat)', category:'quads', type:'kg', sets:3, reps:'10-12', restSec:90, targetRPE:7, equipment:'machine', c7Risk:'low', safeAlternative:'Goblet squat', progressionRule:'Pieds rapprochés et hauts pour isoler les quads.' },
        { id:'legs2_leg_curl_seated', name:'Leg curl assis machine', category:'hamstrings', type:'kg', sets:3, reps:'10-15', restSec:75, targetRPE:7, equipment:'machine', c7Risk:'low', safeAlternative:'Hip bridge isométrique', progressionRule:'Version assise étire mieux l\'ischio-jambier proximal.' },
        { id:'legs2_stepups', name:'Step-ups avec haltères', category:'legs', type:'reps_or_kg', sets:3, reps:'10/jambe', restSec:75, targetRPE:7, equipment:'bodyweight/dumbbells', c7Risk:'low', safeAlternative:'Fentes arrière poids du corps', progressionRule:'Monter en poussant sur le talon, contrôler la descente.' },
        { id:'legs2_calves_seated', name:'Mollets assis machine', category:'calves', type:'kg', sets:4, reps:'15-20', restSec:45, targetRPE:8, equipment:'machine', c7Risk:'low', safeAlternative:'Mollets debout mur', progressionRule:'Version assise isole le soléaire. Pause 1s en bas.' },
        { id:'legs2_pallof', name:'Pallof press anti-rotation', category:'core', type:'kg', sets:3, reps:'10-12/côté', restSec:45, targetRPE:7, equipment:'cable/band', c7Risk:'low', safeAlternative:'Side plank statique', progressionRule:'Résister à la rotation, bras tendus devant soi.' }
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

  /* ── SPORT LIBRARY ── */
  var SPORT_LIBRARY = [
    /* ── PUSH (30) ── */
    { id:'push_wall_pushup', name:'Pompe au mur', category:'push', pattern:'horizontal_push', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['pectoraux','triceps','épaules'], c7Risk:'low', type:'reps', coachingCues:'Corps droit, coudes à 45°, poitrine touche le mur', progressionRule:'Ajouter reps jusqu\'à 3x20, puis variante plus dure', alternatives:['push_incline_pushup','push_knee_pushup'], avoid:false },
    { id:'push_incline_pushup', name:'Pompe inclinée', category:'push', pattern:'horizontal_push', equipment:'bench', difficulty:'beginner', targetMuscles:['pectoraux','triceps','épaules antérieures'], c7Risk:'low', type:'reps', coachingCues:'Mains sur banc, corps aligné, descente contrôlée', progressionRule:'Baisser la hauteur progressivement vers le sol', alternatives:['push_wall_pushup','push_knee_pushup'], avoid:false },
    { id:'push_knee_pushup', name:'Pompe sur les genoux', category:'push', pattern:'horizontal_push', equipment:'floor', difficulty:'beginner', targetMuscles:['pectoraux','triceps'], c7Risk:'low', type:'reps', coachingCues:'Hanches alignées, ne pas bomber le bas du dos', progressionRule:'Passer aux pompes strictes quand 3x15 propres', alternatives:['push_incline_pushup','push_wall_pushup'], avoid:false },
    { id:'push_strict_pushup', name:'Pompe stricte', category:'push', pattern:'horizontal_push', equipment:'floor', difficulty:'intermediate', targetMuscles:['pectoraux','triceps','épaules','gainage'], c7Risk:'low', type:'reps', coachingCues:'Corps planches, coudes 45°, poitrine rase le sol', progressionRule:'Viser 4x20 avant variante déclinée', alternatives:['push_incline_pushup','push_db_flat_press'], avoid:false },
    { id:'push_tempo_pushup', name:'Pompe tempo 3-1-1', category:'push', pattern:'horizontal_push', equipment:'floor', difficulty:'intermediate', targetMuscles:['pectoraux','triceps'], c7Risk:'low', type:'reps', coachingCues:'3 sec descente, 1 sec bas, 1 sec montée', progressionRule:'Maintenir qualité avant d\'ajouter reps', alternatives:['push_strict_pushup','push_db_flat_press'], avoid:false },
    { id:'push_diamond_pushup', name:'Pompe diamant', category:'push', pattern:'horizontal_push', equipment:'floor', difficulty:'intermediate', targetMuscles:['triceps','pectoraux internes'], c7Risk:'low', type:'reps', coachingCues:'Mains en losange sous le sternum, coudes le long du corps', progressionRule:'Commencer genoux si trop difficile', alternatives:['push_rope_extension','push_strict_pushup'], avoid:false },
    { id:'push_decline_pushup', name:'Pompe déclinée', category:'push', pattern:'horizontal_push', equipment:'bench', difficulty:'intermediate', targetMuscles:['pectoraux supérieurs','épaules antérieures'], c7Risk:'low', type:'reps', coachingCues:'Pieds surélevés, corps aligné, descente lente', progressionRule:'Augmenter hauteur des pieds graduellement', alternatives:['push_strict_pushup','push_db_incline_press'], avoid:false },
    { id:'push_archer_pushup', name:'Pompe archer', category:'push', pattern:'horizontal_push', equipment:'floor', difficulty:'advanced', targetMuscles:['pectoraux','triceps','épaules'], c7Risk:'low', type:'reps', coachingCues:'Un bras fléchi, l\'autre tendu en appui, alterner', progressionRule:'Progression vers pompe à un bras', alternatives:['push_decline_pushup','push_strict_pushup'], avoid:false },
    { id:'push_pseudo_planche', name:'Pseudo planche push-up', category:'push', pattern:'horizontal_push', equipment:'floor', difficulty:'advanced', targetMuscles:['pectoraux','triceps','deltoïdes antérieurs'], c7Risk:'low', type:'reps', coachingCues:'Mains pointées vers les pieds, corps incliné vers l\'avant', progressionRule:'Incliner davantage le corps vers l\'avant progressivement', alternatives:['push_archer_pushup','push_decline_pushup'], avoid:false },
    { id:'push_bench_dip_assisted', name:'Dip banc assisté', category:'push', pattern:'vertical_push', equipment:'bench', difficulty:'beginner', targetMuscles:['triceps','pectoraux inférieurs','deltoïdes antérieurs'], c7Risk:'medium', type:'reps', coachingCues:'Pieds au sol pour assistance, descendre jusqu\'à 90°', progressionRule:'Réduire l\'aide des pieds progressivement', alternatives:['push_rope_extension','push_band_extension'], avoid:false },
    { id:'push_bench_dip_strict', name:'Dip banc strict', category:'push', pattern:'vertical_push', equipment:'bench', difficulty:'intermediate', targetMuscles:['triceps','pectoraux inférieurs'], c7Risk:'medium', type:'reps', coachingCues:'Jambes tendues, épaules basses, descente contrôlée', progressionRule:'Passer aux dips parallèles', alternatives:['push_bench_dip_assisted','push_rope_extension'], avoid:false },
    { id:'push_parallel_dip_negative', name:'Dip parallèles négatif', category:'push', pattern:'vertical_push', equipment:'bodyweight', difficulty:'intermediate', targetMuscles:['triceps','pectoraux','épaules'], c7Risk:'medium', type:'reps', coachingCues:'Monter en sautant, descendre en 5 secondes', progressionRule:'Ajouter des dips assistés entre les négatifs', alternatives:['push_bench_dip_strict','push_assisted_dip'], avoid:false },
    { id:'push_assisted_dip', name:'Dip assisté machine', category:'push', pattern:'vertical_push', equipment:'machine', difficulty:'beginner', targetMuscles:['triceps','pectoraux','épaules'], c7Risk:'low', type:'kg', coachingCues:'Réduire l\'assistance progressivement, épaules basses', progressionRule:'Diminuer l\'assistance de 5kg par session', alternatives:['push_bench_dip_assisted','push_strict_dip'], avoid:false },
    { id:'push_strict_dip', name:'Dip strict', category:'push', pattern:'vertical_push', equipment:'bodyweight', difficulty:'advanced', targetMuscles:['triceps','pectoraux inférieurs','deltoïdes antérieurs'], c7Risk:'medium', type:'reps', coachingCues:'Corps vertical pour triceps, légèrement penché pour pecs', progressionRule:'Ajouter lest après 3x10 propres', alternatives:['push_assisted_dip','push_parallel_dip_negative'], avoid:false },
    { id:'push_machine_chest_press', name:'Développé poitrine machine', category:'push', pattern:'horizontal_push', equipment:'machine', difficulty:'beginner', targetMuscles:['pectoraux','triceps','épaules antérieures'], c7Risk:'low', type:'kg', coachingCues:'Dos collé au dossier, trajec­toire fixe sécurisée', progressionRule:'Ajouter 2.5kg quand 3x12 maîtrisés', alternatives:['push_db_flat_press','push_strict_pushup'], avoid:false },
    { id:'push_chest_press_convergente', name:'Développé convergent machine', category:'push', pattern:'horizontal_push', equipment:'machine', difficulty:'beginner', targetMuscles:['pectoraux','triceps'], c7Risk:'low', type:'kg', coachingCues:'Serrer les poignées vers le centre, contraction maximale', progressionRule:'Ajouter reps puis charge', alternatives:['push_machine_chest_press','push_pec_deck'], avoid:false },
    { id:'push_db_flat_press', name:'Développé haltères plat', category:'push', pattern:'horizontal_push', equipment:'dumbbells', difficulty:'intermediate', targetMuscles:['pectoraux','triceps','épaules antérieures'], c7Risk:'low', type:'kg', coachingCues:'Coudes à 45-75°, haltères alignés sur les pectoraux', progressionRule:'Augmenter de 1-2kg quand 4x12 propres', alternatives:['push_machine_chest_press','push_db_incline_press'], avoid:false },
    { id:'push_db_incline_press', name:'Développé haltères incliné', category:'push', pattern:'horizontal_push', equipment:'dumbbells', difficulty:'intermediate', targetMuscles:['pectoraux supérieurs','triceps','épaules antérieures'], c7Risk:'low', type:'kg', coachingCues:'Banc à 30-45°, descendre haltères à hauteur des épaules', progressionRule:'Ajouter 1-2kg quand 4x12 maîtrisés', alternatives:['push_db_flat_press','push_machine_chest_press'], avoid:false },
    { id:'push_db_neutral_press', name:'Développé haltères prise neutre', category:'push', pattern:'horizontal_push', equipment:'dumbbells', difficulty:'intermediate', targetMuscles:['pectoraux','triceps'], c7Risk:'low', type:'kg', coachingCues:'Paumes face à face, pression plus douce sur les poignets', progressionRule:'Utile si douleurs poignets avec prise pronée', alternatives:['push_db_flat_press','push_machine_chest_press'], avoid:false },
    { id:'push_cable_press', name:'Développé poulie cable', category:'push', pattern:'horizontal_push', equipment:'cable', difficulty:'intermediate', targetMuscles:['pectoraux','triceps'], c7Risk:'low', type:'kg', coachingCues:'Tension constante sur toute la trajectoire', progressionRule:'Varier hauteur des poulies pour cibler zones différentes', alternatives:['push_db_flat_press','push_cable_fly'], avoid:false },
    { id:'push_pec_deck', name:'Pec deck / butterfly machine', category:'push', pattern:'horizontal_push', equipment:'machine', difficulty:'beginner', targetMuscles:['pectoraux'], c7Risk:'low', type:'kg', coachingCues:'Légère flexion des coudes, ne pas dépasser les épaules', progressionRule:'Isolation, ajouter reps avant charge', alternatives:['push_cable_fly','push_chest_press_convergente'], avoid:false },
    { id:'push_cable_fly', name:'Fly câble', category:'push', pattern:'horizontal_push', equipment:'cable', difficulty:'intermediate', targetMuscles:['pectoraux'], c7Risk:'low', type:'kg', coachingCues:'Légère flexion coudes fixe, mouvement de câlin', progressionRule:'Ajouter reps avant charge sur exercice d\'isolation', alternatives:['push_pec_deck','push_db_flat_press'], avoid:false },
    { id:'push_lateral_raise_db', name:'Élévations latérales haltères', category:'push', pattern:'vertical_push', equipment:'dumbbells', difficulty:'beginner', targetMuscles:['deltoïdes médians'], c7Risk:'low', type:'kg', coachingCues:'Légère flexion coudes, élever jusqu\'à hauteur épaules max', progressionRule:'Ajouter reps avant charge, priorité qualité', alternatives:['push_lateral_raise_cable','push_frontal_raise_light'], avoid:false },
    { id:'push_lateral_raise_cable', name:'Élévations latérales câble', category:'push', pattern:'vertical_push', equipment:'cable', difficulty:'beginner', targetMuscles:['deltoïdes médians'], c7Risk:'low', type:'kg', coachingCues:'Tension constante en bas, contrôle excentrique', progressionRule:'Progression légère, isolation', alternatives:['push_lateral_raise_db','push_frontal_raise_light'], avoid:false },
    { id:'push_frontal_raise_light', name:'Élévation frontale légère', category:'push', pattern:'vertical_push', equipment:'dumbbells', difficulty:'beginner', targetMuscles:['deltoïdes antérieurs'], c7Risk:'low', type:'kg', coachingCues:'Poids très léger, bras quasi tendus, monter jusqu\'à hauteur yeux', progressionRule:'Rester léger, c\'est un exercice auxiliaire', alternatives:['push_lateral_raise_db','push_cable_press'], avoid:false },
    { id:'push_reverse_grip_pushdown', name:'Extension triceps prise inversée', category:'push', pattern:'vertical_push', equipment:'cable', difficulty:'beginner', targetMuscles:['triceps'], c7Risk:'low', type:'kg', coachingCues:'Paumes vers le haut, coudes fixes au corps', progressionRule:'Ajouter reps puis charge légèrement', alternatives:['push_rope_extension','push_band_extension'], avoid:false },
    { id:'push_rope_extension', name:'Extension triceps corde', category:'push', pattern:'vertical_push', equipment:'cable', difficulty:'beginner', targetMuscles:['triceps'], c7Risk:'low', type:'kg', coachingCues:'Écarter la corde en bas, coudes fixes, corps droit', progressionRule:'Ajouter reps puis charge', alternatives:['push_band_extension','push_reverse_grip_pushdown'], avoid:false },
    { id:'push_band_extension', name:'Extension triceps élastique', category:'push', pattern:'vertical_push', equipment:'band', difficulty:'beginner', targetMuscles:['triceps'], c7Risk:'low', type:'reps', coachingCues:'Coudes au corps, extension complète', progressionRule:'Bande plus forte ou plus de reps', alternatives:['push_rope_extension','push_reverse_grip_pushdown'], avoid:false },
    { id:'push_db_skull_crusher_light', name:'Skull crusher léger haltères', category:'push', pattern:'vertical_push', equipment:'dumbbells', difficulty:'intermediate', targetMuscles:['triceps longs'], c7Risk:'medium', type:'kg', coachingCues:'Coudes fixes, descendre lentement vers le front, très léger', progressionRule:'Poids très léger, priorité qualité', alternatives:['push_rope_extension','push_band_extension'], avoid:false },
    { id:'push_landmine_press_light', name:'Landmine press léger', category:'push', pattern:'vertical_push', equipment:'bar', difficulty:'intermediate', targetMuscles:['épaules','pectoraux supérieurs','triceps'], c7Risk:'low', type:'kg', coachingCues:'Un bras ou deux bras, pression diagonale sécurisée pour les épaules', progressionRule:'Alternative safe au développé militaire', alternatives:['push_db_incline_press','push_machine_chest_press'], avoid:false },

    /* ── PULL (30) ── */
    { id:'pull_dead_hang_assisted', name:'Dead hang assisté', category:'pull', pattern:'vertical_pull', equipment:'bar', difficulty:'beginner', targetMuscles:['dorsaux','avant-bras','trapèzes'], c7Risk:'medium', type:'sec', coachingCues:'Légère flexion coudes, décompress la colonne, pas de tension cervicale', progressionRule:'Augmenter durée progressivement, arrêter si symptômes nerveux', alternatives:['pull_dead_hang_strict','pull_scapular_pullup'], avoid:false },
    { id:'pull_dead_hang_strict', name:'Dead hang strict', category:'pull', pattern:'vertical_pull', equipment:'bar', difficulty:'intermediate', targetMuscles:['dorsaux','avant-bras','trapèzes inférieurs'], c7Risk:'medium', type:'sec', coachingCues:'Bras complètement tendus, épaules actives, pas d\'hyperextension cervicale', progressionRule:'Viser 60s continu avant tractions', alternatives:['pull_dead_hang_assisted','pull_scapular_pullup'], avoid:false },
    { id:'pull_scapular_pullup', name:'Scapular pull-up', category:'pull', pattern:'vertical_pull', equipment:'bar', difficulty:'beginner', targetMuscles:['trapèzes inférieurs','dentelé antérieur'], c7Risk:'low', type:'reps', coachingCues:'Bras tendus, tirer les omoplates vers le bas et ensemble sans fléchir les coudes', progressionRule:'Construire l\'activation scapulaire avant les vraies tractions', alternatives:['pull_dead_hang_strict','pull_negative_pullup'], avoid:false },
    { id:'pull_negative_pullup', name:'Traction négative', category:'pull', pattern:'vertical_pull', equipment:'bar', difficulty:'intermediate', targetMuscles:['dorsaux','biceps','trapèzes'], c7Risk:'medium', type:'reps', coachingCues:'Monter en sautant, descendre en 5-8 secondes lentement', progressionRule:'Viser 3x5 avant tractions assistées régulières', alternatives:['pull_scapular_pullup','pull_assisted_machine_pullup'], avoid:false },
    { id:'pull_assisted_machine_pullup', name:'Traction assistée machine', category:'pull', pattern:'vertical_pull', equipment:'machine', difficulty:'beginner', targetMuscles:['dorsaux','biceps','trapèzes'], c7Risk:'low', type:'kg', coachingCues:'Réduire assistance progressivement, tirage jusqu\'au menton', progressionRule:'Diminuer assistance de 5kg par session', alternatives:['pull_band_pullup','pull_negative_pullup'], avoid:false },
    { id:'pull_band_pullup', name:'Traction avec élastique', category:'pull', pattern:'vertical_pull', equipment:'band', difficulty:'beginner', targetMuscles:['dorsaux','biceps'], c7Risk:'low', type:'reps', coachingCues:'Élastique sous les pieds ou genoux, bande plus légère = plus dur', progressionRule:'Bande plus légère ou passer à la bande suivante', alternatives:['pull_assisted_machine_pullup','pull_negative_pullup'], avoid:false },
    { id:'pull_strict_pullup', name:'Traction stricte', category:'pull', pattern:'vertical_pull', equipment:'bar', difficulty:'advanced', targetMuscles:['dorsaux','biceps','trapèzes','brachioradial'], c7Risk:'medium', type:'reps', coachingCues:'Partir de bras tendus, menton au-dessus de la barre, pas de kipping', progressionRule:'Ajouter lest après 3x8 propres', alternatives:['pull_chin_strict','pull_assisted_machine_pullup'], avoid:false },
    { id:'pull_chin_assisted', name:'Chin-up assisté', category:'pull', pattern:'vertical_pull', equipment:'machine', difficulty:'beginner', targetMuscles:['biceps','dorsaux'], c7Risk:'low', type:'kg', coachingCues:'Prise supination, tirer en engageant les biceps', progressionRule:'Réduire assistance de 5kg par session', alternatives:['pull_assisted_machine_pullup','pull_band_pullup'], avoid:false },
    { id:'pull_chin_strict', name:'Chin-up strict', category:'pull', pattern:'vertical_pull', equipment:'bar', difficulty:'advanced', targetMuscles:['biceps','dorsaux'], c7Risk:'medium', type:'reps', coachingCues:'Prise supination épaule largeur, tirer jusqu\'au menton', progressionRule:'Ajouter lest après 3x8 propres', alternatives:['pull_strict_pullup','pull_chin_assisted'], avoid:false },
    { id:'pull_lat_pulldown_neutral', name:'Tirage vertical prise neutre', category:'pull', pattern:'vertical_pull', equipment:'machine', difficulty:'beginner', targetMuscles:['dorsaux','biceps'], c7Risk:'low', type:'kg', coachingCues:'Prise neutre épaule largeur, tirer vers le sternum', progressionRule:'Ajouter 2.5kg quand 4x12 maîtrisés', alternatives:['pull_lat_pulldown_pronation','pull_lat_pulldown_supination'], avoid:false },
    { id:'pull_lat_pulldown_pronation', name:'Tirage vertical prise pronée', category:'pull', pattern:'vertical_pull', equipment:'machine', difficulty:'beginner', targetMuscles:['dorsaux','trapèzes'], c7Risk:'low', type:'kg', coachingCues:'Prise large pronée, tirer vers le haut du sternum', progressionRule:'Ajouter charge progressivement', alternatives:['pull_lat_pulldown_neutral','pull_lat_pulldown_supination'], avoid:false },
    { id:'pull_lat_pulldown_supination', name:'Tirage vertical prise supinée', category:'pull', pattern:'vertical_pull', equipment:'machine', difficulty:'beginner', targetMuscles:['dorsaux','biceps'], c7Risk:'low', type:'kg', coachingCues:'Prise supination épaule largeur, recrutement biceps plus important', progressionRule:'Ajouter charge progressivement', alternatives:['pull_lat_pulldown_neutral','pull_chin_assisted'], avoid:false },
    { id:'pull_chest_supported_row', name:'Rowing poitrine appuyée', category:'pull', pattern:'horizontal_pull', equipment:'machine', difficulty:'beginner', targetMuscles:['dorsaux','trapèzes intermédiaires','rhomboïdes'], c7Risk:'low', type:'kg', coachingCues:'Poitrine contre le dossier, tirer les coudes en arrière', progressionRule:'Ajouter 2.5kg quand 4x12 maîtrisés', alternatives:['pull_low_cable_row','pull_incline_row'], avoid:false },
    { id:'pull_low_cable_row', name:'Rowing poulie basse', category:'pull', pattern:'horizontal_pull', equipment:'cable', difficulty:'beginner', targetMuscles:['dorsaux','trapèzes','rhomboïdes'], c7Risk:'low', type:'kg', coachingCues:'Dos neutre, tirer le coude le long du corps, serrer l\'omoplate', progressionRule:'Ajouter charge progressivement', alternatives:['pull_chest_supported_row','pull_db_single_row'], avoid:false },
    { id:'pull_db_single_row', name:'Rowing haltère unilatéral', category:'pull', pattern:'horizontal_pull', equipment:'dumbbells', difficulty:'intermediate', targetMuscles:['dorsaux','rhomboïdes','biceps'], c7Risk:'low', type:'kg', coachingCues:'Appui sur banc, dos plat, tirer coude vers plafond', progressionRule:'Ajouter 2kg quand 3x12 propres', alternatives:['pull_chest_supported_row','pull_low_cable_row'], avoid:false },
    { id:'pull_incline_row', name:'Rowing incliné sur banc', category:'pull', pattern:'horizontal_pull', equipment:'dumbbells', difficulty:'intermediate', targetMuscles:['dorsaux','trapèzes supérieurs'], c7Risk:'low', type:'kg', coachingCues:'Poitrine sur banc incliné, tirer coudes vers le haut', progressionRule:'Ajouter charge progressivement', alternatives:['pull_chest_supported_row','pull_db_single_row'], avoid:false },
    { id:'pull_inverted_row', name:'Rowing inversé', category:'pull', pattern:'horizontal_pull', equipment:'bar', difficulty:'beginner', targetMuscles:['dorsaux','biceps','trapèzes'], c7Risk:'low', type:'reps', coachingCues:'Corps aligné, tirer la poitrine vers la barre, contrôle excentrique', progressionRule:'Élever les pieds pour augmenter la difficulté', alternatives:['pull_chest_supported_row','pull_low_cable_row'], avoid:false },
    { id:'pull_cable_pullover', name:'Pullover câble', category:'pull', pattern:'vertical_pull', equipment:'cable', difficulty:'intermediate', targetMuscles:['dorsaux','grand rond'], c7Risk:'low', type:'kg', coachingCues:'Bras quasi tendus, mouvement d\'arc, étirement dorsaux', progressionRule:'Exercice d\'isolation, ajouter reps avant charge', alternatives:['pull_straight_arm_pulldown','pull_lat_pulldown_neutral'], avoid:false },
    { id:'pull_straight_arm_pulldown', name:'Straight arm pulldown', category:'pull', pattern:'vertical_pull', equipment:'cable', difficulty:'intermediate', targetMuscles:['dorsaux','grand rond'], c7Risk:'low', type:'kg', coachingCues:'Bras tendus, pousser la barre vers les cuisses, hanches fixes', progressionRule:'Isolation dorsaux, contrôle excentrique', alternatives:['pull_cable_pullover','pull_lat_pulldown_neutral'], avoid:false },
    { id:'pull_face_pull', name:'Face pull', category:'pull', pattern:'horizontal_pull', equipment:'cable', difficulty:'beginner', targetMuscles:['deltoïdes postérieurs','trapèzes','rotateurs externes'], c7Risk:'low', type:'kg', coachingCues:'Tirer vers le visage, coudes à hauteur épaules, rotation externe maximale', progressionRule:'Exercice de santé épaule, rester léger', alternatives:['pull_reverse_pec_deck','pull_rear_delt_fly'], avoid:false },
    { id:'pull_reverse_pec_deck', name:'Reverse pec deck', category:'pull', pattern:'horizontal_pull', equipment:'machine', difficulty:'beginner', targetMuscles:['deltoïdes postérieurs','rhomboïdes'], c7Risk:'low', type:'kg', coachingCues:'Légère flexion coudes, tirer les bras en arrière', progressionRule:'Rester léger, focus contraction arrière épaule', alternatives:['pull_face_pull','pull_rear_delt_fly'], avoid:false },
    { id:'pull_rear_delt_fly', name:'Oiseau haltères', category:'pull', pattern:'horizontal_pull', equipment:'dumbbells', difficulty:'beginner', targetMuscles:['deltoïdes postérieurs','trapèzes'], c7Risk:'low', type:'kg', coachingCues:'Légère flexion tronc, coudes légèrement fléchis, élever les bras en arrière', progressionRule:'Très léger, priorité qualité', alternatives:['pull_reverse_pec_deck','pull_face_pull'], avoid:false },
    { id:'pull_band_pull_apart', name:'Band pull-apart', category:'pull', pattern:'horizontal_pull', equipment:'band', difficulty:'beginner', targetMuscles:['deltoïdes postérieurs','rhomboïdes','trapèzes'], c7Risk:'low', type:'reps', coachingCues:'Bras tendus, tirer l\'élastique jusqu\'à la poitrine, serrer les omoplates', progressionRule:'Parfait comme échauffement, bande plus forte ensuite', alternatives:['pull_face_pull','pull_rear_delt_fly'], avoid:false },
    { id:'pull_bicep_curl_db', name:'Curl biceps haltères', category:'pull', pattern:'vertical_pull', equipment:'dumbbells', difficulty:'beginner', targetMuscles:['biceps','brachialis'], c7Risk:'low', type:'kg', coachingCues:'Coudes fixes au corps, rotation supination en haut', progressionRule:'Ajouter 1-2kg quand 3x12 propres', alternatives:['pull_hammer_curl','pull_cable_curl'], avoid:false },
    { id:'pull_hammer_curl', name:'Curl marteau', category:'pull', pattern:'vertical_pull', equipment:'dumbbells', difficulty:'beginner', targetMuscles:['brachioradial','biceps'], c7Risk:'low', type:'kg', coachingCues:'Paumes face à face, coudes fixes, mouvement contrôlé', progressionRule:'Ajouter charge progressivement', alternatives:['pull_bicep_curl_db','pull_cable_curl'], avoid:false },
    { id:'pull_cable_curl', name:'Curl câble', category:'pull', pattern:'vertical_pull', equipment:'cable', difficulty:'beginner', targetMuscles:['biceps'], c7Risk:'low', type:'kg', coachingCues:'Tension constante, coudes fixes, rotation supination', progressionRule:'Ajouter charge progressivement', alternatives:['pull_bicep_curl_db','pull_hammer_curl'], avoid:false },
    { id:'pull_incline_curl', name:'Curl incliné haltères', category:'pull', pattern:'vertical_pull', equipment:'dumbbells', difficulty:'intermediate', targetMuscles:['biceps longue portion'], c7Risk:'low', type:'kg', coachingCues:'Banc incliné, bras pendants, étirement maximale en bas', progressionRule:'Léger, étirement complet avant contraction', alternatives:['pull_bicep_curl_db','pull_cable_curl'], avoid:false },
    { id:'pull_reverse_curl', name:'Curl prise inversée', category:'pull', pattern:'vertical_pull', equipment:'dumbbells', difficulty:'beginner', targetMuscles:['brachioradial','extenseurs avant-bras'], c7Risk:'low', type:'kg', coachingCues:'Prise pronée, coudes fixes, mouvement complet', progressionRule:'Renforce les avant-bras et extenseurs', alternatives:['pull_hammer_curl','pull_bicep_curl_db'], avoid:false },
    { id:'pull_farmer_hold', name:'Farmer hold statique', category:'pull', pattern:'carry', equipment:'dumbbells', difficulty:'beginner', targetMuscles:['avant-bras','trapèzes','core'], c7Risk:'low', type:'sec', coachingCues:'Epaules basses, grip serré, dos droit', progressionRule:'Augmenter durée puis charge', alternatives:['pull_grip_squeeze','pull_dead_hang_assisted'], avoid:false },
    { id:'pull_grip_squeeze', name:'Écrasement de grip', category:'pull', pattern:'carry', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['avant-bras','fléchisseurs doigts'], c7Risk:'low', type:'sec', coachingCues:'Écraser une serviette ou grip tool, maintenir la pression', progressionRule:'Augmenter durée ou résistance', alternatives:['pull_farmer_hold','pull_dead_hang_strict'], avoid:false },

    /* ── LEGS (35) ── */
    { id:'legs_box_squat', name:'Squat sur boîte', category:'legs', pattern:'squat', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['quadriceps','fessiers','ischio-jambiers'], c7Risk:'low', type:'reps', coachingCues:'S\'asseoir lentement sur la boîte, se lever avec contrôle', progressionRule:'Réduire hauteur de la boîte progressivement', alternatives:['legs_bw_squat','legs_goblet_squat'], avoid:false },
    { id:'legs_bw_squat', name:'Squat poids du corps', category:'legs', pattern:'squat', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['quadriceps','fessiers'], c7Risk:'low', type:'reps', coachingCues:'Pieds écartés largeur épaules, genoux dans l\'axe des orteils', progressionRule:'Ajouter reps puis goblet squat', alternatives:['legs_box_squat','legs_goblet_squat'], avoid:false },
    { id:'legs_tempo_squat', name:'Squat tempo 3-1-1', category:'legs', pattern:'squat', equipment:'bodyweight', difficulty:'intermediate', targetMuscles:['quadriceps','fessiers'], c7Risk:'low', type:'reps', coachingCues:'3 sec descente, 1 sec pause en bas, 1 sec montée', progressionRule:'Ajouter poids après maîtrise du tempo', alternatives:['legs_bw_squat','legs_goblet_squat'], avoid:false },
    { id:'legs_goblet_squat', name:'Goblet squat', category:'legs', pattern:'squat', equipment:'dumbbells', difficulty:'beginner', targetMuscles:['quadriceps','fessiers','core'], c7Risk:'low', type:'kg', coachingCues:'Haltère tenu à la poitrine, descente profonde contrôlée', progressionRule:'Augmenter poids progressivement', alternatives:['legs_bw_squat','legs_leg_press'], avoid:false },
    { id:'legs_leg_press', name:'Leg press', category:'legs', pattern:'squat', equipment:'machine', difficulty:'beginner', targetMuscles:['quadriceps','fessiers','ischio-jambiers'], c7Risk:'low', type:'kg', coachingCues:'Dos collé, genoux dans l\'axe, ne pas verrouiller les genoux', progressionRule:'Ajouter 5-10kg quand 4x15 propres', alternatives:['legs_goblet_squat','legs_bw_squat'], avoid:false },
    { id:'legs_leg_extension', name:'Leg extension machine', category:'legs', pattern:'squat', equipment:'machine', difficulty:'beginner', targetMuscles:['quadriceps'], c7Risk:'low', type:'kg', coachingCues:'Contrôle excentrique, ne pas bloquer les genoux en extension', progressionRule:'Ajouter charge progressivement, exercice d\'isolation', alternatives:['legs_leg_press','legs_bw_squat'], avoid:false },
    { id:'legs_split_squat', name:'Split squat', category:'legs', pattern:'lunge', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['quadriceps','fessiers'], c7Risk:'low', type:'reps', coachingCues:'Jambe avant à 90°, genou arrière près du sol', progressionRule:'Ajouter haltères après 3x12 propres par jambe', alternatives:['legs_reverse_lunge','legs_bulgarian_split_squat'], avoid:false },
    { id:'legs_bulgarian_split_squat', name:'Bulgarian split squat', category:'legs', pattern:'lunge', equipment:'dumbbells', difficulty:'advanced', targetMuscles:['quadriceps','fessiers','ischio-jambiers'], c7Risk:'low', type:'kg', coachingCues:'Pied arrière sur banc, genou avant dans l\'axe, descente contrôlée', progressionRule:'Ajouter poids après 3x10 par jambe propres', alternatives:['legs_split_squat','legs_reverse_lunge'], avoid:false },
    { id:'legs_reverse_lunge', name:'Fente arrière', category:'legs', pattern:'lunge', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['quadriceps','fessiers'], c7Risk:'low', type:'reps', coachingCues:'Reculer le pied, genou avant dans l\'axe, dos droit', progressionRule:'Ajouter haltères après 3x12 propres', alternatives:['legs_split_squat','legs_walking_lunge'], avoid:false },
    { id:'legs_walking_lunge', name:'Fente marchée', category:'legs', pattern:'lunge', equipment:'bodyweight', difficulty:'intermediate', targetMuscles:['quadriceps','fessiers'], c7Risk:'low', type:'reps', coachingCues:'Alterner jambes en avançant, genou avant jamais sur les orteils', progressionRule:'Ajouter haltères pour progresser', alternatives:['legs_reverse_lunge','legs_split_squat'], avoid:false },
    { id:'legs_stepup', name:'Step-up', category:'legs', pattern:'lunge', equipment:'bench', difficulty:'beginner', targetMuscles:['quadriceps','fessiers'], c7Risk:'low', type:'reps', coachingCues:'Monter sur la boîte en contrôle, ne pas rebondir', progressionRule:'Ajouter haltères ou hauteur de marche', alternatives:['legs_reverse_lunge','legs_split_squat'], avoid:false },
    { id:'legs_wall_sit', name:'Chaise contre le mur', category:'legs', pattern:'squat', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['quadriceps'], c7Risk:'low', type:'sec', coachingCues:'Dos contre le mur, cuisses parallèles au sol', progressionRule:'Augmenter la durée progressivement', alternatives:['legs_bw_squat','legs_leg_extension'], avoid:false },
    { id:'legs_hip_bridge', name:'Hip bridge', category:'legs', pattern:'hip_hinge', equipment:'floor', difficulty:'beginner', targetMuscles:['fessiers','ischio-jambiers','core'], c7Risk:'low', type:'reps', coachingCues:'Pieds à plat, pousser bassin vers le haut, serrer fessiers en haut', progressionRule:'Passer à hip thrust ou unilatéral', alternatives:['legs_hip_thrust_floor','legs_single_leg_glute_bridge'], avoid:false },
    { id:'legs_hip_thrust_floor', name:'Hip thrust au sol', category:'legs', pattern:'hip_hinge', equipment:'floor', difficulty:'beginner', targetMuscles:['fessiers','ischio-jambiers'], c7Risk:'low', type:'reps', coachingCues:'Épaules sur le sol, pieds à plat, extension hanche complète', progressionRule:'Passer à hip thrust machine ou avec haltère', alternatives:['legs_hip_bridge','legs_hip_thrust_machine'], avoid:false },
    { id:'legs_hip_thrust_machine', name:'Hip thrust machine', category:'legs', pattern:'hip_hinge', equipment:'machine', difficulty:'intermediate', targetMuscles:['fessiers','ischio-jambiers'], c7Risk:'low', type:'kg', coachingCues:'Coussinet sur les hanches, extension hanche complète, serrer en haut', progressionRule:'Ajouter 5-10kg quand 4x12 propres', alternatives:['legs_hip_thrust_floor','legs_hip_bridge'], avoid:false },
    { id:'legs_single_leg_glute_bridge', name:'Hip bridge unilatéral', category:'legs', pattern:'hip_hinge', equipment:'floor', difficulty:'intermediate', targetMuscles:['fessiers','ischio-jambiers'], c7Risk:'low', type:'reps', coachingCues:'Une jambe tendue, pousser bassin vers le haut en unilatéral', progressionRule:'Ajouter bande autour des genoux pour résistance', alternatives:['legs_hip_bridge','legs_hip_thrust_floor'], avoid:false },
    { id:'legs_leg_curl_machine', name:'Leg curl machine', category:'legs', pattern:'hip_hinge', equipment:'machine', difficulty:'beginner', targetMuscles:['ischio-jambiers'], c7Risk:'low', type:'kg', coachingCues:'Contrôle excentrique, ne pas soulever les hanches', progressionRule:'Ajouter charge progressivement', alternatives:['legs_rdl_light_db','legs_good_morning_bw'], avoid:false },
    { id:'legs_rdl_light_db', name:'Romanian deadlift haltères léger', category:'legs', pattern:'hip_hinge', equipment:'dumbbells', difficulty:'intermediate', targetMuscles:['ischio-jambiers','fessiers','érecteurs spinaux'], c7Risk:'medium', type:'kg', coachingCues:'Dos neutre, hanches en arrière, descendre haltères le long des jambes', progressionRule:'Seulement si colonne neutre maintenue, commencer très léger', alternatives:['legs_leg_curl_machine','legs_good_morning_bw'], avoid:false },
    { id:'legs_good_morning_bw', name:'Good morning poids du corps', category:'legs', pattern:'hip_hinge', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['ischio-jambiers','fessiers','érecteurs spinaux'], c7Risk:'low', type:'reps', coachingCues:'Mains derrière la tête, hanches en arrière, dos plat', progressionRule:'Exercice de mobilité et activation, viser 2x15', alternatives:['legs_rdl_light_db','legs_leg_curl_machine'], avoid:false },
    { id:'legs_cable_pull_through', name:'Cable pull through', category:'legs', pattern:'hip_hinge', equipment:'cable', difficulty:'beginner', targetMuscles:['fessiers','ischio-jambiers'], c7Risk:'low', type:'kg', coachingCues:'Câble entre les jambes, hanches en arrière puis extension', progressionRule:'Mouvement de hip hinge safe, ajouter charge progressivement', alternatives:['legs_hip_bridge','legs_good_morning_bw'], avoid:false },
    { id:'legs_abduction_machine', name:'Abducteurs machine', category:'legs', pattern:'squat', equipment:'machine', difficulty:'beginner', targetMuscles:['abducteurs','fessiers moyens'], c7Risk:'low', type:'kg', coachingCues:'Genoux contre les coussins, écarter lentement', progressionRule:'Ajouter charge progressivement, exercice d\'isolation', alternatives:['legs_lateral_lunge','legs_cossack_squat_assisted'], avoid:false },
    { id:'legs_adduction_machine', name:'Adducteurs machine', category:'legs', pattern:'squat', equipment:'machine', difficulty:'beginner', targetMuscles:['adducteurs'], c7Risk:'low', type:'kg', coachingCues:'Contrôle sur l\'excentrique, range of motion complète', progressionRule:'Ajouter charge progressivement, exercice d\'isolation', alternatives:['legs_goblet_squat','legs_lateral_lunge'], avoid:false },
    { id:'legs_calf_raise_bw', name:'Mollets poids du corps', category:'legs', pattern:'squat', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['gastrocnémiens','soléaire'], c7Risk:'low', type:'reps', coachingCues:'Monter sur la pointe des pieds, pause en haut, descente lente', progressionRule:'Ajouter reps ou passer à unilatéral', alternatives:['legs_calf_raise_machine','legs_seated_calf_raise'], avoid:false },
    { id:'legs_calf_raise_machine', name:'Mollets machine debout', category:'legs', pattern:'squat', equipment:'machine', difficulty:'beginner', targetMuscles:['gastrocnémiens'], c7Risk:'low', type:'kg', coachingCues:'Pause en haut et en bas, range of motion complète', progressionRule:'Ajouter charge progressivement', alternatives:['legs_calf_raise_bw','legs_seated_calf_raise'], avoid:false },
    { id:'legs_seated_calf_raise', name:'Mollets assis machine', category:'legs', pattern:'squat', equipment:'machine', difficulty:'beginner', targetMuscles:['soléaire'], c7Risk:'low', type:'kg', coachingCues:'Mollets assis isolent le soléaire, pause haut et bas', progressionRule:'Ajouter charge progressivement', alternatives:['legs_calf_raise_machine','legs_calf_raise_bw'], avoid:false },
    { id:'legs_tibialis_raise', name:'Relevé de pointe tibial', category:'legs', pattern:'squat', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['tibial antérieur'], c7Risk:'low', type:'reps', coachingCues:'Dos contre le mur, soulever la pointe des pieds', progressionRule:'Prévention tendinites et force tibia', alternatives:['legs_calf_raise_bw','legs_wall_sit'], avoid:false },
    { id:'legs_farmer_walk_light', name:'Farmer walk léger', category:'legs', pattern:'carry', equipment:'dumbbells', difficulty:'beginner', targetMuscles:['fessiers','quadriceps','core','trapèzes'], c7Risk:'low', type:'min', coachingCues:'Haltères aux côtés, dos droit, pas courts et stables', progressionRule:'Augmenter distance ou charge progressivement', alternatives:['legs_stepup','legs_wall_sit'], avoid:false },
    { id:'legs_pistol_squat_assisted', name:'Squat pistol assisté', category:'legs', pattern:'squat', equipment:'bodyweight', difficulty:'intermediate', targetMuscles:['quadriceps','fessiers','cheville'], c7Risk:'low', type:'reps', coachingCues:'S\'appuyer sur un TRX ou poteau, descendre sur une jambe', progressionRule:'Réduire assistance progressivement', alternatives:['legs_bw_squat','legs_split_squat'], avoid:false },
    { id:'legs_cossack_squat_assisted', name:'Squat cosaque assisté', category:'legs', pattern:'squat', equipment:'bodyweight', difficulty:'intermediate', targetMuscles:['adducteurs','quadriceps','hanches'], c7Risk:'low', type:'reps', coachingCues:'S\'appuyer sur un support, descendre sur le côté', progressionRule:'Progresser vers squat cosaque libre', alternatives:['legs_lateral_lunge','legs_abduction_machine'], avoid:false },
    { id:'legs_lateral_lunge', name:'Fente latérale', category:'legs', pattern:'lunge', equipment:'bodyweight', difficulty:'intermediate', targetMuscles:['adducteurs','quadriceps','fessiers'], c7Risk:'low', type:'reps', coachingCues:'Pas de côté large, plier le genou de la jambe qui porte', progressionRule:'Ajouter haltère quand maîtrisé', alternatives:['legs_cossack_squat_assisted','legs_reverse_lunge'], avoid:false },
    { id:'legs_hamstring_slider', name:'Curl ischio sur disque glissant', category:'legs', pattern:'hip_hinge', equipment:'floor', difficulty:'intermediate', targetMuscles:['ischio-jambiers'], c7Risk:'low', type:'reps', coachingCues:'Allongé, talons sur disques, lever bassin puis tirer les talons', progressionRule:'Progresser vers nordic curl assisté', alternatives:['legs_leg_curl_machine','legs_rdl_light_db'], avoid:false },
    { id:'legs_nordic_curl_assisted', name:'Nordic curl assisté', category:'legs', pattern:'hip_hinge', equipment:'bodyweight', difficulty:'advanced', targetMuscles:['ischio-jambiers'], c7Risk:'medium', type:'reps', coachingCues:'Pieds fixés, s\'affaisser vers le sol en contrôlant', progressionRule:'Commencer avec bande pour assistance', alternatives:['legs_hamstring_slider','legs_leg_curl_machine'], avoid:false },
    { id:'legs_sled_push_light', name:'Poussée de traîneau légère', category:'legs', pattern:'carry', equipment:'machine', difficulty:'beginner', targetMuscles:['quadriceps','fessiers','mollets'], c7Risk:'low', type:'min', coachingCues:'Corps incliné vers l\'avant, pousser avec les jambes', progressionRule:'Augmenter charge ou distance', alternatives:['legs_farmer_walk_light','legs_walking_lunge'], avoid:false },
    { id:'legs_step_down', name:'Step down excentrique', category:'legs', pattern:'lunge', equipment:'bench', difficulty:'intermediate', targetMuscles:['quadriceps','stabilisateurs genou'], c7Risk:'low', type:'reps', coachingCues:'Descendre lentement sur une jambe depuis une marche', progressionRule:'Excellent pour la santé du genou', alternatives:['legs_stepup','legs_split_squat'], avoid:false },
    { id:'legs_single_leg_rdl_bw', name:'RDL unilatéral poids du corps', category:'legs', pattern:'hip_hinge', equipment:'bodyweight', difficulty:'intermediate', targetMuscles:['ischio-jambiers','fessiers','équilibre'], c7Risk:'low', type:'reps', coachingCues:'Une jambe au sol, pencher le tronc et lever la jambe arrière', progressionRule:'Excellent pour équilibre et ischio-jambiers', alternatives:['legs_good_morning_bw','legs_rdl_light_db'], avoid:false },

    /* ── CORE (22) ── */
    { id:'core_dead_bug', name:'Dead bug', category:'core', pattern:'anti_extension', equipment:'floor', difficulty:'beginner', targetMuscles:['transverse abdominal','core profond'], c7Risk:'low', type:'reps', coachingCues:'Dos collé au sol, alterner bras-jambe opposés lentement', progressionRule:'Ajouter des séries avant de complexifier', alternatives:['core_bird_dog','core_plank_knee'], avoid:false },
    { id:'core_bird_dog', name:'Bird dog', category:'core', pattern:'anti_rotation', equipment:'floor', difficulty:'beginner', targetMuscles:['érecteurs spinaux','core','fessiers'], c7Risk:'low', type:'reps', coachingCues:'À quatre pattes, étendre bras et jambe opposés, dos plat', progressionRule:'Tenir 3 secondes en extension avant de changer', alternatives:['core_dead_bug','core_plank_knee'], avoid:false },
    { id:'core_mcgill_curlup', name:'McGill curl-up', category:'core', pattern:'flexion', equipment:'floor', difficulty:'beginner', targetMuscles:['rectus abdominis','core profond'], c7Risk:'low', type:'reps', coachingCues:'Une main sous la lordose, lever légèrement la tête et les épaules', progressionRule:'Parfait pour renforcer sans charger la colonne', alternatives:['core_controlled_crunch','core_dead_bug'], avoid:false },
    { id:'core_plank_knee', name:'Planche sur les genoux', category:'core', pattern:'anti_extension', equipment:'floor', difficulty:'beginner', targetMuscles:['core','trapèzes','épaules'], c7Risk:'low', type:'sec', coachingCues:'Genoux au sol, corps aligné, ne pas bomber le dos', progressionRule:'Passer à la planche stricte', alternatives:['core_dead_bug','core_plank_strict'], avoid:false },
    { id:'core_plank_strict', name:'Planche stricte', category:'core', pattern:'anti_extension', equipment:'floor', difficulty:'intermediate', targetMuscles:['core','épaules','fessiers'], c7Risk:'low', type:'sec', coachingCues:'Corps aligné de la tête aux talons, fessiers serrés', progressionRule:'Ajouter 5 secondes par semaine', alternatives:['core_plank_knee','core_plank_long'], avoid:false },
    { id:'core_plank_long', name:'Planche longue avancée', category:'core', pattern:'anti_extension', equipment:'floor', difficulty:'advanced', targetMuscles:['core profond','érecteurs'], c7Risk:'low', type:'sec', coachingCues:'Mains plus loin devant pour augmenter le levier', progressionRule:'Exercice avancé, maîtriser planche stricte d\'abord', alternatives:['core_plank_strict','core_ab_wheel_partial'], avoid:false },
    { id:'core_side_plank_knee', name:'Planche latérale sur genou', category:'core', pattern:'anti_rotation', equipment:'floor', difficulty:'beginner', targetMuscles:['obliques','abducteurs'], c7Risk:'low', type:'sec', coachingCues:'Genou au sol, hanche droite, corps aligné', progressionRule:'Passer à la planche latérale stricte', alternatives:['core_side_plank_strict','core_dead_bug'], avoid:false },
    { id:'core_side_plank_strict', name:'Planche latérale stricte', category:'core', pattern:'anti_rotation', equipment:'floor', difficulty:'intermediate', targetMuscles:['obliques','fessiers moyens'], c7Risk:'low', type:'sec', coachingCues:'Pieds empilés ou décalés, hanche vers le plafond', progressionRule:'Ajouter 5 secondes par semaine, passer à bras tendu', alternatives:['core_side_plank_knee','core_pallof_press'], avoid:false },
    { id:'core_hollow_hold_tuck', name:'Hollow hold position groupée', category:'core', pattern:'anti_extension', equipment:'floor', difficulty:'beginner', targetMuscles:['abdominaux','hip flexors'], c7Risk:'low', type:'sec', coachingCues:'Genoux groupés, creux lombaire aplati, bas du dos au sol', progressionRule:'Passer au hollow hold jambes tendues', alternatives:['core_plank_knee','core_dead_bug'], avoid:false },
    { id:'core_hollow_hold', name:'Hollow hold', category:'core', pattern:'anti_extension', equipment:'floor', difficulty:'intermediate', targetMuscles:['abdominaux','hip flexors'], c7Risk:'low', type:'sec', coachingCues:'Jambes tendues, bras tendus au-dessus, bas du dos collé au sol', progressionRule:'Viser 30 secondes propres avant de progresser', alternatives:['core_hollow_hold_tuck','core_plank_strict'], avoid:false },
    { id:'core_pallof_press', name:'Pallof press', category:'core', pattern:'anti_rotation', equipment:'cable', difficulty:'intermediate', targetMuscles:['obliques','core profond'], c7Risk:'low', type:'kg', coachingCues:'Debout de côté, pousser et ramener la câble devant la poitrine', progressionRule:'Ajouter charge progressivement', alternatives:['core_cable_antirotation','core_side_plank_strict'], avoid:false },
    { id:'core_cable_antirotation', name:'Anti-rotation câble', category:'core', pattern:'anti_rotation', equipment:'cable', difficulty:'intermediate', targetMuscles:['obliques','core profond'], c7Risk:'low', type:'kg', coachingCues:'Tenir câble à deux mains, résister à la rotation', progressionRule:'Varier les angles et positions', alternatives:['core_pallof_press','core_side_plank_strict'], avoid:false },
    { id:'core_reverse_crunch', name:'Crunch inversé', category:'core', pattern:'flexion', equipment:'floor', difficulty:'beginner', targetMuscles:['abdominaux inférieurs'], c7Risk:'low', type:'reps', coachingCues:'Ramener les genoux vers la poitrine, soulever légèrement les hanches', progressionRule:'Contrôle strict, pas de balancement', alternatives:['core_controlled_crunch','core_leg_raise_bent'], avoid:false },
    { id:'core_controlled_crunch', name:'Crunch contrôlé', category:'core', pattern:'flexion', equipment:'floor', difficulty:'beginner', targetMuscles:['rectus abdominis'], c7Risk:'low', type:'reps', coachingCues:'Lever légèrement les épaules, pas d\'élan, contrôle excentrique', progressionRule:'Qualité avant quantité', alternatives:['core_mcgill_curlup','core_reverse_crunch'], avoid:false },
    { id:'core_leg_raise_bent', name:'Relevé de jambes fléchies', category:'core', pattern:'flexion', equipment:'floor', difficulty:'beginner', targetMuscles:['abdominaux inférieurs','hip flexors'], c7Risk:'low', type:'reps', coachingCues:'Dos collé au sol, genoux légèrement fléchis', progressionRule:'Passer jambes tendues quand maîtrisé', alternatives:['core_reverse_crunch','core_hanging_knee_raise_assisted'], avoid:false },
    { id:'core_hanging_knee_raise_assisted', name:'Relevé de genoux à la barre assisté', category:'core', pattern:'flexion', equipment:'bar', difficulty:'beginner', targetMuscles:['abdominaux inférieurs','hip flexors'], c7Risk:'low', type:'reps', coachingCues:'Sangles ou barre basse, ramener genoux vers poitrine', progressionRule:'Réduire assistance, passer barre libre', alternatives:['core_leg_raise_bent','core_reverse_crunch'], avoid:false },
    { id:'core_mountain_climber_slow', name:'Mountain climber lent', category:'core', pattern:'anti_extension', equipment:'floor', difficulty:'beginner', targetMuscles:['core','épaules','hip flexors'], c7Risk:'low', type:'reps', coachingCues:'Position pompe, ramener genou vers poitrine lentement', progressionRule:'Garder hanches stables, pas de rotation', alternatives:['core_plank_strict','core_dead_bug'], avoid:false },
    { id:'core_bear_crawl_hold', name:'Position bear crawl statique', category:'core', pattern:'anti_extension', equipment:'floor', difficulty:'beginner', targetMuscles:['core profond','épaules'], c7Risk:'low', type:'sec', coachingCues:'À quatre pattes genoux soulevés de 5cm, dos plat', progressionRule:'Ajouter déplacements progressivement', alternatives:['core_plank_knee','core_bird_dog'], avoid:false },
    { id:'core_ab_wheel_partial', name:'Ab wheel partiel', category:'core', pattern:'anti_extension', equipment:'floor', difficulty:'advanced', targetMuscles:['core profond','dorsaux','épaules'], c7Risk:'medium', type:'reps', coachingCues:'Rouler seulement de 30-45°, revenir en contrôle', progressionRule:'Augmenter amplitude progressivement', alternatives:['core_plank_long','core_hollow_hold'], avoid:false },
    { id:'core_farmer_carry_light', name:'Farmer carry léger', category:'core', pattern:'carry', equipment:'dumbbells', difficulty:'beginner', targetMuscles:['core','trapèzes','obliques'], c7Risk:'low', type:'min', coachingCues:'Haltères aux côtés, dos droit, épaules basses', progressionRule:'Augmenter distance ou charge', alternatives:['core_suitcase_carry','core_pallof_press'], avoid:false },
    { id:'core_suitcase_carry', name:'Suitcase carry', category:'core', pattern:'anti_rotation', equipment:'dumbbells', difficulty:'intermediate', targetMuscles:['obliques','core profond'], c7Risk:'low', type:'min', coachingCues:'Un seul haltère, résister à l\'inclinaison latérale', progressionRule:'Augmenter distance ou charge, alterner côtés', alternatives:['core_farmer_carry_light','core_pallof_press'], avoid:false },
    { id:'core_stir_the_pot', name:'Stir the pot sur ballon', category:'core', pattern:'anti_extension', equipment:'bench', difficulty:'advanced', targetMuscles:['core profond','stabilisateurs'], c7Risk:'low', type:'reps', coachingCues:'Avant-bras sur ballon de gym, faire des petits cercles', progressionRule:'Exercice avancé de stabilité core', alternatives:['core_plank_long','core_ab_wheel_partial'], avoid:false },

    /* ── BODYWEIGHT (38) ── */
    { id:'bw_incline_pushup', name:'Pompe inclinée BW', category:'bodyweight', pattern:'horizontal_push', equipment:'bench', difficulty:'beginner', targetMuscles:['pectoraux','triceps'], c7Risk:'low', type:'reps', coachingCues:'Mains sur banc, corps aligné, descente contrôlée', progressionRule:'Baisser la hauteur progressivement', alternatives:['bw_knee_pushup','bw_strict_pushup'], avoid:false },
    { id:'bw_knee_pushup', name:'Pompe sur genoux BW', category:'bodyweight', pattern:'horizontal_push', equipment:'floor', difficulty:'beginner', targetMuscles:['pectoraux','triceps'], c7Risk:'low', type:'reps', coachingCues:'Hanches alignées, ne pas bomber le bas du dos', progressionRule:'Passer aux pompes strictes quand 3x15 propres', alternatives:['bw_incline_pushup','bw_strict_pushup'], avoid:false },
    { id:'bw_strict_pushup', name:'Pompe stricte BW', category:'bodyweight', pattern:'horizontal_push', equipment:'floor', difficulty:'intermediate', targetMuscles:['pectoraux','triceps','gainage'], c7Risk:'low', type:'reps', coachingCues:'Corps planche, coudes à 45°, poitrine rase le sol', progressionRule:'Viser 4x20 avant variante déclinée', alternatives:['bw_incline_pushup','bw_decline_pushup'], avoid:false },
    { id:'bw_decline_pushup', name:'Pompe déclinée BW', category:'bodyweight', pattern:'horizontal_push', equipment:'bench', difficulty:'intermediate', targetMuscles:['pectoraux supérieurs','épaules'], c7Risk:'low', type:'reps', coachingCues:'Pieds sur banc, corps aligné, descente contrôlée', progressionRule:'Augmenter hauteur des pieds graduellement', alternatives:['bw_strict_pushup','bw_diamond_pushup'], avoid:false },
    { id:'bw_diamond_pushup', name:'Pompe diamant BW', category:'bodyweight', pattern:'horizontal_push', equipment:'floor', difficulty:'intermediate', targetMuscles:['triceps','pectoraux internes'], c7Risk:'low', type:'reps', coachingCues:'Mains en losange, coudes le long du corps', progressionRule:'Commencer genoux si trop difficile', alternatives:['bw_strict_pushup','bw_archer_pushup'], avoid:false },
    { id:'bw_archer_pushup', name:'Pompe archer BW', category:'bodyweight', pattern:'horizontal_push', equipment:'floor', difficulty:'advanced', targetMuscles:['pectoraux','triceps'], c7Risk:'low', type:'reps', coachingCues:'Un bras fléchi, l\'autre tendu en appui latéral', progressionRule:'Progression vers pompe à un bras', alternatives:['bw_diamond_pushup','bw_decline_pushup'], avoid:false },
    { id:'bw_scapular_pull', name:'Scapular pull BW', category:'bodyweight', pattern:'vertical_pull', equipment:'bar', difficulty:'beginner', targetMuscles:['trapèzes inférieurs','dentelé'], c7Risk:'low', type:'reps', coachingCues:'Bras tendus, déprimer les omoplates sans fléchir les coudes', progressionRule:'Base pour apprendre les tractions', alternatives:['bw_dead_hang','bw_negative_pullup'], avoid:false },
    { id:'bw_negative_pullup', name:'Traction négative BW', category:'bodyweight', pattern:'vertical_pull', equipment:'bar', difficulty:'intermediate', targetMuscles:['dorsaux','biceps'], c7Risk:'medium', type:'reps', coachingCues:'Monter en sautant, descendre en 5-8 secondes', progressionRule:'Viser 3x5 avant tractions assistées', alternatives:['bw_scapular_pull','bw_assisted_pullup'], avoid:false },
    { id:'bw_assisted_pullup', name:'Traction assistée BW', category:'bodyweight', pattern:'vertical_pull', equipment:'band', difficulty:'beginner', targetMuscles:['dorsaux','biceps'], c7Risk:'low', type:'reps', coachingCues:'Élastique sous les pieds, tirer jusqu\'au menton', progressionRule:'Bande plus légère progressivement', alternatives:['bw_negative_pullup','bw_strict_pullup'], avoid:false },
    { id:'bw_strict_pullup', name:'Traction stricte BW', category:'bodyweight', pattern:'vertical_pull', equipment:'bar', difficulty:'advanced', targetMuscles:['dorsaux','biceps','trapèzes'], c7Risk:'medium', type:'reps', coachingCues:'Partir de bras tendus, menton au-dessus de la barre', progressionRule:'Ajouter lest après 3x8 propres', alternatives:['bw_assisted_pullup','bw_chinup'], avoid:false },
    { id:'bw_chinup', name:'Chin-up BW', category:'bodyweight', pattern:'vertical_pull', equipment:'bar', difficulty:'advanced', targetMuscles:['biceps','dorsaux'], c7Risk:'medium', type:'reps', coachingCues:'Prise supination, tirer jusqu\'au menton', progressionRule:'Ajouter lest après 3x8 propres', alternatives:['bw_strict_pullup','bw_assisted_pullup'], avoid:false },
    { id:'bw_dead_hang', name:'Dead hang BW', category:'bodyweight', pattern:'vertical_pull', equipment:'bar', difficulty:'beginner', targetMuscles:['dorsaux','avant-bras'], c7Risk:'medium', type:'sec', coachingCues:'Décompresser la colonne, pas de tension cervicale', progressionRule:'Viser 60s continu', alternatives:['bw_scapular_pull','bw_negative_pullup'], avoid:false },
    { id:'bw_bench_dip_assisted', name:'Dip banc assisté BW', category:'bodyweight', pattern:'vertical_push', equipment:'bench', difficulty:'beginner', targetMuscles:['triceps','pectoraux inférieurs'], c7Risk:'medium', type:'reps', coachingCues:'Pieds au sol pour assistance', progressionRule:'Réduire l\'aide des pieds progressivement', alternatives:['bw_bench_dip_strict','bw_parallel_dip_negative'], avoid:false },
    { id:'bw_bench_dip_strict', name:'Dip banc strict BW', category:'bodyweight', pattern:'vertical_push', equipment:'bench', difficulty:'intermediate', targetMuscles:['triceps','pectoraux inférieurs'], c7Risk:'medium', type:'reps', coachingCues:'Jambes tendues, épaules basses, descente contrôlée', progressionRule:'Passer aux dips parallèles', alternatives:['bw_bench_dip_assisted','bw_parallel_dip_negative'], avoid:false },
    { id:'bw_parallel_dip_negative', name:'Dip parallèles négatif BW', category:'bodyweight', pattern:'vertical_push', equipment:'bodyweight', difficulty:'intermediate', targetMuscles:['triceps','pectoraux'], c7Risk:'medium', type:'reps', coachingCues:'Monter en sautant, descendre en 5 secondes', progressionRule:'Ajouter des dips assistés entre les négatifs', alternatives:['bw_bench_dip_strict','bw_assisted_dip'], avoid:false },
    { id:'bw_assisted_dip', name:'Dip assisté BW', category:'bodyweight', pattern:'vertical_push', equipment:'band', difficulty:'beginner', targetMuscles:['triceps','pectoraux'], c7Risk:'low', type:'reps', coachingCues:'Élastique pour assistance, réduire progressivement', progressionRule:'Bande plus légère progressivement', alternatives:['bw_bench_dip_strict','bw_strict_dip'], avoid:false },
    { id:'bw_strict_dip', name:'Dip strict BW', category:'bodyweight', pattern:'vertical_push', equipment:'bodyweight', difficulty:'advanced', targetMuscles:['triceps','pectoraux inférieurs'], c7Risk:'medium', type:'reps', coachingCues:'Corps vertical pour triceps, légèrement penché pour pecs', progressionRule:'Ajouter lest après 3x10 propres', alternatives:['bw_assisted_dip','bw_parallel_dip_negative'], avoid:false },
    { id:'bw_box_squat', name:'Squat sur boîte BW', category:'bodyweight', pattern:'squat', equipment:'bench', difficulty:'beginner', targetMuscles:['quadriceps','fessiers'], c7Risk:'low', type:'reps', coachingCues:'S\'asseoir sur la boîte, se lever avec contrôle', progressionRule:'Réduire hauteur progressivement', alternatives:['bw_squat','legs_goblet_squat'], avoid:false },
    { id:'bw_squat', name:'Squat BW', category:'bodyweight', pattern:'squat', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['quadriceps','fessiers'], c7Risk:'low', type:'reps', coachingCues:'Pieds écartés, genoux dans l\'axe des orteils', progressionRule:'Ajouter volume puis poids', alternatives:['bw_box_squat','bw_split_squat'], avoid:false },
    { id:'bw_split_squat', name:'Split squat BW', category:'bodyweight', pattern:'lunge', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['quadriceps','fessiers'], c7Risk:'low', type:'reps', coachingCues:'Jambe avant à 90°, genou arrière proche du sol', progressionRule:'Ajouter haltères quand 3x12 propres', alternatives:['bw_squat','bw_bulgarian_split_squat'], avoid:false },
    { id:'bw_bulgarian_split_squat', name:'Bulgarian split squat BW', category:'bodyweight', pattern:'lunge', equipment:'bench', difficulty:'advanced', targetMuscles:['quadriceps','fessiers'], c7Risk:'low', type:'reps', coachingCues:'Pied arrière sur banc, genou avant dans l\'axe', progressionRule:'Ajouter haltères après maîtrise', alternatives:['bw_split_squat','legs_reverse_lunge'], avoid:false },
    { id:'bw_pistol_squat_assisted', name:'Squat pistol assisté BW', category:'bodyweight', pattern:'squat', equipment:'bodyweight', difficulty:'intermediate', targetMuscles:['quadriceps','fessiers','cheville'], c7Risk:'low', type:'reps', coachingCues:'S\'appuyer sur un support, descendre sur une jambe', progressionRule:'Réduire l\'assistance progressivement', alternatives:['bw_split_squat','bw_squat'], avoid:false },
    { id:'bw_pistol_squat', name:'Squat pistol BW', category:'bodyweight', pattern:'squat', equipment:'bodyweight', difficulty:'advanced', targetMuscles:['quadriceps','fessiers','équilibre'], c7Risk:'low', type:'reps', coachingCues:'Une jambe tendue devant, descendre sur l\'autre jambe', progressionRule:'Maîtriser version assistée d\'abord', alternatives:['bw_pistol_squat_assisted','bw_bulgarian_split_squat'], avoid:false },
    { id:'bw_dead_bug', name:'Dead bug BW', category:'bodyweight', pattern:'anti_extension', equipment:'floor', difficulty:'beginner', targetMuscles:['core profond','transverse'], c7Risk:'low', type:'reps', coachingCues:'Dos collé au sol, alterner bras-jambe opposés', progressionRule:'Ajouter séries progressivement', alternatives:['core_bird_dog','bw_plank_30s'], avoid:false },
    { id:'bw_plank_30s', name:'Planche 30s', category:'bodyweight', pattern:'anti_extension', equipment:'floor', difficulty:'beginner', targetMuscles:['core','épaules'], c7Risk:'low', type:'sec', coachingCues:'Corps aligné, fessiers serrés', progressionRule:'Progresser vers 60s puis variantes', alternatives:['bw_dead_bug','bw_plank_60s'], avoid:false },
    { id:'bw_plank_60s', name:'Planche 60s', category:'bodyweight', pattern:'anti_extension', equipment:'floor', difficulty:'intermediate', targetMuscles:['core','épaules'], c7Risk:'low', type:'sec', coachingCues:'Corps aligné, pas de compensation', progressionRule:'Progresser vers planche longue ou variantes', alternatives:['bw_plank_30s','bw_side_plank_45s'], avoid:false },
    { id:'bw_side_plank_45s', name:'Planche latérale 45s', category:'bodyweight', pattern:'anti_rotation', equipment:'floor', difficulty:'intermediate', targetMuscles:['obliques','fessiers moyens'], c7Risk:'low', type:'sec', coachingCues:'Hanche vers le plafond, corps aligné', progressionRule:'Progresser vers 60s ou variantes', alternatives:['bw_plank_60s','core_side_plank_strict'], avoid:false },
    { id:'bw_hollow_hold', name:'Hollow hold BW', category:'bodyweight', pattern:'anti_extension', equipment:'floor', difficulty:'intermediate', targetMuscles:['abdominaux','hip flexors'], c7Risk:'low', type:'sec', coachingCues:'Jambes tendues, bras au-dessus, bas du dos au sol', progressionRule:'Viser 30s propres', alternatives:['bw_plank_60s','core_hollow_hold'], avoid:false },
    { id:'bw_hanging_knee_raise', name:'Relevé de genoux à la barre', category:'bodyweight', pattern:'flexion', equipment:'bar', difficulty:'intermediate', targetMuscles:['abdominaux inférieurs','hip flexors'], c7Risk:'low', type:'reps', coachingCues:'Ramener genoux vers poitrine, contrôle excentrique', progressionRule:'Passer aux jambes tendues', alternatives:['bw_hollow_hold','core_hanging_knee_raise_assisted'], avoid:false },
    { id:'bw_deep_squat_hold', name:'Deep squat tenu', category:'bodyweight', pattern:'squat', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['hanches','chevilles','quadriceps'], c7Risk:'low', type:'sec', coachingCues:'Talon au sol si possible, dos droit, s\'aider d\'un support', progressionRule:'Augmenter durée et profondeur', alternatives:['bw_squat','mob_deep_squat_hold'], avoid:false },
    { id:'bw_cossack_squat_assisted', name:'Squat cosaque assisté BW', category:'bodyweight', pattern:'squat', equipment:'bodyweight', difficulty:'intermediate', targetMuscles:['adducteurs','hanches'], c7Risk:'low', type:'reps', coachingCues:'S\'appuyer sur un support, fente latérale profonde', progressionRule:'Réduire assistance progressivement', alternatives:['bw_squat','legs_lateral_lunge'], avoid:false },
    { id:'bw_bear_crawl', name:'Bear crawl', category:'bodyweight', pattern:'carry', equipment:'floor', difficulty:'intermediate', targetMuscles:['core','épaules','hip flexors'], c7Risk:'low', type:'min', coachingCues:'Genoux à 5cm du sol, dos plat, mouvements coordonnés', progressionRule:'Augmenter distance ou vitesse', alternatives:['core_bear_crawl_hold','bw_plank_60s'], avoid:false },
    { id:'bw_crab_hold', name:'Position crabe', category:'bodyweight', pattern:'anti_extension', equipment:'floor', difficulty:'beginner', targetMuscles:['épaules postérieures','triceps','fessiers'], c7Risk:'low', type:'sec', coachingCues:'Hanches vers le plafond, épaules en arrière', progressionRule:'Ajouter déplacements progressivement', alternatives:['bw_bear_crawl','core_bear_crawl_hold'], avoid:false },
    { id:'bw_wall_handstand_hold', name:'Appui renversé contre le mur', category:'bodyweight', pattern:'vertical_push', equipment:'bodyweight', difficulty:'advanced', targetMuscles:['épaules','triceps','core'], c7Risk:'medium', type:'sec', coachingCues:'Corps aligné contre le mur, épaules actives', progressionRule:'Maîtriser pike hold d\'abord', alternatives:['bw_pike_hold','push_landmine_press_light'], avoid:false },
    { id:'bw_pike_hold', name:'Pike hold', category:'bodyweight', pattern:'vertical_push', equipment:'floor', difficulty:'intermediate', targetMuscles:['épaules','triceps'], c7Risk:'low', type:'sec', coachingCues:'Hanches hautes, bras tendus, tête entre les bras', progressionRule:'Progresser vers appui renversé', alternatives:['bw_wall_handstand_hold','push_strict_pushup'], avoid:false },
    { id:'bw_l_sit_tuck', name:'L-sit groupé', category:'bodyweight', pattern:'anti_extension', equipment:'floor', difficulty:'advanced', targetMuscles:['hip flexors','core','triceps'], c7Risk:'low', type:'sec', coachingCues:'Mains au sol, genoux groupés, soulever les hanches', progressionRule:'Étendre une jambe puis les deux', alternatives:['bw_hollow_hold','core_hollow_hold'], avoid:false },
    { id:'bw_skin_the_cat_partial', name:'Skin the cat partiel', category:'bodyweight', pattern:'vertical_pull', equipment:'bar', difficulty:'advanced', targetMuscles:['dorsaux','épaules','core'], c7Risk:'medium', type:'reps', coachingCues:'Rotation partielle des épaules, ne pas forcer l\'amplitude', progressionRule:'Exercice avancé, maîtriser dead hang d\'abord', alternatives:['bw_dead_hang','bw_strict_pullup'], avoid:false },
    { id:'bw_tuck_planche_lean', name:'Tuck planche lean', category:'bodyweight', pattern:'horizontal_push', equipment:'floor', difficulty:'advanced', targetMuscles:['épaules antérieures','core','triceps'], c7Risk:'low', type:'sec', coachingCues:'Pencher le corps vers l\'avant avec les genoux groupés', progressionRule:'Progression vers pseudo planche puis planche', alternatives:['push_pseudo_planche','bw_pike_hold'], avoid:false },

    /* ── MOBILITY_FLEXIBILITY (45) ── */
    { id:'mob_neck_rotations', name:'Rotations cervicales douces', category:'mobility_flexibility', pattern:'mobilization', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['cervicaux','trapèzes supérieurs'], c7Risk:'low', type:'reps', coachingCues:'Mouvements lents et doux, ne jamais forcer', progressionRule:'Échauffement quotidien, jamais brusque', alternatives:['mob_shoulder_cars','wu_joint_mobility_circuit'], avoid:false },
    { id:'mob_shoulder_cars', name:'CARs d\'épaule', category:'mobility_flexibility', pattern:'mobilization', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['épaules','coiffe des rotateurs'], c7Risk:'low', type:'reps', coachingCues:'Rotation complète contrôlée de l\'épaule, amplitude maximale', progressionRule:'Quotidien pour maintenir la mobilité', alternatives:['mob_scapular_circles','mob_wrist_circles'], avoid:false },
    { id:'mob_scapular_circles', name:'Cercles scapulaires', category:'mobility_flexibility', pattern:'mobilization', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['trapèzes','dentelé antérieur','rhomboïdes'], c7Risk:'low', type:'reps', coachingCues:'Faire des cercles avec les épaules, amplitude maximale', progressionRule:'Intégrer dans l\'échauffement', alternatives:['mob_shoulder_cars','wu_band_pull_apart'], avoid:false },
    { id:'mob_wrist_circles', name:'Cercles de poignets', category:'mobility_flexibility', pattern:'mobilization', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['avant-bras','poignets'], c7Risk:'low', type:'reps', coachingCues:'Cercles complets dans les deux sens', progressionRule:'Essentiel avant pompes et tractions', alternatives:['mob_wrist_extension','mob_shoulder_cars'], avoid:false },
    { id:'mob_wrist_extension', name:'Étirement extension de poignet', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'beginner', targetMuscles:['fléchisseurs poignet','avant-bras'], c7Risk:'low', type:'sec', coachingCues:'Mains à plat doigts vers les genoux, reculer les hanches', progressionRule:'Maintenir 30-60s, progresser lentement', alternatives:['mob_wrist_circles','mob_cat_cow'], avoid:false },
    { id:'mob_thoracic_rotation', name:'Rotation thoracique', category:'mobility_flexibility', pattern:'rotation', equipment:'floor', difficulty:'beginner', targetMuscles:['thoracique','obliques'], c7Risk:'low', type:'reps', coachingCues:'À quatre pattes, main derrière la tête, rotation maximale', progressionRule:'Faire des deux côtés, maintenir 2s en haut', alternatives:['mob_thread_the_needle','mob_cat_cow'], avoid:false },
    { id:'mob_cat_cow', name:'Cat-Cow', category:'mobility_flexibility', pattern:'mobilization', equipment:'floor', difficulty:'beginner', targetMuscles:['colonne vertébrale','érecteurs','abdominaux'], c7Risk:'low', type:'reps', coachingCues:'Alterner flexion et extension de la colonne lentement', progressionRule:'10 répétitions, synchroniser avec la respiration', alternatives:['mob_thoracic_rotation','mob_child_pose'], avoid:false },
    { id:'mob_thread_the_needle', name:'Thread the needle', category:'mobility_flexibility', pattern:'rotation', equipment:'floor', difficulty:'beginner', targetMuscles:['thoracique','épaules','trapèzes'], c7Risk:'low', type:'reps', coachingCues:'À quatre pattes, glisser un bras sous le corps, maintenir 2s', progressionRule:'Augmenter l\'amplitude progressivement', alternatives:['mob_thoracic_rotation','mob_cat_cow'], avoid:false },
    { id:'mob_child_pose', name:'Posture de l\'enfant', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'beginner', targetMuscles:['dorsaux','épaules','hanches'], c7Risk:'low', type:'sec', coachingCues:'Bras tendus devant, hanches vers les talons, respiration profonde', progressionRule:'Maintenir 60-120s, idéal pour récupération', alternatives:['mob_cat_cow','mob_lat_stretch_bench'], avoid:false },
    { id:'mob_doorway_chest_stretch', name:'Étirement poitrine dans l\'encadrement', category:'mobility_flexibility', pattern:'stretch', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['pectoraux','deltoïdes antérieurs'], c7Risk:'low', type:'sec', coachingCues:'Bras à 90° contre le cadre, avancer légèrement', progressionRule:'Maintenir 30-60s, varier la hauteur des bras', alternatives:['mob_child_pose','mob_cobra_stretch'], avoid:false },
    { id:'mob_lat_stretch_bench', name:'Étirement dorsaux sur banc', category:'mobility_flexibility', pattern:'stretch', equipment:'bench', difficulty:'beginner', targetMuscles:['dorsaux','grand rond'], c7Risk:'low', type:'sec', coachingCues:'Coudes sur banc, hanches en arrière, front vers le sol', progressionRule:'Excellent pour mobilité post-entraînement', alternatives:['mob_child_pose','mob_cat_cow'], avoid:false },
    { id:'mob_couch_stretch', name:'Couch stretch', category:'mobility_flexibility', pattern:'stretch', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['quadriceps','hip flexors','rectus femoris'], c7Risk:'low', type:'sec', coachingCues:'Genou arrière contre le mur, hanche vers le sol', progressionRule:'Tenir 60-90s par côté, essentiel pour sedentaires', alternatives:['mob_low_lunge','mob_lizard_lunge'], avoid:false },
    { id:'mob_hip_circles', name:'Cercles de hanches', category:'mobility_flexibility', pattern:'mobilization', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['hanches','fessiers','adducteurs'], c7Risk:'low', type:'reps', coachingCues:'Cercles larges et lents, amplitude maximale', progressionRule:'Intégrer dans l\'échauffement jambes', alternatives:['mob_90_90_switch','mob_cat_cow'], avoid:false },
    { id:'mob_90_90_switch', name:'90/90 avec transition', category:'mobility_flexibility', pattern:'mobilization', equipment:'floor', difficulty:'intermediate', targetMuscles:['rotateurs de hanche','hanches','fessiers'], c7Risk:'low', type:'reps', coachingCues:'Passer d\'un 90/90 à l\'autre fluidement', progressionRule:'Ajouter rotation de tronc en position finale', alternatives:['mob_90_90_hold','mob_hip_circles'], avoid:false },
    { id:'mob_90_90_hold', name:'90/90 tenu', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'beginner', targetMuscles:['rotateurs de hanche','piriforme'], c7Risk:'low', type:'sec', coachingCues:'Maintenir 60-90s de chaque côté, dos droit', progressionRule:'Augmenter durée progressivement', alternatives:['mob_90_90_switch','mob_pigeon_stretch'], avoid:false },
    { id:'mob_pigeon_stretch', name:'Pigeon stretch', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'intermediate', targetMuscles:['piriforme','rotateurs externes hanche'], c7Risk:'low', type:'sec', coachingCues:'Jambe avant perpendiculaire, hanche vers le sol', progressionRule:'Tenir 60-120s par côté, aller progressivement', alternatives:['mob_90_90_hold','mob_figure_4_stretch'], avoid:false },
    { id:'mob_figure_4_stretch', name:'Étirement figure 4', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'beginner', targetMuscles:['piriforme','fessiers'], c7Risk:'low', type:'sec', coachingCues:'Allongé, croiser cheville sur genou, tirer vers la poitrine', progressionRule:'Alternative moins intense au pigeon pour débutants', alternatives:['mob_pigeon_stretch','mob_90_90_hold'], avoid:false },
    { id:'mob_low_lunge', name:'Fente basse', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'beginner', targetMuscles:['hip flexors','quadriceps'], c7Risk:'low', type:'sec', coachingCues:'Genou arrière au sol, hanche vers l\'avant', progressionRule:'Tenir 60-90s par côté', alternatives:['mob_couch_stretch','mob_lizard_lunge'], avoid:false },
    { id:'mob_lizard_lunge', name:'Lizard lunge', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'intermediate', targetMuscles:['hip flexors','adducteurs','hanches'], c7Risk:'low', type:'sec', coachingCues:'Pied avant à l\'extérieur de la main, descendre plus bas', progressionRule:'Version avancée de la fente basse', alternatives:['mob_low_lunge','mob_pigeon_stretch'], avoid:false },
    { id:'mob_half_split', name:'Demi grand écart', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'intermediate', targetMuscles:['ischio-jambiers','hanches'], c7Risk:'low', type:'sec', coachingCues:'Jambe avant tendue, torse vers la jambe', progressionRule:'Tenir 60-90s par côté', alternatives:['mob_lizard_lunge','mob_forward_fold'], avoid:false },
    { id:'mob_forward_fold', name:'Flexion avant debout', category:'mobility_flexibility', pattern:'stretch', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['ischio-jambiers','dorsaux','mollets'], c7Risk:'low', type:'sec', coachingCues:'Genoux légèrement fléchis, laisser la tête pendre', progressionRule:'Fléchir progressivement les genoux pour approfondir', alternatives:['mob_half_split','mob_seated_pike'], avoid:false },
    { id:'mob_seated_pike', name:'Pike assis', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'intermediate', targetMuscles:['ischio-jambiers','mollets','bas du dos'], c7Risk:'low', type:'sec', coachingCues:'Jambes tendues, torse vers les jambes, pieds fléchis', progressionRule:'Tenir 60-120s, approfondir progressivement', alternatives:['mob_forward_fold','mob_half_split'], avoid:false },
    { id:'mob_pancake_good_morning', name:'Pancake good morning', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'advanced', targetMuscles:['adducteurs','ischio-jambiers','dos'], c7Risk:'low', type:'sec', coachingCues:'Jambes écartées assises, se pencher vers l\'avant dos plat', progressionRule:'Progresser vers straddle hold', alternatives:['mob_straddle_hold','mob_seated_pike'], avoid:false },
    { id:'mob_straddle_hold', name:'Straddle hold', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'intermediate', targetMuscles:['adducteurs','ischio-jambiers'], c7Risk:'low', type:'sec', coachingCues:'Jambes écartées, maintenir la position, respirer', progressionRule:'Augmenter l\'angle d\'écartement progressivement', alternatives:['mob_pancake_good_morning','mob_butterfly_stretch'], avoid:false },
    { id:'mob_frog_stretch', name:'Frog stretch', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'intermediate', targetMuscles:['adducteurs','hanches'], c7Risk:'low', type:'sec', coachingCues:'À quatre pattes, genoux écartés, s\'enfoncer vers le sol', progressionRule:'Tenir 60-120s, balancer légèrement', alternatives:['mob_butterfly_stretch','mob_straddle_hold'], avoid:false },
    { id:'mob_butterfly_stretch', name:'Papillon assis', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'beginner', targetMuscles:['adducteurs','hanches internes'], c7Risk:'low', type:'sec', coachingCues:'Plantes des pieds ensemble, genoux vers le sol', progressionRule:'Tenir 60-120s, approfondir progressivement', alternatives:['mob_frog_stretch','mob_90_90_hold'], avoid:false },
    { id:'mob_deep_squat_hold', name:'Deep squat tenu', category:'mobility_flexibility', pattern:'mobilization', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['chevilles','hanches','quadriceps'], c7Risk:'low', type:'sec', coachingCues:'Talon au sol, dos droit, s\'aider d\'un support si nécessaire', progressionRule:'Augmenter durée et profondeur', alternatives:['mob_hip_circles','mob_frog_stretch'], avoid:false },
    { id:'mob_calf_wall_stretch', name:'Étirement mollets contre le mur', category:'mobility_flexibility', pattern:'stretch', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['gastrocnémiens','soléaire'], c7Risk:'low', type:'sec', coachingCues:'Pied contre le mur, genou fléchi ou tendu selon cible', progressionRule:'Tenir 60s par côté, essentiel pour la dorsiflexion', alternatives:['mob_ankle_dorsiflexion','wu_ankle_bounce'], avoid:false },
    { id:'mob_ankle_dorsiflexion', name:'Dorsiflexion cheville', category:'mobility_flexibility', pattern:'mobilization', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['cheville','tibial antérieur'], c7Risk:'low', type:'reps', coachingCues:'Genou vers l\'avant devant le pied, talon au sol', progressionRule:'Améliore squat et atterrissage', alternatives:['mob_calf_wall_stretch','mob_deep_squat_hold'], avoid:false },
    { id:'mob_hamstring_flossing', name:'Flossing ischio-jambiers', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'intermediate', targetMuscles:['ischio-jambiers','nerf sciatique'], c7Risk:'low', type:'reps', coachingCues:'Allongé, jambe tendue vers le haut, fléchir/étendre la cheville', progressionRule:'Technique de mobilisation nerveuse douce', alternatives:['mob_forward_fold','mob_seated_pike'], avoid:false },
    { id:'mob_adductor_rockback', name:'Rock back adducteurs', category:'mobility_flexibility', pattern:'mobilization', equipment:'floor', difficulty:'beginner', targetMuscles:['adducteurs','hanches'], c7Risk:'low', type:'reps', coachingCues:'À quatre pattes, genou de côté, se balancer vers l\'arrière', progressionRule:'Mouvement de mobilisation actif', alternatives:['mob_butterfly_stretch','mob_frog_stretch'], avoid:false },
    { id:'mob_front_split_supported', name:'Grand écart avant supporté', category:'mobility_flexibility', pattern:'stretch', equipment:'bodyweight', difficulty:'advanced', targetMuscles:['hip flexors','ischio-jambiers'], c7Risk:'low', type:'sec', coachingCues:'Blocs ou mains au sol pour supporter, descendre progressivement', progressionRule:'Progresser de 1-2 cm par mois', alternatives:['mob_half_split','mob_lizard_lunge'], avoid:false },
    { id:'mob_middle_split_supported', name:'Grand écart latéral supporté', category:'mobility_flexibility', pattern:'stretch', equipment:'bodyweight', difficulty:'advanced', targetMuscles:['adducteurs'], c7Risk:'low', type:'sec', coachingCues:'Mains au sol ou blocs, descendre lentement', progressionRule:'Progresser très lentement sur des semaines', alternatives:['mob_straddle_hold','mob_butterfly_stretch'], avoid:false },
    { id:'mob_pnf_hamstring', name:'PNF ischio-jambiers', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'intermediate', targetMuscles:['ischio-jambiers'], c7Risk:'low', type:'reps', coachingCues:'Contracter ischio 7s, relâcher 2s, étirer 30s, répéter 3 cycles', progressionRule:'Méthode PNF très efficace pour gains rapides', alternatives:['mob_seated_pike','mob_half_split'], avoid:false },
    { id:'mob_pnf_hip_flexor', name:'PNF hip flexors', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'intermediate', targetMuscles:['hip flexors','quadriceps'], c7Risk:'low', type:'reps', coachingCues:'En fente, contracter hip flexor 7s puis étirer 30s', progressionRule:'3 cycles par côté, progression rapide', alternatives:['mob_couch_stretch','mob_low_lunge'], avoid:false },
    { id:'mob_pnf_adductor', name:'PNF adducteurs', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'intermediate', targetMuscles:['adducteurs'], c7Risk:'low', type:'reps', coachingCues:'Contracter adducteurs 7s, relâcher, puis étirer 30s', progressionRule:'3 cycles, idéal pour grand écart latéral', alternatives:['mob_butterfly_stretch','mob_frog_stretch'], avoid:false },
    { id:'mob_bridge_prep', name:'Préparation au pont', category:'mobility_flexibility', pattern:'mobilization', equipment:'floor', difficulty:'intermediate', targetMuscles:['thoracique','épaules','hip flexors'], c7Risk:'medium', type:'reps', coachingCues:'Allongé, monter progressivement en pont, épaules actives', progressionRule:'Progression lente, mobilité thoracique d\'abord', alternatives:['mob_cobra_stretch','mob_cat_cow'], avoid:false },
    { id:'mob_cobra_stretch', name:'Étirement cobra', category:'mobility_flexibility', pattern:'stretch', equipment:'floor', difficulty:'beginner', targetMuscles:['abdominaux','hip flexors','thoracique'], c7Risk:'low', type:'sec', coachingCues:'Allongé ventre au sol, pousser avec les bras, bassin au sol', progressionRule:'Extension thoracique, maintenir 30-60s', alternatives:['mob_cat_cow','mob_bridge_prep'], avoid:false },
    { id:'mob_breathing_reset_9090', name:'Respiration reset 90/90', category:'mobility_flexibility', pattern:'recovery', equipment:'floor', difficulty:'beginner', targetMuscles:['diaphragme','core profond'], c7Risk:'low', type:'min', coachingCues:'Jambes à 90° contre un mur, respiration diaphragmatique profonde', progressionRule:'5 minutes quotidiennes pour récupération du système nerveux', alternatives:['mob_child_pose','wu_breathing_downshift'], avoid:false },
    { id:'mob_foam_roll_quads', name:'Foam roll quadriceps', category:'mobility_flexibility', pattern:'recovery', equipment:'foam_roller', difficulty:'beginner', targetMuscles:['quadriceps'], c7Risk:'low', type:'min', coachingCues:'Rouler lentement, s\'arrêter sur les zones tendues 20-30s', progressionRule:'Avant ou après l\'entraînement', alternatives:['mob_foam_roll_calves','mob_foam_roll_upper_back'], avoid:false },
    { id:'mob_foam_roll_calves', name:'Foam roll mollets', category:'mobility_flexibility', pattern:'recovery', equipment:'foam_roller', difficulty:'beginner', targetMuscles:['gastrocnémiens','soléaire'], c7Risk:'low', type:'min', coachingCues:'Rouler lentement de la cheville au genou', progressionRule:'Excellent avant course ou squat', alternatives:['mob_foam_roll_quads','mob_calf_wall_stretch'], avoid:false },
    { id:'mob_foam_roll_upper_back', name:'Foam roll haut du dos', category:'mobility_flexibility', pattern:'recovery', equipment:'foam_roller', difficulty:'beginner', targetMuscles:['thoracique','trapèzes'], c7Risk:'low', type:'min', coachingCues:'Rouler entre T4 et T10, éviter le cou et le bas du dos', progressionRule:'Excellent pour mobilité thoracique', alternatives:['mob_thoracic_rotation','mob_thread_the_needle'], avoid:false },
    { id:'mob_jefferson_curl_very_light', name:'Jefferson curl très léger', category:'mobility_flexibility', pattern:'stretch', equipment:'dumbbells', difficulty:'advanced', targetMuscles:['colonne vertébrale','ischio-jambiers'], c7Risk:'medium', type:'reps', coachingCues:'Poids très léger, vertèbre par vertèbre vers le bas, contrôle total', progressionRule:'Commencer sans poids, progression extrêmement lente', alternatives:['mob_forward_fold','mob_seated_pike'], avoid:false },
    { id:'mob_active_leg_swing', name:'Balancement de jambe actif', category:'mobility_flexibility', pattern:'mobilization', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['hanches','ischio-jambiers','hip flexors'], c7Risk:'low', type:'reps', coachingCues:'Balancer la jambe de l\'avant vers l\'arrière et latéralement', progressionRule:'Échauffement dynamique, augmenter l\'amplitude progressivement', alternatives:['mob_hip_circles','mob_low_lunge'], avoid:false },
    { id:'mob_world_greatest_stretch', name:'World greatest stretch', category:'mobility_flexibility', pattern:'mobilization', equipment:'floor', difficulty:'intermediate', targetMuscles:['hanches','thoracique','épaules','ischio-jambiers'], c7Risk:'low', type:'reps', coachingCues:'Fente avec rotation thoracique, enchaîner les mouvements fluidement', progressionRule:'5 reps par côté, excellent échauffement global', alternatives:['mob_lizard_lunge','mob_thoracic_rotation'], avoid:false },

    /* ── WARMUP_RECOVERY (22) ── */
    { id:'wu_walk_incline_5min', name:'Marche inclinée 5 minutes', category:'warmup_recovery', pattern:'warmup', equipment:'cardio', difficulty:'beginner', targetMuscles:['mollets','ischio-jambiers','cardiovasculaire'], c7Risk:'low', type:'min', coachingCues:'Tapis à 3-5% d\'inclinaison, allure confortable', progressionRule:'Échauffement général avant tout entraînement', alternatives:['wu_easy_bike_5min','wu_jumping_jacks_low'], avoid:false },
    { id:'wu_easy_bike_5min', name:'Vélo facile 5 minutes', category:'warmup_recovery', pattern:'warmup', equipment:'cardio', difficulty:'beginner', targetMuscles:['quadriceps','cardiovasculaire'], c7Risk:'low', type:'min', coachingCues:'Résistance légère, cadence modérée', progressionRule:'Alternative marche pour échauffement', alternatives:['wu_walk_incline_5min','wu_jumping_jacks_low'], avoid:false },
    { id:'wu_jumping_jacks_low', name:'Jumping jacks modérés', category:'warmup_recovery', pattern:'warmup', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['cardiovasculaire','coordination'], c7Risk:'low', type:'reps', coachingCues:'Mouvement contrôlé, ne pas sauter trop haut', progressionRule:'50-100 reps, élève la température corporelle', alternatives:['wu_walk_incline_5min','wu_easy_bike_5min'], avoid:false },
    { id:'wu_band_pull_apart', name:'Band pull-apart échauffement', category:'warmup_recovery', pattern:'warmup', equipment:'band', difficulty:'beginner', targetMuscles:['deltoïdes postérieurs','rhomboïdes'], c7Risk:'low', type:'reps', coachingCues:'Bras tendus, tirer l\'élastique jusqu\'à la poitrine', progressionRule:'2x15 avant tout entraînement push ou pull', alternatives:['wu_external_rotation_band','wu_scapular_pushup'], avoid:false },
    { id:'wu_external_rotation_band', name:'Rotation externe élastique', category:'warmup_recovery', pattern:'warmup', equipment:'band', difficulty:'beginner', targetMuscles:['coiffe des rotateurs','deltoïdes postérieurs'], c7Risk:'low', type:'reps', coachingCues:'Coude à 90°, rotation externe lente', progressionRule:'Essentiel pour santé de l\'épaule', alternatives:['wu_band_pull_apart','wu_scapular_pushup'], avoid:false },
    { id:'wu_scapular_pushup', name:'Scapular push-up', category:'warmup_recovery', pattern:'warmup', equipment:'floor', difficulty:'beginner', targetMuscles:['dentelé antérieur','trapèzes inférieurs'], c7Risk:'low', type:'reps', coachingCues:'En position pompe, protracter et rétracter les omoplates', progressionRule:'2x10 avant tout entraînement push', alternatives:['wu_band_pull_apart','wu_external_rotation_band'], avoid:false },
    { id:'wu_glute_bridge_warmup', name:'Hip bridge échauffement', category:'warmup_recovery', pattern:'warmup', equipment:'floor', difficulty:'beginner', targetMuscles:['fessiers','ischio-jambiers'], c7Risk:'low', type:'reps', coachingCues:'Activation fessiers légère, pas d\'effort maximal', progressionRule:'2x12 avant entraînement jambes', alternatives:['wu_bw_squat_warmup','wu_hip_hinge_drill'], avoid:false },
    { id:'wu_bw_squat_warmup', name:'Squat poids du corps échauffement', category:'warmup_recovery', pattern:'warmup', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['quadriceps','fessiers','hanches'], c7Risk:'low', type:'reps', coachingCues:'Mouvement complet, descente lente pour activer les muscles', progressionRule:'2x10 avant entraînement jambes', alternatives:['wu_glute_bridge_warmup','wu_hip_hinge_drill'], avoid:false },
    { id:'wu_hip_hinge_drill', name:'Drill hip hinge', category:'warmup_recovery', pattern:'warmup', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['ischio-jambiers','fessiers'], c7Risk:'low', type:'reps', coachingCues:'Mains sur les hanches, plier vers l\'avant dos plat', progressionRule:'Technique de base pour RDL et hip thrust', alternatives:['wu_glute_bridge_warmup','wu_bw_squat_warmup'], avoid:false },
    { id:'wu_ankle_bounce', name:'Rebonds de cheville', category:'warmup_recovery', pattern:'warmup', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['mollets','cheville'], c7Risk:'low', type:'reps', coachingCues:'Petits rebonds sur la pointe des pieds, atterrissage doux', progressionRule:'Activation proprioceptive de la cheville', alternatives:['wu_walk_incline_5min','mob_ankle_dorsiflexion'], avoid:false },
    { id:'wu_shoulder_dislocate_band', name:'Shoulder dislocate élastique', category:'warmup_recovery', pattern:'warmup', equipment:'band', difficulty:'intermediate', targetMuscles:['épaules','coiffe des rotateurs'], c7Risk:'low', type:'reps', coachingCues:'Élastique large, passer les bras de devant derrière', progressionRule:'Réduire la largeur de prise progressivement', alternatives:['wu_band_pull_apart','mob_shoulder_cars'], avoid:false },
    { id:'wu_dynamic_hamstring_sweep', name:'Balancement ischio dynamique', category:'warmup_recovery', pattern:'warmup', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['ischio-jambiers'], c7Risk:'low', type:'reps', coachingCues:'Jambe tendue, balancer vers le haut dynamiquement', progressionRule:'20 reps par jambe avant entraînement', alternatives:['mob_active_leg_swing','wu_dynamic_lunge'], avoid:false },
    { id:'wu_dynamic_lunge', name:'Fente dynamique', category:'warmup_recovery', pattern:'warmup', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['quadriceps','fessiers','hip flexors'], c7Risk:'low', type:'reps', coachingCues:'Fentes marchées à rythme modéré', progressionRule:'10 par jambe en échauffement', alternatives:['wu_bw_squat_warmup','wu_dynamic_hamstring_sweep'], avoid:false },
    { id:'wu_light_first_set', name:'Première série légère', category:'warmup_recovery', pattern:'warmup', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['variable selon l\'exercice'], c7Risk:'low', type:'reps', coachingCues:'50% du poids de travail, technique parfaite', progressionRule:'Toujours faire avant la première série de travail', alternatives:['wu_walk_incline_5min','wu_easy_bike_5min'], avoid:false },
    { id:'wu_breathing_downshift', name:'Respiration de récupération', category:'warmup_recovery', pattern:'recovery', equipment:'floor', difficulty:'beginner', targetMuscles:['système nerveux parasympathique','diaphragme'], c7Risk:'low', type:'min', coachingCues:'4 temps inspiration, 6 temps expiration, allongé', progressionRule:'5-10 minutes après l\'entraînement', alternatives:['mob_breathing_reset_9090','mob_child_pose'], avoid:false },
    { id:'wu_walk_20min', name:'Marche 20 minutes', category:'warmup_recovery', pattern:'recovery', equipment:'cardio', difficulty:'beginner', targetMuscles:['cardiovasculaire','récupération active'], c7Risk:'low', type:'min', coachingCues:'Allure détendue, sans effort', progressionRule:'Récupération active entre les séances', alternatives:['wu_easy_bike_20min','wu_walk_incline_5min'], avoid:false },
    { id:'wu_easy_bike_20min', name:'Vélo facile 20 minutes', category:'warmup_recovery', pattern:'recovery', equipment:'cardio', difficulty:'beginner', targetMuscles:['cardiovasculaire','quadriceps'], c7Risk:'low', type:'min', coachingCues:'Résistance légère, récupération active', progressionRule:'Alternative marche pour récupération', alternatives:['wu_walk_20min','wu_mobility_flow_15min'], avoid:false },
    { id:'wu_mobility_flow_15min', name:'Flow mobilité 15 minutes', category:'warmup_recovery', pattern:'recovery', equipment:'floor', difficulty:'beginner', targetMuscles:['corps entier'], c7Risk:'low', type:'min', coachingCues:'Enchaîner cat-cow, pigeon, 90/90, thoracique fluidement', progressionRule:'Routine de récupération quotidienne', alternatives:['wu_easy_bike_20min','wu_foam_roll_short'], avoid:false },
    { id:'wu_foam_roll_short', name:'Foam roll court 10 minutes', category:'warmup_recovery', pattern:'recovery', equipment:'foam_roller', difficulty:'beginner', targetMuscles:['corps entier'], c7Risk:'low', type:'min', coachingCues:'Quadriceps, ischio-jambiers, dos, mollets', progressionRule:'Avant ou après l\'entraînement', alternatives:['wu_mobility_flow_15min','mob_foam_roll_quads'], avoid:false },
    { id:'wu_deload_session', name:'Séance deload', category:'warmup_recovery', pattern:'recovery', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['corps entier'], c7Risk:'low', type:'min', coachingCues:'50% volume habituel, 60% intensité, maintenir les patterns', progressionRule:'1 semaine de deload toutes les 4-6 semaines', alternatives:['wu_mobility_flow_15min','wu_walk_20min'], avoid:false },
    { id:'wu_yoga_sun_salutation_light', name:'Salutation au soleil légère', category:'warmup_recovery', pattern:'recovery', equipment:'floor', difficulty:'beginner', targetMuscles:['corps entier','souplesse'], c7Risk:'low', type:'reps', coachingCues:'Enchaîner les postures fluidement, respirer', progressionRule:'5-10 rounds en récupération ou matin', alternatives:['wu_mobility_flow_15min','mob_world_greatest_stretch'], avoid:false },
    { id:'wu_joint_mobility_circuit', name:'Circuit mobilité articulaire', category:'warmup_recovery', pattern:'warmup', equipment:'bodyweight', difficulty:'beginner', targetMuscles:['toutes les articulations'], c7Risk:'low', type:'min', coachingCues:'Cheville, genou, hanche, colonne, épaule, poignet — cercles et mouvements', progressionRule:'5-7 minutes avant chaque entraînement', alternatives:['wu_dynamic_lunge','mob_shoulder_cars'], avoid:false }
  ];

  /* ── FEATURE REGISTRY ── */
  var FEATURES = [
    { id:'home_command_center',   label:'Home / Mission Now',        tab:'aujourdhui', priority:'P0', required:true },
    { id:'stats_war_room',        label:'Stats War Room',            tab:'stats',      priority:'P1', required:true },
    { id:'routine_ops',           label:'Routine Ops',               tab:'routine',    priority:'P0', required:true },
    { id:'sport_library',         label:'Sport Bibliothèque',        tab:'sport',      priority:'P0', required:true },
    { id:'sport_ppl',             label:'Sport Programme PPL',       tab:'sport',      priority:'P0', required:true },
    { id:'sport_bodyweight',      label:'Sport Poids du corps',      tab:'sport',      priority:'P0', required:true },
    { id:'sport_flexibility',     label:'Sport Souplesse',           tab:'sport',      priority:'P0', required:true },
    { id:'sport_history',         label:'Sport Historique',          tab:'sport',      priority:'P0', required:true },
    { id:'sport_tests',           label:'Sport Tests mensuels',      tab:'sport',      priority:'P1', required:true },
    { id:'nutrition',             label:'Nutrition Command',         tab:'aujourdhui', priority:'P1', required:false },
    { id:'study_epfc',            label:'Étude / EPFC',              tab:'etude',      priority:'P0', required:true },
    { id:'certifications',        label:'Certifications Roadmap',    tab:'etude',      priority:'P0', required:true },
    { id:'proofs',                label:'Système de preuves',        tab:'etude',      priority:'P0', required:true },
    { id:'coding_arena',          label:'Coding Arena',              tab:'etude',      priority:'P1', required:false },
    { id:'ai_lab',                label:'IA Lab',                    tab:'etude',      priority:'P1', required:false },
    { id:'repair_iot_lab',        label:'Repair & IoT Lab',          tab:'etude',      priority:'P1', required:false },
    { id:'vinted_v2',             label:'Vinted Profit v2',          tab:'argent',     priority:'P0', required:true },
    { id:'finance_war_room',      label:'Finance War Room',          tab:'argent',     priority:'P1', required:true },
    { id:'dutch_command',         label:'Dutch Command',             tab:'routine',    priority:'P1', required:false },
    { id:'weekly_review',         label:'Weekly Review',             tab:'stats',      priority:'P1', required:true },
    { id:'ai_coach',              label:'AI Coach',                  tab:'reglages',   priority:'P2', required:false },
    { id:'import_export_v2',      label:'Import / Export v2',        tab:'reglages',   priority:'P1', required:true },
    { id:'lite_full_mode',        label:'Mode Lite / Full',          tab:'reglages',   priority:'P1', required:false }
  ];

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
    computeSportSessionType: computeSportSessionType,
    SPORT_LIBRARY: SPORT_LIBRARY,
    FEATURES: FEATURES
  };
})();
