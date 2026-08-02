export const ROUTES = [
  ['today', 'Aujourd’hui'],
  ['nutrition', 'Nutrition'],
  ['sport', 'Sport'],
  ['study', 'Études'],
  ['money', 'Argent'],
  ['system', 'Système']
];

export const DAY_MODES = {
  auto: { label: 'Auto', description: 'Le moteur adapte la charge selon énergie, douleur, temps et retard.' },
  normal: { label: 'Normal', description: 'Une action majeure et deux maintiens.' },
  execution: { label: 'Exécution', description: 'Priorité au bloc principal, sans dispersion.' },
  fatigue: { label: 'Fatigue', description: 'Charge réduite et action minimale utile.' },
  recovery: { label: 'Récupération', description: 'Douleur, sommeil et récupération avant performance.' }
};

export const MEAL_PLAN = {
  1: {
    name: 'Lundi',
    meals: [
      meal('Petit-déjeuner', '07:30', 560, 43, 12, ['Skyr 250 g', 'Flocons d’avoine 60 g', 'Œufs 2', 'Fruits rouges 100 g', 'Graines de lin moulues 10 g']),
      meal('Déjeuner', '12:30', 670, 52, 13, ['Poulet 200 g cru', 'Riz basmati 70 g cru', 'Brocoli 200 g', 'Poivron 150 g', 'Huile d’olive 10 g']),
      meal('Collation', '16:30', 280, 22, 5, ['Skyr 170 g', 'Amandes 15 g', '1 fruit']),
      meal('Dîner', '19:30', 610, 42, 10, ['Saumon 150 g cru', 'Pommes de terre 300 g cuites', 'Haricots verts 250 g', 'Huile d’olive 5 g'])
    ]
  },
  2: {
    name: 'Mardi',
    meals: [
      meal('Petit-déjeuner', '07:30', 560, 43, 12, ['Skyr 250 g', 'Flocons d’avoine 60 g', 'Œufs 2', '1 pomme', 'Graines de lin 10 g']),
      meal('Déjeuner', '12:30', 650, 51, 12, ['Dinde 200 g crue', 'Pommes de terre 350 g cuites', 'Courgettes 250 g', 'Carottes 150 g', 'Huile d’olive 10 g']),
      meal('Collation', '16:30', 280, 22, 5, ['Skyr 170 g', 'Noix 15 g', '1 fruit']),
      meal('Dîner', '19:30', 590, 47, 15, ['Cabillaud 180 g cru', 'Lentilles 180 g cuites', 'Épinards 250 g', 'Huile d’olive 5 g'])
    ]
  },
  3: {
    name: 'Mercredi',
    meals: [
      meal('Petit-déjeuner', '07:30', 540, 42, 11, ['Fromage blanc 300 g', 'Avoine 50 g', 'Œufs 2', 'Banane 1 petite']),
      meal('Déjeuner', '12:30', 680, 45, 11, ['Bœuf haché 5 % 180 g cru', 'Riz 70 g cru', 'Champignons 200 g', 'Haricots verts 200 g']),
      meal('Collation', '16:30', 270, 21, 5, ['Skyr 170 g', 'Amandes 15 g', '1 fruit']),
      meal('Dîner', '19:30', 620, 46, 12, ['Œufs 3', 'Cottage cheese 200 g', 'Pain complet 80 g', 'Salade composée 300 g'])
    ]
  },
  4: {
    name: 'Jeudi',
    meals: [
      meal('Petit-déjeuner', '07:30', 560, 43, 12, ['Skyr 250 g', 'Avoine 60 g', 'Œufs 2', 'Fruits rouges 100 g']),
      meal('Déjeuner', '12:30', 670, 51, 13, ['Poulet 200 g cru', 'Boulgour 70 g cru', 'Brocoli 200 g', 'Carottes 150 g', 'Huile d’olive 10 g']),
      meal('Collation', '16:30', 280, 22, 5, ['Skyr 170 g', 'Noix 15 g', '1 fruit']),
      meal('Dîner', '19:30', 600, 39, 12, ['Sardines 120 g égouttées', 'Pommes de terre 300 g', 'Tomate et concombre 300 g', 'Avocat 70 g'])
    ]
  },
  5: {
    name: 'Vendredi',
    meals: [
      meal('Petit-déjeuner', '07:30', 540, 42, 11, ['Fromage blanc 300 g', 'Avoine 50 g', 'Œufs 2', '1 fruit']),
      meal('Déjeuner', '12:30', 690, 52, 14, ['Dinde 200 g crue', 'Pâtes complètes 80 g crues', 'Sauce tomate sans sucre 150 g', 'Courgettes 250 g']),
      meal('Collation', '16:30', 280, 22, 5, ['Skyr 170 g', 'Amandes 15 g', '1 fruit']),
      meal('Dîner', '19:30', 640, 46, 17, ['Bœuf haché 5 % 150 g cru', 'Haricots rouges 180 g cuits', 'Riz 120 g cuit', 'Poivrons et tomates 300 g'])
    ]
  },
  6: {
    name: 'Samedi',
    meals: [
      meal('Petit-déjeuner', '08:30', 570, 43, 12, ['Skyr 250 g', 'Avoine 60 g', 'Œufs 2', 'Banane 1 petite']),
      meal('Déjeuner', '13:00', 670, 51, 13, ['Poulet 200 g cru', 'Pommes de terre 350 g', 'Légumes variés 350 g', 'Huile d’olive 10 g']),
      meal('Collation', '17:00', 280, 22, 5, ['Skyr 170 g', 'Noix 15 g', '1 fruit']),
      meal('Dîner', '20:00', 630, 45, 14, ['Truite 170 g crue', 'Pois chiches 160 g cuits', 'Épinards 250 g', 'Huile d’olive 5 g'])
    ]
  },
  0: {
    name: 'Dimanche',
    meals: [
      meal('Petit-déjeuner', '08:30', 550, 42, 11, ['Fromage blanc 300 g', 'Avoine 50 g', 'Œufs 2', 'Fruits rouges 100 g']),
      meal('Déjeuner', '13:00', 660, 51, 13, ['Poulet 200 g cru', 'Riz 70 g cru', 'Brocoli ou chou-fleur 300 g', 'Huile d’olive 10 g']),
      meal('Collation', '17:00', 280, 22, 5, ['Skyr 170 g', 'Amandes 15 g', '1 fruit']),
      meal('Dîner', '19:30', 610, 47, 12, ['Œufs 3', 'Skyr 200 g', 'Pain complet 80 g', 'Salade composée 300 g', 'Noix 15 g'])
    ]
  }
};

export const FOOD_SUBSTITUTIONS = {
  protein: ['Poulet', 'Dinde', 'Poisson blanc', 'Saumon ou truite', 'Œufs + skyr', 'Bœuf maigre', 'Tofu ferme + légumineuses'],
  carbs: ['Riz', 'Pommes de terre', 'Pâtes complètes', 'Boulgour', 'Pain complet', 'Lentilles ou pois chiches'],
  vegetables: ['Brocoli', 'Haricots verts', 'Courgette', 'Épinards', 'Carottes', 'Mélange de légumes surgelés'],
  quick: ['Poulet rôti sans peau + légumes surgelés', 'Skyr + avoine + fruit', 'Œufs + pain complet + crudités', 'Sardines + pommes de terre vapeur']
};

export const SPORT_PROGRAM = [
  workout('Upper A', 'Poussée et tirage horizontal, sans charge inutile sur la nuque', [
    exercise('Développé haltères incliné', 3, '6–10', '1–2 RIR'),
    exercise('Rowing poitrine appuyée', 3, '8–12', 'Nuque neutre'),
    exercise('Tirage vertical neutre', 3, '8–12', 'Amplitude sans douleur irradiée'),
    exercise('Élévations latérales', 3, '12–20', 'Contrôle strict'),
    exercise('Extension triceps corde', 2, '10–15', ''),
    exercise('Curl marteau', 2, '8–12', '')
  ]),
  workout('Lower A', 'Quadriceps, ischios, fessiers et gainage', [
    exercise('Presse à cuisses', 3, '6–10', 'Dos stable'),
    exercise('Leg curl assis', 3, '8–12', ''),
    exercise('Fentes arrière', 2, '8–12 / jambe', ''),
    exercise('Hip thrust', 2, '8–12', ''),
    exercise('Mollets debout', 3, '10–15', ''),
    exercise('Pallof press', 2, '10–15 / côté', '')
  ]),
  workout('Récupération', 'Marche ou vélo facile, mobilité sans douleur', [], true),
  workout('Upper B', 'Pompes ou dips assistés, tirage et bras', [
    exercise('Pompes progressives', 4, '5–12', 'Choisir une variante propre'),
    exercise('Rowing poulie assis', 3, '8–12', 'Épaules basses'),
    exercise('Tractions assistées ou tirage vertical', 3, '5–10', 'Aucune répétition forcée'),
    exercise('Écarté poulie', 2, '10–15', ''),
    exercise('Face pull léger', 2, '12–20', 'Sans extension cervicale'),
    exercise('Curl incliné', 2, '8–12', '')
  ]),
  workout('Lower B', 'Chaîne postérieure et stabilité', [
    exercise('Soulevé de terre roumain haltères', 3, '6–10', 'Charge modérée, nuque neutre'),
    exercise('Bulgarian split squat', 2, '8–10 / jambe', ''),
    exercise('Leg curl', 3, '8–12', ''),
    exercise('Adducteurs machine', 2, '10–15', ''),
    exercise('Mollets assis', 3, '10–20', ''),
    exercise('Side plank', 2, '25–45 sec / côté', '')
  ]),
  workout('Repos', 'Repos complet ou marche légère', [], true)
];

export const STUDY_TRACKS = {
  epfc: {
    label: 'EPFC informatique',
    resources: [
      ['Python et algorithmique', 'Automate the Boring Stuff with Python', 'Produire un script utile'],
      ['Bases de données', 'Learning SQL', 'Écrire et expliquer cinq requêtes'],
      ['Web', 'MDN Learn Web Development', 'Construire une page responsive'],
      ['Réseaux', 'Computer Networking: A Top-Down Approach', 'Réaliser un mini-lab réseau'],
      ['Systèmes', 'How Linux Works', 'Documenter dix commandes Linux']
    ]
  },
  nl: {
    label: 'Néerlandais',
    resources: [
      ['Base active', 'Brulingua + Anki', '20 minutes et 10 phrases'],
      ['Compréhension', 'NedBox', 'Une vidéo et un résumé'],
      ['Grammaire', 'Klare taal!', 'Une règle et cinq exemples'],
      ['Objectif B2', 'ERK oefenbank / CNaVT', 'Une tâche chronométrée']
    ]
  },
  repair: {
    label: 'Réparation électronique',
    resources: [
      ['Diagnostic', 'How to Diagnose and Fix Everything Electronic', 'Créer un arbre de panne'],
      ['Mesures', 'Practical Electronics for Inventors', 'Effectuer et noter trois mesures'],
      ['Atelier', 'iFixit + cas réel', 'Documenter une réparation complète']
    ]
  }
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
  return { id: `${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '_')}_${time}`, title, time, calories, protein, fiber, items };
}

function workout(name, focus, exercises, recovery = false) {
  return { name, focus, exercises, recovery };
}

function exercise(name, sets, target, note) {
  return { id: name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(/[^a-z0-9]+/g, '_'), name, sets, target, note };
}
