import sharp from "sharp";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
const source =
  "C:/Users/aleks/.codex/generated_images/01a0b116-6b79-71e2-9315-31760c0e16b1/";
await mkdir("public/assets/art", { recursive: true });
await mkdir("art/masters", { recursive: true });
const files = {
  environments: "exec-3562cbfb-803a-47ac-b91c-a89e62914b9c.png",
  hero: "exec-405a371e-ec70-4aba-8ae1-a9d88aeee64e.png",
  girl: "exec-63bb3895-77d3-4cdf-8842-3fed5fb89964.png",
  heroStages: "exec-7f68e88a-7816-48dd-b376-959356d26949.png",
  girlStages: "exec-62a3505d-1253-4b59-85a8-353124e5bc92.png",
  pixel: "exec-bb1df8cb-fb0c-48b2-97ae-30ff6771133a.png",
};
for (const [id, f] of Object.entries(files))
  await copyFile(source + f, `art/masters/${id}.png`);
const manifest = [];
async function output(id, pipeline, chapter = "shared", pixel = false) {
  const filename = id + ".webp";
  await pipeline
    .webp({ quality: 91, lossless: pixel, effort: 6 })
    .toFile("public/assets/art/" + filename);
  const m = await sharp("public/assets/art/" + filename).metadata();
  manifest.push({
    id,
    url: "assets/art/" + filename,
    chapter,
    type: "texture",
    priority: chapter === "prologue" ? "critical" : "chapter-current",
    width: m.width,
    height: m.height,
    memoryBytes: m.width * m.height * 4,
    fallback: null,
  });
}
const envs = [
  "prologue",
  "light",
  "garden",
  "clock",
  "room",
  "crowd",
  "cafe",
  "thought",
  "finale",
];
const meta = await sharp(source + files.environments).metadata();
for (let i = 0; i < 9; i++) {
  const x = Math.round(((i % 3) * meta.width) / 3),
    y = Math.round((Math.floor(i / 3) * meta.height) / 3);
  const right = Math.round((((i % 3) + 1) * meta.width) / 3),
    bottom = Math.round(((Math.floor(i / 3) + 1) * meta.height) / 3);
  await output(
    "env-" + envs[i],
    sharp(source + files.environments).extract({
      left: x,
      top: y,
      width: right - x,
      height: bottom - y,
    }),
    envs[i],
  );
}
await output(
  "env-pixel",
  sharp(source + files.pixel).resize(390, 844, { kernel: "nearest" }),
  "resolution",
  true,
);
for (const [kind, count, file] of [
  ["hero", 5, files.heroStages],
  ["girl", 6, files.girlStages],
]) {
  const m = await sharp(source + file).metadata();
  for (let i = 0; i < count; i++) {
    const x = Math.round((i * m.width) / count),
      right = Math.round(((i + 1) * m.width) / count);
    await output(
      kind + "-" + (i + 1),
      sharp(source + file)
        .extract({ left: x, top: 0, width: right - x, height: m.height })
        .resize({ height: 760 }),
      "shared",
      kind === "hero" && i >= 3,
    );
  }
}
await output("hero-6", sharp(source + files.hero).resize({ height: 1000 }));
await output("girl-7", sharp(source + files.girl).resize({ height: 1000 }));
await writeFile(
  "src/content/asset-manifest.json",
  JSON.stringify(manifest, null, 2),
);
console.log("Prepared", manifest.length, "game textures");
