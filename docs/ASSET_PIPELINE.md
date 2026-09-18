# Asset pipeline
Built-in imagegen creates authored masters. Identity references remain at user-supplied paths outside the repository and public folder. Selected generated assets live in art/masters; game-ready compressed art in public/assets/art. Sheet extraction, resize and WebP export use Sharp. These steps only package art, not redraw likenesses.

scripts/prepare-art.mjs records initial sheet extraction. scripts/update-art.mjs applies selected replacements. Manifest records ID, dimensions, loading class and estimated RGBA cost. Runtime paths use import.meta.env.BASE_URL. Pixel art is authored in its own style and uses nearest-neighbour sampling.

scripts/add-seated.mjs packages seated identities, including the partially revealed face for the room before night_silence. scripts/finish-environments.mjs applies the selected high-resolution environments and exports the authored 8/16-bit art with nearest-neighbour sampling. Export scripts reference the local generation archive; ordinary npm build uses committed public assets and does not require that archive or any photographs. The current manifest has 26 textures (about 62 MiB if all simultaneously decoded); chapter environment eviction keeps runtime residency below that maximum.

Score: scripts/create-audio.py renders original ambient cues and SFX, no borrowed melody. Stay is not downloaded. A supplied authorized file goes to public/assets/audio/stay-user-track.*; then set src/content/music.ts track and the jointly chosen scene. Current null configuration avoids broken requests and premature placement.

Do not package private photo references, keys, art masters or development QA captures into dist. Only public assets and compiled application are published.
