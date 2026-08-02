export const ROUTES = [
  ['today', 'Aujourd’hui'],
  ['athlete', 'Athlète'],
  ['trading', 'Trading'],
  ['study', 'Études'],
  ['library', 'Lecture'],
  ['nutrition', 'Nutrition'],
  ['money', 'Argent'],
  ['system', 'Système']
];

export const DAY_MODES = {
  auto: { label: 'Auto', description: 'Charge calculée selon énergie, douleur, temps et régularité.' },
  normal: { label: 'Normal', description: 'Un bloc majeur et deux maintiens.' },
  execution: { label: 'Exécution', description: 'Priorité au travail profond et à la progression.' },
  fatigue: { label: 'Fatigue', description: 'Volume réduit, technique et minimum utile.' },
  recovery: { label: 'Récupération', description: 'Santé, mobilité et récupération avant performance.' }
};

export const MEAL_PLAN = {
  1: { name: 'Lundi', meals: [
    meal('Petit-déjeuner', '07:30', 560, 43, 12, ['Skyr 250 g', 'Flocons d’avoine 60 g', 'Œufs 2', 'Fruits rouges 100 g', 'Graines de lin 10 g']),
    meal('Déjeuner', '12:30', 670, 52, 13, ['Poulet 200 g cru', 'Riz basmati 70 g cru', 'Brocoli 200 g', 'Poivron 150 g', 'Huile d’olive 10 g']),
    meal('Collation', '16:30', 280, 22, 5, ['Skyr 170 g', 'Amandes 15 g', '1 fruit']),
    meal('Dîner', '19:30', 610, 42, 10, ['Saumon 150 g cru', 'Pommes de terre 300 g', 'Haricots verts 250 g'])
  ]},
  2: { name: 'Mardi', meals: [
    meal('Petit-déjeuner', '07:30', 550, 42, 11, ['Fromage blanc 300 g', 'Avoine 50 g', 'Œufs 2', '1 pomme']),
    meal('Déjeuner', '12:30', 650, 51, 12, ['Dinde 200 g crue', 'Pommes de terre 350 g', 'Courgettes 250 g', 'Carottes 150 g']),
    meal('Collation', '16:30', 280, 22, 5, ['Skyr 170 g', 'Noix 15 g', '1 fruit']),
    meal('Dîner', '19:30', 590, 47, 15, ['Cabillaud 180 g cru', 'Lentilles 180 g cuites', 'Épinards 250 g'])
  ]},
  3: { name: 'Mercredi', meals: [
    meal('Petit-déjeuner', '07:30', 540, 42, 11, ['Skyr 250 g', 'Avoine 60 g', 'Œufs 2', 'Banane petite']),
    meal('Déjeuner', '12:30', 680, 45, 11, ['Bœuf maigre 180 g cru', 'Riz 70 g cru', 'Champignons 200 g', 'Haricots verts 200 g']),
    meal('Collation', '16:30', 270, 21, 5, ['Skyr 170 g', 'Amandes 15 g', '1 fruit']),
    meal('Dîner', '19:30', 620, 46, 12, ['Œufs 3', 'Cottage cheese 200 g', 'Pain complet 80 g', 'Salade 300 g'])
  ]},
  4: { name: 'Jeudi', meals: [
    meal('Petit-déjeuner', '07:30', 560, 43, 12, ['Skyr 250 g', 'Avoine 60 g', 'Œufs 2', 'Fruits rouges 100 g']),
    meal('Déjeuner', '12:30', 670, 51, 13, ['Poulet 200 g cru', 'Boulgour 70 g cru', 'Brocoli 200 g', 'Carottes 150 g']),
    meal('Collation', '16:30', 280, 22, 5, ['Skyr 170 g', 'Noix 15 g', '1 fruit']),
    meal('Dîner', '19:30', 600, 39, 12, ['Sardines 120 g', 'Pommes de terre 300 g', 'Tomate et concombre 300 g', 'Avocat 70 g'])
  ]},
  5: { name: 'Vendredi', meals: [
    meal('Petit-déjeuner', '07:30', 540, 42, 11, ['Fromage blanc 300 g', 'Avoine 50 g', 'Œufs 2', '1 fruit']),
    meal('Déjeuner', '12:30', 690, 52, 14, ['Dinde 200 g crue', 'Pâtes complètes 80 g crues', 'Sauce tomate 150 g', 'Courgettes 250 g']),
    meal('Collation', '16:30', 280, 22, 5, ['Skyr 170 g', 'Amandes 15 g', '1 fruit']),
    meal('Dîner', '19:30', 640, 46, 17, ['Bœuf maigre 150 g', 'Haricots rouges 180 g', 'Riz 120 g cuit', 'Poivrons et tomates 300 g'])
  ]},
  6: { name: 'Samedi', meals: [
    meal('Petit-déjeuner', '08:30', 570, 43, 12, ['Skyr 250 g', 'Avoine 60 g', 'Œufs 2', 'Banane petite']),
    meal('Déjeuner', '13:00', 670, 51, 13, ['Poulet 200 g cru', 'Pommes de terre 350 g', 'Légumes 350 g']),
    meal('Collation', '17:00', 280, 22, 5, ['Skyr 170 g', 'Noix 15 g', '1 fruit']),
    meal('Dîner', '20:00', 630, 45, 14, ['Truite 170 g crue', 'Pois chiches 160 g', 'Épinards 250 g'])
  ]},
  0: { name: 'Dimanche', meals: [
    meal('Petit-déjeuner', '08:30', 550, 42, 11, ['Fromage blanc 300 g', 'Avoine 50 g', 'Œufs 2', 'Fruits rouges 100 g']),
    meal('Déjeuner', '13:00', 660, 51, 13, ['Poulet 200 g cru', 'Riz 70 g cru', 'Brocoli ou chou-fleur 300 g']),
    meal('Collation', '17:00', 280, 22, 5, ['Skyr 170 g', 'Amandes 15 g', '1 fruit']),
    meal('Dîner', '19:30', 610, 47, 12, ['Œufs 3', 'Skyr 200 g', 'Pain complet 80 g', 'Salade 300 g'])
  ]}
};

export const FOOD_SUBSTITUTIONS = {
  Protéines: ['Poulet', 'Dinde', 'Poisson blanc', 'Saumon ou truite', 'Œufs + skyr', 'Bœuf maigre', 'Tofu ferme + légumineuses'],
  Glucides: ['Riz', 'Pommes de terre', 'Pâtes complètes', 'Boulgour', 'Pain complet', 'Lentilles ou pois chiches'],
  Légumes: ['Brocoli', 'Haricots verts', 'Courgette', 'Épinards', 'Carottes', 'Mélange surgelé'],
  Express: ['Poulet rôti sans peau + légumes', 'Skyr + avoine + fruit', 'Œufs + pain complet + crudités', 'Sardines + pommes de terre']
};

export const ATHLETE_QUALITIES = [
  ['strength', 'Force'],
  ['muscle', 'Masse utile'],
  ['aerobic', 'Endurance aérobie'],
  ['intensity', 'Haute intensité'],
  ['bodyweight', 'Poids du corps'],
  ['mobility', 'Mobilité'],
  ['balance', 'Équilibre / tronc'],
  ['recovery', 'Récupération']
];

export const ATHLETE_CYCLE = [
  session('Force A · bas du corps', ['strength', 'muscle', 'balance'], 65, [
    drill('Échauffement vélo + mobilité hanches', '8 min', 'Facile'),
    drill('Presse à cuisses', '4 × 5–8', '2 RIR, dos stable'),
    drill('Soulevé de terre roumain haltères', '3 × 6–10', 'Nuque neutre, charge contrôlée'),
    drill('Fentes arrière', '3 × 8 / jambe', 'Amplitude stable'),
    drill('Leg curl', '3 × 8–12', 'Contrôle complet'),
    drill('Mollets', '3 × 12–20', 'Pause en haut'),
    drill('Pallof press + dead bug', '3 tours', 'Anti-rotation, respiration')
  ]),
  session('Base aérobie + mobilité', ['aerobic', 'mobility', 'recovery'], 55, [
    drill('Zone 2 vélo, marche inclinée ou rameur', '35–45 min', 'Conversation possible'),
    drill('Chevilles et hanches', '6 min', 'Amplitude sans douleur'),
    drill('Rotation thoracique douce', '4 min', 'Pas de contrainte cervicale'),
    drill('Respiration lente', '5 min', 'Expiration prolongée')
  ]),
  session('Force B · haut du corps', ['strength', 'muscle', 'bodyweight'], 65, [
    drill('Échauffement épaules / omoplates', '8 min', 'Sans extension cervicale'),
    drill('Développé haltères incliné', '4 × 5–8', 'Nuque neutre'),
    drill('Rowing poitrine appuyée', '4 × 6–10', 'Omoplates contrôlées'),
    drill('Tirage vertical neutre', '3 × 8–12', 'Stop si irradiation'),
    drill('Pompes progressives', '3 séries propres', 'Garder 2 répétitions en réserve'),
    drill('Élévations latérales', '3 × 12–20', 'Léger et strict'),
    drill('Curl + triceps corde', '3 × 10–15', 'Superset')
  ]),
  session('Intervalles + mouvement', ['intensity', 'bodyweight', 'mobility'], 45, [
    drill('Échauffement progressif', '10 min', 'RPE 3 à 5'),
    drill('Intervalles vélo ou rameur', '8 × 1 min / 90 s facile', 'RPE 8, jamais sprint désordonné'),
    drill('Bear crawl ou marche quadrupède', '4 × 20–30 s', 'Version sans douleur cervicale'),
    drill('Step-up dynamique', '3 × 8 / jambe', 'Contrôle avant vitesse'),
    drill('Mobilité globale', '8 min', 'Hanches, chevilles, thorax')
  ]),
  session('Force C · corps entier', ['strength', 'muscle', 'balance'], 65, [
    drill('Échauffement général', '8 min', 'Température + amplitude'),
    drill('Goblet squat ou hack squat', '4 × 6–10', 'Technique constante'),
    drill('Hip thrust', '3 × 6–10', 'Pause en haut'),
    drill('Rowing poulie', '3 × 8–12', 'Épaules basses'),
    drill('Landmine press ou machine convergente', '3 × 8–12', 'Éviter lourd au-dessus de la tête'),
    drill('Farmer carry léger à modéré', '4 × 30 m', 'Posture haute, stop si symptômes'),
    drill('Side plank', '3 × 25–45 s / côté', 'Bassin aligné')
  ]),
  session('Calisthénie + endurance musculaire', ['bodyweight', 'muscle', 'balance'], 50, [
    drill('Pompes', '5 séries sous-maximales', 'Laisser 2 répétitions en réserve'),
    drill('Tractions assistées ou tirage', '5 × 5–10', 'Qualité stricte'),
    drill('Split squat au poids du corps', '4 × 12 / jambe', 'Tempo contrôlé'),
    drill('Rowing inversé assisté', '4 × 8–15', 'Corps gainé'),
    drill('Circuit tronc', '4 tours', 'Dead bug, bird dog, side plank'),
    drill('Marche chargée légère', '8–12 min', 'Respiration nasale si confortable')
  ]),
  session('Endurance longue + souplesse', ['aerobic', 'mobility', 'recovery'], 75, [
    drill('Endurance facile', '50–70 min', 'Zone 2, progression +5 min maximum'),
    drill('Retour au calme', '5 min', 'Très facile'),
    drill('Étirements doux', '10–15 min', 'Mollets, fléchisseurs de hanche, ischios, pectoraux'),
    drill('Auto-évaluation', '2 min', 'Fatigue, douleurs, sommeil')
  ]),
  session('Récupération active', ['mobility', 'balance', 'recovery'], 35, [
    drill('Marche facile', '20–30 min', 'Aucune recherche de performance'),
    drill('Mobilité confortable', '8 min', 'Sans forcer la nuque'),
    drill('Équilibre unipodal', '3 × 30 s / côté', 'Support proche'),
    drill('Respiration / relaxation', '5 min', 'Descendre le rythme')
  ], true)
];

export const PROP_FIRM_PRESETS = {
  flex25: { label: 'MFFU Flex 25K', account: 25000, profitTarget: 1500, maxLoss: 1000, maxMini: 2, maxMicro: 20, consistencyPct: 50, minDays: 2, drawdown: 'EOD' },
  flex50: { label: 'MFFU Flex 50K', account: 50000, profitTarget: 3000, maxLoss: 2000, maxMini: 3, maxMicro: 30, consistencyPct: 50, minDays: 2, drawdown: 'EOD' },
  custom: { label: 'Plan personnalisé', account: 50000, profitTarget: 3000, maxLoss: 2000, maxMini: 3, maxMicro: 30, consistencyPct: 50, minDays: 2, drawdown: 'À vérifier' }
};

export const TRADING_CURRICULUM = [
  module('Fondations futures', 1, 'Comprendre contrats, tick, point, échéance et marge.', ['CME Institute · Futures Fundamentals', 'A Complete Guide to the Futures Market · Jack Schwager'], 'Fiche contrat complète de ton marché'),
  module('Plateforme et ordres', 2, 'Maîtriser market, limit, stop, stop-limit, OCO, bracket et replay.', ['Documentation officielle de ta plateforme', 'Trading and Exchanges · Larry Harris'], '10 ordres simulés sans erreur'),
  module('Risque de survie', 3, 'Risque fixe, stop journalier, perte maximale et risque de ruine.', ['Trade Your Way to Financial Freedom · Van K. Tharp', 'The Art of Currency Trading · Brent Donnelly'], 'Calculateur de taille et règle écrite'),
  module('Microstructure', 4, 'Liquidité, spread, carnet, agressivité et contexte de séance.', ['Trading and Exchanges · Larry Harris', 'Mind Over Markets · Dalton, Jones, Dalton'], '20 captures commentées'),
  module('Un seul setup', 5, 'Définir contexte, déclencheur, invalidation, objectif et no-trade.', ['One Good Trade · Mike Bellafiore', 'The PlayBook · Mike Bellafiore'], 'Playbook d’un setup sur une page'),
  module('Backtest propre', 6, 'Échantillon, expectancy, drawdown, séries de pertes et biais.', ['Evidence-Based Technical Analysis · David Aronson', 'Fooled by Randomness · Nassim Taleb'], '100 occurrences avec statistiques'),
  module('Exécution en replay', 7, 'Transformer la règle en comportement stable.', ['Documentation replay de ta plateforme', 'The Mental Game of Trading · Jared Tendler'], '10 séances sans violation'),
  module('Journal et revue', 8, 'Séparer qualité de décision et résultat financier.', ['The Daily Trading Coach · Brett Steenbarger', 'Enhancing Trader Performance · Brett Steenbarger'], 'Journal avant/après standardisé'),
  module('Psychologie sous pression', 9, 'Reconnaître tilt, FOMO, revanche et surconfiance.', ['Trading in the Zone · Mark Douglas', 'Best Loser Wins · Tom Hougaard'], 'Plan anti-tilt déclenchable'),
  module('Règles prop firm', 10, 'Intégrer drawdown, limite de contrats, jours minimum et cohérence.', ['Règlement officiel MyFundedFutures', 'Checklist personnelle de conformité'], 'Simulateur paramétré et signé'),
  module('Mock challenge', 11, 'Réaliser deux évaluations complètes en simulation.', ['Données replay', 'Journal quotidien'], '2 simulations sans breach'),
  module('Gate de passage', 12, 'Ne payer un challenge qu’après preuve statistique et comportementale.', ['Tableau de bord de performance', 'Revue hebdomadaire'], 'Critères de readiness tous validés')
];

export const TRADING_TOOLS = [
  ['TradingView', 'Graphiques, alertes et replay', 'Documentation officielle + raccourcis + modèle de graphique minimal'],
  ['Tradovate / NinjaTrader', 'Exécution futures', 'Ordres bracket, OCO, ATM, simulation et export des trades'],
  ['CME', 'Spécifications et calendrier', 'Tick value, horaires, échéances, jours fériés et avis de marché'],
  ['Journal', 'Décisions et statistiques', 'Capture avant/après, setup, risque, erreur, émotion, résultat R'],
  ['Tableur / dashboard', 'Expectancy et drawdown', 'Win rate, gain moyen, perte moyenne, profit factor, max losing streak'],
  ['Calendrier économique', 'Risque événementiel', 'Décider à l’avance quand ne pas trader']
];

export const STUDY_TRACKS = {
  epfc: { label: 'EPFC informatique', resources: [
    ['Algorithmique', 'Automate the Boring Stuff with Python', 'Un script fonctionnel et expliqué'],
    ['Bases de données', 'Learning SQL', 'Cinq requêtes expliquées'],
    ['Web', 'MDN Learn Web Development', 'Une page responsive'],
    ['Réseaux', 'Computer Networking: A Top-Down Approach', 'Un mini-lab documenté'],
    ['Systèmes', 'How Linux Works', 'Dix commandes appliquées']
  ]},
  nl: { label: 'Néerlandais', resources: [
    ['Base active', 'Brulingua + Anki', '20 minutes et 10 phrases'],
    ['Compréhension', 'NedBox', 'Une vidéo et un résumé'],
    ['Grammaire', 'Klare taal!', 'Une règle et cinq exemples'],
    ['Objectif B2', 'ERK oefenbank / CNaVT', 'Une tâche chronométrée']
  ]},
  repair: { label: 'Outils et réparation', resources: [
    ['Multimètre', 'Practical Electronics for Inventors', 'Mesurer tension, résistance et continuité sur un montage sûr'],
    ['Alimentation de labo', 'The Art of Electronics · chapitres ciblés', 'Limiter courant et alimenter sans court-circuit'],
    ['Fer à souder', 'Make: Electronics + guide fabricant', 'Dix soudures propres inspectées'],
    ['Oscilloscope', 'The XYZs of Oscilloscopes · Tektronix', 'Mesurer fréquence, amplitude et bruit'],
    ['Diagnostic', 'How to Diagnose and Fix Everything Electronic', 'Arbre de panne d’un appareil réel'],
    ['Sécurité atelier', 'Notices fabricants et bonnes pratiques ESD', 'Checklist atelier appliquée']
  ]}
};

export const CULTURE_SHELVES = {
  core: { label: 'Culture générale · socle', books: [
    book('Une brève histoire de presque tout', 'Bill Bryson', 'Sciences'),
    book('Cosmos', 'Carl Sagan', 'Astronomie'),
    book('Le Gène', 'Siddhartha Mukherjee', 'Biologie'),
    book('The Story of Art', 'E. H. Gombrich', 'Arts'),
    book('Les Leçons de l’histoire', 'Will & Ariel Durant', 'Histoire'),
    book('Les Routes de la soie', 'Peter Frankopan', 'Histoire mondiale'),
    book('Why Nations Fail', 'Daron Acemoglu & James Robinson', 'Institutions'),
    book('CORE Econ · The Economy', 'CORE Econ', 'Économie'),
    book('Pensées, vite et lentement', 'Daniel Kahneman', 'Psychologie'),
    book('The Righteous Mind', 'Jonathan Haidt', 'Psychologie morale'),
    book('Le Monde de Sophie', 'Jostein Gaarder', 'Philosophie'),
    book('Méditations', 'Marc Aurèle', 'Philosophie'),
    book('Le Prince', 'Nicolas Machiavel', 'Politique'),
    book('La Démocratie en Amérique · extraits', 'Alexis de Tocqueville', 'Politique'),
    book('L’Ère de la surveillance capitaliste · sélection', 'Shoshana Zuboff', 'Technologie'),
    book('The Beginning of Infinity', 'David Deutsch', 'Connaissance')
  ]},
  novels: { label: 'Romans · plaisir et profondeur', books: [
    book('L’Étranger', 'Albert Camus', 'Roman'),
    book('1984', 'George Orwell', 'Dystopie'),
    book('Le Meilleur des mondes', 'Aldous Huxley', 'Dystopie'),
    book('Crime et Châtiment', 'Fiodor Dostoïevski', 'Classique'),
    book('Les Misérables', 'Victor Hugo', 'Classique'),
    book('Cent ans de solitude', 'Gabriel García Márquez', 'Réalisme magique'),
    book('Le Monde s’effondre', 'Chinua Achebe', 'Afrique'),
    book('Beloved', 'Toni Morrison', 'Mémoire'),
    book('L’Odyssée', 'Homère', 'Épopée'),
    book('Dune', 'Frank Herbert', 'Science-fiction'),
    book('La Main gauche de la nuit', 'Ursula K. Le Guin', 'Science-fiction'),
    book('Le Nom de la rose', 'Umberto Eco', 'Historique')
  ]},
  critical: { label: 'Pensée critique', books: [
    book('The Demon-Haunted World', 'Carl Sagan', 'Esprit critique'),
    book('Calling Bullshit', 'Carl Bergstrom & Jevin West', 'Données'),
    book('How to Read a Book', 'Mortimer Adler & Charles Van Doren', 'Méthode'),
    book('Superforecasting', 'Philip Tetlock & Dan Gardner', 'Prévision'),
    book('Factfulness', 'Hans Rosling', 'Statistiques'),
    book('Fooled by Randomness', 'Nassim Nicholas Taleb', 'Hasard'),
    book('The Scout Mindset', 'Julia Galef', 'Raisonnement'),
    book('On Bullshit', 'Harry Frankfurt', 'Argumentation')
  ]}
};

export const DEFAULT_RECURRING = [
  ['Loyer', 625, 1],
  ['Contribution alimentaire', 600, 5],
  ['Assurance voiture', 130, 10],
  ['Électricité', 80, 15],
  ['Internet', 50, 18],
  ['Téléphone', 30, 20],
  ['Sport', 30, 22]
];

function meal(title, time, calories, protein, fiber, items) {
  return { id: `${title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_')}_${time}`, title, time, calories, protein, fiber, items };
}
function session(name, qualities, duration, exercises, recovery = false) {
  return { id: slug(name), name, qualities, duration, exercises, recovery };
}
function drill(name, target, note) { return { id: slug(name), name, target, note }; }
function module(title, week, objective, resources, proof) { return { id: `week_${week}`, title, week, objective, resources, proof }; }
function book(title, author, category) { return { id: slug(`${author}_${title}`), title, author, category }; }
function slug(value) { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }
