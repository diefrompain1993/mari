# Проявление
Personal mobile portrait visual novel, working title. Built for 390 × 844, with authored identity-based characters and an open in-person final question.

Publication is paused at the user's request: repository private, GitHub Pages deleted, publication workflow disabled. Do not re-enable publication without a new request. Local preview works through npm run dev on a phone in portrait orientation.

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e
```

Publish dist through the included GitHub Pages Actions workflow. In repository Settings → Pages, choose GitHub Actions. No server or environment keys are required. All asset paths support repository subdirectories. Source photographs must never be copied into public.

Development scene access: `?scene=night_pages` or `window.__VN_DEBUG__.goToScene('night_silence')`. Debug access is absent in production. See docs for narrative amendments, art direction, asset pipeline and verified QA status.

Current revision follows the original book reference: blank last page, forest fragments, constellation, paper city, Archive and late personal reveal. Whole-world line → pixel → drawn progression and short tap interactions remain. Read docs/SCENARIO.md for dialogue. Browser tests use port 5187 with strict port binding; manual preview uses 5188. Regenerate the readable script with node scripts/export-scenario.mjs.
