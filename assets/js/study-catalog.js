export const COURSES=[['epfc','EPFC / Cours'],['python','Python'],['linux','Linux / OS'],['arch','Architecture PC'],['sql','SQL'],['web','Web / JS'],['coding','Coding'],['ai','IA'],['iot','IoT'],['repair','Réparation'],['network','Réseaux'],['security','Sécurité'],['nl','Néerlandais / SELOR']];
export const SOURCES=['Syllabus','PowerPoint','PDF','O’Reilly','Vidéo','Lab en ligne','Exercice plateforme','Projet GitHub','Diagnostic atelier','Anki','Écoute NL','Livre NL','Site NL','SELOR/CNaVT'];
export const TYPES=['lecture','exercise','lab','project','mock_exam','diagnostic','repair_log','iot_prototype','anki','listening','speaking','writing','grammar','selor_prep'];
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
 nl:['Nederlands op niveau','Nederlands naar perfectie','Nederlands voor gevorderde anderstaligen - Tekstboek 1','Nederlands voor gevorderde anderstaligen - Tekstboek 2','Vanzelfsprekend','Niet vanzelfsprekend','Klare taal!','Klare taal +','Néerlandais - 100 fautes','Néerlandais - Grammaire de l’étudiant']
};
export const NL_RESOURCES=[
 {kind:'Livre',title:'Nederlands op niveau',url:'https://www.coutinho.nl/nl/nederlands-op-niveau-9789046904411',level:'B1-B2',goal:'socle avancé'},
 {kind:'Livre',title:'Nederlands naar perfectie',url:'https://www.coutinho.nl/nl/nederlands-naar-perfectie-9789046904527',level:'B2-C1',goal:'perfectionnement'},
 {kind:'Livre',title:'Nederlands voor gevorderde anderstaligen 1',url:'https://shop.acco.be/nl-be/items/9789462927704/Nederlands-voor-gevorderde-anderstaligen---Tekstboek-1',level:'B1-B2',goal:'texte + vocabulaire'},
 {kind:'Livre',title:'Nederlands voor gevorderde anderstaligen 2',url:'',level:'B2-C1',goal:'suite avancée'},
 {kind:'Méthode',title:'Vanzelfsprekend',url:'http://www.vanzelfsprekend.be/',level:'A2-B1',goal:'base structurée'},
 {kind:'Vidéo',title:'Vanzelfsprekend YouTube',url:'https://www.youtube.com/channel/UC9pj96Qd964u6Fo-y9HR9Ag',level:'A2-B1',goal:'écoute guidée'},
 {kind:'Méthode',title:'Niet vanzelfsprekend',url:'https://ilt.kuleuven.be/publicaties/ned_nietvanzelf.php',level:'B1-B2',goal:'suite méthode'},
 {kind:'Grammaire',title:'Klare taal!',url:'https://www.nt2.nl/nl/101-23_Klare-taal',level:'A2-B1',goal:'grammaire claire'},
 {kind:'Grammaire',title:'Klare taal +',url:'https://www.nt2.nl/nl/101-23_Klare-taal',level:'B1-B2',goal:'grammaire avancée'},
 {kind:'Grammaire',title:'Néerlandais - 100 fautes',url:'https://www.standaardboekhandel.be/p/neerlandais--100-fautes-9782807351165',level:'B1-C1',goal:'corriger erreurs francophones'},
 {kind:'Grammaire',title:'Néerlandais - Grammaire de l’étudiant',url:'https://www.deboecksuperieur.com/livre/9782807315723-neerlandais-grammaire-de-l-etudiant',level:'A2-B2',goal:'référence grammaire'},
 {kind:'Bibliothèque',title:'Brusselse bibliotheken NL-collectie',url:'https://brusselsebibliotheken.bibliotheek.be/adressen',level:'all',goal:'trouver les livres'},
 {kind:'Site',title:'NedBox',url:'https://www.nedbox.be/',level:'A2-B2',goal:'écoute et compréhension'},
 {kind:'Site',title:'Virtuele Training',url:'https://virtueletraining.com',level:'B1-B2',goal:'exercices'},
 {kind:'Site',title:'Ver-taal',url:'http://nl.ver-taal.com/',level:'A2-B2',goal:'compréhension'},
 {kind:'Écriture',title:'Schrijfassistent Nederlands voor Anderstaligen',url:'https://nt2.schrijfassistent.be/',level:'B1-C1',goal:'correction écrite'},
 {kind:'Site',title:'Dutch With Ambition',url:'https://www.dutchwithambition.be/',level:'B1-C1',goal:'progression ambitieuse'},
 {kind:'Référence',title:'Taaladvies Vlaanderen',url:'https://www.vlaanderen.be/taaladvies',level:'B2-C1',goal:'usage correct'},
 {kind:'App',title:'Brulingua',url:'https://www.brulingua.be/nl/',level:'A1-B2',goal:'pratique structurée'},
 {kind:'Bruxelles',title:'Nederlands oefenen in Brussel',url:'https://www.nederlandsoefeneninbrussel.be/tips-voor-beginners/',level:'A1-B2',goal:'pratique orale à Bruxelles'},
 {kind:'SELOR',title:'CNaVT voorbereiding',url:'https://cnavt.org/voorbereiding',level:'B2-C1',goal:'préparation test langue'},
 {kind:'SELOR',title:'ERK oefenbank B2',url:'https://erk-nederlands.taalunie.org/voorbeelden-en-oefenbank/?_sft_erk-niveau=b2',level:'B2',goal:'exemples et exercices B2'},
 {kind:'SELOR',title:'Werkenvoor.be / Selor assessment training',url:'https://www.assessment-training.com/nl/selor-assessment',level:'assessment',goal:'raisonnement et assessment'}
];
export const EXERCISE_PACKS={python:['variables and types','if else drills','loops 30 exercices','functions kata','file read write','CLI mini project','PCEP mock'],linux:['pwd cd ls drill','permissions chmod lab','process ps top lab','grep sed awk drills','systemd service note','Linux mock'],sql:['select where order drill','joins drill','group by aggregate','subquery drill','schema mini project','SQL mock'],web:['HTML semantic page','CSS responsive card','JS DOM todo','fetch API drill','form validation','portfolio page'],coding:['CodingBat warmup','Exercism track','Codewars kata','LeetCode easy','algorithm note','redo mistakes'],ai:['prompt test log','notebook sklearn intro','classification mini lab','NLP transformer note','LLM app sketch','AI fundamentals mock'],iot:['Arduino blink','button input','potentiometer read','DHT sensor log','ESP32 WiFi request','MQTT sensor flow','mini dashboard'],repair:['multimeter continuity','voltage measurement','visual inspection log','fault hypothesis tree','repair case note','component test log'],network:['subnetting drills','packet capture reading','router table drill','VLAN note','Network mock'],security:['Linux security commands','web request inspection','basic log analysis','ports and services drill','security mock'],nl:['Anki 30 cartes','NedBox 20 min','Vanzelfsprekend vidéo','Klare taal grammaire','Schrijfassistent correction','write 10 phrases','speaking record 5 min','ERK B2 oefenbank','CNaVT voorbereiding','SELOR assessment drill']};
export const NL_PLAN=[['A1-A2','Base active','Vanzelfsprekend + Brulingua + Anki + Ver-taal'],['B1','Consolidation','Nederlands op niveau + NedBox + Klare taal + phrases écrites'],['B2','Objectif SELOR langue','Nederlands voor gevorderde anderstaligen + ERK B2 + Schrijfassistent + speaking'],['B2-C1','Perfectionnement','Nederlands naar perfectie + Niet vanzelfsprekend + 100 fautes + Taaladvies'],['SELOR','Passage test','CNaVT voorbereiding + ERK oefenbank B2 + assessment drills + simulation orale/écrite']];
