export const NAV = [
  ['today', 'Aujourd’hui', '⌂'],
  ['health', 'Santé', '♥'],
  ['learn', 'Apprendre', '◎'],
  ['culture', 'Culture', '◇'],
  ['body', 'Corps', '△'],
  ['money', 'Argent', '€'],
  ['trading', 'Trading', '↗'],
  ['review', 'Revue', '✓'],
  ['settings', 'Réglages', '⚙']
];

export const HEALTH_PILLARS = [
  { id: 'sleep', label: 'Sommeil', icon: '☾', target: '7–9 h, horaire stable, qualité suivie' },
  { id: 'movement', label: 'Mouvement', icon: '↟', target: 'Pas, cardio et renforcement chaque semaine' },
  { id: 'nutrition', label: 'Nutrition', icon: '◉', target: 'Protéines, fibres, végétaux et hydratation' },
  { id: 'heart', label: 'Cœur', icon: '♥', target: 'Tension, activité, poids et nicotine' },
  { id: 'brain', label: 'Cerveau', icon: '◌', target: 'Sommeil, apprentissage, humeur et liens sociaux' },
  { id: 'recovery', label: 'Récupération', icon: '≈', target: 'Stress, douleur, respiration et lumière' },
  { id: 'prevention', label: 'Prévention', icon: '＋', target: 'Contrôles, vaccins et suivi médical' },
  { id: 'safety', label: 'Sécurité', icon: '!', target: 'Alcool, nicotine, interactions et signaux d’alerte' }
];

export const BODY_SYSTEMS = [
  { id: 'energy', label: 'Énergie', icon: '⚡', inputs: 'sommeil · douleur · mouvement · eau' },
  { id: 'heart', label: 'Cœur', icon: '♥', inputs: 'tension · activité · sommeil · nicotine' },
  { id: 'brain', label: 'Cerveau', icon: '◌', inputs: 'sommeil · humeur · apprentissage · liens' },
  { id: 'liver', label: 'Foie', icon: '⬡', inputs: 'alcool · poids · activité · sucres' },
  { id: 'metabolic', label: 'Métabolisme', icon: '∞', inputs: 'tour de taille · activité · sommeil · alimentation' },
  { id: 'gut', label: 'Digestion', icon: '≈', inputs: 'fibres · eau · végétaux · symptômes' }
];

export const PREVENTION = [
  ['gp', 'Médecin généraliste', 'Selon situation et suivi'],
  ['blood-pressure', 'Tension artérielle', 'Mesure correcte et répétée'],
  ['dentist', 'Dentiste', 'Contrôle régulier'],
  ['vision', 'Vision', 'Selon symptômes et correction'],
  ['hearing', 'Audition', 'Selon exposition et symptômes'],
  ['vaccines', 'Vaccins', 'Calendrier belge à vérifier'],
  ['medication', 'Revue médicaments', 'Interactions, effets et utilité'],
  ['bloodwork', 'Analyses indiquées', 'Uniquement selon contexte médical'],
  ['skin', 'Peau', 'Lésion nouvelle ou changeante'],
  ['mental', 'Santé mentale', 'Humeur, anxiété, addictions, sommeil']
];

export const LEARNING_PATH = [
  { id: 'focus', label: 'Attention', proof: '25 minutes sans distraction + résultat écrit' },
  { id: 'recall', label: 'Rappel actif', proof: 'Répondre sans regarder les notes' },
  { id: 'spacing', label: 'Espacement', proof: 'Revoir au bon moment, pas tout le même jour' },
  { id: 'interleave', label: 'Entrelacement', proof: 'Mélanger deux types de problèmes' },
  { id: 'feynman', label: 'Feynman', proof: 'Expliquer simplement avec ses propres mots' },
  { id: 'deliberate', label: 'Pratique délibérée', proof: 'Travailler une faiblesse précise avec feedback' },
  { id: 'notes', label: 'Notes reliées', proof: 'Une idée par note, reliée à une autre' },
  { id: 'transfer', label: 'Transfert', proof: 'Utiliser la connaissance dans un projet réel' }
];

export const LEARNING_BOOKS = [
  ['make-it-stick', 'Make It Stick', 'Brown, Roediger & McDaniel', 'Rappel actif, espacement, entrelacement'],
  ['understanding-learning', 'Understanding How We Learn', 'Weinstein, Sumeracki & Caviglioli', 'Science de l’apprentissage illustrée'],
  ['peak', 'Peak', 'Anders Ericsson & Robert Pool', 'Pratique délibérée'],
  ['mind-for-numbers', 'A Mind for Numbers', 'Barbara Oakley', 'Matières difficiles et résolution de problèmes'],
  ['smart-notes', 'How to Take Smart Notes', 'Sönke Ahrens', 'Notes reliées et production'],
  ['ultralearning', 'Ultralearning', 'Scott Young', 'Projets d’apprentissage intensifs'],
  ['scout-mindset', 'The Scout Mindset', 'Julia Galef', 'Corriger ses croyances'],
  ['thinking-bets', 'Thinking in Bets', 'Annie Duke', 'Décider sous incertitude']
];

export const CULTURE_DOMAINS = [
  ['history', 'Histoire mondiale', 'Chronologies, empires, révolutions, guerres, institutions', 'Construire une frise commentée'],
  ['geography', 'Géographie & géopolitique', 'États, ressources, routes, frontières, puissances', 'Expliquer une crise avec une carte'],
  ['economics', 'Économie', 'Inflation, taux, monnaie, emploi, commerce, dette', 'Expliquer une décision de banque centrale'],
  ['law', 'Institutions & droit', 'Pouvoirs, élections, Constitution, UE, droits fondamentaux', 'Tracer qui décide quoi en Belgique et dans l’UE'],
  ['philosophy', 'Philosophie & éthique', 'Arguments, connaissance, morale, liberté, justice', 'Comparer deux positions opposées'],
  ['physics', 'Physique & univers', 'Matière, énergie, espace, temps, étoiles, quantique', 'Expliquer un phénomène sans formule inutile'],
  ['biology', 'Biologie & médecine', 'Cellules, génétique, évolution, immunité, essais cliniques', 'Lire une affirmation santé avec esprit critique'],
  ['climate', 'Climat & planète', 'Cycles, énergie, biodiversité, risques, adaptation', 'Résumer mécanisme, preuves et incertitudes'],
  ['technology', 'Technologie & informatique', 'Réseaux, données, IA, cybersécurité, électronique', 'Dessiner un système de bout en bout'],
  ['society', 'Psychologie & société', 'Biais, groupes, normes, inégalités, démographie', 'Analyser un comportement sans anecdote'],
  ['literature', 'Littérature & langues', 'Genres, mouvements, rhétorique, grands textes', 'Comparer deux œuvres ou styles'],
  ['arts', 'Arts & architecture', 'Périodes, formes, musique, image, espace', 'Décrire une œuvre avec contexte et technique'],
  ['religions', 'Religions & idées', 'Traditions, textes, courants, histoire, sécularisation', 'Présenter sans caricature ni prosélytisme'],
  ['media', 'Médias & esprit critique', 'Sources, statistiques, causalité, propagande, vérification', 'Auditer une information virale']
];

export const CULTURE_QUESTIONS = [
  'Pourquoi l’inflation peut-elle rester élevée même quand la croissance ralentit ?',
  'Quelle différence entre corrélation, causalité et simple coïncidence ?',
  'Comment une banque centrale influence-t-elle l’économie réelle ?',
  'Pourquoi les frontières actuelles ne suivent-elles pas toujours les peuples ?',
  'Qu’est-ce qui distingue une démocratie libérale d’une simple élection ?',
  'Pourquoi le sommeil améliore-t-il l’apprentissage ?',
  'Comment reconnaître une source primaire ?',
  'Pourquoi une moyenne peut-elle masquer une forte inégalité ?',
  'Comment un modèle d’IA produit-il une réponse ?',
  'Que signifie réellement “scientifiquement prouvé” ?',
  'Pourquoi les empires s’étendent-ils puis se fragmentent-ils ?',
  'Comment une œuvre d’art reflète-t-elle son époque ?',
  'Qu’est-ce qu’un biais de sélection ?',
  'Pourquoi le climat varie-t-il et pourquoi le réchauffement actuel est-il particulier ?'
];

export const QUICK_ACTIONS = [
  ['water', '+250 ml eau', 'Eau'],
  ['protein', '+25 g protéines', 'Protéines'],
  ['walk', '+10 min marche', 'Mouvement'],
  ['focus', 'Bloc focus 25 min', 'Apprendre'],
  ['expense', 'Ajouter dépense', 'Argent'],
  ['symptom', 'Noter symptôme', 'Santé']
];

export const AUTOMATIONS = [
  ['morningPlan', 'Plan du matin', 'Génère automatiquement trois priorités selon récupération, retards et temps disponible.'],
  ['weakPillarNudge', 'Priorité santé', 'Met en avant le pilier santé le plus faible au lieu d’afficher huit objectifs simultanés.'],
  ['weeklyReview', 'Revue du dimanche', 'Prépare automatiquement le bilan des sept derniers jours.'],
  ['smartDefaults', 'Valeurs intelligentes', 'Préremplit les formulaires avec les dernières valeurs cohérentes.'],
  ['oneTapLogging', 'Capture en un geste', 'Active la barre d’actions rapides sur toutes les pages.']
];
