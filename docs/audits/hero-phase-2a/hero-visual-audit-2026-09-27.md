# Phase 2A — Hero visual audit

Date: 2026-09-27  
Scope: read-only visual/responsive/performance audit of 16 public hero sections  
Rendered viewports: 320×700, 360×800, 375×812, 390×844, 414×896, 430×932, 768×1024, 1024×1366, 1280×800  
Browser render DPR: 1 (Retina implications are called out separately)  
Production files changed during this audit: none

## A. Executive Summary

All 16 requested heroes were rendered in a real Chromium browser at all nine requested viewport sizes (144 renders). Priority screenshots were saved at 390, 430, 768 and 1280 px, with side-by-side sheets for the three requested families.

The overall visual result is stronger than the raw CSS complexity suggests:

- **8 heroes are class A**: their focal point and text/image composition are already good.
- **8 heroes are class B**: the image remains usable, but a small focal-position adjustment or breakpoint simplification would make the composition more stable.
- **0 heroes are class C**: no rendered hero has a fundamentally broken composition.
- **0 heroes are class D**: none of the original photographs is intrinsically unusable on mobile. The visible softness is primarily a delivery/resolution problem, not proof that the source photograph must be replaced.

The main issue is sharpness. The seven detailed Airport/Disneyland pages select a 480×268 source on 320–430 px screens even though a 650–776 px-tall `object-fit: cover` box needs roughly 1,165–1,390 source pixels across at DPR 1. The three Long Distance landing pages use an 800×447 CSS background through 1024 px; cover enlargement reaches approximately 1.37×–1.89× at DPR 1. On a DPR 2 phone the deficit is materially larger.

The best existing reusable mobile system is the **Airport → Paris detailed landing system**: consistent 650 px mobile minimum, 32 px inner horizontal padding, two full-width CTAs and an immediately adjacent trust strip. It should be the structural reference, while keeping page-specific text height and focal positions.

The most important Phase 2B work should therefore be:

1. correct responsive source selection before changing photographs;
2. normalize the detailed landing spacing and height logic at 320 px;
3. smooth Normandy’s 768→769 px focal-position jump;
4. preserve all desktop composition rules.

## B. Hero systems currently present

### HERO SYSTEM A — full-viewport home composition

Pages: `/`  
Characteristics: `min-height: 100vh`, centered text, two CTAs, one 1376×768 background, mobile background positioned `82% bottom`. It is visually strong at 390–768 px, but at 320×700 the second CTA is below the fold. This is an intentional immersive system, not a good common template for service pages.

### HERO SYSTEM B — compact hub/page-header composition

Pages: `/services`, `/airport`, `/disneyland`, `/long-distance`, `/hourly`  
Characteristics: content-driven height, centered heading/description, no hero CTA/trust strip, landscape CSS background, compact 302–485 px mobile hero. This system is visually efficient and sharp enough with its 768/1280/1376 image-set sources.

### HERO SYSTEM C — detailed Airport → Paris landing composition

Pages: `/cdg-to-paris`, `/orly-to-paris`, `/beauvais-to-paris`  
Characteristics: foreground `<img>`, overlay, left-aligned copy, two stacked mobile CTAs, 650 px mobile minimum, trust strip immediately below. This is the strongest common structural reference for detailed mobile landings.

### HERO SYSTEM D — detailed Disneyland landing composition

Pages: `/cdg-to-disneyland`, `/orly-to-disneyland`, `/beauvais-to-disneyland`, `/paris-to-disneyland`  
Characteristics: same basic architecture as System C, but a 690 px mobile minimum and more variable copy. The family is internally consistent; 320 px content causes 743–776 px actual heights.

### HERO SYSTEM E — Long Distance destination composition

Pages: `/paris-to-normandy`, `/paris-to-champagne`, `/paris-to-loire-valley`  
Characteristics: CSS background rather than `<img>`, two stacked CTAs, destination-specific fixed minima and multiple focal-position breakpoints. It has the largest internal variance and the clearest resolution mismatch.

## C. Hero matrix de toutes les pages

Classification concerns framing/composition. Sharpness and height are reported separately.

| Route | Key subject | Mobile framing observation | Class |
|---|---|---|---|
| `/` | van, Étretat cliffs and sea | van and cliffs remain legible at 390–768; text has a usable dark overlay | A |
| `/services` | Étretat arch/coast | centered landscape remains balanced across all widths | A |
| `/airport` | terminal, chauffeur car | centered framing keeps terminal and car visible; copy remains readable | A |
| `/disneyland` | castle | castle remains the clear focal point and does not disappear | A |
| `/long-distance` | motorway and van | van stays on the right and the road provides a clean text area | A |
| `/hourly` | Arc de Triomphe and sedan | monument and vehicle share the frame cleanly | A |
| `/cdg-to-paris` | Paris street and vehicle | vehicle is tight to the right/bottom edge on small mobile | B |
| `/orly-to-paris` | Paris bridge and van | vehicle is large and partly cropped on the right; still readable as intentional | B |
| `/beauvais-to-paris` | Montmartre and vehicle | monument is strong; vehicle is tight to the right edge | B |
| `/cdg-to-disneyland` | road/trees and vehicle | vehicle remains identifiable but is partially cropped and sits behind lower content | B |
| `/orly-to-disneyland` | terminal and vehicle | vehicle occupies much of the lower-right image and benefits from a small focal refinement | B |
| `/beauvais-to-disneyland` | rural road and van | subject/text separation is the best of the four Disneyland detail pages | A |
| `/paris-to-disneyland` | Paris street and van | vehicle is tight to the right edge on mobile | B |
| `/paris-to-normandy` | country road, landscape and van | acceptable endpoints, but the 40%→58% jump after 768 px visibly moves the van | B |
| `/paris-to-champagne` | vineyards, road and van | deliberate 62→58→54 progression protects text and vehicle well | A |
| `/paris-to-loire-valley` | château, tree, road and van | van is cut at the right edge; text, château and vehicle compete in the tall mobile crop | B |

Totals: **A 8 · B 8 · C 0 · D 0**.

## D. Mobile height matrix

All Y values below are measured from the top of the hero, not the document. Mobile header height is 96 px for every page at 320/390/430. `H/D` = H1 Y / description Y; `P/S` = primary CTA Y / secondary CTA Y; `next` = start of the following strip/section. Dashes mean that the compact hub hero has no CTA.

| Route | 320 px: hero · H/D · P/S · next | 390 px: hero · H/D · P/S · next | 430 px: hero · H/D · P/S · next |
|---|---|---|---|
| `/` | 817 · 224/431 · 658/729 · 817 | 844 · 237/444 · 671/742 · 844 | 932 · 304/465 · 692/763 · 932 |
| `/services` | 368 · 112/201 · — · 368 | 342 · 112/201 · — · 342 | 317 · 112/201 · — · 317 |
| `/airport` | 427 · 172/261 · — · 427 | 380 · 150/239 · — · 380 | 354 · 150/239 · — · 354 |
| `/disneyland` | 427 · 172/261 · — · 427 | 402 · 172/261 · — · 402 | 402 · 172/261 · — · 402 |
| `/long-distance` | 485 · 172/293 · — · 485 | 405 · 150/239 · — · 405 | 405 · 150/239 · — · 405 |
| `/hourly` | 402 · 172/261 · — · 402 | 376 · 172/261 · — · 376 | 354 · 150/239 · — · 354 |
| `/cdg-to-paris` | 701 · 157/279 · 507/578 · 701 | 650 · 153/243 · 443/513 · 650 | 650 · 167/257 · 429/499 · 650 |
| `/orly-to-paris` | 701 · 157/279 · 507/578 · 701 | 650 · 153/243 · 443/513 · 650 | 650 · 167/257 · 429/499 · 650 |
| `/beauvais-to-paris` | 701 · 157/279 · 507/578 · 701 | 650 · 162/252 · 452/522 · 650 | 650 · 167/257 · 429/499 · 650 |
| `/cdg-to-disneyland` | 772 · 165/287 · 578/649 · 772 | 714 · 165/287 · 521/591 · 714 | 690 · 184/273 · 478/549 · 690 |
| `/orly-to-disneyland` | 743 · 165/287 · 549/620 · 743 | 690 · 167/289 · 494/565 · 690 | 690 · 184/273 · 478/549 · 690 |
| `/beauvais-to-disneyland` | 776 · 165/319 · 582/653 · 776 | 690 · 167/289 · 494/565 · 690 | 690 · 167/289 · 494/565 · 690 |
| `/paris-to-disneyland` | 743 · 165/287 · 549/620 · 743 | 690 · 184/273 · 478/549 · 690 | 690 · 189/278 · 454/525 · 690 |
| `/paris-to-normandy` | 845 · 174/296 · 652/722 · 845 | 724 · 174/264 · 531/602 · 724 | 695 · 174/264 · 501/572 · 695 |
| `/paris-to-champagne` | 784 · 201/323 · 590/661 · 784 | 671 · 180/269 · 477/548 · 671 | 660 · 189/278 · 457/528 · 660 |
| `/paris-to-loire-valley` | 753 · 173/295 · 560/630 · 753 | 690 · 187/276 · 483/553 · 690 | 690 · 192/281 · 459/530 · 690 |

Additional heights:

- Header: 108 px at 768 and 1024; 112 px at 1280.
- At 320×700, the secondary CTA is below the fold on Home, all four detailed Disneyland pages, and all three Long Distance destination pages. On Airport → Paris it remains visible, although the trust strip is below the fold.
- Normandy is the clearest excessive-height case: 845 px at 320 and 724 px at 390, with the trust strip beginning late.
- Home height comes from `100vh` plus content overflow at 320; the service detail heights come from the combination of minimum height, vertical padding and copy length.
- Beauvais → Disneyland reaches 748 px at 1280 because of content, not an unnecessarily high desktop `min-height`.

## E. Background/Object position matrix

| Route/family | 320 | 390 | 430 | 768 | 1024 | 1280 | Finding |
|---|---:|---:|---:|---:|---:|---:|---|
| Home | 82% bottom | 82% bottom | 82% bottom | 82% bottom | center | center | coherent mobile/desktop split |
| Hubs (`services`, `airport`, `disneyland`, `long-distance`, `hourly`) | center | center | center | center | center | center | coherent |
| CDG → Paris | 58% | 58% | 58% | 62% | center | center | small mobile/tablet adjustment useful |
| Orly → Paris | 62% | 62% | 62% | 62% | center | center | stable, subject still tight right |
| Beauvais → Paris | 63% | 63% | 63% | 63% | center | center | stable, subject still tight right |
| Detailed Disneyland (all four) | 62% | 62% | 62% | 62% | center | center | consistent family rule |
| Normandy | 66% | 66% | 66% | 40% | 58% | center | abrupt 768→769 change is visible |
| Champagne | 62% | 62% | 62% | 58% | 54% | center | gradual movement is visually justified |
| Loire Valley | 60% | 60% | 60% | center | center | center | simple and acceptable; right edge remains tight |

## F. Image source/resolution matrix

All detailed landing source sets are 16:9-ish landscape files: 480×268, 800×447 and 1376×768. Hub sets are 768×429, 1280×714 and 1376×768. The Services image is 1584×672 and Home is 1376×768.

| Page/family | 320 | 390 | 430 | 768 | 1024 | 1280 | Mechanism / preload |
|---|---|---|---|---|---|---|---|
| Home | BG 1376 | BG 1376 | BG 1376 | BG 1376 | BG 1376 | BG 1376 | CSS background; preload yes; no responsive alternatives |
| Services | Étretat 1584 | same | same | same | same | same | CSS background; preload yes |
| Airport hub | 768 | 768 | 768 | 1280 | 1280 | 1376 | CSS media/image-set logic; preloads present |
| Disneyland hub | 768 | 768 | 768 | 1280 | 1280 | 1376 | CSS media/image-set logic; preloads present |
| Long Distance hub | 768 | 768 | 768 | 1280 | 1280 | 1376 | CSS media/image-set logic; preloads present |
| Hourly hub | 768 | 768 | 768 | 1280 | 1280 | 1376 | CSS media/image-set logic; preloads present |
| Airport → Paris (3) | 480 | 480 | 480 | 800 | 1376 | 1376 | `<img srcset>`, `sizes="100vw"`; preload only on CDG |
| Disneyland detail (4) | 480 | 480 | 480 | 800 | 1376 | 1376 | `<img srcset>`, `sizes="100vw"`; responsive preload on all four |
| Normandy | 800 | 800 | 800 | 800 | 800 | 1376 | CSS background; separate responsive preload exists |
| Champagne | 800 | 800 | 800 | 800 | 800 | 1376 | CSS background; separate responsive preload exists |
| Loire Valley | 800 | 800 | 800 | 800 | 800 | 1376 | CSS background; separate responsive preload exists |

Cover enlargement estimates at DPR 1:

| Family | Representative box | Approx. source width needed by cover | Selected width | Enlargement |
|---|---:|---:|---:|---:|
| Airport → Paris, 390/430 | 390–430 × 650 | ~1,164 | 480 | ~2.43× |
| Airport → Paris, 768 | 768 × 630 | ~1,129 | 800 | ~1.41× |
| Disneyland detail, 390 | 390 × 690–714 | ~1,236–1,279 | 480 | ~2.58–2.66× |
| Disneyland detail, 768 | 768 × 660 | ~1,183 | 800 | ~1.48× |
| Normandy, 320 | 320 × 845 | ~1,514 | 800 | ~1.89× |
| Normandy, 390 | 390 × 724 | ~1,297 | 800 | ~1.62× |
| Normandy, 1024 | 1024 × 680 | ~1,219 | 800 | ~1.52× |
| Champagne, 390 | 390 × 671 | ~1,202 | 800 | ~1.50× |
| Loire, 390 | 390 × 690 | ~1,236 | 800 | ~1.55× |

At DPR 2, the physical-pixel requirement approximately doubles. The existing 1376-wide originals may still be insufficient for pixel-perfect coverage of the tallest 16:9 mobile boxes, which is why a purpose-made portrait crop is useful for the three Long Distance pages even after source-selection fixes.

The Long Distance preload can also select a file different from the CSS background actually painted. This creates a risk of preloading one candidate and then downloading the hard-coded 800 file. Phase 2B should make preload and CSS selection describe the same resource logic.

## G. Sharpness findings

### Resolution

- **Confirmed soft:** all three Airport → Paris detail heroes at 320–768.
- **Confirmed soft:** all four detailed Disneyland heroes at 320–768.
- **Confirmed soft:** Normandy, Champagne and Loire Valley at 320–1024, most visible on tall mobile.
- **Acceptable:** compact hubs; their selected 768 file approximately matches the cover demand at mobile sizes.
- **Acceptable to mildly soft:** Home on the tallest mobile/tablet viewports; one 1376×768 file serves every size.

### Compression

No distinct block artifacts, ringing or banding were visually isolated. The softness follows the mathematically expected cover enlargement and source switches, so **resolution/source selection is the primary diagnosis**, not over-compression. Compression should only be reassessed after correct candidates are loaded.

### Height

Tall boxes amplify the resolution problem because a landscape image must scale by hero height before being cropped horizontally. Reducing unnecessary height at 320 px therefore improves both fold position and apparent sharpness.

## H. Normandy detailed analysis

The important subjects are the winding road, valley, and van in the lower-right half. The copy needs the darker left/sky area.

- **390 px, 66%:** natural mobile composition. The van is visible below/right without destroying text contrast. Recommended working range: **62–66%**.
- **430 px, 66%:** still natural, though the van sits behind the lower description/CTA area. Recommended working range: **62–66%**.
- **768 px, 40%:** the van is pushed to the far right, leaving a very clean text area. The result itself is acceptable. Recommended working range: **42–50%** if continuity is desired.
- **1024 px, 58%:** balanced two-subject layout with van center-right and landscape retained. Recommended working range: **55–58%**.

The actual perceptible discontinuity occurs at **769 px**, where the rule changes from 40% to 58%. The van moves left by roughly 60 px between 768 and 769 in otherwise near-identical viewports. Neither endpoint is broken, but the transition is unnecessarily abrupt. This is a class B positioning issue, not a need to replace the original photo.

Normandy also has the tallest mobile hero: 845 px at 320 and 724 px at 390. At 320 the secondary CTA begins below the viewport and the trust strip starts at hero Y 845. Both content height and mobile padding contribute; the nominal 640 px minimum is not the sole cause.

## I. Champagne detailed analysis

The vineyard lines and road establish the destination, while the van occupies the lower-right. Text is safest on the darker left.

- 62% at ≤480 keeps the vehicle recognizable without moving it under the main copy.
- 58% at 481–768 gently opens the vineyard/road composition.
- 54% at 769–1024 remains balanced and avoids a Normandy-style jump.

The progression is visually useful and should not be flattened blindly. It could be expressed more cleanly with family variables or fewer duplicated declarations, but its visual intent is sound. Champagne is class A for framing. Its softness is caused by the 800×447 background being enlarged, not by a bad focal position.

## J. Loire Valley detailed analysis

The château and landscape occupy the left/middle; the van and tree occupy the right. At 390–430 the 60% position preserves both destination and vehicle, but the van is cut at the right edge. At 768+ center positioning is acceptable.

The 690 px mobile minimum is not strictly required by the copy at 390/430; the layout has more bottom image area than Airport → Paris. At 320, however, content still drives the rendered hero to 753 px. A modest common padding/height normalization can reduce it without changing text.

The visible softness comes chiefly from enlargement of the 800×447 background. A portrait variant would be useful because it can preserve the château, road and vehicle with less horizontal waste. Recommendation: **RECOMMENDED**, ideal mobile master approximately **900×1400** (with optimized derivatives as appropriate). It is not required to rescue the existing composition, so the hero is class B rather than D.

## K. Airport → Paris comparison

| Item | CDG | Orly | Beauvais |
|---|---|---|---|
| Mobile height | 650 at 390/430 | 650 | 650 |
| 320 actual height | 701 | 701 | 701 |
| Position ≤430 | 58% | 62% | 63% |
| Position 768 | 62% | 62% | 63% |
| Selected source ≤430 | 480×268 | 480×268 | 480×268 |
| Selected source 768 | 800×447 | 800×447 | 800×447 |
| Preload | responsive image preload | none | none |
| Composition | vehicle tight right | largest vehicle crop | strong monument, vehicle tight right |

The family already shares one structural system. No different height logic is justified. Source delivery is the shared weakness. CDG’s different preload is a performance inconsistency, not a visual reason to alter the hero. The minimal Phase 2B direction is to keep the 650 px structure, align preload behavior, and make mobile resource selection aware of the tall cover box.

## L. Disneyland comparison

All four pages can share the same mobile system. At 430 and 768 the 690/660 px rules produce coherent alignment. Differences at 320 are content-driven:

- CDG: 772 px;
- Orly: 743 px;
- Beauvais: 776 px due to longer description;
- Paris: 743 px.

All select 480×268 at ≤430 and 800×447 at 768, with `sizes="100vw"` and a responsive preload. Their shared 62% mobile/tablet object position is internally consistent. Beauvais has the cleanest subject/text separation; CDG, Orly and Paris would benefit from page-specific focal refinements of only a few percentage points after the correct source is loaded.

The correct order for Phase 2B is: fix source selection, re-render, then decide whether any of the 62% exceptions are still necessary. Do not tune position against a blurred 480 candidate and assume the result will remain identical with a higher-resolution crop.

## M. Recommended common mobile hero structure

Use Airport → Paris as the reference for **detailed service landing pages**, not as a pixel-identical template:

- 96 px fixed header;
- hero content begins approximately 104–112 px below the hero top;
- 32 px content inset on narrow mobile;
- eyebrow → H1 → description with common vertical rhythm;
- two full-width CTAs, approximately 55–59 px high with a 16 px gap;
- 64 px lower safety space when content allows;
- trust strip immediately after the hero;
- content-driven growth below a common family minimum rather than multiple arbitrary minima;
- common overlay structure, with photo-specific object/background position variables;
- responsive source rules that account for the *cover box*, not only viewport width.

This recommendation does not mean forcing every page to 650 px. Copy length may increase the final height. The target is one spacing algorithm and a small number of page-specific focal variables.

## N. Pages requiring only CSS positioning

- `/cdg-to-paris`: small focal refinement after source correction.
- `/orly-to-paris`: small focal refinement after source correction.
- `/beauvais-to-paris`: small focal refinement after source correction.
- `/cdg-to-disneyland`: small focal refinement after source correction.
- `/orly-to-disneyland`: small focal refinement after source correction.
- `/paris-to-disneyland`: small focal refinement after source correction.
- `/paris-to-normandy`: remove/smooth the abrupt 768→769 focal jump.
- `/paris-to-loire-valley`: optional small right-subject refinement.

Champagne should keep its progressive focal logic unless new renders show a regression after source changes.

## O. Pages requiring height/padding adjustment

Priority:

1. `/paris-to-normandy` — tallest at 320 and still late trust-strip arrival at 390.
2. `/paris-to-champagne` and `/paris-to-loire-valley` — secondary CTA below the 320×700 fold.
3. Detailed Disneyland family — normalize 320 px top/bottom rhythm while allowing longer copy to grow.
4. Home — optional 320-only adjustment so the secondary CTA does not start below the fold; preserve the full-viewport design at 390+.

No compact hub requires height correction.

## P. Pages potentially requiring better image source

Highest priority (10 pages):

- `/cdg-to-paris`, `/orly-to-paris`, `/beauvais-to-paris`;
- `/cdg-to-disneyland`, `/orly-to-disneyland`, `/beauvais-to-disneyland`, `/paris-to-disneyland`;
- `/paris-to-normandy`, `/paris-to-champagne`, `/paris-to-loire-valley`.

For the first seven, try corrected `<picture>`/`srcset` selection before creating new imagery. For the Long Distance backgrounds, align CSS `image-set`/media rules and preload, then evaluate portrait derivatives.

Home may benefit from an additional large/mobile candidate later, but it is not a Phase 2B priority.

## Q. Pages where portrait variants are recommended

| Family | Recommendation | Ideal mobile ratio/dimensions | Reason |
|---|---|---|---|
| Home | OPTIONAL | about 900×1400 | could reduce tablet/mobile enlargement, but current composition works |
| Compact hubs | NOT NEEDED | — | short hero boxes already suit landscape files |
| Airport → Paris | OPTIONAL | about 900×1400 | landscape originals can work if correct 1376 candidate is selected |
| Disneyland detail | OPTIONAL | about 900×1400 | same; fix resource selection first |
| Long Distance destinations | RECOMMENDED | **900×1400 per destination** | tall boxes, strong right-side subjects and repeated 800-source enlargement |

**Portrait variants actually recommended: 3** — Normandy, Champagne and Loire Valley. They should be authored crops, not automated center crops. No image is created in Phase 2A.

## R. Desktop elements that MUST NOT change

- 1280 desktop hero heights and horizontal CTA layout;
- desktop center positions unless a page-specific visual test proves otherwise;
- 1376×768 desktop candidates and their focal composition;
- overlay strength and left-side text readability;
- typography, H1 wording, eyebrow wording and descriptions;
- trust-strip contents and order;
- navigation/header dimensions;
- CTA labels, destinations and tracking behavior;
- SEO metadata, schema, canonical URLs and internal links.

All Phase 2B selectors should be scoped to mobile/tablet media queries to avoid accidental desktop drift.

## S. Proposed Phase 2B correction plan

No item below has been applied.

| Page/family | CURRENT | TARGET | CHANGE TYPE | DESKTOP RISK | VISUAL VALIDATION REQUIRED |
|---|---|---|---|---|---|
| Home | 100vh; second CTA below 320×700 fold | preserve immersive design, improve 320-only fold | height/padding | low | yes |
| Services | compact centered hero works | unchanged | none | none | no |
| Airport hub | compact hero and image-set work | unchanged | none | none | no |
| Disneyland hub | compact hero and focal point work | unchanged | none | none | no |
| Long Distance hub | compact hero, mild 320 cover upscale | preserve composition; optional source tuning only | source | low | yes |
| Hourly hub | compact hero and image-set work | unchanged | none | none | no |
| CDG → Paris | 480 mobile source; 58/62% focal rules | load adequate source, then validate one small focal adjustment | source/srcset/position | low | yes |
| Orly → Paris | no preload; 480 mobile source; 62% | align preload/source logic; keep 650 structure | preload/source/srcset | low | yes |
| Beauvais → Paris | no preload; 480 mobile source; 63% | align preload/source logic; keep 650 structure | preload/source/srcset | low | yes |
| CDG → Disneyland | 480 mobile source; tall 320 content | adequate source and shared 320 spacing | source/srcset/padding | low | yes |
| Orly → Disneyland | 480 mobile source; tall 320 content | adequate source and shared 320 spacing | source/srcset/padding | low | yes |
| Beauvais → Disneyland | 480 source; longest copy | adequate source; content-driven height retained | source/srcset/padding | low | yes |
| Paris → Disneyland | 480 mobile source; tall 320 content | adequate source and shared 320 spacing | source/srcset/padding | low | yes |
| Normandy | 800 background through 1024; 66→40→58 jump | aligned CSS/preload source, smoother focal transition, shorter 320 rhythm | source/position/height/padding | medium | yes |
| Champagne | 800 background through 1024; useful 62→58→54 progression | keep progression, align source/preload, normalize spacing | source/height/padding | low | yes |
| Loire Valley | 800 background through 1024; 690 mobile minimum | adequate/portrait source, modest height reduction, validate right focal point | source/height/position | medium | yes |

Recommended sequence:

1. introduce shared responsive source logic without changing position or height;
2. capture the same 390/430/768/1280 matrix;
3. normalize mobile spacing/height;
4. apply only the page-specific focal exceptions still proven necessary;
5. compare desktop screenshots against this audit before accepting changes.

## T. Risk assessment

- **Desktop regression — medium if selectors are broad:** several classes are shared across destination families. Restrict changes by breakpoint and family.
- **Double downloads — medium:** a responsive preload that does not match a CSS background rule can fetch two hero images.
- **LCP regression — medium:** choosing 1376 everywhere fixes blur but can increase bytes. Use correct candidates/portrait crops rather than a blanket largest-source rule.
- **Text contrast regression — medium:** moving a vehicle or bright sky away from its current position can put bright detail behind copy.
- **CLS risk — low:** current heroes have explicit minimum heights/dimensions. Preserve reserved space when changing sources.
- **SEO/tracking risk — low if Phase 2B remains CSS/image-only:** do not touch copy, links, CTA targets or scripts.

## U. Final recommendation

Do not redesign the heroes. Keep the five existing visual identities but consolidate the three detailed landing families around the Airport → Paris mobile spacing system.

The first correction should be source delivery, because positioning decisions made against an enlarged 480/800 source can be misleading. After the sharpness fix, reduce only the proven 320 px excess, smooth Normandy’s one abrupt breakpoint, and retain Champagne’s useful gradual positioning. Commission three authored 900×1400 portrait variants for Normandy, Champagne and Loire Valley if the aim is both Retina sharpness and efficient payload; they are an enhancement, not a prerequisite for a usable Phase 2B.

## Audit captures

Individual captures (16 pages × 4 priority widths) and 12 comparison sheets are in:

`docs/audits/hero-phase-2a/captures/`

Key comparison sheets:

- `comparison-airport-paris-{390,430,768,1280}.png`
- `comparison-disneyland-{390,430,768,1280}.png`
- `comparison-long-distance-{390,430,768,1280}.png`

Total saved PNG captures: **76**.
