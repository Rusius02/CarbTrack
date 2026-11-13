# CarbTrack

Application web locale pour estimer les émissions carbone de particuliers et d’organisations. Le navigateur communique avec une API locale Python ; cette API conserve le workspace dans une base SQLite sur la machine.

## Démarrer

Prérequis : Python 3.10 ou plus récent (SQLite est inclus avec Python).

```powershell
python -m backend.run
```

Ouvrir ensuite <http://127.0.0.1:8000>. Le serveur écoute uniquement sur l’interface locale par défaut et sert à la fois le site et l’API ; ne pas ouvrir `index.html` directement ni démarrer un serveur statique séparé.

Pour exécuter les tests :

```powershell
npm test
python -m unittest discover -s tests_backend -v
```

La base est créée automatiquement dans `data/carbtrack.sqlite3` au premier démarrage. `data/` est exclu de Git. Pour choisir un autre emplacement, définir `CARBTRACK_DB_PATH`. Le port peut être remplacé via `CARBTRACK_PORT`. Le serveur reste lié à `127.0.0.1` afin que le stockage carbone demeure accessible uniquement depuis la machine locale.

**Sauvegarde :** arrêter le serveur et copier le fichier SQLite. Le projet est un prototype mono-workspace, mono-utilisateur, sans authentification ni synchronisation. Ne pas exposer ce serveur sur un réseau partagé ou Internet.

## Architecture

```text
src/                              # Application navigateur (JavaScript ES modules)
├── domain/                       # Entités métier et calculs purs
├── application/
│   ├── ports/                    # Contrats de persistance
│   └── use-cases/                # Opérations et politiques applicatives
├── infrastructure/
│   ├── persistence/              # Adaptateur HTTP, découplé du stockage serveur
│   └── payments/                 # Liens de paiement hébergés
├── presentation/                 # Vues DOM et contrôleurs
└── main.js                       # Composition root navigateur

backend/
└── carbtrack/
    ├── domain/                   # Modèle et validation côté serveur
    ├── application/              # Service et port de dépôt
    ├── infrastructure/
    │   └── persistence/          # Adaptateur SQLite et migrations SQL
    └── presentation/             # API HTTP et service de fichiers statiques
```

Les dépendances suivent une architecture ports/adaptateurs : l’application dépend des contrats, et le point de composition assemble les implémentations. L’API valide à nouveau toutes les données avant écriture ; la base impose également des contraintes et enregistre chaque remplacement de workspace dans une transaction. Le dépôt SQLite est remplaçable sans faire dépendre les règles métier du moteur SQL.

La version précédente stockait le workspace dans `localStorage` sous `carbtrack-v1`. Au premier chargement, si la base SQLite est encore vierge, le client migre cette donnée vers l’API ; la clé locale n’est supprimée qu’après confirmation de l’enregistrement. En cas d’échec, les données historiques restent en place et l’erreur est affichée.

## Données et méthode carbone

Le calcul appliqué à chaque activité est :

`émissions (kgCO₂e) = quantité × facteur d’émission (kgCO₂e / unité)`

Le total est une estimation à partir des activités saisies. Les facteurs d’émission de l’exemple sont **fictifs et illustratifs** ; ils ne proviennent pas de la Base Empreinte® et ne doivent pas être utilisés dans un inventaire officiel. Pour un bilan plus fiable, renseigner des facteurs documentés adaptés au pays, à l’année, à la technologie et au périmètre de l’activité.

Le GHG Protocol Corporate Standard distingue les émissions directes (scope 1), les émissions indirectes liées à l’énergie achetée (scope 2) et les autres émissions indirectes de la chaîne de valeur (scope 3). Ce prototype ne réalise pas à lui seul un BEGES réglementaire, une vérification indépendante ou un rapport CSRD/ESRS.

## Références réglementaires et méthodologiques

- [Base Empreinte® de l’ADEME](https://base-empreinte.ademe.fr/) — base publique de facteurs d’émission et de données d’inventaire.
- [GHG Protocol — Corporate Standard](https://ghgprotocol.org/corporate-standard) — principes de comptabilité des émissions d’organisations ; voir aussi le [Scope 2 Guidance](https://ghgprotocol.org/scope-2-guidance).
- [Code de l’environnement, article L. 229-25](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044598109) — référence française relative au bilan d’émissions de gaz à effet de serre (BEGES).
- [Directive (UE) 2022/2464 (CSRD)](https://eur-lex.europa.eu/eli/dir/2022/2464/oj) — publication d’informations de durabilité par les entreprises.
- [Règlement délégué (UE) 2023/2772 (ESRS)](https://eur-lex.europa.eu/eli/reg_del/2023/2772/oj) — normes européennes de reporting de durabilité.
- [Directive (UE) 2025/794](https://eur-lex.europa.eu/eli/dir/2025/794/oj) — modification des dates d’application de certaines obligations CSRD/CSDDD.

La réglementation évolue et son applicabilité dépend du profil de chaque organisation. Ces références sont des points de départ, pas une analyse juridique ni une liste exhaustive des textes applicables. Vérifier les versions consolidées, la transposition nationale et les obligations en vigueur avant toute déclaration.

## Rémunération

Les offres et tarifs affichés restent indicatifs. Le checkout n’est pas activé par défaut. Pour commercialiser les abonnements, configurer `window.CARBTRACK_CHECKOUT_URLS` avant le module `src/main.js` avec des Payment Links Stripe hébergés. Le serveur ne reçoit ni ne conserve de données de paiement. La gestion des comptes, des abonnements, des webhooks et des droits d’accès nécessitera une implémentation serveur dédiée ; ne jamais placer une clé secrète Stripe dans le front-end.
