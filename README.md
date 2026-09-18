# Проявление
Personal mobile portrait visual novel, working title. Built for 390 × 844, with authored identity-based characters and an open in-person final question.

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e
```

Publish dist through the included GitHub Pages Actions workflow. In repository Settings → Pages, choose GitHub Actions. No server or environment keys are required. All asset paths support repository subdirectories. Source photographs must never be copied into public.

Development scene access: `?scene=silence_room` or `window.__VN_DEBUG__.goToScene('night_silence')`. Debug access is absent in production. See docs for narrative amendments, art direction, asset pipeline and verified QA status.
