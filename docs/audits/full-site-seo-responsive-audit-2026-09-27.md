# Full Site SEO & Responsive Audit — 2026-09-27

Site audité : `Paris Private Airport Transfer`  
Projet : `/Users/roshanmanoranjith/Desktop/paris-private-airport-transfer`  
Mode : lecture seule. Aucun correctif HTML/CSS/JS, aucun changement de sitemap ou de test, aucun commit, push ou déploiement.

## A. Executive summary

L'audit couvre les **26 fichiers HTML** du projet, dont **19 pages indexables présentes dans le sitemap**, ainsi que les CSS, JavaScript, images, règles Vercel, `robots.txt`, `sitemap.xml`, données structurées et tests existants. Le responsive a été rendu dans un navigateur local à **320, 360, 375, 390, 414, 430, 768, 1024 et 1280 px**, soit **171 rendus** pour les 19 pages indexables. Des captures visuelles ont également été comparées sur les héros Normandy, Champagne, Loire Valley et CDG–Paris.

Le socle est sain : métadonnées uniques, canoniques cohérentes, un H1 par page indexable, assets locaux présents, liens internes testés, FAQ visibles alignées avec le JSON-LD et **36/36 tests réussis**. Le cluster Long Distance récemment travaillé est SEO-logiquement cohérent et ne doit pas être réécrit.

Les défauts les plus importants sont concentrés sur le mobile/tablette :

1. `/reservation` déborde horizontalement de **279 px à 1024 px** à cause du footer spécifique qui force les contacts sur une seule ligne.
2. Les héros photo pleine hauteur sont visuellement adoucis sur mobile : les images responsive sont choisies selon la largeur du viewport alors que `cover` doit remplir un conteneur très haut. À 390 px, une source 480/800 px peut devoir couvrir environ 1 150–1 300 px de largeur intrinsèque. Le phénomène est visible sur Normandy, Champagne et Loire Valley, mais il est en réalité systémique sur plusieurs landing pages utilisant le même principe.
3. Le sélecteur d'indicatif téléphonique de `/reservation` et `/contact` est un `div` cliquable non focalisable au clavier, ce qui peut bloquer des utilisateurs internationaux dans le parcours de conversion.

Le bloc d'avantages n'a pas une implémentation mobile unique : les pages Airport→Paris constituent la référence la plus cohérente (2 colonnes + dernier élément centré), les pages Airport→Disneyland laissent le cinquième élément seul à gauche, et les pages Long Distance spécialisées basculent en une colonne, y compris à 768 px.

### Périmètre et limites

- Les vérifications visuelles ont été faites sur le serveur statique local, sans modifier le projet.
- Aucun audit Lighthouse terrain ni données CrUX n'étaient disponibles. Les constats performance sont donc fondés sur le code, les poids d'assets et le comportement réseau attendu.
- Les redirections Vercel ont été vérifiées dans la configuration et par les tests, pas sur la production.
- Les scripts tiers (Google tag, Google Fonts, Font Awesome) n'ont pas généré d'erreur console pendant les rendus locaux.

## B. Score diagnostique par catégorie

| Catégorie | Score | Diagnostic |
|---|---:|---|
| Responsive mobile | 72/100 | Aucun overflow à 320–430 px, mais héros trop hauts/soft, variantes du bloc d'avantages et un overflow à 1024 px sur la réservation. |
| Desktop consistency | 90/100 | Desktop globalement stable et cohérent ; aucune refonte générale justifiée. |
| SEO on-page | 94/100 | 19/19 pages indexables avec métadonnées complètes, uniques, H1 unique, canonical et OG/Twitter. |
| SEO technique | 91/100 | Sitemap, robots, alias et noindex corrects ; `lastmod` partiellement ancien et production non testée directement. |
| Performance | 76/100 | Bon usage des WebP/srcset/lazy loading, mais CSS global volumineux, nombreux originaux lourds dans le dépôt et sélection d'image inadaptée aux héros `cover` très hauts. |
| Accessibilité / UX | 71/100 | CTA tactiles corrects et FAQ utilisables, mais menu mobile et sélecteurs de pays incomplets côté ARIA/clavier, messages de validation peu annoncés. |
| Conversion | 78/100 | Offre et CTA clairs ; friction principale sur le formulaire international et overflow tablette de la page de réservation. |

## C. CRITICAL

**0 problème critique.**

Aucun défaut observé ne rend l'ensemble du site inaccessible, non indexable ou inutilisable. Aucun lien local cassé, asset manquant, canonical dupliqué ou erreur JSON-LD bloquante n'a été trouvé.

## D. HIGH

### H-01 — Débordement horizontal de `/reservation` à 1024 px

- **Page :** `/reservation`
- **Fichier :** `reservation.html`, lignes 348–352 environ
- **Éléments :** `.footer-contact-section .footer-contact-items`
- **Règle actuelle :** `display:flex; gap:1.1rem; flex-wrap:nowrap`
- **Mesure navigateur :** viewport 1024 px, `scrollWidth = 1303 px`, soit **279 px de dépassement**.
- **Cause :** le footer reste en grille de 3 colonnes de 272 px à 1024 px, tandis que les trois contacts imposent `white-space: nowrap` et `flex-wrap: nowrap`. Les liens finissent jusqu'à x=1304.
- **Impact :** scroll horizontal sur une page de conversion essentielle, footer partiellement hors écran et impression de page cassée sur tablette/petit laptop.
- **Correction future sûre :** limiter la correction à la plage tablette dans `reservation.html`, ou supprimer la surcharge `nowrap` pour laisser la règle commune de `css/style.css` faire `wrap`. Risque desktop faible si la règle est bornée à `max-width: 1100px` ou à la largeur où le footer passe à 3 colonnes.

### H-02 — Héros photo adoucis et cadrage mobile instable

- **Pages les plus visibles :** `/paris-to-normandy`, `/paris-to-champagne`, `/paris-to-loire-valley`.
- **Pages techniquement concernées par le même principe :** les sept routes Airport/Disneyland utilisant un `<img>` absolu avec `object-fit:cover`.
- **CSS :** `css/style.css`, blocs `.normandy-page-header`, `.champagne-page-header`, `.loire-page-header`, `.cdg-hero-image`, `.cdg-paris-hero-image`, `.orly-paris-hero-image`, `.beauvais-paris-hero-image`.
- **Constat mesuré :** à 390×900 DPR 1, Normandy charge le fichier 800×447 dans un hero de 390×724. Avec `cover`, l'image doit virtuellement couvrir environ 1 295 px de largeur et est donc agrandie. CDG–Paris charge la source 480 dans une boîte 390×650 ; `srcset sizes="100vw"` ne tient pas compte du ratio imposé par `object-fit: cover`.
- **Cause :** la sélection responsive repose uniquement sur la largeur CSS (`100vw`), pas sur la hauteur du hero et le recadrage `cover`. Les fichiers optimisés s'arrêtent à 1376 px. Le paysage est fortement recadré dans un conteneur portrait.
- **Anomalie supplémentaire Normandy :** `background-position` passe de `66% center` jusqu'à 480 px à `40% center` entre 481 et 768 px, puis `58% center` jusqu'à 1024 px. Ce saut de 26 points explique un déplacement perceptible du sujet entre téléphone et tablette.
- **Impact :** première impression moins premium, surtout sur les trois landing pages Long Distance.
- **Correction future :** nécessite validation visuelle. Il ne faut pas appliquer `center` partout. Prévoir des variantes portrait ou une stratégie `picture`/`image-set` correspondant au ratio du hero, puis conserver une position propre à chaque sujet.
- **Risque desktop :** nul si les changements restent dans les sources/media queries mobiles ; élevé si l'image desktop ou la règle commune `cover` est remplacée globalement.

### H-03 — Sélecteur d'indicatif non utilisable correctement au clavier

- **Pages :** `/reservation`, `/contact`
- **Fichiers :** `reservation.html` autour de `#countryFlagDisplay`, `contact.html` autour de `#contactCountryFlagDisplay`, scripts `js/reservation.js` et `js/contact.js`.
- **HTML actuel :** un `<div class="country-flag-display">` joue le rôle de bouton, sans `tabindex`, `role`, `aria-expanded`, `aria-controls` ni nom accessible.
- **Impact :** un utilisateur clavier/technologie d'assistance ne peut pas ouvrir normalement la liste des indicatifs. C'est une friction directe sur le formulaire de réservation et le formulaire de contact.
- **Correction future :** transformer le déclencheur en vrai `<button type="button">`, gérer `aria-expanded`, navigation clavier et focus. Nécessite test fonctionnel des deux formulaires ; aucun changement visuel n'est nécessaire.

## E. MEDIUM

### M-01 — Trois comportements mobiles différents pour le même bloc d'avantages

Le HTML réutilise le même noyau `.normandy-reassurance-grid`, mais les sous-classes imposent trois résultats :

- Airport→Paris : 2 colonnes, 36 px de hauteur minimale, dernier item centré sur deux colonnes.
- Airport→Disneyland : 2 colonnes, 40 px, dernier item seul à gauche.
- Long Distance spécialisées : 1 colonne, environ 256 px de hauteur totale, y compris à 768 px.

Cette différence vient de la spécificité des règles `.cdg-paris-reassurance ...` et `.cdg-reassurance ...` dans `css/style.css`, pas de la longueur des libellés. La version Airport→Paris est la meilleure référence existante.

### M-02 — Héros mobiles trop hauts et contenu de confiance repoussé

À 320 px, les héros mesurés atteignent notamment : Home 817 px, Normandy 845 px, Champagne 784 px, Loire 753 px, CDG→Disneyland 772 px et Beauvais→Disneyland 775 px. Le H1 reste lisible, mais sur Normandy le CTA WhatsApp tombe sous le premier viewport et les trust indicators arrivent tard. Le problème vient du cumul header 96 px + padding + paragraphes longs + deux CTA + `min-height`.

Correction future possible uniquement sous 480 px : réduire le padding vertical et/ou la longueur visuelle occupée par le paragraphe sans changer le texte SEO. Ne pas réduire la taille des zones tactiles (elles sont actuellement entre 55 et 59 px).

### M-03 — État du menu mobile incomplet pour les technologies d'assistance

Le bouton hamburger a un nom accessible sur les pages publiques principales, mais il n'expose pas `aria-expanded` ni `aria-controls`; `js/main.js` change seulement le caractère `☰/✕`. Le menu ne met pas en place de focus trap et ne gère pas explicitement `Escape`. À 320 px, l'ouverture fonctionne et ne crée pas d'overflow, mais l'état n'est pas annoncé.

### M-04 — Erreurs et confirmations de formulaire insuffisamment annoncées

Les `.field-error`, `.success-message` et `.error-message` sont visuelles, sans liaison systématique `aria-describedby`, `aria-invalid` ou région `aria-live`. Cela concerne surtout `reservation.html`, `contact.html`, `js/reservation.js` et `js/contact.js`.

### M-05 — Aucune prise en charge de `prefers-reduced-motion`

`css/style.css` contient des animations d'entrée et une pulsation continue des CTA. Aucune media query `prefers-reduced-motion` n'a été trouvée. Une future correction peut être strictement additive et sans effet pour les utilisateurs n'ayant pas demandé la réduction des animations.

### M-06 — Architecture CSS difficile à stabiliser

`css/style.css` fait 163 831 octets, 7 825 lignes et contient 68 blocs `@media`. Les familles de landing pages et leurs correctifs sont empilés dans le même fichier. `reservation.html` ajoute encore 35 styles inline et utilise `css/reservation.bundle.min.css` (45 169 octets), copie minifiée d'un socle proche du CSS principal. Cette architecture explique les surcharges accidentelles (`!important`, règles page-spécifiques, breakpoint footer).

Ce n'est pas une invitation à refondre le design. La stratégie sûre consiste à consolider seulement les composants réellement communs, une famille à la fois, avec captures de non-régression desktop.

## F. LOW

### L-01 — `lastmod` du sitemap partiellement antérieur aux dernières modifications

Plusieurs pages portent un `lastmod` au 16 septembre alors que leur dernier commit est du 20 septembre. Cela ne bloque pas l'indexation, mais diminue la fiabilité du signal. Ne mettre à jour que les dates réellement justifiées lors d'une prochaine modification.

### L-02 — Préchargement hero absent sur Orly→Paris et Beauvais→Paris

CDG→Paris a un `<link rel="preload" as="image" ... imagesrcset>`, tandis que les pages Orly→Paris et Beauvais→Paris comptent uniquement sur l'image `fetchpriority="high"` située plus loin dans le HTML. L'impact LCP doit être validé avec Lighthouse avant correction.

### L-03 — Deux sauts de hiérarchie de titres

- `/hourly` : `h2 → h4` pour les cartes de durée.
- `/reservation` : `h2 → h4` dans le panneau Admin caché.

Le premier mérite une correction sémantique future ; le second a peu d'impact public car le panneau est masqué.

### L-04 — Règles H1 mobiles page-spécifiques neutralisées

Les règles `.normandy-page-header h1`, `.champagne-page-header h1`, `.loire-page-header h1` sous 480 px annoncent 2.15–2.25 rem, mais la règle antérieure `.page-header h1 { font-size:1.7rem !important; }` gagne. Le navigateur mesure donc 27.2 px sur toutes ces pages. Le résultat est visuellement cohérent, mais le CSS exprime une intention qui n'est pas appliquée.

### L-05 — Deux liens internes ouverts dans un nouvel onglet sans `rel`

Dans `reservation.html`, les liens CGV et confidentialité utilisent `target="_blank"` sans `rel="noopener"`. Les navigateurs modernes appliquent généralement une protection implicite, mais l'attribut explicite reste préférable.

### L-06 — Dépôt d'images très lourd, sans impact direct équivalent sur chaque page

Le dossier images/assets contient 407 fichiers pour 111.22 Mio ; 81 dépassent 500 Kio. Les 55 JPEG représentent 46.87 Mio et six SVG de flotte environ 13.3 Mio. Les HTML indexables ne référencent toutefois aucun `.jpeg` brut et utilisent les variantes WebP optimisées : il ne faut pas confondre poids du dépôt et poids chargé par visite. L'opportunité est surtout de nettoyer les originaux inutilisés du déploiement après vérification, pas de modifier les images actuellement servies sans mesure.

## G. Responsive matrix par page

Résultat des 171 rendus : aucun overflow horizontal à 320, 360, 375, 390, 414, 430, 768 et 1280 px. Une seule combinaison échoue : `/reservation` à 1024 px.

| Page | 320–430 | 768 | 1024 | ≥1280 | Observation |
|---|---|---|---|---|---|
| `/` | OK | OK | OK | OK | Hero haut à 320 px, CTA utilisables. |
| `/services` | OK | OK | OK | OK | Grilles empilées correctement. |
| `/flotte` | OK | OK | OK | OK | Images et fiches sans déformation. |
| `/contact` | OK | OK | OK | OK | Formulaire empilé ; sélecteur pays non clavier. |
| `/reservation` | OK | OK | **FAIL** | OK | Footer à 1303 px pour viewport 1024. |
| `/airport` | OK | OK | OK | OK | Hub stable. |
| `/disneyland` | OK | OK | OK | OK | Hub stable. |
| `/long-distance` | OK | OK | OK | OK | Hub stable, destinations empilées. |
| `/hourly` | OK | OK | OK | OK | Saut h2→h4, pas de casse visuelle. |
| `/paris-to-normandy` | OK | OK | OK | OK | Hero soft ; saut de cadrage 66%→40%→58%; trust strip 1 colonne. |
| `/paris-to-champagne` | OK | OK | OK | OK | Hero soft ; cadrage progressif 62%→58%→54%. |
| `/paris-to-loire-valley` | OK | OK | OK | OK | Hero soft et très haut ; trust strip 1 colonne. |
| `/cdg-to-paris` | OK | OK | OK | OK | Trust strip de référence ; hero cover adouci. |
| `/orly-to-paris` | OK | OK | OK | OK | Même structure ; preload hero absent. |
| `/beauvais-to-paris` | OK | OK | OK | OK | Même structure ; preload hero absent. |
| `/cdg-to-disneyland` | OK | OK | OK | OK | 2 colonnes trust, cinquième item non centré. |
| `/orly-to-disneyland` | OK | OK | OK | OK | Même comportement que CDG. |
| `/beauvais-to-disneyland` | OK | OK | OK | OK | H1 sur 4 lignes à 320 px, sans débordement. |
| `/paris-to-disneyland` | OK | OK | OK | OK | Même composant hero ; libellés trust adaptés au départ Paris. |

### Header mobile

| Largeur | Hauteur header | Logo | Hamburger | Résultat |
|---:|---:|---:|---:|---|
| 320 | 96 px | ~171×74 | 44×44 | Pas de chevauchement/overflow. |
| 390 | 96 px | 180×78 | 44×44 | Correct. |
| 768 | 108 px | 194×84 | 44×44 | Correct. |
| 1024 | 108 px | 194×84 | 44×44 | Menu mobile encore actif, cohérent. |
| 1280 | 112 px | 178×77 | masqué | Navigation desktop. |

À 320 px, le panneau ouvert fait 320 px de large, reste dans le viewport et les liens sont lisibles. Le léger décalage calculé à gauche (~−10 px) ne crée pas d'overflow, mais doit être recontrôlé si la navigation est retouchée.

### Typographie mobile

- Les H1 de landing pages spécialisées sont calculés à 27.2 px / 32.64 px de line-height à 320 px.
- Beauvais→Disneyland est le cas le plus long : 131 px de hauteur (4 lignes), mais sans coupure.
- Le H1 Home est plus grand (35.2 px) et occupe 183 px ; c'est intentionnel et reste lisible.
- Les CTA hero mesurés font 55–59 px de haut, donc confortables au toucher.
- Les FAQ utilisent des boutons pleine largeur avec focus visible explicite.

## H. Hero/background matrix

| Page/famille | Ressource et technique | Desktop | Tablette | Mobile | Anomalie / cause probable |
|---|---|---|---|---|---|
| Home | `images/BG.webp`, CSS background | `cover`, centre | règles spécifiques | `auto 92%`, `82% bottom` | Cadrage volontaire différent ; pas de rupture observée. |
| Services | `etretat_bg.webp`, CSS background | cover/centre | idem | idem | Pas de variante dédiée, mais rendu acceptable. |
| Fleet | `chambord_bg.webp`, CSS background | cover/centre | idem | idem | Pas de problème visible. |
| Contact | `american_cemetry.webp`, CSS background | cover/centre | idem | idem | Pas de problème visible. |
| Reservation | `paris_bg.webp`, CSS background | cover/centre | idem | idem | Hero court et stable. |
| Airport hub | `airport-1376/1280/768.webp`, CSS background | centre | 1280/1376 DPR2 | 768/1280 DPR2 | Implémentation responsive robuste. |
| Disneyland hub | `disney_castle-*`, CSS background | centre | 1280/1376 | 768/1280 | Implémentation responsive robuste. |
| Long Distance hub | `longue-distance-*`, CSS background | centre | 1280/1376 | 768/1280 | Implémentation responsive robuste. |
| Hourly hub | `hourly-service-*`, CSS background + 5 preloads media | centre | 1280/1376 | 768/1280 | Bon routage de ressource. |
| Normandy | `normandy-private-chauffeur-*`, CSS background | min 650, centre | 590, 58%; à ≤768 610, 40% | min 640, 66%, source 800/1376 DPR2 | **Saut de position + source trop étroite pour le ratio portrait cover.** |
| Champagne | `champagne-private-chauffeur-*`, CSS background | min 650, centre | 590, 54%; ≤768 610, 58% | min 660, 62% | Progression cohérente, mais agrandissement visible. |
| Loire Valley | `loire-valley-private-chauffeur-*`, CSS background | min 650, centre | 590/650, centre | min 690, 60% | Hero le plus haut ; agrandissement et douceur visibles. |
| CDG→Disneyland | `<img class=cdg-hero-image>`, srcset 480/800/1376 | object-fit cover, centre | 62% à ≤768 | min 690, 62% | `sizes=100vw` sous-estime la source nécessaire au cover portrait. |
| Orly→Disneyland | même base CDG + classe Orly | centre | 62% | min 690 | Même cause. |
| Beauvais→Disneyland | même base CDG + classe Beauvais | centre | 62% | min 690 | Même cause. |
| Paris→Disneyland | même base CDG + classe Paris | centre | 62% | min 690 | Même cause. |
| CDG→Paris | `<img class=cdg-paris-hero-image>`, srcset | centre | 62% | min 650, 58% | Structure cohérente, mais source 480 choisie à 390 px. |
| Orly→Paris | `<img class=orly-paris-hero-image>`, srcset | centre | 62% | min 650, 62% | Pas de preload ; même limite cover/srcset. |
| Beauvais→Paris | `<img class=beauvais-paris-hero-image>`, srcset | centre | 63% | min 650, 63% | Pas de preload ; même limite cover/srcset. |

### Pourquoi les backgrounds semblent décalés

Le problème n'est pas un simple défaut de `center` :

- les photos sont en ratio paysage 1376×768 ;
- les héros mobiles approchent un ratio portrait 390×650 à 390×724 ;
- `cover` supprime donc une grande partie des côtés ;
- chaque page utilise un `background-position`/`object-position` différent pour préserver le véhicule ou le paysage ;
- Normandy ajoute un saut inhabituel entre 480 et 768 px ;
- les variantes de largeur ne garantissent pas la densité nécessaire quand la hauteur, plutôt que la largeur, pilote le `cover`.

## I. Matrice spéciale — Flight Tracking / Personalized Pickup / Private Vehicle / Door-to-Door

### Occurrences exhaustives

- La combinaison exacte des quatre expressions se trouve sur `/cdg-to-paris`, `/orly-to-paris` et `/beauvais-to-paris`.
- `Flight Tracking` apparaît aussi sur Home/Beauvais selon le texte, mais pas dans le même composant complet.
- Les pages Disneyland utilisent `Meet & Greet` à la place de `Personalized Pickup`.
- Les pages Long Distance utilisent `Private Journey`, `Door-to-Door`, `Flexible Stops`, `Premium Vehicle`, `24/7 Service`.

| Page | Structure HTML | CSS appliqué | Desktop | Mobile | Différence | Cause |
|---|---|---|---|---|---|---|
| CDG→Paris | `section.normandy-reassurance.cdg-paris-reassurance > .container > .normandy-reassurance-grid > 5 span` | base + `.cdg-paris-reassurance ...` | 5 colonnes, gap 1rem, 48 px | 2 colonnes, gap .2/.75rem, 36 px, 5e centré | Référence | Surcharge dédiée complète. |
| Orly→Paris | même structure + `.orly-paris-reassurance` | sélecteurs groupés avec CDG | identique | identique | Aucune | Même règle groupée. |
| Beauvais→Paris | même structure + `.beauvais-paris-reassurance` | sélecteurs groupés avec CDG | identique | identique | Aucune | Même règle groupée. |
| CDG→Disneyland | `section...cdg-reassurance` + 5 span | base + `.cdg-reassurance ...` | 5 colonnes | 2 colonnes, 40 px, 5e à gauche | Dernier item déséquilibré | Pas de règle `last-child` pleine largeur. |
| Orly→Disneyland | `cdg-reassurance orly-reassurance` | hérite CDG | 5 colonnes | identique CDG | idem | Héritage volontaire de CDG. |
| Beauvais→Disneyland | `cdg-reassurance beauvais-reassurance` | hérite CDG | 5 colonnes | identique CDG | idem | Héritage volontaire de CDG. |
| Paris→Disneyland | `cdg-reassurance paris-disneyland-reassurance` | hérite CDG | 5 colonnes | identique CDG | Libellés différents | Même composant, contenu adapté. |
| Normandy | base `.normandy-reassurance-grid` | règle générique ≤768 | 5 puis 3 colonnes ≤1024 | 1 colonne, gap .25rem, padding gauche calculé | Beaucoup plus haut | Pas de surcharge compacte. |
| Champagne | même base | règle générique | idem | idem | idem | idem. |
| Loire Valley | même base | règle générique | idem | idem | idem | idem. |

**Implémentation de référence recommandée :** la famille Airport→Paris. Elle conserve les libellés lisibles sur deux colonnes, centre proprement le cinquième élément et réduit la hauteur sans diminuer les zones de lecture. Une future correction doit agir sur la classe commune/famille, pas recopier du CSS dans chaque HTML.

## J. SEO matrix des 19 pages indexables

Tous les titres et descriptions sont uniques. Toutes les pages ont un canonical absolu correspondant au sitemap, un seul H1, les balises Open Graph/Twitter requises et aucun alt manquant. Les nombres FAQ indiquent les questions visibles et présentes en JSON-LD.

| URL | Title / desc | H1 | Images alt | Schema principal | Breadcrumb | FAQ | Verdict |
|---|---|---:|---:|---|---|---:|---|
| `/` | 51 / 160 | 1 | 4/4 | LocalBusiness, WebSite, WebPage, Service | — | 0 | OK |
| `/services` | 63 / 145 | 1 | 17/17 | — | — | 0 | OK ; schema optionnel, pas un défaut. |
| `/flotte` | 59 / 152 | 1 | 10/10 | — | — | 0 | OK |
| `/contact` | 55 / 157 | 1 | 4/4 | — | — | 0 | OK |
| `/reservation` | 41 / 136 | 1 | 4/4 | — | — | 0 | OK ; page transactionnelle indexable. |
| `/airport` | 56 / 151 | 1 | 8/8 | Service, LocalBusiness | — | 0 | OK |
| `/disneyland` | 45 / 150 | 1 | 7/7 | Service, LocalBusiness | — | 0 | OK |
| `/long-distance` | 61 / 138 | 1 | 13/13 | Service, BreadcrumbList, FAQPage | oui | 6 | OK — conserver le contenu actuel. |
| `/hourly` | 59 / 140 | 1 | 11/11 | Service, LocalBusiness | — | 0 | OK |
| `/paris-to-normandy` | 62 / 157 | 1 | 10/10 | Service, BreadcrumbList, FAQPage | oui | 7 | OK — ne pas réécrire. |
| `/paris-to-champagne` | 58 / 160 | 1 | 11/11 | Service, BreadcrumbList, FAQPage | oui | 8 | OK — ne pas réécrire. |
| `/paris-to-loire-valley` | 59 / 148 | 1 | 11/11 | Service, BreadcrumbList, FAQPage | oui | 10 | OK — ne pas réécrire. |
| `/cdg-to-disneyland` | 60 / 149 | 1 | 10/10 | Service, BreadcrumbList, FAQPage | oui | 12 | OK |
| `/cdg-to-paris` | 57 / 149 | 1 | 9/9 | Service, BreadcrumbList, FAQPage | oui | 13 | OK |
| `/orly-to-paris` | 58 / 149 | 1 | 9/9 | Service, BreadcrumbList, FAQPage | oui | 14 | OK |
| `/beauvais-to-paris` | 58 / 149 | 1 | 10/10 | Service, BreadcrumbList, FAQPage | oui | 12 | OK |
| `/orly-to-disneyland` | 61 / 127 | 1 | 10/10 | Service, BreadcrumbList, FAQPage | oui | 12 | OK |
| `/beauvais-to-disneyland` | 61 / 135 | 1 | 10/10 | Service, BreadcrumbList, FAQPage | oui | 13 | OK |
| `/paris-to-disneyland` | 62 / 141 | 1 | 10/10 | Service, BreadcrumbList, FAQPage | oui | 11 | OK |

### Cannibalisation et intention

- `/airport` joue le rôle de hub ; les pages CDG/Orly/Beauvais ciblent des trajets distincts.
- `/disneyland` joue le rôle de hub ; les quatre pages enfants distinguent clairement l'origine.
- `/long-distance` cible le service générique ; Normandy, Champagne et Loire Valley ciblent les destinations. La relation parent/enfant est claire via navigation, contenu et BreadcrumbList.
- Aucun titre/H1 dupliqué ni page orpheline n'a été trouvé.
- Aucun prix public n'est présent dans le cluster Long Distance spécialisé ; les CTA mènent à une demande de devis, conformément au modèle commercial.

## K. Internal-linking map

```text
Home
├── Services
│   ├── Airport
│   │   ├── CDG → Paris
│   │   ├── Orly → Paris
│   │   └── Beauvais → Paris
│   ├── Disneyland
│   │   ├── CDG → Disneyland
│   │   ├── Orly → Disneyland
│   │   ├── Beauvais → Disneyland
│   │   └── Paris → Disneyland
│   ├── Long Distance
│   │   ├── Normandy
│   │   ├── Champagne
│   │   └── Loire Valley
│   └── Hourly
├── Fleet
├── Contact
└── Reservation
```

Constats :

- Home contient des liens contextuels vers les dix routes principales et les hubs.
- Long Distance contient des cartes/liens vers Normandy, Champagne et Loire Valley.
- Chaque page spécialisée Long Distance propose un retour `Explore All Long-Distance Services` vers `/long-distance` et un BreadcrumbList `Home → Services → Long Distance → destination`.
- Airport et Disneyland exposent leurs sous-pages dans le contenu et/ou la navigation structurée.
- Aucun lien local ou fragment cassé n'a été trouvé par les tests.
- Aucune page indexable n'est orpheline grâce aux hubs, au menu et au footer.
- Certains corps de pages dépendent davantage du menu/footer pour les liens de sortie, mais il n'existe pas de dead end réel. Ajouter artificiellement des liens n'est pas recommandé.

## L. Performance findings

### Points positifs

- Les landing pages récentes disposent de variantes 480/800/1376 WebP.
- Les images sous la ligne de flottaison ont généralement `loading="lazy"`, `decoding="async"` et des dimensions explicites.
- Les héros `<img>` ont `fetchpriority="high"`; les principaux backgrounds récents disposent d'un preload image.
- Aucun asset local référencé ne manque.

### Opportunités prioritaires

1. **Adapter les sources au ratio `cover` mobile**, pas seulement à `100vw` (H-02). C'est à la fois un sujet netteté et LCP.
2. **Mesurer Orly→Paris et Beauvais→Paris** avec Lighthouse avant d'ajouter le preload manquant (L-02).
3. **Réduire le CSS réellement livré à terme** : `style.css` contient les styles de toutes les familles de pages. Ne pas entreprendre une purge automatique sans couverture visuelle.
4. **Exclure du déploiement les originaux inutilisés** après inventaire de références. Les gros JPEG/SVG ne sont pas chargés par les pages actuelles, donc le gain visiteur peut être nul si l'hébergement ne les transfère pas.

### Risques LCP / CLS

- LCP : héros CSS découverts après la feuille de style, partiellement compensés par les preloads ; sources cover parfois sous-dimensionnées.
- CLS : faible sur les `<img>` visibles car width/height sont présents. Les fonts chargées de façon asynchrone peuvent produire une variation typographique mineure.
- Les animations `fadeInUp` utilisent `transform/opacity` et ne devraient pas déplacer le layout, mais doivent respecter `prefers-reduced-motion`.

## M. Conversion findings

### Ce qui fonctionne

- Proposition de valeur et destination lisibles dès le hero.
- CTA principal visible sur toutes les landing pages à 320 px.
- CTA de réservation préremplis par route (`/reservation?route=...`) sur les pages transactionnelles.
- WhatsApp disponible comme canal secondaire.
- Long Distance utilise correctement `Request a Quote` et n'affiche pas de prix public.
- Éléments de confiance concrets sans faux avis, faux compteurs ou faux badges.

### Frictions

1. Sélecteur de pays non clavier sur les deux formulaires (H-03).
2. Overflow du footer de `/reservation` à 1024 px (H-01), après un formulaire long : mauvaise impression au moment où l'utilisateur cherche des informations de confiance/contact.
3. Héros très hauts sur mobile : les indicateurs de confiance et parfois le CTA secondaire sont repoussés sous la ligne de flottaison.
4. Validation visuelle non annoncée aux lecteurs d'écran (M-04).
5. Le formulaire de réservation demande beaucoup d'informations, mais elles sont cohérentes avec le service et regroupées par sections ; supprimer des champs sans analyse métier n'est pas recommandé.

## N. Fichiers qui seraient concernés par de futures corrections

Cette liste est prospective ; **aucun de ces fichiers n'a été modifié pendant l'audit**.

| Sujet | Fichiers potentiels |
|---|---|
| Overflow reservation 1024 | `reservation.html` (prioritaire), éventuellement `css/reservation.bundle.min.css` si la correction doit être partagée. |
| Bloc avantages commun | `css/style.css` uniquement si les classes existantes sont normalisées. |
| Cadrage/netteté héros | `css/style.css`; HTML des landing pages utilisant `<img>`; nouvelles variantes dans `images/services/normandy/`, `champagne/`, `loire-valley/`, `cdg-paris/`, `orly-paris/`, `beauvais-paris/`, `*-disneyland/`. |
| Menu mobile ARIA | `js/main.js` et les HTML publics pour `aria-controls`/état initial si nécessaire. |
| Sélecteurs pays | `reservation.html`, `contact.html`, `js/reservation.js`, `js/contact.js`, éventuellement CSS correspondant. |
| Messages de formulaire | mêmes fichiers formulaire + CSS commun. |
| Réduction animations | `css/style.css`. |
| Hiérarchie hourly | `hourly-service.html`. |
| Préload héros | `orly-to-paris.html`, `beauvais-to-paris.html`. |
| Dates sitemap | `sitemap.xml`, seulement lors d'une future modification réelle. |

## O. SAFE TO FIX

Corrections pouvant être réalisées sans changer l'apparence desktop validée :

1. Autoriser le wrap du footer de `/reservation` uniquement à la plage 769–1100 px.
2. Ajouter `aria-expanded`/`aria-controls` au menu mobile et synchroniser l'état dans `js/main.js`.
3. Transformer les déclencheurs pays en boutons en conservant exactement les styles actuels.
4. Ajouter `aria-live`, `aria-invalid` et `aria-describedby` aux messages/formulaires.
5. Ajouter une media query `prefers-reduced-motion: reduce`.
6. Centrer le cinquième item de la famille Disneyland via une règle `max-width:768px`.
7. Corriger les niveaux de titres Hourly sans changer leur style CSS.
8. Ajouter `rel="noopener"` aux deux liens internes en nouvel onglet.

## P. NEEDS VISUAL VALIDATION

1. Toute modification du `background-position` Normandy/Champagne/Loire.
2. Toute création de variantes portrait ou changement de `sizes/srcset` des héros.
3. Passage des blocs Long Distance de 1 à 2 colonnes sur mobile/tablette.
4. Réduction des hauteurs/paddings hero sous 480 px.
5. Nettoyage ou découpage de `css/style.css`, car les règles tardives et `!important` peuvent créer des régressions croisées.
6. Suppression d'assets lourds : confirmer qu'ils ne servent pas aux emails, à un workflow externe ou à une future génération avant suppression.

## Q. DO NOT CHANGE

- Ne pas réécrire les title, meta descriptions, H1 ou contenus de `/long-distance`, `/paris-to-normandy`, `/paris-to-champagne`, `/paris-to-loire-valley` : aucun problème SEO réel ne le justifie.
- Ne pas ajouter de prix aux pages Long Distance spécialisées.
- Ne pas modifier les URLs courtes, canoniques, breadcrumbs ou l'architecture parent/enfant actuelle.
- Ne pas remplacer tous les cadrages par `center` ; préserver le sujet de chaque photo.
- Ne pas modifier le desktop globalement : aucun défaut de cohérence majeur n'y a été observé.
- Ne pas ajouter de faux avis, compteurs, logos partenaires ou badges de confiance.
- Ne pas modifier le backend, Supabase, pricing, admin, emails, tracking ou système de réservation dans une phase de correction responsive.

## R. Plan de correction futur

### Phase 1 — Bugs responsive réels

1. Corriger le footer `/reservation` à 1024 px.
2. Rendre les sélecteurs pays utilisables au clavier.
3. Ajouter les états ARIA du menu et des messages.
4. Rejouer la matrice 9 largeurs et les tests 36/36.

### Phase 2 — Cohérence landing pages

1. Choisir formellement Airport→Paris comme référence du trust strip mobile.
2. Aligner Disneyland puis Long Distance via classes communes, sans toucher au desktop.
3. Valider chaque hero à 320, 390, 430, 768 et 1024 px avec captures avant/après.

### Phase 3 — Performance / UX

1. Mesurer LCP/CLS avec Lighthouse sur Home, Reservation et une page de chaque famille.
2. Produire des sources hero adaptées au ratio portrait seulement si la mesure/validation confirme le gain.
3. Ajouter reduced-motion et consolider progressivement le CSS.
4. Auditer les assets non référencés avant toute suppression.

### Phase 4 — SEO uniquement si problème réel restant

1. Mettre à jour les `lastmod` lors d'un changement réel.
2. Revalider canonical/redirects en production.
3. Ne toucher aux contenus SEO que si Search Console, données de requêtes ou problème technique concret le justifie.

## S. Final verdict

Le site est **SEO-techniquement solide et desktop stable**. Il n'a pas besoin d'une refonte ni d'une réécriture généralisée. La priorité est une série de corrections responsive/accessibilité très ciblées : overflow de la réservation à 1024 px, choix de sources/cadrages hero adaptés au mobile, puis harmonisation du trust strip. Ces interventions peuvent être isolées dans des media queries ou composants communs, avec un risque desktop faible si elles sont testées famille par famille.

### Tests exécutés

| Commande | Résultat |
|---|---|
| `node --test tests/seo.test.cjs` | **7/7 réussis** |
| `node --test tests/admin-mode.test.cjs tests/email-operation.test.cjs tests/manage-cancellation.test.cjs` | **29/29 réussis** |
| `node --test tests/*.test.cjs` | **36/36 réussis** |

Fragilités des tests : ils couvrent très bien les métadonnées, liens, JSON-LD, alias et logique admin/opérations, mais ne détectent ni overflow responsive, ni cadrage visuel, ni accessibilité clavier/ARIA, ni LCP/CLS.

### Contrôle d'intégrité de l'audit

- Fichiers HTML/CSS/JS/sitemap/tests modifiés : **aucun**.
- Nouveau fichier créé : `docs/audits/full-site-seo-responsive-audit-2026-09-27.md` uniquement.
- Commit/push/déploiement : **aucun**.

