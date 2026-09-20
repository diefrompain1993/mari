# QA log
Fantasy art revision: replaced standing/seated identity art, gradual girl reveal stages, hero drawn/pixel stages and nine environments according to the user's illustrated reference. Kept the sparse authored opening and the existing intentional pixel environment. Updated seated facing, sprite spacing and reveal mask width for long coats and the white gown. Rejected realistic art is archived outside public. Publication remains paused: private repository and manually disabled Pages workflow.

2026-09-18: strict TypeScript and production compilation completed; 8 pure logic tests passed (save validation, unavailable storage, narrative stage reconstruction, single unanswered finale, no-failure puzzle/crowd rules).

First mobile WebKit pass: all four mini-game controls responded. Scene traversal found stale hidden character texture after environment unloading; changed lifecycle to retain shared character textures. Inspected initial mobile screenshots; corrected banding in dialogue shade, replaced low-resolution key backgrounds, added progressive drawn intro.

Remaining validation is recorded here after each completed pass; this document is not a claim that the full final quality bar has been met. Physical iPhone/Android performance and phone-speaker audio mix cannot be certified by emulation.

Identity/art pass: integrated photo-based standing, seated and intermediate characters; updated the room, cafГ©, light, garden, clock, crowd, thought and final environments. Inspected WebKit mobile captures; corrected seating alignment, face visibility before the night reveal, crowd silhouettes and pixel sampling. Source photographs remain outside the project.

Regression: 8 logic tests and 4 browser tests passed. Browser tests now calculate input positions from the actual viewport (iPhone profile 390 Г— 664; Android 390 Г— 844), assert that choice interactions change response state, and verify sound context/playing state where Web Audio exists. Saved cafГ© checkpoint resumes; night silence ignores taps; final question remains after tapping.

Production: scripts/check-production.mjs serves dist under /novel-preview/ and checks both engines. No missing requests or page errors; scene query cannot skip the beginning; development API absent; no horizontal overflow. Chromium requests the score and its live development audio context reaches running. This Windows Playwright WebKit build exposes no AudioContext, so its sound result is unavailable, not a pass for real Safari audio.

Performance: headless WebKit at DPR 1 measured near 60 FPS; DPR 3 device emulation was around 20 FPS. Software Chromium measured around 30 FPS. These machine/emulator measurements do not establish real-device performance. Removed costly glow filter and runtime resolution changes; particles adapt to sustained slow frames.

Full normal playthrough completed in 903.68 seconds (15:04), from the start button to final_question, with no scene jumps or forced mini-game completion. All five interaction beats completed. No page errors or failed requests. Evidence: local art/qa/full/report.json, scene screenshots and a full WebM recording; captures are ignored by git and excluded from the build.

This run followed fixes for a negative response timer blocking later night/sort choices and WebKit canvas presentation disappearing after viewport resize. The drawing buffer now stays fixed; CSS sizing and inverse stage scaling preserve proportions and input coordinates. Resizing is checked with screenshot pixel variance and touch advancement, not only absence of exceptions. Night prompts were also moved above the answer controls.

Final local regression: strict TypeScript/build, 8 logic tests, and all 6 browser tests passed (3 each in WebKit and Chromium). The resize test waits for typewriter completion before advancing, avoiding a double-tap race that could skip the expected line. Normal full-run screenshots were reviewed across all 11 scenes.

Deployment: source pushed to private diefrompain1993/mari. GitHub Pages creation returned HTTP 422: вЂњYour current plan does not support GitHub Pages for this repository.вЂќ No live site is claimed. Repository visibility remains private pending the user's hosting choice.

User then explicitly requested making the repository public. Visibility changed to PUBLIC and Pages configuration succeeded with HTTPS at https://diefrompain1993.github.io/mari/. Live deployment verification follows the workflow run.

Live check succeeded in WebKit and Chromium: HTTP 200, story starts, saved text resumes after reload, debug API absent, no page/request errors; all 26 manifest images return 200. Workflow 35326890651 completed successfully. Final responsive polish anchors the dialogue shade to the current viewport bottom after resize; the canvas and touch regression remains covered.

Fantasy revision final verification (2026-09-18, after user resumed): 8 logic tests, strict TypeScript/production build, and all 6 mobile browser tests passed (3 WebKit, 3 Chromium; 3.5 minutes). Separate scene capture completed 8 frames with no page errors or failed requests. Inspected final gown framing after x272 adjustment and seated alignment. Current preview: art/fantasy/game-preview.png. The historical 15:04 normal playthrough above predates this art replacement.

Hosting remains paused: repository PRIVATE, Pages deleted, pages.yml disabled_manually. Privacy and disabled workflow were rechecked on this resumed pass. No public deployment was performed.

## September 20: book story and technical polish
The new book narrative contains 188 beats across 14 scenes. The ordinary-touch run reached the unanswered ending without errors in 314.8 seconds with accelerated text only (not a normal reading-time estimate). A previous complete regression passed all six book browser checks and nine unit tests.

Current polish: long stereo score (eight tracks, 192 seconds each, four sections); high-contrast collectible discs and title chips; settings bookmark with persisted live controls; interrupted character reveal cleanup, tile assembly and centered drawn reveal; book-leaf transitions. Final question is В«РЎС‚Р°РЅРµС€СЊ Р»Рё С‚С‹ РјРѕРµР№ РґРµРІСѓС€РєРѕР№?В».

Production subpath /novel-preview/ checked in WebKit and Chromium: no load/runtime errors, debug absent, scene zero preserved. Chromium requests the new MP3. This WebKit production environment has no AudioContext; separate browser tests cover its media fallback duration. Visual captures: art/qa/polish-mobile-*.png. No public deployment.

Final regression: all 8 browser checks passed (4 WebKit, 4 Chromium; 5.8 minutes), 9 unit tests passed, build passed. Inspected current settings and target screenshots in both engines. Decoded all eight MP3s: 192.0 seconds each, no clipping, boundary step below ordinary sample-step peaks.

Latest refinement verified: branch-attached forest leaves with no external labels, unfolding sheet and progressive text; enamel clock and responsive hit area. Production build passed. Four focused mobile checks passed (WebKit + Chromium, clock/forest, 1.2 minutes), including 664/844 resizing and direct touches. Inspected both engines' forest screenshots. The broader interaction suite passed WebKit; its Chromium run exceeded the prior global 120s timeout near the last interaction, then was interrupted by user-requested edits. Its global budget is now 240s while individual interaction limits remain unchanged; do not report that broader rerun as passed.
