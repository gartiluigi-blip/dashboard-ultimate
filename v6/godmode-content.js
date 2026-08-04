export const HEALTH_PILLARS = [
  { id: 'sleep', label: 'Sommeil', icon: '🌙', target: '7–9 h, horaires réguliers', why: 'Mémoire, énergie, humeur, récupération et santé cardio-métabolique.' },
  { id: 'movement', label: 'Mouvement', icon: '⚡', target: '150–300 min/semaine + force 2×', why: 'Cœur, cerveau, glycémie, masse musculaire et longévité fonctionnelle.' },
  { id: 'nutrition', label: 'Nutrition', icon: '🥗', target: '400 g fruits/légumes + 25 g fibres', why: 'Micronutriments, microbiote, poids, foie et santé vasculaire.' },
  { id: 'cardio', label: 'Cœur & métabolisme', icon: '♥', target: 'Tension, lipides, glycémie et tour de taille suivis', why: 'Prévenir silencieusement hypertension, diabète et risque cardiovasculaire.' },
  { id: 'brain', label: 'Cerveau & mémoire', icon: '🧠', target: 'Apprendre, bouger, dormir, socialiser', why: 'Attention, apprentissage, humeur et réserve cognitive.' },
  { id: 'recovery', label: 'Stress & récupération', icon: '◌', target: 'Lumière, pauses, respiration, liens sociaux', why: 'Énergie stable, sommeil, pression artérielle et adhérence aux habitudes.' },
  { id: 'prevention', label: 'Prévention', icon: '✚', target: 'Médecin, dentiste, vaccins et dépistages adaptés', why: 'Détecter tôt ce qui ne donne pas encore de symptômes.' },
  { id: 'safety', label: 'Substances & sécurité', icon: '◇', target: 'Zéro tabac, alcool minimal ou nul, médicaments revus', why: 'Foie, cœur, cerveau, cancer, sommeil et interactions.' }
];

export const ORGAN_SYSTEMS = [
  { id: 'energy', label: 'Énergie', icon: '⚡', inputs: ['Sommeil', 'hydratation', 'douleur', 'stress', 'activité', 'apports'], note: 'Un score d’habitudes, jamais un diagnostic de fatigue.' },
  { id: 'heart', label: 'Cœur', icon: '♥', inputs: ['Tension', 'activité', 'sommeil', 'nutrition', 'nicotine', 'glycémie'], note: 'La tension et les analyses médicales comptent davantage que les sensations.' },
  { id: 'brain', label: 'Cerveau', icon: '🧠', inputs: ['Sommeil', 'activité', 'apprentissage', 'humeur', 'liens sociaux'], note: 'Les applications de brain training seules ne remplacent pas ces fondamentaux.' },
  { id: 'liver', label: 'Foie', icon: '◐', inputs: ['Poids', 'alcool', 'boissons sucrées', 'activité', 'médicaments'], note: 'Aucun “détox” : le suivi médical et les habitudes métaboliques priment.' },
  { id: 'metabolic', label: 'Métabolisme', icon: '◆', inputs: ['Tour de taille', 'poids', 'activité', 'fibres', 'sommeil'], note: 'Le score ne remplace pas glycémie, HbA1c ou bilan lipidique.' },
  { id: 'gut', label: 'Digestion', icon: '≈', inputs: ['Fibres', 'diversité végétale', 'hydratation', 'symptômes'], note: 'Les symptômes persistants ou le sang imposent un avis médical.' }
];

export const PREVENTION_ITEMS = [
  { id: 'gp', label: 'Bilan médecin généraliste', cadence: 'Selon risques et symptômes', category: 'Médical' },
  { id: 'bp', label: 'Tension artérielle correctement mesurée', cadence: 'Périodique', category: 'Cœur' },
  { id: 'dental', label: 'Contrôle dentaire et hygiène', cadence: 'Régulier', category: 'Prévention' },
  { id: 'vision', label: 'Vision / correction', cadence: 'Selon besoin', category: 'Sens' },
  { id: 'hearing', label: 'Audition si gêne ou exposition au bruit', cadence: 'Selon besoin', category: 'Sens' },
  { id: 'vaccines', label: 'Vaccins à jour', cadence: 'Calendrier belge / médecin', category: 'Immunité' },
  { id: 'medication', label: 'Revue médicaments et compléments', cadence: 'À chaque changement', category: 'Sécurité' },
  { id: 'labs', label: 'Analyses indiquées par le médecin', cadence: 'Selon contexte', category: 'Biologie' },
  { id: 'skin', label: 'Peau : lésion qui change ou ne guérit pas', cadence: 'Surveillance', category: 'Cancer' },
  { id: 'mental', label: 'Humeur, anxiété, stress et addictions', cadence: 'Auto-check mensuel', category: 'Mental' }
];

export const ENERGY_PROTOCOL = [
  ['Réveil', 'Lumière extérieure, eau, quelques minutes de mouvement et heure de lever stable.'],
  ['Matin', 'Travail cognitif difficile avant la dispersion; café seulement si utile, pas pour masquer une dette de sommeil.'],
  ['Midi', 'Repas rassasiant riche en protéines, fibres et végétaux; marche courte après le repas.'],
  ['Après-midi', 'Pause active, hydratation, tâche plus légère si baisse normale de vigilance.'],
  ['Soir', 'Baisser lumière et stimulation; arrêter caféine assez tôt; préparer le lendemain.'],
  ['Nuit', 'Chambre sombre, fraîche et calme; objectif 7–9 heures avec régularité.']
];

export const META_LEARNING_PATH = [
  { id: 'attention', title: 'Attention et environnement', goal: 'Supprimer les distractions et définir une cible observable.', drill: '25 minutes mono-tâche, téléphone hors de portée, objectif écrit.', proof: 'Écris ce que tu as produit, pas seulement le temps passé.' },
  { id: 'retrieval', title: 'Rappel actif', goal: 'Essayer de récupérer l’information sans regarder.', drill: 'Ferme le cours et réponds à cinq questions de mémoire.', proof: 'Note les réponses, les erreurs et la correction.' },
  { id: 'spacing', title: 'Espacement', goal: 'Revoir juste avant l’oubli plutôt que relire en bloc.', drill: 'Programme J+1, J+3, J+7, J+14 et J+30.', proof: 'Crée au moins cinq cartes ou questions datées.' },
  { id: 'interleave', title: 'Entrelacement', goal: 'Mélanger des problèmes proches pour apprendre à choisir la méthode.', drill: 'Alterne trois types d’exercices au lieu de faire une série identique.', proof: 'Explique pourquoi chaque méthode était la bonne.' },
  { id: 'elaboration', title: 'Élaboration et Feynman', goal: 'Relier, comparer et expliquer avec des mots simples.', drill: 'Explique le sujet à une personne imaginaire en une page.', proof: 'Surligne les trous où ton explication devient vague.' },
  { id: 'feedback', title: 'Pratique délibérée', goal: 'Travailler précisément la faiblesse avec retour rapide.', drill: 'Choisis une erreur récurrente et répète une version légèrement plus difficile.', proof: 'Avant/après mesurable ou feedback externe.' },
  { id: 'notes', title: 'Notes utiles', goal: 'Construire des idées reliées, pas stocker des citations.', drill: 'Une note = une idée reformulée + source + lien vers une autre idée.', proof: 'Crée cinq notes atomiques reliées.' },
  { id: 'transfer', title: 'Transfert par projet', goal: 'Utiliser la connaissance dans un contexte nouveau.', drill: 'Construis, enseigne, écris ou résous un problème réel.', proof: 'Livre un résultat visible et une rétrospective.' }
];

export const LEARNING_BOOKS = [
  { id: 'make-it-stick', title: 'Make It Stick', author: 'Peter C. Brown, Henry L. Roediger III, Mark A. McDaniel', role: 'Fondations : rappel, espacement, difficulté désirable', order: 1 },
  { id: 'understanding-learning', title: 'Understanding How We Learn', author: 'Yana Weinstein, Megan Sumeracki, Oliver Caviglioli', role: 'Méthodes cognitives illustrées et applicables', order: 2 },
  { id: 'peak', title: 'Peak', author: 'Anders Ericsson, Robert Pool', role: 'Pratique délibérée et feedback', order: 3 },
  { id: 'mind-for-numbers', title: 'A Mind for Numbers', author: 'Barbara Oakley', role: 'Apprendre les matières difficiles et résoudre des problèmes', order: 4 },
  { id: 'smart-notes', title: 'How to Take Smart Notes', author: 'Sönke Ahrens', role: 'Notes reliées et production écrite', order: 5 },
  { id: 'ultralearning', title: 'Ultralearning', author: 'Scott Young', role: 'Projet intensif, directness et expérimentation', order: 6 },
  { id: 'scout-mindset', title: 'The Scout Mindset', author: 'Julia Galef', role: 'Raisonnement, calibration et correction des croyances', order: 7 },
  { id: 'thinking-bets', title: 'Thinking in Bets', author: 'Annie Duke', role: 'Décider sous incertitude sans confondre résultat et qualité', order: 8 }
];

export const CULTURE_DOMAINS = [
  { id: 'world-history', label: 'Histoire mondiale', icon: '⌛', foundation: 'Grandes civilisations, empires, révolutions, industrialisation, guerres mondiales et décolonisation.', output: 'Construire une frise de 30 événements et expliquer cinq causalités.' },
  { id: 'geography', label: 'Géographie & géopolitique', icon: '◎', foundation: 'Cartes, ressources, démographie, frontières, puissances et organisations internationales.', output: 'Placer 50 pays, mers, détroits et zones stratégiques puis expliquer un conflit.' },
  { id: 'economics', label: 'Économie', icon: '↗', foundation: 'Offre, demande, inflation, taux, monnaie, chômage, croissance, commerce et inégalités.', output: 'Expliquer une décision de banque centrale sans jargon.' },
  { id: 'institutions', label: 'Politique, institutions & droit', icon: '§', foundation: 'État de droit, séparation des pouvoirs, élections, UE, Belgique, droits fondamentaux et justice.', output: 'Comparer trois systèmes politiques et cartographier les institutions belges.' },
  { id: 'philosophy', label: 'Philosophie & éthique', icon: 'Φ', foundation: 'Connaissance, morale, liberté, justice, identité, science et sens.', output: 'Écrire une objection forte à ta propre position.' },
  { id: 'physics', label: 'Physique & univers', icon: '∞', foundation: 'Mouvement, énergie, matière, thermodynamique, relativité, quantique et cosmologie.', output: 'Expliquer dix phénomènes quotidiens avec un modèle physique.' },
  { id: 'life-science', label: 'Biologie & médecine', icon: '✦', foundation: 'Cellule, génétique, évolution, immunité, organes, épidémiologie et méthode clinique.', output: 'Expliquer comment une preuve médicale devient une recommandation.' },
  { id: 'earth', label: 'Climat & planète', icon: '◉', foundation: 'Géologie, cycles, climat, énergie, biodiversité et risques naturels.', output: 'Distinguer météo, climat, scénario et incertitude.' },
  { id: 'technology', label: 'Technologie & informatique', icon: '⌘', foundation: 'Internet, données, algorithmes, cybersécurité, IA, énergie et fabrication.', output: 'Dessiner le trajet d’une requête web et les risques principaux.' },
  { id: 'psychology', label: 'Psychologie & société', icon: '◇', foundation: 'Perception, mémoire, motivation, biais, groupes, classes sociales et institutions.', output: 'Analyser un comportement avec plusieurs hypothèses concurrentes.' },
  { id: 'literature', label: 'Littérature & langues', icon: 'A', foundation: 'Genres, grands mouvements, mythes, narration, poésie et traditions mondiales.', output: 'Comparer deux œuvres de cultures différentes sur un même thème.' },
  { id: 'arts', label: 'Arts, musique & architecture', icon: '▣', foundation: 'Styles, périodes, composition, représentation, technique et contexte social.', output: 'Présenter une œuvre en décrivant forme, contexte et interprétation.' },
  { id: 'religions', label: 'Religions & idées', icon: '✧', foundation: 'Judaïsme, christianisme, islam, hindouisme, bouddhisme, traditions chinoises et sécularisation.', output: 'Comparer croyances, pratiques et histoire sans caricature.' },
  { id: 'media', label: 'Médias & esprit critique', icon: '◫', foundation: 'Source, preuve, causalité, statistiques, propagande, réseaux sociaux et vérification.', output: 'Auditer une affirmation avec source primaire, contre-argument et degré de confiance.' }
];

export const CULTURE_QUESTIONS = [
  ['Histoire', 'Pourquoi la révolution industrielle a-t-elle commencé en Grande-Bretagne ?', 'Ressources, institutions, capital, commerce, innovations et main-d’œuvre ont interagi; aucune cause unique ne suffit.'],
  ['Géographie', 'Pourquoi les détroits maritimes ont-ils une importance géopolitique ?', 'Ils concentrent le trafic, réduisent les routes alternatives et créent des points de pression économiques et militaires.'],
  ['Économie', 'Pourquoi une banque centrale augmente-t-elle ses taux ?', 'Pour ralentir la demande et le crédit afin de réduire les pressions inflationnistes, au prix possible d’une activité plus faible.'],
  ['Politique', 'À quoi sert la séparation des pouvoirs ?', 'À limiter la concentration du pouvoir grâce à des institutions capables de se contrôler mutuellement.'],
  ['Philosophie', 'Quelle différence entre une opinion et une croyance justifiée ?', 'Une croyance justifiée repose sur des raisons et des preuves évaluables, tout en restant révisable.'],
  ['Physique', 'Pourquoi le ciel est-il bleu ?', 'Les molécules de l’atmosphère diffusent davantage les courtes longueurs d’onde visibles que les longues.'],
  ['Biologie', 'Pourquoi les antibiotiques ne traitent-ils pas les virus ?', 'Ils ciblent des structures ou fonctions bactériennes que les virus ne possèdent pas.'],
  ['Climat', 'Pourquoi un événement froid ne réfute-t-il pas le réchauffement climatique ?', 'La météo décrit un événement local et court; le climat décrit des distributions et tendances de long terme.'],
  ['Technologie', 'Que se passe-t-il lorsque tu ouvres un site web ?', 'Résolution DNS, connexion réseau sécurisée, requête HTTP, réponse du serveur puis rendu par le navigateur.'],
  ['Psychologie', 'Pourquoi la mémoire n’est-elle pas un enregistrement fidèle ?', 'Elle reconstruit à partir de traces, du contexte, des attentes et d’informations ultérieures.'],
  ['Arts', 'Pourquoi le contexte change-t-il l’interprétation d’une œuvre ?', 'Le commanditaire, la technique, les conventions et les événements de l’époque modifient ce que l’œuvre pouvait signifier.'],
  ['Médias', 'Quelle différence entre corrélation et causalité ?', 'Une association peut venir d’un facteur tiers, du hasard ou d’une causalité inversée; établir une cause exige davantage de preuves.']
];

export const SOURCE_LADDER = [
  ['1', 'Source primaire', 'Texte de loi, données, étude originale, discours complet, document officiel.'],
  ['2', 'Synthèse rigoureuse', 'Revue systématique, recommandation d’institution scientifique, manuel académique.'],
  ['3', 'Expert transparent', 'Analyse qui cite ses sources, distingue fait et opinion et expose les limites.'],
  ['4', 'Presse de qualité', 'Bonne pour l’actualité et le contexte, à remonter vers la source sur les points importants.'],
  ['5', 'Réseaux sociaux', 'Point de départ seulement; jamais preuve finale pour une décision importante.']
];
