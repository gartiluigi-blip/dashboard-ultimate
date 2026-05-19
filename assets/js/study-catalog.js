export const COURSES=[['epfc','EPFC / Cours'],['python','Python'],['linux','Linux / OS'],['arch','Architecture PC'],['sql','SQL'],['web','Web / JS'],['coding','Coding'],['ai','IA'],['iot','IoT'],['repair','Réparation'],['network','Réseaux'],['security','Sécurité'],['nl','Néerlandais']];
export const SOURCES=['Syllabus','PowerPoint','PDF','O’Reilly','Vidéo','Lab en ligne','Exercice plateforme','Projet GitHub','Diagnostic atelier','Anki','Écoute NL'];
export const TYPES=['lecture','exercise','lab','project','mock_exam','diagnostic','repair_log','iot_prototype','anki','listening','speaking','writing'];
export const BOOKS={
 epfc:['Syllabus officiel','PowerPoint cours','Notes personnelles','Exercices corrigés','Examens blancs'],
 python:['Python Crash Course','Learning Python','Automate the Boring Stuff with Python','Fluent Python','Python Cookbook','Effective Python','Think Python'],
 linux:['Linux Pocket Guide','How Linux Works','Learning Linux Command Line','Linux Cookbook','UNIX and Linux System Administration Handbook'],
 arch:['Code: The Hidden Language of Computer Hardware and Software','Computer Systems: A Programmer’s Perspective','Write Great Code, Volume 1','Computer Organization and Design'],
 sql:['Learning SQL','SQL Cookbook','SQL Antipatterns','Practical SQL','Database Design for Mere Mortals'],
 web:['HTML and CSS: The Definitive Guide','JavaScript: The Definitive Guide','Eloquent JavaScript','CSS: The Definitive Guide','You Don’t Know JS Yet'],
 coding:['Think Like a Programmer','Grokking Algorithms','A Common-Sense Guide to Data Structures and Algorithms','Programming Pearls','Clean Code'],
 ai:['Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow','Designing Machine Learning Systems','Practical Deep Learning','Natural Language Processing with Transformers','AI Engineering','Building LLM Applications'],
 iot:['Arduino Cookbook','Programming Arduino','Make: Electronics','Practical Electronics for Inventors','ESP32 IoT Projects','IoT Projects with Arduino Nano 33 BLE Sense'],
 repair:['How to Diagnose and Fix Everything Electronic','Practical Electronics for Inventors','Make: Electronics','Troubleshooting and Repairing Consumer Electronics','Electronic Troubleshooting'],
 network:['Computer Networking: A Top-Down Approach','Network Warrior','Practical Packet Analysis','CCNA Certification Guide','Network Programmability and Automation'],
 security:['Linux Basics for Security','Network Security Assessment','Practical Malware Analysis','Web Application Security','Blue Team Handbook'],
 nl:['Dutch Grammar You Really Need to Know','Essential Dutch Grammar','Dutch Vocabulary Builder','2000 Most Common Dutch Words in Context']
};
export const EXERCISE_PACKS={
 python:['variables and types','if else drills','loops 30 exercices','functions kata','file read write','CLI mini project','PCEP mock'],
 linux:['pwd cd ls drill','permissions chmod lab','process ps top lab','grep sed awk drills','systemd service note','Linux mock'],
 sql:['select where order drill','joins drill','group by aggregate','subquery drill','schema mini project','SQL mock'],
 web:['HTML semantic page','CSS responsive card','JS DOM todo','fetch API drill','form validation','portfolio page'],
 coding:['CodingBat warmup','Exercism track','Codewars kata','LeetCode easy','algorithm note','redo mistakes'],
 ai:['prompt test log','notebook sklearn intro','classification mini lab','NLP transformer note','LLM app sketch','AI fundamentals mock'],
 iot:['Arduino blink','button input','potentiometer read','DHT sensor log','ESP32 WiFi request','MQTT sensor flow','mini dashboard'],
 repair:['multimeter continuity','voltage measurement','visual inspection log','fault hypothesis tree','repair case note','component test log'],
 network:['subnetting drills','packet capture reading','router table drill','VLAN note','Network mock'],
 security:['Linux security commands','web request inspection','basic log analysis','ports and services drill','security mock'],
 nl:['Anki 30 cards','shadowing 15 min','listening VRT/NOS','write 10 phrases','correct 5 mistakes','speaking record 5 min']
};
export const NL_PLAN=[['A1','6-8 semaines','Anki 20 mots/jour, phrases simples, prononciation, écoute lente 20 min'],['A2','2-3 mois','dialogues quotidiens, écoute 30 min, 10 phrases écrites/jour'],['B1','4-6 mois','articles simples, conversation 30-45 min, résumé oral, erreurs corrigées'],['B2','6-12 mois','VRT/NOS, mails pro, débats simples, 120-180 mots, speaking 45-60 min'],['C1','12 semaines+','opinion nuancée, présentation 10 min, essai 250-300 mots']];
