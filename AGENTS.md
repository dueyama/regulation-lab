# Repository Guidelines

## Purpose
This repository hosts a web-based experiment tool for self-organized proportion regulation. The app compares the paper's lattice/PCA model with a billiard-style particle model inspired by the legacy iOS SpriteKit prototype.

## Source Material
- Treat `papers/` and `old/` as local reference material only.
- Do not publish or commit the PDF paper or the legacy iOS project.
- Cite the paper in README and app UI using bibliographic metadata and DOI instead of embedding the PDF.

## Implementation Notes
- Keep user-facing documentation primarily in English.
- The app UI supports Japanese and English, with Japanese as the initial language.
- Keep simulation logic separate from React components.
- Preserve deterministic seed behavior when changing simulation code.

## Validation
- Run `npm test` for simulation rules and determinism.
- Run `npm run build` before handoff or deployment preparation.
- Do not push to GitHub or deploy to Vercel unless explicitly asked.
