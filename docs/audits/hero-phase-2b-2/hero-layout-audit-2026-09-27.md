# Phase 2B-2 — Hero layout audit

Date: 2026-09-27  
Scope: mobile spacing/height and focal-position refinements only  
Sources of truth: Phase 2A and Phase 2B-1 audit reports

## 1. Production files changed by Phase 2B-2

- `css/style.css`

No HTML, JavaScript, text, SEO field, image asset, backend file or tracking file was changed during Phase 2B-2.

## 2. CSS rules changed

- Long Distance ≤480 px: common `padding-top: 6.6rem`, `padding-bottom: 3rem`, hero-action gap `0.75rem`, hero-action top margin `1.5rem`.
- Disneyland ≤360 px: the same compact spacing values, while keeping the existing content-driven height and button/text sizes.
- Loire ≤480 px: minimum height reduced from 690 to 650 px and focal position changed from 60% to 62%.
- Normandy: mobile 66% retained; a stepped focal progression replaces the 40%→58% discontinuity; 769–1024 uses tablet spacing (`7rem`/`4rem`) to prevent the height jump.
- No source-selection, preload, overlay, H1 size, body-copy size or button-height rule changed.

## 3. Hero heights before/after

Values are CSS pixels. Columns: 320 · 390 · 430 · 768 · 1024 · 1280.

| Page | 320 | 390 | 430 | 768 | 1024 | 1280 |
|---|---:|---:|---:|---:|---:|---:|
| CDG → Paris | 700.7→700.7 | 650→650 | 650→650 | 630→630 | 627.1→627.1 | 657.2→657.2 |
| Orly → Paris | 700.7→700.7 | 650→650 | 650→650 | 630→630 | 627.1→627.1 | 657.2→657.2 |
| Beauvais → Paris | 700.7→700.7 | 650→650 | 650→650 | 630→630 | 627.1→627.1 | 657.2→657.2 |
| CDG → Disneyland | 771.7→737.3 | 714→714 | 690→690 | 660→660 | 638.7→638.7 | 670.1→670.1 |
| Orly → Disneyland | 742.9→708.5 | 690→690 | 690→690 | 660→660 | 638.7→638.7 | 670.1→670.1 |
| Beauvais → Disneyland | 775.5→741.1 | 690→690 | 690→690 | 660→660 | 638.7→638.7 | 748.4→748.4 |
| Paris → Disneyland | 742.9→708.5 | 690→690 | 690→690 | 660→660 | 638.7→638.7 | 670.1→670.1 |
| Normandy | 845→802.6 | 724.2→681.8 | 694.8→652.4 | 610→610 | 680.4→600.4 | 712.4→712.4 |
| Champagne | 783.7→741.3 | 670.5→660 | 660→660 | 610→610 | 645.4→645.4 | 677.4→677.4 |
| Loire Valley | 753→710.6 | 690→650 | 690→650 | 650→650 | 640.4→640.4 | 671.7→671.7 |

## 4–5. Focal positions and Normandy behavior

Airport → Paris positions remain 58%/62%/63% on mobile. Disneyland remains 62%. Champagne remains 62% → 58% → 54% → center. Loire mobile changes 60%→62%.

Normandy final CSS progression:

| Viewport/range | Before position | After position | Before height | After height |
|---|---:|---:|---:|---:|
| 320 | 66% | 66% | 845 | 802.6 |
| 390 | 66% | 66% | 724.2 | 681.8 |
| 430 | 66% | 66% | 694.8 | 652.4 |
| 481–599 (600 control shown next) | 40% | 62% | — | — |
| 600 | 40% | 58% | 628.7 | 628.7 |
| 700 | 40% | 54% | 610 | 610 |
| 768 | 40% | 54% | 610 | 610 |
| 769 | 58% | 54% | 693.2 | 613.2 |
| 820 | 58% | 56% | 658.2 | 590 |
| 900 | 58% | 58% | 664.9 | 590 |
| 1024 | 58% | 58% | 680.4 | 600.4 |
| 1025–1159 | center | 58% | — | — |
| 1160–1279 | center | 54% | — | — |
| 1280 | center | center | 712.4 | 712.4 |

The 768→769 transition is now 610→613.2 px with the same 54% focal position. The before/after continuity sheet confirms that the vehicle no longer makes the previous abrupt horizontal jump.

## 6. Champagne

The validated focal sequence is untouched: 62% mobile, 58% tablet, 54% from 769–1024, center on desktop. Spacing removes 42.4 px at 320 and 10.5 px at 390; 430 and wider retain their previous heights.

## 7. Loire Valley

Mobile is now 62%. At 390/430 the hero is 650 px instead of 690 px. The château remains identifiable on the left, the vehicle is more visible on the right, and the overlay continues to keep the text readable.

## 8. Disneyland

All four pages retain the shared 62% position through 768. Only ≤360 spacing changed. At 320 the reduction is 34.4 px on every page; the remaining height differences are caused by line wrapping/content length rather than page-specific CSS exceptions. H1, copy and buttons keep their original sizes.

## 9. Airport → Paris

No focal or spacing adjustment was necessary. CDG remains 58%, Orly 62%, Beauvais 63% on mobile; all measured heights are unchanged.

## 10. Phase 2B-1 sources

Phase 2B-1 HTML/preload/source code is unchanged by this phase. The three Long Distance backgrounds continue to request exactly one 1376 file. Airport/Disneyland continue to request one hero file with no double download.

Important validation finding: at exactly 769 px DPR 1, the seven `<img>` heroes select the 800 candidate because their Phase 2B-1 `sizes` rule switches back to `100vw` above 768. At 768 and 1024 they select 1376. This pre-existing edge case was not changed here because Phase 2B-2 explicitly forbids edits to `srcset`, `sizes` and preload. `network-769-validation.json` records the exact requests.

## 11–13. Integrity

- Phase 1 hashes for `contact.html`, `css/header-logo.css`, `js/contact.js`, `js/main.js`, `js/reservation.js` and `reservation.html` match the pre-Phase-2B-2 values.
- Home and the five hubs were not edited and none of the new selectors targets their hero systems.
- No HTML changed in Phase 2B-2; titles, descriptions, canonicals, schemas, FAQs, H1 wording, URLs and internal links are intact.
- No production image was added, cropped or regenerated. The new PNG files are audit screenshots only; no portrait variant exists.

## 14. Desktop 1280

All ten pages retain identical hero height, computed focal position, source, H1/description/CTA rectangles, header and trust-strip boundary at 1280. Nine before/after screenshots are bit-identical. Beauvais → Disneyland has only sub-pixel/animation-render timing variance (mean changed-channel delta 0.43/255, no geometry/style difference).

## 15. Responsive results

104 final browser checks cover 320, 360, 375, 390, 414, 430, 600/700 (Normandy), 768, 769, 820/900 (Normandy), 1024 and 1280.

- 0 horizontal overflows.
- 0 clipped H1s or descriptions.
- 0 hero-action blocks outside their hero.
- 0 abnormal gaps between hero and following section.
- Trust strips begin exactly at the hero boundary.
- No header regression observed.

Measurements are stored in `before-measurements.json` and `after-measurements.json`; captures and 22 comparison sheets are in `captures/`.

## 16–17. Tests and Git validation

- `node --test tests/seo.test.cjs`: **7/7 passed**
- `node --test tests/admin-mode.test.cjs tests/email-operation.test.cjs tests/manage-cancellation.test.cjs`: **29/29 passed**
- `node --test tests/*.test.cjs`: **36/36 passed**
- `git diff --check`: **passed**
- No commit, push or deployment was performed.

## 18. Remaining issue

The only confirmed technical issue is the 769 px source-selection edge case on the seven `<img>` heroes described above. It causes no double download, layout shift or clipping, but the selected 800 file is below the intended cover demand. It belongs to a future explicitly authorized source-selection correction, not to this layout phase.

## 19. Portrait variants

900×1400 portrait variants are now **optional, not required** for layout or DPR 1 presentation. The current landscape assets produce coherent crops after these corrections. Portrait variants could still improve Retina sharpness/data efficiency by avoiding horizontally discarded pixels, especially for tall Normandy/Disneyland heroes, but the visual result no longer depends on them.
