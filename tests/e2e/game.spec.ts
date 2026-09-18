import { test, expect } from "@playwright/test";
import sharp from 'sharp';
test("boot, touch, scenes, screenshots, save and quiet final", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  await page.goto("/");
  await expect(page.locator("#boot")).toBeHidden();
  const height = page.viewportSize()!.height;
  await page.touchscreen.tap(195, height * .67 + 24);
  await page.waitForTimeout(1000);
  await expect
    .poll(() => page.evaluate(() => window.__VN_DEBUG__?.dumpState().busy))
    .toBe(false);
  await expect.poll(() => page.evaluate(() => (window.__VN_DEBUG__!.dumpState().audio as {track:string}).track)).toBe('prologue');
  if (await page.evaluate(() => typeof AudioContext !== 'undefined')) {
    await expect.poll(() => page.evaluate(() => (window.__VN_DEBUG__!.dumpState().audio as {context:string}).context)).toBe('running');
    await expect.poll(() => page.evaluate(() => (window.__VN_DEBUG__!.dumpState().audio as {playing:boolean}).playing)).toBe(true);
  }
  const scenes = [
    "prologue_intro",
    "light_follow",
    "approach_fourteen_time",
    "silence_room",
    "noise_crowd",
    "noise_cafe",
    "resolution_8bit",
    "resolution_16bit",
    "finale_question",
  ];
  for (const id of scenes) {
    await page.evaluate((id) => window.__VN_DEBUG__!.goToScene(id), id);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `art/qa/${info.project.name}-${id}.png` });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.evaluate(() => window.__VN_DEBUG__!.goToScene("night_silence"));
  await page.touchscreen.tap(195, height - 110);
  expect(await page.evaluate(() => window.__VN_DEBUG__!.dumpState().beat)).toBe(
    "night_silence",
  );
  await page.evaluate(() => window.__VN_DEBUG__!.goToScene("noise_cafe"));
  await page.reload();
  await expect(page.locator("#boot")).toBeHidden();
  await page.touchscreen.tap(195, height * .67 + 24);
  await expect
    .poll(() => page.evaluate(() => window.__VN_DEBUG__?.dumpState().scene))
    .toBe("noise_cafe");
  await page.evaluate(() => window.__VN_DEBUG__!.goToScene("final_question"));
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => window.__VN_DEBUG__!.dumpState().beat)).toBe(
    "final_question",
  );
  await page.touchscreen.tap(195, height - 100);
  expect(await page.evaluate(() => window.__VN_DEBUG__!.dumpState().beat)).toBe(
    "final_question",
  );
  expect(errors).toEqual([]);
});
test('repeated choices finish, resizing keeps the scene visible and touch aligned', async ({page}, info) => {
  await page.goto('/');
  await expect(page.locator('#boot')).toBeHidden();
  for (const [beat,rounds] of [['night_conversation',3],['sort_memories',4]] as const) {
    await page.evaluate(id=>window.__VN_DEBUG__!.goToScene(id),beat);
    for(let round=0;round<rounds;round++) {
      const height=page.viewportSize()!.height;
      await expect(async () => {
        const before=await page.evaluate(()=>window.__VN_DEBUG__!.dumpState().minigame) as {round:number;responding:number}|null;
        if(!before || before.round>round || before.responding>0)return;
        await page.touchscreen.tap(195,height-(beat==='night_conversation'?159:200));
        const after=await page.evaluate(()=>window.__VN_DEBUG__!.dumpState().minigame) as {round:number;responding:number}|null;
        expect(!after || after.round>round || after.responding>0).toBe(true);
      }).toPass({timeout:5000,intervals:[300,500]});
      await expect.poll(()=>page.evaluate(()=>{
        const m=window.__VN_DEBUG__!.dumpState().minigame as {round:number}|null;
        return m?.round??99;
      }),{timeout:12000}).toBeGreaterThan(round);
    }
    expect(await page.evaluate(()=>window.__VN_DEBUG__!.dumpState().minigame)).toBeNull();
  }
  for(const height of [844,664,844]) {
    await page.setViewportSize({width:390,height});
    await page.evaluate(()=>window.__VN_DEBUG__!.goToScene('night_sound'));
    await page.waitForTimeout(1000);
    const pixels=await page.screenshot({path:`art/qa/${info.project.name}-resize-${height}.png`});
    const stats=await sharp(pixels).resize({width:195}).stats();
    expect(stats.channels[0].stdev).toBeGreaterThan(15);
    await expect.poll(()=>page.evaluate(()=>(window.__VN_DEBUG__!.dumpState().dialogue as {typing:boolean}).typing)).toBe(false);
    await page.touchscreen.tap(195,height-100);
    await expect.poll(()=>page.evaluate(()=>window.__VN_DEBUG__!.dumpState().beat)).toBe('night_what');
  }
});
test("all interaction controls respond to touch", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#boot")).toBeHidden();
  const height = page.viewportSize()!.height;
  await page.touchscreen.tap(195, height * .67 + 24);
  for (const id of [
    "follow_start",
    "fourteen_time",
    "night_conversation",
    "stay_close",
    "sort_memories",
  ]) {
    await page.evaluate((id) => window.__VN_DEBUG__!.goToScene(id), id);
    expect(
      await page.evaluate(() => window.__VN_DEBUG__!.dumpState().minigame),
    ).not.toBeNull();
    if (id === "fourteen_time") {
      for (let i = 0; i < 4; i++) await page.touchscreen.tap(195, 370);
      await expect
        .poll(() =>
          page.evaluate(() => window.__VN_DEBUG__!.dumpState().minigame),
        )
        .toBeNull();
    } else if (id === "night_conversation" || id === "sort_memories") {
      await page.touchscreen.tap(190, id === "night_conversation" ? height - 159 : height - 200);
      expect((
        (await page.evaluate(
          () => window.__VN_DEBUG__!.dumpState().minigame,
        )) as { responding: number }
      ).responding).toBeGreaterThan(0);
      await page.evaluate(() => window.__VN_DEBUG__!.completeMinigame());
    } else {
      await page.mouse.move(190, 600);
      await page.mouse.down();
      await page.waitForTimeout(1200);
      await page.mouse.up();
      const state = (await page.evaluate(
        () => window.__VN_DEBUG__!.dumpState().minigame,
      )) as { progress: number };
      expect(state.progress).toBeGreaterThan(0);
      await page.evaluate(() => window.__VN_DEBUG__!.completeMinigame());
    }
  }
});
