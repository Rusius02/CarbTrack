# CarbTrack

Application web statique pour estimer et suivre les émissions carbone de particuliers et d’organisations.

## Architecture

Le code est organisé en couches ; les dépendances vont de l’extérieur vers le domaine :

```text
src/
├── domain/                 # Entités, règles métier et calculs purs
├── application/
│   ├── ports/              # Contrats attendus par les cas d’usage
│   └── use-cases/          # Opérations applicatives indépendantes du navigateur
├── infrastructure/
│   ├── persistence/        # Adaptateur localStorage
│   └── payments/           # Adaptateur Stripe Payment Links
├── presentation/           # Vues DOM et contrôleurs de l’interface
└── main.js                 # Composition root : assemble les dépendances
tests/
├── domain/
├── application/
└── infrastructure/
```

### Décisions de conception

- **Responsabilité unique (SRP)** : `Activity` valide une activité ; `AnnualReport` agrège une période ; chaque cas d’usage orchestre une seule opération ; `DashboardView` s’occupe de la présentation DOM.
- **Ouverture/fermeture (OCP)** : le stockage et le paiement sont des adaptateurs remplaçables ; les cas d’usage ne dépendent pas de `localStorage` ou de Stripe.
- **Substitution de Liskov (LSP)** : les implémentations du port `StateRepository` peuvent remplacer le stockage local sans changer les cas d’usage.
- **Ségrégation des interfaces (ISP)** : le port de persistance expose uniquement `load` et `save`.
- **Inversion des dépendances (DIP)** : l’application dépend des contrats ; `src/main.js` est le seul point qui connaît les implémentations concrètes.
- **Encapsulation et immutabilité** : les entités valident leur état à la création et exposent un calcul métier dérivé.
- **Injection des dépendances** : cas d’usage, contrôleurs et adaptateurs reçoivent explicitement leurs dépendances ; les tests peuvent utiliser un dépôt en mémoire.

Le JavaScript natif par modules ES évite d’imposer une chaîne de compilation au prototype. `package.json` fournit uniquement le runner de tests natif Node.

## Démarrer

Les modules ES doivent être servis via HTTP (ne pas ouvrir le fichier directement en `file://`). Depuis la racine du projet :

```powershell
python -m http.server 8000
```

Puis ouvrir <http://localhost:8000>. Aucune dépendance applicative n’est requise. Lancer les tests avec :

```powershell
npm test
```

Les activités et préférences sont stockées dans le `localStorage` du navigateur sous la clé `carbtrack-v1`. Elles ne sont ni synchronisées ni sauvegardées sur un serveur.

## Méthode et limites

Le calcul appliqué à chaque activité est :

`émissions (kgCO₂e) = quantité × facteur d’émission (kgCO₂e / unité)`

Le total affiché est une estimation à partir des activités saisies. Les facteurs d’émission de l’exemple sont **fictifs et illustratifs** ; ils ne proviennent pas de la Base Empreinte® et ne doivent pas être utilisés dans un inventaire officiel. Pour un résultat plus fiable, renseigner des facteurs documentés adaptés au pays, à l’année, à la technologie et au périmètre de l’activité. Conserver la référence et les hypothèses associées aux facteurs est recommandé.

Le GHG Protocol Corporate Standard distingue les émissions directes (scope 1), les émissions indirectes liées à l’énergie achetée (scope 2) et les autres émissions indirectes de la chaîne de valeur (scope 3). Les scopes ne sont demandés que dans le profil organisationnel. Ce prototype ne réalise pas à lui seul un BEGES réglementaire, une vérification indépendante ou un rapport CSRD/ESRS.

## Références réglementaires et méthodologiques

- [Base Empreinte® de l’ADEME](https://base-empreinte.ademe.fr/) — base publique de facteurs d’émission et de données d’inventaire.
- [GHG Protocol — Corporate Standard](https://ghgprotocol.org/corporate-standard) — principes de comptabilité des émissions d’organisations ; voir aussi le [Scope 2 Guidance](https://ghgprotocol.org/scope-2-guidance).
- [Code de l’environnement, article L. 229-25](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044598109) — référence française relative au bilan d’émissions de gaz à effet de serre (BEGES).
- [Directive (UE) 2022/2464 (CSRD)](https://eur-lex.europa.eu/eli/dir/2022/2464/oj) — directive sur la publication d’informations en matière de durabilité par les entreprises.
- [Règlement délégué (UE) 2023/2772 (ESRS)](https://eur-lex.europa.eu/eli/reg_del/2023/2772/oj) — normes européennes de reporting de durabilité.
- [Directive (UE) 2025/794](https://eur-lex.europa.eu/eli/dir/2025/794/oj) — modification des dates d’application de certaines obligations CSRD/CSDDD.

La réglementation évolue et son applicabilité dépend du profil et de la situation de l’organisation. Ces liens sont des points de départ, pas une analyse juridique ni une liste exhaustive des textes applicables. Vérifier les versions consolidées, la transposition nationale et les obligations en vigueur avant de déposer un bilan.

## Modèle de rémunération

Les offres et tarifs affichés dans cette maquette sont indicatifs. Le checkout n’est pas activé par défaut. Pour vendre des abonnements sans intégrer de secret de paiement au front-end :

1. Créer les produits et prix (abonnement mensuel) dans Stripe.
2. Créer un Payment Link Stripe hébergé pour chaque offre payante.
3. Avant de charger `src/main.js`, définir les URLs publiques de ces liens, par exemple dans une balise script :

   ```html
   <script>
     window.CARBTRACK_CHECKOUT_URLS = {
       plus: "https://buy.stripe.com/votre_lien_plus",
       equipe: "https://buy.stripe.com/votre_lien_equipe"
     };
   </script>
   <script type="module" src="./src/main.js"></script>
   ```

4. Remplacer les tarifs d’exemple et mettre à jour ce document. Les boutons n’ouvrent que des URLs `https://buy.stripe.com/…` ou `https://checkout.stripe.com/…`.

Cette intégration redirige vers le paiement Stripe, mais n’implémente pas encore la gestion de comptes, l’activation automatique des fonctionnalités, les webhooks, les factures ni le portail client. Pour ces fonctions et la protection des données de compte, ajouter un serveur et valider les événements Stripe côté serveur. Ne jamais intégrer de clé secrète Stripe dans les fichiers du site.

## Données personnelles

Cette maquette ne crée pas de compte et n’envoie pas les activités à un serveur. Les données restent dans le stockage local du navigateur ; les supprimer en effaçant les données de site du navigateur. Les liens externes vers Stripe et les références ne s’ouvrent qu’à la demande de l’utilisateur.
