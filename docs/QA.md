# QA log
2026-09-18: strict TypeScript and production compilation completed; 8 pure logic tests passed (save validation, unavailable storage, narrative stage reconstruction, single unanswered finale, no-failure puzzle/crowd rules).

First mobile WebKit pass: all four mini-game controls responded. Scene traversal found stale hidden character texture after environment unloading; changed lifecycle to retain shared character textures. Inspected initial mobile screenshots; corrected banding in dialogue shade, replaced low-resolution key backgrounds, added progressive drawn intro.

Remaining validation is recorded here after each completed pass; this document is not a claim that the full final quality bar has been met. Physical iPhone/Android performance and phone-speaker audio mix cannot be certified by emulation.

Identity/art pass: integrated photo-based standing, seated and intermediate characters; updated the room, café, light, garden, clock, crowd, thought and final environments. Inspected WebKit mobile captures; corrected seating alignment, face visibility before the night reveal, crowd silhouettes and pixel sampling. Source photographs remain outside the project.

Regression: 8 logic tests and 4 browser tests passed. Browser tests now calculate input positions from the actual viewport (iPhone profile 390 × 664; Android 390 × 844), assert that choice interactions change response state, and verify sound context/playing state where Web Audio exists. Saved café checkpoint resumes; night silence ignores taps; final question remains after tapping.

Production: scripts/check-production.mjs serves dist under /novel-preview/ and checks both engines. No missing requests or page errors; scene query cannot skip the beginning; development API absent; no horizontal overflow. Chromium requests the score and its live development audio context reaches running. This Windows Playwright WebKit build exposes no AudioContext, so its sound result is unavailable, not a pass for real Safari audio.

Performance: headless WebKit at DPR 1 measured near 60 FPS; DPR 3 device emulation was around 20 FPS. Software Chromium measured around 30 FPS. These machine/emulator measurements do not establish real-device performance. Removed costly glow filter and runtime resolution changes; particles adapt to sustained slow frames.

Full normal playthrough completed in 903.68 seconds (15:04), from the start button to final_question, with no scene jumps or forced mini-game completion. All five interaction beats completed. No page errors or failed requests. Evidence: local art/qa/full/report.json, scene screenshots and a full WebM recording; captures are ignored by git and excluded from the build.

This run followed fixes for a negative response timer blocking later night/sort choices and WebKit canvas presentation disappearing after viewport resize. The drawing buffer now stays fixed; CSS sizing and inverse stage scaling preserve proportions and input coordinates. Resizing is checked with screenshot pixel variance and touch advancement, not only absence of exceptions. Night prompts were also moved above the answer controls.

Final local regression: strict TypeScript/build, 8 logic tests, and all 6 browser tests passed (3 each in WebKit and Chromium). The resize test waits for typewriter completion before advancing, avoiding a double-tap race that could skip the expected line. Normal full-run screenshots were reviewed across all 11 scenes.

Deployment: source pushed to private diefrompain1993/mari. GitHub Pages creation returned HTTP 422: “Your current plan does not support GitHub Pages for this repository.” No live site is claimed. Repository visibility remains private pending the user's hosting choice.

User then explicitly requested making the repository public. Visibility changed to PUBLIC and Pages configuration succeeded with HTTPS at https://diefrompain1993.github.io/mari/. Live deployment verification follows the workflow run.
