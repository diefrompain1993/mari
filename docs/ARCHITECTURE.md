# Architecture
Vite + strict TypeScript, PixiJS v8 WebGL, GSAP timelines, Howler audio. All story text is typed data in src/content/story.ts. A scene contains semantic beats with character stage/camera/pause/audio/interaction cues. GameDirector reconstructs stage from scene plus preceding beats when resuming.

SceneManager owns environment/characters; Character performs authored-image reveals; CameraDirector handles framing; FXManager reduces particles after sustained slow frames. Dialogue and mini-games render in canvas. DOM is limited to loading, settings, fallback, and screen-reader announcements.

SaveManager validates version and narrative bounds. Interrupted mini-games restart at their beat. Settings/audio survive reload. Hidden pages pause narrative time, animation and audio. There are no relationship points or failure endings.

Art loads per scene and prefetches the next. Old environment textures unload; the shared character set stays alive because hidden characters and reveal animations retain references. Renderer DPR is fixed at a maximum of 1.5 at startup; changing resolution during playback caused empty WebKit frames and is deliberately avoided. Slow-frame adaptation reduces particles only. Debug entrypoints exist only when import.meta.env.DEV; production never exposes window.__VN_DEBUG__ or scene query shortcuts.

GitHub Pages: relative Vite base, no backend, no client secrets, static dist. Workflow builds/tests on main. Real-device FPS requires device testing; desktop emulation cannot establish hardware performance.

Viewport changes retain the original drawing buffer. CSS fits the canvas to the viewport and inverse stage scaling keeps visual proportions and pointer coordinates correct; this avoids a reproducible WebKit blank presentation after buffer resize. Landscape and hidden pages pause narrative playback, and returning from background does not unpause an open settings dialog.
