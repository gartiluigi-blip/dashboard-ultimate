/* data.js — constantes, ressources, rotation semaine */
'use strict';

window.D = (function () {

  var DAYS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];

  var ROTATION = {
    lundi:    ['EPFC Python','Coding exercices','Néerlandais','Sport Pull'],
    mardi:    ['EPFC Linux/OS','IoT lab','Lecture','Sport Push'],
    mercredi: ['EPFC Architecture','Réparation électronique','IA','Souplesse'],
    jeudi:    ['EPFC SQL','Coding projet','Néerlandais','Sport Legs'],
    vendredi: ['EPFC Web/JS','IoT ou Réparation catch-up','Échecs','Mobilité'],
    samedi:   ['Long study block','Vinted','Sport','Famille/flexible'],
    dimanche: ['Weekly review','Révision','Planning','Stretch']
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
    ]
  };

  var PRIORITY_CATEGORIES = ['Étude','Sport','Travail','Projet','Admin','Autre'];

  function todayRotation() {
    var day = DAYS[new Date().getDay()];
    return { day: day, tasks: ROTATION[day] || [] };
  }

  return {
    DAYS: DAYS,
    ROTATION: ROTATION,
    BOOKMARKS: BOOKMARKS,
    FOCUS_DOMAINS: FOCUS_DOMAINS,
    LOG_FIELDS: LOG_FIELDS,
    STUDY_TABS: STUDY_TABS,
    RESOURCES: RESOURCES,
    SPORT: SPORT,
    PRIORITY_CATEGORIES: PRIORITY_CATEGORIES,
    todayRotation: todayRotation
  };
})();
