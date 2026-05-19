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
      subtasks: ['Lire 1 chapitre / suivre 1 leçon', 'Implémenter un concept vu', 'Créer des notes Anki'],
      trackerFields: [
        { id:'concept', label:'Concept étudié', type:'text', placeholder:'Ex: Backpropagation, Transformers…' },
        { id:'resource', label:'Ressource', type:'select', options:['Fast.ai','Hands-On ML','AI Engineering','Kaggle','Autre'] },
        { id:'anki', label:'Cartes Anki créées', type:'number', placeholder:'0', unit:'cartes' },
        { id:'coded', label:'Code implémenté ?', type:'toggle' }
      ]
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
      subtasks: ['Lire l\'énoncé sans regarder la solution', 'Coder de tête d\'abord', 'Optimiser + noter complexité O(n)'],
      trackerFields: [
        { id:'problems', label:'Exercices résolus', type:'number', placeholder:'0', unit:'exercices' },
        { id:'platform', label:'Plateforme', type:'select', options:['LeetCode','CodingBat','HackerRank','Codecademy','Projet perso','Autre'] },
        { id:'difficulty', label:'Difficulté', type:'select', options:['Easy','Medium','Hard'] },
        { id:'language', label:'Langage', type:'select', options:['Python','JavaScript','Java','C','Autre'] }
      ]
    },
    {
      id: 'nl',
      label: 'Néerlandais',
      icon: '🇳🇱',
      cat: 'study',
      min: 30,
      defaultPriority: 'A',
      hint: 'Taalgarage + Anki deck NL — minimum 30 min par jour',
      studyMat: 'nl',
      subtasks: ['Taalgarage : 1 leçon', 'Anki : 20 cartes minimum', 'Écrire 3 phrases avec les mots appris'],
      trackerFields: [
        { id:'words', label:'Nouveaux mots appris', type:'number', placeholder:'0', unit:'mots' },
        { id:'lesson', label:'Leçon Taalgarage', type:'text', placeholder:'Ex: A1.2 leçon 4' },
        { id:'anki', label:'Cartes Anki révisées', type:'number', placeholder:'0', unit:'cartes' },
        { id:'topic', label:'Sujet / grammaire', type:'text', placeholder:'Ex: Verbes de modalité, vocabulaire maison…' }
      ]
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
      subtasks: ['Diagnostic / mesure', 'Tester composants', 'Réparer / souder', 'Documenter avancement'],
      trackerFields: [
        { id:'device', label:'Appareil / Objet', type:'text', placeholder:'Ex: Ampli Sony, PS4, lampe…', persist:true },
        { id:'problem', label:'Problème', type:'text', placeholder:'Ex: Pas de son, court-circuit…', persist:true },
        { id:'progress', label:'Avancement (%)', type:'number', placeholder:'0', unit:'%' },
        { id:'result', label:'Résultat du jour', type:'select', options:['En cours','Avancé','Bloqué — besoin pièce','Réparé ✓','Irrécupérable'] }
      ]
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
      subtasks: ['10 puzzles Chessable', '1 partie lente (15+10)', 'Analyser erreurs avec Stockfish'],
      trackerFields: [
        { id:'elo_before', label:'ELO avant', type:'number', placeholder:'Ex: 1250' },
        { id:'elo_after', label:'ELO après', type:'number', placeholder:'Ex: 1260' },
        { id:'puzzles', label:'Puzzles faits', type:'number', placeholder:'0', unit:'puzzles' },
        { id:'game_result', label:'Résultat partie', type:'select', options:['Victoire','Nul','Défaite','Pas joué'] }
      ]
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
    DAILY_PRACTICE: DAILY_PRACTICE
  };
})();
