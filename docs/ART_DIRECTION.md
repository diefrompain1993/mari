# Art direction — fantasy revision
The user's illustrated moonlit reference supersedes the earlier realistic/editorial direction. Characters must be visibly drawn fantasy visual-novel figures: fine ink contours, stylized eyes and facial planes, painted color shapes, no photographic skin or realistic costume portraits.

Girl: pearl/ivory layered floor-length gown, lace-front fitted bodice, draped bell sleeves, small flower ornament, short feathery pale bob. Her whiteness belongs to the costume and progressive light reveal; the final face is legible. Hero: midnight navy long split-tail coat, high collar, silver lacing and embroidery, dark trousers and boots. No aura or luminous silhouette in his fully drawn form.

Environments use moonlit indigo, silver tracery, crescent motifs, imagined spires and flowing architectural lines. The previous rustic wrap tunic, modern short jacket, realistic faces and warm realistic interiors are rejected. Preserve narrative independence and emotional causality despite the more ornate fantasy design.

Selected masters: art/fantasy. Prompt set and provenance: art/fantasy-generation.json. Runtime assets: public/assets/art-v2, exported with scripts/prepare-fantasy.mjs. Original identity photographs stay outside the project. Pixel stages remain deliberate pixel art; the sparse authored opening sketch is retained.

Current progression amendment: hero/world stay sparse line art through early connection; first pixel reveal is new_detail. The entire middle, including seated scenes, is pixel art. Background/pose selection is centralized in src/content/visuals.ts. Only human_reveal unlocks full drawn art. New masters: art/progression; runtime: public/assets/art-v3. Pixel textures use nearest sampling, subdued square particles, and authored pixel environments. Final fantasy assets remain in art-v2.

Book reference revision: new dedicated line book and ink forest; pixel star hill, paper city, library; fully drawn final book. Five NPCs have authored raster sprites. Background overrides in scene data preserve each location while the protagonist develops. Portrait framing and dialogue safe area remain 390×844/664. Collection responses have a dark panel to avoid competing with sprites.

## Collectible and clock art refinement
Replaced UI discs, title chips and checkmarks with torn manuscript leaves and luminous stars. Serif titles have local shadows; soft pools of night separate objects from detailed backgrounds. Touch regions include titles (110 × 88). The clock now has a dark enamel face, Roman numerals, minute markings and independent hands; its placement and hit area follow portrait resizing. Characters are subdued during artifact interactions and restored on exit. Runtime art is drawn in Pixi Graphics as interface/world props, not character art.

Forest immersion refinement: collectible leaves are attached to five actual thread/branch coordinates in the 586 × 1266 background. World-to-screen conversion follows camera motion and portrait resizing. The forest uses top alignment so upper branches remain visible on compact screens. Selection opens a folded leaf in the center; its memory is typed below, with a first tap revealing remaining text and the next continuing. Reduced-motion preference skips the unfolding/sway. Selection view uses a shorter feathered shade instead of the large opaque panel.

Latest user refinement: forest leaves have no external emotion labels. The title appears only inside the opened sheet. Invisible touch areas remain 60 × 60.
