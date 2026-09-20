# Asset pipeline
Current authority is the drawn-fantasy revision: art/fantasy-generation.json and scripts/prepare-fantasy.mjs. Selected generated PNG masters are copied to art/fantasy, then exported to public/assets/art-v2. The exporter preserves generated alpha; the generated image preview can display RGB haze stored under fully transparent pixels, so inspect the composited game rather than mistaking hidden RGB for a halo. Older export scripts below are historical and must not overwrite the current manifest.

Rejected realistic runtime images were copied into art/archive-realism/runtime and removed from public after confirming the manifest references only art-v2. The old masters remain historical; they are not used by the current game. GitHub publication remains disabled.

Built-in imagegen creates authored masters. Identity references remain at user-supplied paths outside the repository and public folder. Selected generated assets live in art/masters; game-ready compressed art in public/assets/art. Sheet extraction, resize and WebP export use Sharp. These steps only package art, not redraw likenesses.

scripts/prepare-art.mjs records initial sheet extraction. scripts/update-art.mjs applies selected replacements. Manifest records ID, dimensions, loading class and estimated RGBA cost. Runtime paths use import.meta.env.BASE_URL. Pixel art is authored in its own style and uses nearest-neighbour sampling.

scripts/add-seated.mjs packages seated identities, including the partially revealed face for the room before night_silence. scripts/finish-environments.mjs applies the selected high-resolution environments and exports the authored 8/16-bit art with nearest-neighbour sampling. Export scripts reference the local generation archive; ordinary npm build uses committed public assets and does not require that archive or any photographs. The current manifest has 26 textures (about 62 MiB if all simultaneously decoded); chapter environment eviction keeps runtime residency below that maximum.

Score: scripts/create-audio.py renders original ambient cues and SFX, no borrowed melody. Stay is not downloaded. A supplied authorized file goes to public/assets/audio/stay-user-track.*; then set src/content/music.ts track and the jointly chosen scene. Current null configuration avoids broken requests and premature placement.

Do not package private photo references, keys, art masters or development QA captures into dist. Only public assets and compiled application are published.

Latest progression export: scripts/prepare-progression.mjs. It copies selected built-in ImageGen outputs from their provenance paths into art/progression and packages authored alpha sprites/pixel environments into art-v3. After this revision do not run prepare-fantasy alone: it restores older mappings. New background/character routing is in src/content/visuals.ts. Original user photographs are still excluded.

Book export: node scripts/prepare-book.mjs. Sources are copied into art/book; prompt/provenance is art/book-generation.json. Runtime textures live in public/assets/book. Character sheets are cropped by equal cells, trimmed by alpha and exported at intentional pixel resolution where appropriate. No photo originals or generated masters are served as public assets.

## Technical polish вЂ” September 20
- Original stereo score: `scripts/create-score.py`, eight MP3 tracks of 192 seconds each, four arrangement sections, circular note/reverb tails. Dependencies: numpy, imageio-ffmpeg. Runtime uses MP3; `create-audio.py` now renders ambience and SFX only.
- Collectibles now use opaque navy discs, ivory rings, dark title chips and collected checkmarks.
- Settings are a scrollable bookmark panel with live values and retained preferences.
- Pixel raster reveals assemble in tiles; drawn raster reveals unfold from the center. Interrupted reveals settle before replacement. Book-leaf transitions use the paused animation timeline.
- Final wording: В«РЎС‚Р°РЅРµС€СЊ Р»Рё С‚С‹ РјРѕРµР№ РґРµРІСѓС€РєРѕР№?В».
