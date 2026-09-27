# Phase 2B-1 — Hero source-selection audit

Date: 2026-09-27  
Scope: image-source quality only for the 10 detailed service landing pages  
Browser validation: Chromium/Chrome, 120 combinations (10 pages × 6 widths × DPR 1/2)

## 1. Production files changed

- `cdg-to-paris.html`
- `orly-to-paris.html`
- `beauvais-to-paris.html`
- `cdg-to-disneyland.html`
- `orly-to-disneyland.html`
- `beauvais-to-disneyland.html`
- `paris-to-disneyland.html`
- `paris-to-normandy.html`
- `paris-to-champagne.html`
- `paris-to-loire-valley.html`
- `css/style.css`

Audit outputs were added under `docs/audits/hero-phase-2b-1/`. The Phase 1 changes and the entire Phase 2A audit were preserved.

## 2. Source logic before

- Airport → Paris: `sizes="100vw"` selected 480 px at 320–430, 800 px at 768, and 1376 px on desktop. Only CDG had a responsive preload.
- Disneyland: `sizes="100vw"` selected 480 px at 320–430, 800 px at 768, and 1376 px on desktop. All four pages had responsive preloads using the same underspecified size.
- Long Distance: CSS painted the 800 px background through 1024 px while a responsive preload could select a different candidate.

## 3. Source logic after

- Airport → Paris: the existing 480/800/1376 `srcset` is retained. Both `<img sizes>` and responsive preload use `(max-width: 480px) 1256px, (max-width: 768px) 1130px, 100vw`.
- Disneyland: the existing `srcset` is retained. `<img sizes>` and preload use `(max-width: 480px) 1390px, (max-width: 768px) 1184px, 100vw` on all four pages.
- Long Distance: CSS and preload both point to the existing 1376 px file at every audited breakpoint.

This does select 1376 px throughout the audited detailed heroes, but it is not an arbitrary force-load: the smallest DPR 1 cover demand observed is about 1093 px and most mobile demands are 1165–1514 px. The only smaller available candidate is 800 px, which is insufficient. No new asset was created.

## 4–7. Browser-selected source matrix

Every cell below is the actual painted source width observed in Chrome. The preload selected the same file in every case.

| Page | 320@1 | 390@1 | 430@1 | 390@2 | 430@2 | 768@1 | 1024@1 | 1280@1 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| CDG → Paris | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 |
| Orly → Paris | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 |
| Beauvais → Paris | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 |
| CDG → Disneyland | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 |
| Orly → Disneyland | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 |
| Beauvais → Disneyland | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 |
| Paris → Disneyland | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 |
| Normandy | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 |
| Champagne | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 |
| Loire Valley | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 | 1376 |

Intrinsic dimensions are **1376×768** throughout. The complete machine-readable 120-row result, including hero rectangles, current source, computed CSS background, preload and network requests, is in `source-validation.json`.

### Compact dimensions/cover matrix (DPR 1)

Each cell is `hero CSS box → rendered cover footprint · source scale`. A scale below 1 means the 1376×768 source is downscaled; above 1 means slight enlargement.

| Page | 390 | 430 | 768 | 1280 |
|---|---|---|---|---|
| CDG/Orly/Beauvais → Paris | 390×650 → 1165×650 · 0.85× | 430×650 → 1165×650 · 0.85× | 768×630 → 1129×630 · 0.82× | 1280×657 → 1280×714 · 0.93× |
| CDG → Disneyland | 390×714 → 1279×714 · 0.93× | 430×690 → 1236×690 · 0.90× | 768×660 → 1183×660 · 0.86× | 1280×670 → 1280×714 · 0.93× |
| Orly/Paris → Disneyland | 390×690 → 1236×690 · 0.90× | 430×690 → 1236×690 · 0.90× | 768×660 → 1183×660 · 0.86× | 1280×670 → 1280×714 · 0.93× |
| Beauvais → Disneyland | 390×690 → 1236×690 · 0.90× | 430×690 → 1236×690 · 0.90× | 768×660 → 1183×660 · 0.86× | 1280×748 → 1341×748 · 0.97× |
| Normandy | 390×724 → 1298×724 · 0.94× | 430×695 → 1245×695 · 0.90× | 768×610 → 1093×610 · 0.79× | 1280×712 → 1280×714 · 0.93× |
| Champagne | 390×671 → 1201×671 · 0.87× | 430×660 → 1183×660 · 0.86× | 768×610 → 1093×610 · 0.79× | 1280×677 → 1280×714 · 0.93× |
| Loire Valley | 390×690 → 1236×690 · 0.90× | 430×690 → 1236×690 · 0.90× | 768×650 → 1165×650 · 0.85× | 1280×672 → 1280×714 · 0.93× |

At DPR 2, the same 1376 file is the largest available candidate. The effective source enlargement at 390/430 is approximately 1.69× for Airport → Paris, 1.80–1.86× for Disneyland, and 1.72–1.89× for Long Distance. Therefore the result is materially better than 480/800, but not pixel-perfect Retina coverage.

## 8–9. Preload and network validation

- Orly → Paris and Beauvais → Paris now have the same responsive high-priority preload strategy as CDG.
- Airport and Disneyland preload `imagesrcset`/`imagesizes` exactly match their hero `<img>` selection logic.
- Long Distance preloads the exact fixed 1376 resource painted by CSS.
- Heroes remain eager/high-priority LCP candidates; no lazy loading was added.
- Result across 120 cold-cache checks: **one unique hero image request per page/configuration, zero double downloads**.

## 10–14. Visual and geometry validation

- The 390/430 before/after sheets show a clear source-resolution improvement, especially in vehicle edges and landscape detail.
- Hero geometry, H1 position, CTA position and following-section boundary match Phase 2A.
- No `background-position`, `object-position`, `background-size`, `object-fit`, height, minimum height, padding, overlay, copy or CTA rule was changed.
- Normandy’s existing 768→769 position jump remains intentionally untouched for Phase 2B-2.
- Desktop at 1280 still paints the same 1376 source with unchanged geometry, crop, text and CTA placement.

After captures exist for all 10 pages at 390, 430, 768 and 1280. Family comparison sheets exist for 390 and 430.

## 15. Tests

- `node --test tests/seo.test.cjs`: **7/7 passed**
- `node --test tests/admin-mode.test.cjs tests/email-operation.test.cjs tests/manage-cancellation.test.cjs`: **29/29 passed**
- `node --test tests/*.test.cjs`: **36/36 passed**

## 16. Git validation

- `git diff --check`: passed with no whitespace errors.
- No commit, push or deployment was performed.

## 17. Remaining limits

- 1376 px is the largest existing landscape source and cannot fully satisfy the physical-pixel demand of tall DPR 2 mobile heroes.
- Normandy at 320 DPR 1 has a cover demand of about 1514 px, so even 1376 requires a slight ~1.10× enlargement.
- Perfect Retina sharpness would require larger or purpose-made assets, but new/portrait variants are explicitly outside this phase.
- Framing and height refinements remain deferred to Phase 2B-2.
