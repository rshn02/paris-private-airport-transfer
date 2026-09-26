# Audit SEO Long Distance & Normandy — 24 septembre 2026

## Périmètre et méthode

Audit local, en lecture seule, du frontend du dépôt `paris-private-airport-transfer`. Les concurrents n'ont pas été explorés et aucune donnée de volume de recherche externe n'a été utilisée. Les constats de routage décrivent donc le comportement attendu d'après `vercel.json`, sans test HTTP de la production.

Contrôles réalisés : HTML, métadonnées, liens, navigation, footer, sitemap, robots, routes Vercel, JSON-LD, CSS responsive, JavaScript chargé, fichiers image et historique Git. La suite locale `node --test tests/seo.test.cjs` passe intégralement : **7 tests sur 7**.

## 1. Executive summary

Le site possède déjà une architecture Long Distance cohérente : un hub `/long-distance` et trois landing pages spécialisées, `/paris-to-normandy`, `/paris-to-champagne` et `/paris-to-loire-valley`. Les quatre URL sont indexables, canoniques, présentes dans le sitemap, accessibles depuis le menu Services et techniquement saines.

La page Normandy est la plus importante pour le projet actuel. Elle est substantielle (environ 773 mots utiles dans `<main>`), possède un H1 unique, sept FAQ visibles et synchronisées avec le JSON-LD, un fil d'Ariane structuré correct, des images responsives documentées, et une conversion clairement orientée vers la demande de devis. Aucun tarif chiffré n'est affiché.

Son principal écart stratégique est toutefois net : le title, la meta description, le H1, le hero, plusieurs sections, les messages WhatsApp et la FAQ cadrent presque entièrement le service comme **Paris → Normandy**. La possibilité d'un départ d'un « Paris airport » ou d'un « another agreed location » est présente, mais elle ne suffit pas à faire comprendre que CDG, Orly, Beauvais, Disneyland Paris, Versailles, Chantilly ou d'autres adresses de la zone de service sont de vrais points de prise en charge. En l'état, l'impression dominante est donc : **Paris est le départ attendu, avec quelques exceptions génériques**.

La couverture Normandy est bonne pour les expériences D-Day, Omaha Beach, Normandy American Cemetery, Pointe du Hoc, Arromanches, Bayeux et Mont-Saint-Michel. Honfleur et la côte sont présents mais moins développés. Rouen, Le Havre, Caen, Utah Beach, Sainte-Mère-Église, Versailles et Chantilly sont absents du contenu principal Normandy.

Le maillage global paraît fort si l'on compte le menu : chaque page destination reçoit des liens depuis 21 autres fichiers HTML. En revanche, ce chiffre est surtout produit par le sous-menu répété sur tout le site. Les liens réellement contextuels vers chaque destination viennent principalement de la homepage et du hub Long Distance. Les pages Airport, Disneyland, Fleet, Contact et Services ne développent pas de passerelles contextuelles directes vers Normandy, Champagne ou Loire Valley.

La cannibalisation est actuellement faible et maîtrisée : `/services` présente la famille, `/long-distance` traite l'intention générique, et `/paris-to-normandy` traite la destination. La priorité future ne devrait pas être de multiplier les pages départ × destination, mais d'élargir clairement la zone de pickup sur la page Normandy, de renforcer les liens contextuels, puis d'envisager une page D-Day réellement distincte si un contenu et une offre suffisamment spécifiques peuvent être produits.

## 2. Inventaire Long Distance

### Pages cœur trouvées

| URL | Fichier physique | Indexable | Sitemap | Canonical | Mots utiles approx. | JSON-LD | FAQ | CTA principal | Liens entrants identifiables |
|---|---|---:|---:|---|---:|---|---|---|---:|
| `/long-distance` | `long-distance-transfer.html` | Oui (`index, follow`) | Oui | `/long-distance` | 678 | `Service` | 6 visibles, sans `FAQPage` | `Request a Quote` → `/contact` | 22 fichiers sources hors auto-lien ; nombreux liens de navigation/footer, au moins 6 liens contextuels publics |
| `/paris-to-normandy` | `paris-to-normandy.html` | Oui | Oui | `/paris-to-normandy` | 773 | `Service`, `BreadcrumbList`, `FAQPage` | 7 visibles + schema | `Request a Quote` → `/contact?service=normandy` | 21 fichiers sources hors auto-lien ; 2 sources contextuelles fortes (`index`, hub) |
| `/paris-to-champagne` | `paris-to-champagne.html` | Oui | Oui | `/paris-to-champagne` | 827 | `Service`, `BreadcrumbList`, `FAQPage` | 8 visibles + schema | `Request a Quote` → `/contact?service=champagne` | 21 fichiers sources hors auto-lien ; 2 sources contextuelles fortes |
| `/paris-to-loire-valley` | `paris-to-loire-valley.html` | Oui | Oui | `/paris-to-loire-valley` | 875 | `Service`, `BreadcrumbList`, `FAQPage` | 10 visibles + schema | `Request a Quote` → `/contact?service=loire-valley` | 21 fichiers sources hors auto-lien ; 2 sources contextuelles fortes |

Les comptes de mots portent sur le contenu de `<main>`, UI et FAQ incluses, mais sans navigation, footer, scripts ni JSON-LD.

### Titles, descriptions, H1 et H2

#### `/long-distance`

- Title : `Long Distance Private Transfer from Paris | Private Chauffeur`
- Meta description : `Book a private long-distance chauffeur from Paris to Normandy, Champagne, Loire Valley and selected destinations across France and Europe.`
- H1 : `Long Distance Private Transfer from Paris`
- H2 : `Travel Beyond Paris in Complete Comfort`; `Popular Long Distance Destinations`; `Paris ↔ Normandy`; `Paris ↔ Champagne & Reims`; `Paris ↔ Loire Valley`; `Paris ↔ Brussels`; `Paris ↔ Luxembourg`; `Paris ↔ Switzerland`; `Why Choose a Private Long-Distance Transfer?`; `Your Journey, Your Schedule`; `Premium Vehicles for Your Long-Distance Transfer`; `Frequently Asked Questions`; `Travel Further. Travel Privately.`
- Principaux liens sortants : les trois pages destination via `Explore Normandy`, `Explore Champagne`, `Explore Loire Valley`; `/contact`; `/hourly`; `/flotte`; navigation générale.

#### `/paris-to-normandy`

- Title : `Paris to Normandy Private Chauffeur | D-Day & Custom Trips`
- Meta description : `Travel from Paris to Normandy with a private chauffeur. D-Day beaches, Omaha Beach, Bayeux, Honfleur and custom itineraries. Request your personalized quote.`
- H1 : `Private Chauffeur from Paris to Normandy`
- H2 : détaillés dans la section 3.
- Principaux liens sortants : `/contact?service=normandy`, WhatsApp prérempli, `/long-distance`, `/airport`, `/flotte`, navigation générale.

#### `/paris-to-champagne`

- Title : `Paris to Champagne Private Chauffeur | Reims & Épernay`
- Meta description : `Travel from Paris to Champagne with a private chauffeur. Discover Reims, Épernay and vineyard destinations with a personalized private journey. Request a quote.`
- H1 : `Private Chauffeur from Paris to Champagne`
- H2 : `Choose Your Champagne Experience`; `Enjoy Champagne. We’ll Take Care of the Driving.`; `A Journey That Fits Your Plans`; `Discover Reims & Épernay in One Private Journey`; `Travel Through Champagne in Comfort`; `Your Champagne Journey, Personally Quoted`; `Frequently Asked Questions`; `Let’s Plan Your Champagne Journey`.
- Principaux liens sortants : `/contact?service=champagne`, WhatsApp, `/long-distance`, `/airport`, `/flotte`, navigation générale.

#### `/paris-to-loire-valley`

- Title : `Paris to Loire Valley Private Chauffeur | Châteaux Day Trip`
- Meta description : `Travel from Paris to the Loire Valley with a private chauffeur. Discover Chambord, Chenonceau, Amboise and more with a personalized private journey.`
- H1 : `Private Chauffeur from Paris to the Loire Valley`
- H2 : `Choose Your Loire Valley Experience`; `More Time Exploring. Less Time Between Châteaux.`; `A Journey That Fits Your Plans`; `Discover Three Iconic Châteaux in One Private Journey`; `Travel Through the Loire Valley in Comfort`; `Your Journey, Personally Quoted`; `Frequently Asked Questions`; `Plan Your Private Journey to the Loire Valley`.
- Principaux liens sortants : `/contact?service=loire-valley`, WhatsApp, `/long-distance`, `/airport`, `/flotte`, navigation générale.

### Pages indirectement liées

- `index.html` : présente le Long Distance et lie contextuellement les trois destinations.
- `services.html` : présente le service Long Distance et lie contextuellement le hub, mais les liens vers les trois destinations ne sont que dans le menu.
- `hourly-service.html` : lien contextuel `long-distance private transfer` vers le hub.
- Toutes les pages commerciales principales : liens de menu vers le hub et ses trois sous-pages.
- Les pages destination : lien contextuel `Explore All Long-Distance Services` vers le hub.
- `links.html` : lien vers le hub, mais page `noindex`.
- `contact.html` et `js/contact.js` : reconnaissent les paramètres `service=normandy`, `service=champagne` et `service=loire-valley`.
- `js/marketing-attribution.js` : classe les trois landing pages par service et normalise `/long-distance-transfer` vers `/long-distance`.

Aucune autre landing page Long Distance, ancienne page Normandy, page D-Day, page Mont-Saint-Michel ou combinaison départ × destination n'a été trouvée.

## 3. État actuel complet de `/paris-to-normandy`

### Métadonnées

1. **Title** : `Paris to Normandy Private Chauffeur | D-Day & Custom Trips`.
2. **Meta description** : `Travel from Paris to Normandy with a private chauffeur. D-Day beaches, Omaha Beach, Bayeux, Honfleur and custom itineraries. Request your personalized quote.`
3. **Canonical** : `https://www.parisprivateairporttransfer.com/paris-to-normandy`.
4. **Robots** : `index, follow`.
5. **Open Graph** : site name, title, description, type `website`, URL, image 1376 × 768 et image alt présents et cohérents.
6. **Twitter** : `summary_large_image`, title, description, image et image alt présents.

### Hiérarchie éditoriale

- H1 unique : `Private Chauffeur from Paris to Normandy`.
- H2 :
  1. `Choose Your Normandy Experience`
  2. `Visit the D-Day Landing Beaches from Paris`
  3. `A Journey That Fits Your Plans`
  4. `Travel Long Distance in Comfort`
  5. `Your Journey, Personally Quoted`
  6. `Frequently Asked Questions`
  7. `Let’s Plan Your Normandy Journey`
- H3 hors footer :
  - `D-Day & American History`
  - `Normandy Coast`
  - `Mont-Saint-Michel`
  - `Create Your Own Journey`
  - `One-Way Private Transfer`
  - `Round Trip`
  - `Private Day Trip`
  - `Airport to Normandy`
  - `Tell Us Your Plans`
  - `Receive Your Personalized Quote`
  - `Confirm Your Journey`
  - `Meet Your Chauffeur`
  - les sept questions FAQ listées plus bas.

### Structure et texte visible

1. Hero : promesse Paris → Normandy, résumé D-Day/Honfleur/Bayeux/coast, CTA devis et WhatsApp.
2. Bandeau de réassurance : Private Journey, Door-to-Door, Flexible Stops, Premium Vehicle, 24/7 Service.
3. Quatre cartes d'expériences : D-Day, côte normande, Mont-Saint-Michel, trajet personnalisé.
4. Bloc éditorial D-Day depuis Paris : Omaha, Pointe du Hoc, American Cemetery, Arromanches, Bayeux.
5. Formats : one-way, round trip, private day trip, airport to Normandy.
6. Confort : véhicule premium climatisé, eau/rafraîchissements, places, passagers et bagages, chauffeur professionnel.
7. Processus de devis en quatre étapes.
8. FAQ de sept questions.
9. CTA final devis + WhatsApp.

### Conversion et formulaire

- Aucun formulaire intégré dans la page.
- Huit liens vers `/contact?service=normandy` : hero, quatre cartes, section D-Day, processus de devis et CTA final.
- Textes utilisés : `Request a Quote` (hero et final), `Request This Itinerary` (2), `Request This Journey`, `Build My Journey`, `Plan My Journey`, `Request My Quote`.
- Trois CTA WhatsApp avec un message prérempli explicitement « from Paris to Normandy » : hero, bloc devis et fin de page.
- Un CTA parent : `Explore All Long-Distance Services` → `/long-distance`.
- Un CTA flotte : `Discover Our Fleet` → `/flotte`.
- Le paramètre `service=normandy` est exploité dans `js/contact.js` pour préconfigurer la demande.

### Images

Le hero est un background CSS, pas une balise `<img>` : `normandy-private-chauffeur-{480,800,1376}.webp`, avec rendu mobile actuellement en 800 px et 1376 px sur écrans haute densité.

| Image de contenu | ALT | Dimensions HTML | Chargement |
|---|---|---|---|
| `normandy-american-cemetery-800.webp` + srcset 480/800/1376 | `Normandy American Cemetery overlooking the coast` | 1376 × 768 | lazy + async |
| `normandy-coast-etretat-800.webp` + srcset | `Cliffs of Étretat on the Normandy coast` | 1376 × 768 | lazy + async |
| `mont-saint-michel-normandy-800.webp` + srcset | `Mont-Saint-Michel in Normandy` | 1376 × 768 | lazy + async |
| `custom-normandy-journey-800.webp` + srcset | `Private chauffeur vehicle on a custom journey through Normandy` | 1376 × 768 | lazy + async |
| `omaha-beach-normandy-800.webp` + srcset | `Omaha Beach on the Normandy coast` | 1376 × 768 | lazy + async |
| `normandy-premium-vehicle-interior-800.webp` + srcset | `Premium private chauffeur vehicle interior` | 1376 × 768 | lazy + async |

Toutes les références image testées existent. Toutes les balises `<img>` ont un ALT et des dimensions. Les images de contenu ont `sizes`, `srcset`, `loading="lazy"` et `decoding="async"`. Le logo et les icônes de paiement ne sont logiquement pas lazy-loadés.

### Structured data, FAQ et breadcrumb

- `Service` : `Paris to Normandy Private Chauffeur`; serviceType `Private chauffeur transfer and customized day trip`; provider `LocalBusiness`; areaServed Paris + Normandy.
- `BreadcrumbList` : Home → Services → Long Distance → Normandy. Structure valide et hiérarchie correcte. Aucun breadcrumb visible, ce qui reste cohérent avec le design actuel.
- `FAQPage` : sept questions. Les tests confirment que questions et réponses JSON-LD existent également dans le contenu visible.
- Pas de `Organization`, `WebPage` ni `WebSite` autonomes sur cette page. Le prestataire est imbriqué comme `LocalBusiness` dans `Service`.

Questions FAQ : durée de trajet; D-Day en une journée; personnalisation; attente lors des visites; pickup hôtel Paris; one-way et nuit en Normandy; différence chauffeur/guide.

### Navigation, footer et scripts

- Navigation : architecture Services → Long Distance → Normandy correctement reflétée, avec états actifs.
- Footer : liens vers Airport Transfers, Disneyland Experience, Long Distance, Hourly Service, Fleet, Contact et pages légales. Les trois sous-pages Long Distance ne sont pas dans le footer.
- Scripts : Google tag, `js/main.js` (navigation), petit script inline d'accordéon FAQ et `js/marketing-attribution.js`. Aucun script spécifique manifestement inutile n'a été identifié.

### Checklist détaillée demandée

| Élément | État actuel |
|---|---|
| Informations commerciales | PRÉSENT : service privé, porte-à-porte, formats, personnalisation, devis |
| Prix public | ABSENT : aucun montant, aucun « From € » |
| Points de départ | Paris dominant; Paris hotel, residence, airport ou autre lieu convenu |
| Véhicules | PRÉSENT mais générique : premium, air-conditioned, adapté passagers/bagages |
| Bagages | PRÉSENT et utile |
| Sièges enfants | ABSENT |
| Temps de trajet | PARTIEL : dépend de la destination/traffic; aucune durée chiffrée |
| One-way | PRÉSENT et expliqué |
| Round trip | PRÉSENT et expliqué |
| Day trip | PRÉSENT et expliqué |
| Multi-stop | PARTIEL : « combine compatible stops » et itinéraire personnalisé, mais pas de traitement dédié |
| Chauffeur waiting / at disposal | PRÉSENT : véhicule disponible et attente si convenue |
| Hôtels / résidences | PRÉSENT, principalement Paris |
| Airports | PRÉSENT génériquement : « a Paris airport » |
| Disneyland Paris | ABSENT du contenu principal; seulement navigation/footer |
| Versailles | ABSENT |
| Chantilly | ABSENT |
| CDG | ABSENT du contenu principal; seulement navigation |
| Orly | ABSENT du contenu principal; seulement navigation |
| Beauvais | ABSENT du contenu principal; seulement navigation |
| D-Day beaches | PRÉSENT et bien traité |
| Bayeux | PRÉSENT dans deux blocs D-Day |
| Omaha Beach | PRÉSENT dans la meta, cartes, section et image |
| American Cemetery | PRÉSENT dans la carte, section et image |
| Sainte-Mère-Église | ABSENT |
| Pointe du Hoc | PRÉSENT dans carte + section |
| Arromanches | PRÉSENT dans carte + section |
| Rouen | ABSENT |
| Honfleur | PRÉSENT dans hero + carte côte, mais peu détaillé |
| Deauville | PRÉSENT, simple mention dans la carte côte |
| Étretat | PRÉSENT, simple mention + image dédiée |
| Caen | ABSENT |
| Le Havre | ABSENT |
| Mont-Saint-Michel | PRÉSENT avec carte dédiée et formats proposés |

## 4. Intentions actuellement couvertes

| Intention | Évaluation | Justification |
|---|---|---|
| A. Transfert direct | COUVERT | Door-to-door et transfert privé sont structurants |
| B. Aller simple | COUVERT | Carte dédiée + FAQ séjour sur place |
| C. Aller-retour | COUVERT | Carte dédiée et retour selon itinéraire |
| D. Day trip | COUVERT | Carte, FAQ D-Day et schema Service |
| E. Multi-stop | PARTIELLEMENT COUVERT | Arrêts compatibles/personnalisation, sans réponse complète à l'intention |
| F. D-Day beaches | COUVERT | Carte, H2, FAQ, lieux précis |
| G. Chauffeur à disposition | COUVERT | Disponibilité pendant le trajet convenu et FAQ attente |
| H. Depuis un aéroport | PARTIELLEMENT COUVERT | Format générique « a Paris airport », aucun aéroport nommé ni logistique dédiée |
| I. Depuis Disneyland | NON COUVERT | Aucun contenu principal |
| J. Depuis Versailles | NON COUVERT | Absent |
| K. Depuis Chantilly | NON COUVERT | Absent |
| L. Groupes/familles | PARTIELLEMENT COUVERT | Passagers/choix véhicule, mais ni familles, groupes, capacités ni sièges enfants |
| M. Bagages | COUVERT | Véhicule adapté aux passagers et bagages |
| N. Business travel | NON COUVERT | Aucun cas d'usage professionnel |
| O. Tourism | COUVERT | D-Day, côte, Mont-Saint-Michel, itinéraires |
| P. Hôtels | COUVERT | Pickup hôtel Paris répété |
| Q. Résidences privées | PARTIELLEMENT COUVERT | Mention résidence/autre lieu convenu, peu développée |

## 5. Paris vs zone de pickup

### Verdict

**A — La page donne majoritairement l'impression que le départ doit être Paris**, tout en laissant apercevoir quelques exceptions génériques.

Passages qui imposent cette perception :

- Title : `Paris to Normandy...`
- Meta : `Travel from Paris to Normandy...`
- Eyebrow : `Private journeys between Paris and Normandy`
- H1 : `Private Chauffeur from Paris to Normandy`
- Hero : `private chauffeur from Paris`
- H2 : `Visit the D-Day Landing Beaches from Paris`
- Corps : `Travel directly from your Paris hotel...`
- Formats : retour à Paris et `private transportation between Paris and Normandy`
- FAQ : `Can you pick me up from my Paris hotel?`
- WhatsApp : `private journey from Paris to Normandy`

Passages qui ouvrent la zone de pickup sans la rendre claire :

- `Airport to Normandy` : départ depuis `a Paris airport`.
- FAQ : `Paris hotel, residence, airport or another agreed location`.
- Processus : demande de partager la `pickup location`.
- JSON-LD : description `between Paris, Paris airports and Normandy`.

Il est donc possible de conserver Paris comme cible SEO principale, mais le contenu actuel ne correspond pas encore au modèle commercial « Paris est important, mais la prise en charge couvre une zone plus large ».

## 6. Normandy destination coverage

### Bien couvertes

- **Normandy comme région** : plusieurs formats, expériences et sous-régions; distinction région/destinations globalement correcte.
- **D-Day beaches** : véritable thème éditorial.
- **Omaha Beach, Normandy American Cemetery, Pointe du Hoc, Arromanches, Bayeux** : regroupés de façon cohérente dans deux blocs D-Day; Omaha possède aussi une image dédiée.
- **Mont-Saint-Michel** : carte dédiée, transfert/round trip/journey mentionnés.

### Simplement mentionnées ou peu développées

- **Honfleur** : hero + carte côte, sans informations pratiques propres.
- **Deauville** : une mention dans la carte côte.
- **Trouville** : une mention dans la carte côte.
- **Étretat** : une mention textuelle et une image/ALT dédiée.

### Absentes du contenu principal

- Rouen
- Le Havre
- Caen
- Utah Beach
- Sainte-Mère-Église
- Giverny

Giverny peut être commercialement pertinent selon l'itinéraire, mais sa pertinence comme destination « Normandy » n'est pas établie par le contenu local et ne doit pas être forcée sans validation.

## 7. Analyse D-Day

| Requête/intention | Verdict | Justification |
|---|---|---|
| `private driver to D-Day beaches` | COUVERT | D-Day est un bloc majeur, chauffeur et disponibilité sont expliqués |
| `Paris to D-Day beaches private transfer` | COUVERT | H2 exact autour du départ Paris, transfert privé et day trip |
| `chauffeur to Omaha Beach` | PARTIELLEMENT COUVERT | Omaha est visible plusieurs fois, mais sans bloc logistique propre ni transfert dédié |
| `private driver to Normandy American Cemetery` | PARTIELLEMENT COUVERT | lieu présent dans carte, texte et image, sans réponse autonome complète |
| `Bayeux private transfer` | PARTIELLEMENT COUVERT | Bayeux est un arrêt D-Day, pas une offre de transfert clairement développée |
| `private chauffeur to Sainte-Mère-Église` | NON COUVERT | lieu absent |

## 8. Audit du hub `/long-distance`

- Title/H1 ciblent clairement `Long Distance Private Transfer from Paris`.
- Introduction : chauffeur longue distance France/Europe, porte-à-porte, hôtel/résidence/aéroport, véhicule premium, itinéraire adapté.
- Destinations : Normandy, Champagne/Reims, Loire Valley, Brussels, Luxembourg, Switzerland.
- Liens spécialisés : `Explore Normandy`, `Explore Champagne`, `Explore Loire Valley`.
- CTA : plusieurs `Request a Quote` vers `/contact`, `Plan Your Journey`, `Discover Our Fleet`.
- Profondeur : environ 678 mots, six destinations, six bénéfices, véhicule, organisation, six FAQ visibles.
- Structured data : `Service` valide avec Paris, Normandy, Champagne, Loire Valley, Belgium, Luxembourg et Switzerland en `areaServed`.
- FAQ : présente visiblement, mais sans schema `FAQPage`.
- Breadcrumb : absent visuellement et en JSON-LD.
- Liens entrants contextuels publics identifiés : homepage (`Explore Long-Distance Transfers`), Services (`long-distance transfer service`), Hourly (`long-distance private transfer`) et les trois pages destination (`Explore All Long-Distance Services`), en plus des liens de menu/footer.

### Verdict hub

**OUI**, le hub indique clairement aux utilisateurs et moteurs qu'il existe une spécialité Long Distance : requête générique dans title/H1, destinations structurées, liens enfants, service schema, avantages et FAQ. Il reste perfectible comme hub d'autorité : départ encore cadré sur Paris, BreadcrumbList absent, certaines destinations sans page enfant, peu de liens contextuels depuis les familles Airport et Disneyland.

## 9. Maillage interne

### Carte actuelle

```text
Homepage
 ├─ Normandy (contexte)
 ├─ Champagne and Épernay (contexte)
 ├─ Loire Valley (contexte)
 └─ Explore Long-Distance Transfers → /long-distance

Services
 └─ long-distance transfer service → /long-distance

Hourly
 └─ long-distance private transfer → /long-distance

/long-distance
 ├─ Explore Normandy
 ├─ Explore Champagne
 └─ Explore Loire Valley

Chaque page destination
 └─ Explore All Long-Distance Services → /long-distance
```

Le menu Services, présent sur les pages commerciales, utilise partout `Long Distance`, `Normandy`, `Champagne`, `Loire Valley`. Le footer utilise `Long Distance`, mais ne liste pas les sous-pages.

### Diagnostic par type de page

- Homepage : bon maillage contextuel vers hub + trois destinations.
- Services : lien contextuel vers le hub uniquement; destinations accessibles par le menu.
- Airport pages : liens vers hub/destinations uniquement via navigation/footer, pas dans le contenu.
- Disneyland pages : même constat.
- Fleet : même constat.
- Contact : même constat.
- Pages destination : bon retour contextuel vers le parent; liens latéraux entre destinations uniquement via navigation.

### Problèmes/opportunités

- Aucune page cœur n'est orpheline.
- Le nombre brut de liens entrants surestime l'autorité contextuelle à cause du menu répété.
- Les ancres principales sont descriptives. Pas de dépendance à `Learn more` pour les quatre pages cœur.
- Les pages spécialisées manquent de liens contextuels depuis les pages Airport/Disneyland, alors que le modèle commercial accepte ces pickups.
- Aucun lien interne du site testé n'est cassé.
- Aucun lien HTML interne ne pointe vers une ancienne URL `.html` Long Distance.

## 10. Cannibalisation

| Intention | Pages en jeu | Risque actuel |
|---|---|---|
| long distance transfer Paris | `/long-distance`, `/services`, homepage | FAIBLE : le hub porte title/H1 et le contenu détaillé; les autres pages présentent la catégorie |
| private chauffeur long distance | `/long-distance`, `/hourly` | FAIBLE À MODÉRÉ : Hourly parle de mise à disposition mais renvoie clairement au hub pour les longues distances |
| Paris to Normandy | `/paris-to-normandy`, bloc Normandy du hub | FAIBLE : la landing est nettement plus spécifique; le hub agit comme parent |
| Normandy private transfer/chauffeur | `/paris-to-normandy`, `/long-distance` | FAIBLE : architecture parent/enfant cohérente |
| Normandy day trip | `/paris-to-normandy` uniquement | AUCUNE cannibalisation actuelle |
| D-Day transfer | `/paris-to-normandy` uniquement | AUCUNE cannibalisation actuelle |

Le danger futur serait de créer simultanément des pages `Normandy`, `Normandy day trip`, `Paris to Normandy`, `CDG to Normandy` et chaque ville sans angle réellement distinct. L'architecture actuelle évite ce problème.

## 11. Technical SEO

### Points conformes

- Routage attendu : `/long-distance` est réécrit vers le fichier physique extensionless `/long-distance-transfer`; les trois pages spécialisées utilisent `cleanUrls`.
- Redirection permanente explicite : `/long-distance-transfer` → `/long-distance`.
- Les quatre pages sont `index, follow` et autorisées par `robots.txt`.
- Les quatre URL sont dans `sitemap.xml`.
- Canonicals exacts et cohérents.
- Un seul H1 par page.
- Titles et meta descriptions uniques dans l'ensemble des 19 pages indexables du sitemap.
- Open Graph et Twitter complets.
- JSON-LD parsable.
- Aucun lien interne cassé détecté par les tests.
- Aucune image référencée manquante sur les quatre pages.
- ALT et dimensions présents sur toutes les balises `<img>`.
- Aucun prix public chiffré dans les quatre pages.

### Points à surveiller

- Avec `cleanUrls: true`, une ancienne URL `/long-distance-transfer.html` devrait d'abord être nettoyée en `/long-distance-transfer`, puis redirigée vers `/long-distance` : chaîne potentielle de deux redirections à confirmer par test HTTP production. `/long-distance-transfer` seul redirige directement.
- Les `lastmod` sont obsolètes par rapport à l'historique Git : hub `2026-08-31`, Normandy `2026-09-07`, Champagne/Loire `2026-09-08`, alors que ces fichiers ou leur rendu partagé ont été modifiés le 20 septembre 2026.
- Le CSS partagé pèse environ 160 Ko non minifié. Ce n'est pas propre au Long Distance, mais il affecte ses pages.
- Le hero Normandy est un background CSS. Le preload `imagesrcset` peut sélectionner la variante 480 px alors que la règle CSS mobile demande 800 px (ou 1376 px en haute densité), ce qui peut produire une requête preload inutilisée suivie d'une seconde requête.
- Le background hero n'apporte pas d'ALT HTML; l'information essentielle reste toutefois textuelle dans le hero, donc l'image peut être considérée décorative.
- Le hub charge plusieurs images de destination lazy-loadées; les fichiers existent et les `srcset` sont corrects.

## 12. Structured data

| Page | Schemas | Validité et cohérence |
|---|---|---|
| `/long-distance` | `Service` avec provider `LocalBusiness` imbriqué | JSON valide; reflète les destinations visibles; pas de BreadcrumbList ni FAQPage |
| `/paris-to-normandy` | `Service`, `BreadcrumbList`, `FAQPage`; provider `LocalBusiness` imbriqué | JSON valide; FAQ identique au visible; breadcrumb logique; `areaServed` limité à Paris + Normandy |
| `/paris-to-champagne` | `Service`, `BreadcrumbList`, `FAQPage`; provider imbriqué | JSON valide; 8 FAQ visibles/synchronisées; breadcrumb logique |
| `/paris-to-loire-valley` | `Service`, `BreadcrumbList`, `FAQPage`; provider imbriqué | JSON valide; 10 FAQ visibles/synchronisées; breadcrumb logique |

Schemas absents sur ces pages : `Organization` autonome, `WebPage`, `WebSite`. Leur absence n'est pas en soi une erreur. Aucun rating/review fabriqué n'est présent. Il n'est pas nécessaire d'ajouter un FAQ schema au hub uniquement pour viser un rich result.

Incohérence stratégique mineure sur Normandy : le `Service.description` cite `Paris airports`, mais `areaServed` ne liste que Paris et Normandy, et le contenu visible ne nomme aucun aéroport spécifique.

## 13. Request a Quote / conversion

- Le parcours est entièrement orienté devis; aucun prix chiffré.
- Premier CTA Normandy : dans le hero, immédiatement après le résumé, avant toute autre section.
- Destination : `/contact?service=normandy`; le paramètre est reconnu par le formulaire Contact.
- Huit CTA Contact sur la page, trois WhatsApp et un CTA final complet.
- Desktop : hero avec deux CTA côte à côte; cartes et sections alternées.
- Mobile : les CTA passent en pleine largeur et en colonne à ≤ 768 px.
- Friction positive : aucun formulaire long dans la landing; le service est préselectionné après clic.
- Frictions : passage obligatoire vers `/contact`; aucune conservation explicite dans l'URL du type de trajet/lieu précis choisi; tous les CTA de cartes transmettent seulement `service=normandy`; messages WhatsApp toujours cadrés `from Paris`.
- Le hub envoie simplement vers `/contact`, sans paramètre de service Long Distance.

## 14. Mobile — Normandy

- Header/menu : règles responsive existantes et script `main.js`; sous-menu Long Distance disponible.
- Hero : min-height 610 px à ≤ 768 px puis 640 px à ≤ 480 px, H1 2.65 rem puis 2.25 rem, texte 1.05 rem, overlay renforcé pour la lisibilité.
- Premier CTA : inclus dans le hero et transformé en bouton pleine largeur; pas de section intermédiaire avant lui.
- Images : variantes WebP 480/800/1376, `sizes`, dimensions explicites, lazy-loading hors hero.
- Cards/splits/formats/étapes : passage de grilles 2–4 colonnes à une seule colonne à ≤ 768 px.
- FAQ : boutons tactiles larges, police réduite, focus visible, réponses masquées proprement au chargement.
- Footer : passe en colonne.
- Overflow : `body { overflow-x: hidden; }`; les grilles emploient `minmax(0, 1fr)` et aucun débordement évident n'a été identifié dans le CSS.
- CLS : dimensions explicites et `aspect-ratio` limitent les déplacements; le hero CSS a une hauteur minimale. Les fontes externes asynchrones peuvent produire un léger changement typographique, mais pas de défaut Long Distance spécifique identifié.
- Lisibilité : overlay sombre, texte blanc, eyebrow doré; contrastes globalement adaptés.
- Point performance : risque de preload 480 px inutile face au CSS qui demande 800/1376 px sur mobile, décrit en section 11.

## 15. Gap analysis

| Élément | Existe | Qualité actuelle | Manque | Priorité |
|---|---|---|---|---|
| Targeting Paris → Normandy | Oui | Forte | Rien de critique pour cette intention | LOW |
| Pickup hors Paris | Partiel | Faible | Proposition claire de zone de pickup et exemples réels | CRITICAL |
| CDG | Non dans le contenu | Faible | Pickup, contexte arrivée, lien depuis page CDG | HIGH |
| Orly | Non dans le contenu | Faible | Pickup et lien contextuel | HIGH |
| Beauvais | Non dans le contenu | Faible | Clarifier disponibilité/réalité commerciale | MEDIUM |
| Disneyland | Non dans le contenu | Faible | Pickup et lien contextuel si réellement offert | HIGH |
| Versailles | Non | Absent | Mention/prise en charge si confirmée | MEDIUM |
| Chantilly | Non | Absent | Mention/prise en charge si confirmée | MEDIUM |
| Normandy destinations | Oui | Bonne mais incomplète | Rouen, Le Havre, Caen et autres destinations utiles | HIGH |
| D-Day beaches | Oui | Forte | Approfondissement logistique éventuel | MEDIUM |
| Bayeux | Oui | Moyenne | Rôle comme destination/transfert, pas seulement arrêt | MEDIUM |
| Omaha Beach | Oui | Bonne | Informations pratiques plus distinctes | MEDIUM |
| American Cemetery | Oui | Bonne | Informations pratiques plus distinctes | MEDIUM |
| Sainte-Mère-Église | Non | Absente | Couverture si desservie | HIGH |
| Mont-Saint-Michel | Oui | Bonne | Temps/logistique selon preuve et politique éditoriale | MEDIUM |
| Direct transfer | Oui | Forte | — | LOW |
| Round trip | Oui | Bonne | — | LOW |
| Day trip | Oui | Bonne | Limites/organisation plus détaillées | MEDIUM |
| Multi-stop | Partiel | Moyenne | Explication structurée et exemples compatibles | HIGH |
| Chauffeur waiting | Oui | Bonne | Modalités toujours sur devis, déjà prudent | LOW |
| Luggage | Oui | Bonne | Capacités par véhicule éventuellement via Fleet | LOW |
| Groups | Partiel | Faible | Familles/groupes/capacité | MEDIUM |
| Child seats | Non | Absente | Information uniquement si service confirmé | MEDIUM |
| Vehicles | Oui | Moyenne | Types/capacités via liens contextuels | MEDIUM |
| Travel times | Partiel | Prudente mais peu utile | Fourchettes par destination si fiables | MEDIUM |
| Request a Quote | Oui | Forte | Enrichir les paramètres transmis par les CTA | MEDIUM |
| FAQ | Oui | Forte | Pickup hors Paris et destinations manquantes | HIGH |
| Internal linking | Oui | Technique fort, contextuel limité | Liens éditoriaux Airport/Disneyland/Services/Fleet | HIGH |
| Structured data | Oui | Bonne | Alignement areaServed/pickups; breadcrumb du hub optionnel | MEDIUM |
| Trust elements | Partiel | Service features, 24/7, chauffeur | Preuves vérifiables/garanties réellement démontrables | MEDIUM |
| Mobile UX | Oui | Bonne | Corriger le potentiel preload hero redondant | MEDIUM |

## 16. Futures pages possibles — analyse uniquement

| Sujet | Intention distincte ? | Cannibalisation | Duplication | Intérêt potentiel | Recommandation |
|---|---|---|---|---|---|
| A. Normandy Day Trip | Partiellement : format vs destination | Élevé avec la page actuelle qui le couvre déjà | Élevé | Bon utilisateur, SEO à valider | **À INTÉGRER DANS NORMANDY** |
| B. D-Day Beaches Private Chauffeur | Oui : histoire, sites, itinéraire, temps | Modéré, contrôlable avec un angle D-Day net | Modéré | Élevé : intention forte déjà visible dans la page | **PAGE DISTINCTE**, seulement avec contenu réellement approfondi |
| C. Mont-Saint-Michel | Oui pour transfert/visite longue | Modéré | Modéré | Bon utilisateur; SEO non validé localement | **À ÉTUDIER PLUS TARD** |
| D. Honfleur / Deauville | Cluster côtier cohérent | Modéré | Élevé si pages séparées | Bon pour l'itinéraire côtier | **À INTÉGRER DANS NORMANDY** |
| E. Rouen / Étretat | Cluster possible mais intentions différentes | Modéré | Élevé sans données dédiées | Bon pour enrichir la couverture | **À INTÉGRER DANS NORMANDY** |
| F. Bayeux | Peut être transfert ou base D-Day | Élevé avec D-Day + Normandy | Élevé | Utile, mais page autonome non justifiée localement | **À INTÉGRER DANS NORMANDY** |
| G. CDG → Normandy | Oui : pickup aéroport/arrivée | Modéré | Élevé si simple permutation de départ | Fort intérêt commercial; SEO à valider | **À ÉTUDIER PLUS TARD** |
| H. Disneyland → Normandy | Oui commercialement | Faible à modéré | Élevé sans contenu propre | Utilité réelle possible, demande inconnue | **À ÉTUDIER PLUS TARD** |

## 17. Top 10 problèmes/opportunités

1. **CRITICAL — Positionnement pickup trop parisien** : la page ne reflète pas la zone de service réelle.
2. **HIGH — Aéroports non nommés dans le contenu Normandy** : CDG, Orly et Beauvais ne sont présents que dans la navigation.
3. **HIGH — Disneyland/Versailles/Chantilly absents** malgré le modèle commercial annoncé.
4. **HIGH — Maillage contextuel insuffisant** depuis Airport, Disneyland, Services, Fleet et Contact vers les destinations.
5. **HIGH — Couverture géographique incomplète** : Rouen, Caen, Le Havre et Sainte-Mère-Église absents.
6. **HIGH — Multi-stop seulement implicite**, alors qu'il s'agit d'un élément différenciant de l'offre.
7. **MEDIUM — CTA trop peu contextualisés** : toutes les cartes transmettent le même paramètre, et WhatsApp impose Paris.
8. **MEDIUM — `lastmod` sitemap obsolètes** après des modifications du 20 septembre.
9. **MEDIUM — Preload hero mobile potentiellement redondant** avec les nouvelles variantes CSS 800/1376.
10. **MEDIUM — Opportunité D-Day distincte**, mais uniquement si elle peut dépasser substantiellement le contenu existant et éviter la duplication.

## 18. Ce qu'il ne faut surtout pas changer

- Ne pas remplacer le hub `/long-distance` par Normandy.
- Ne pas casser la hiérarchie Services → Long Distance → Normandy.
- Ne pas diluer la cible forte `Paris to Normandy` dans le title/H1 sans stratégie : Paris peut rester l'axe SEO principal.
- Ne pas créer une page pour chaque combinaison départ × destination.
- Ne pas créer des pages de ville minces ou quasi dupliquées.
- Ne pas afficher de prix, exemple de tarif ou « From € ».
- Ne pas supprimer le fonctionnement `Request a Quote` ni les paramètres `service=...`.
- Ne pas promettre de durées, disponibilités, sièges enfants, capacités ou services non confirmés.
- Ne pas présenter le chauffeur comme guide historique licencié.
- Ne pas ajouter de schema FAQ uniquement pour un rich result; garder toute donnée structurée alignée avec le visible.
- Ne pas modifier réservation, backend, Supabase, admin, tracking, emails ou pricing dans cette refonte éditoriale.

## 19. Proposition d'architecture future — sans implémentation

```text
Services
└── Long Distance                     /long-distance
    ├── Normandy                      /paris-to-normandy
    │   ├── D-Day Beaches             future éventuelle, après validation
    │   └── Mont-Saint-Michel         à étudier plus tard
    ├── Champagne                     /paris-to-champagne
    └── Loire Valley                  /paris-to-loire-valley
```

Principes recommandés :

1. Conserver `/paris-to-normandy` comme page régionale principale et cible SEO Paris → Normandy.
2. Ajouter sur cette même page une couche commerciale explicite « pickup from our service area » avec CDG, Orly, Beauvais, Disneyland, Versailles, Chantilly, hôtels, gares et adresses privées uniquement lorsque chaque promesse est confirmée.
3. Organiser les destinations en clusters utiles : D-Day; côte Honfleur/Deauville/Étretat; villes Rouen/Caen/Bayeux; Mont-Saint-Michel; itinéraire personnalisé.
4. Renforcer les liens contextuels bidirectionnels entre les familles Airport/Disneyland et Normandy, sans créer immédiatement des pages dédiées à chaque départ.
5. N'envisager une page enfant D-Day que si elle offre une intention, une structure et des informations propres. Maintenir alors Normandy comme page régionale et D-Day comme page thématique.
6. Utiliser les données réelles de demandes, Search Console et SERP avant de décider de pages CDG → Normandy, Disneyland → Normandy ou Mont-Saint-Michel.

## Confirmation de non-modification

- Nombre de fichiers du site modifiés : **0**
- Nombre de pages créées : **0**
- Seul fichier créé : ce rapport dans `docs/seo/`
- Aucun déploiement
- Aucun push

