# MASTER TECHNICAL SPECIFICATION

Ты работаешь как lead game engineer, frontend graphics engineer, technical artist, motion designer и QA-инженер одного проекта.

Нужно не написать демонстрацию и не собрать красивый лендинг.

Нужно **создать законченную мобильную визуальную веб-новеллу уровня небольшого polished indie-game**, которая запускается по ссылке в браузере телефона и воспринимается именно как игра.

Используй сюжетное ТЗ, переданное пользователем отдельно, как источник истины для истории, последовательности глав, диалогов, мини-игр и эмоциональной драматургии.

---

# 0. МОДЕЛЬ РАБОТЫ

Работай автономно.

Не останавливайся после первого рабочего прототипа.

Не возвращай результат пользователю со словами «основа готова, дальше можно добавить...», если эти вещи входят в данное ТЗ.

Доведи каждую фазу до её Definition of Done.

Самостоятельно принимай обычные инженерные решения, если они не меняют сюжет, смысл отношений или финальный вопрос.

Если несколько технических вариантов дают одинаковый результат, выбери тот, который:

1. лучше работает на мобильном устройстве;
2. даёт более стабильные 60 FPS;
3. проще поддерживается;
4. обеспечивает более качественную картинку;
5. меньше зависит от нестабильных browser APIs.

Не спрашивай пользователя о второстепенных технических решениях.

Единственная обязательная пауза предусмотрена после Phase A: тогда необходимо запросить фотографии двух персонажей.

---

# 1. ГЛАВНАЯ PRODUCT-ЦЕЛЬ

Игрок должен забыть, что находится на обычной веб-странице.

После загрузки должно возникать ощущение:

«Я запустил небольшую авторскую игру.»

Необходимо избежать любого впечатления:

* лендинга;
* React demo;
* портфолио;
* Webflow-анимации;
* slideshow;
* PowerPoint;
* сайта с текстом поверх картинок;
* AI-generated prototype;
* набора случайных нейросетевых изображений.

Визуальная новелла должна иметь:

* единое художественное направление;
* полноценное интро;
* loading sequence;
* главы;
* сценический режиссёр;
* персонажей;
* живое окружение;
* камеры;
* частицы;
* lighting;
* звуковое пространство;
* эмоциональные паузы;
* интерактивность;
* четыре сюжетных мини-игры;
* сохранение прогресса;
* плавные переходы;
* сильный финал.

Целевая продолжительность прохождения:

**15–25 минут.**

---

# 2. ЦЕЛЕВАЯ ПЛАТФОРМА

Проект разрабатывается **только под смартфон в портретной ориентации**.

Desktop-first запрещён.

Не трать время на полноценную desktop-версию.

Основной диапазон viewport:

* ширина: примерно 360–430 CSS px;
* высота: примерно 740–940 CSS px;
* aspect ratio ориентирован на современные iPhone и Android.

Основной reference viewport:

**390 × 844.**

Обязательно учитывать:

* `env(safe-area-inset-top)`;
* `env(safe-area-inset-bottom)`;
* Dynamic Island / notch;
* Safari bottom toolbar;
* Android Chrome;
* viewport resize;
* touch input;
* DPR 2–3.

В landscape показывать красивый затемнённый экран:

«Эту историю лучше смотреть вертикально.»

На desktop разрешается показать только минимальный экран:

«Открой эту историю на телефоне.»

Полноценную desktop-композицию не создавать.

---

# 3. ТЕХНОЛОГИЧЕСКАЯ АРХИТЕКТУРА

Предпочтительный baseline:

* TypeScript;
* Vite;
* PixiJS v8;
* production renderer: WebGL/WebGL2;
* GSAP >= 3.13;
* Howler.js;
* pixi-filters v6, только там, где эффект действительно нужен;
* Vitest для чистой игровой логики;
* Playwright для мобильного end-to-end тестирования.

Если после анализа проекта ты считаешь небольшое изменение архитектуры объективно лучше, можешь его сделать, но сохрани перечисленные цели.

Не используй тяжёлый полноценный game engine только ради narrative flow.

Не используй Three.js для обычной 2D visual novel без реальной необходимости.

Не используй WebGPU как единственный renderer.

---

# 4. РАЗДЕЛЕНИЕ СИСТЕМ

Не складывай игру в один огромный `App.tsx`, `main.ts` или один HTML-файл.

Сделай нормальную архитектуру.

Примерное разделение ответственности:

```text
src/
  app/
  engine/
    GameDirector
    SceneManager
    TransitionDirector
    AssetManager
    AudioManager
    DialogueSystem
    SaveManager
    InputManager
    CameraDirector
    FXManager

  scenes/
    prologue/
    light/
    approach/
    silence/
    noise/
    resolution/
    finale/

  minigames/
    follow-the-light/
    fourteen-time/
    night-conversation/
    stay-close/

  content/
    story/
    dialogue/
    chapters/

  characters/
    hero/
    girl/

  fx/
  shaders/
  ui/
  debug/
  assets/
```

Точная структура может отличаться, если есть техническая причина.

Narrative content необходимо отделить от rendering logic.

Диалоги, сцены, реплики, переходы и cue должны храниться как типизированные данные, а не быть хаотично захардкожены в компонентах.

---

# 5. GAME DIRECTOR

Создай центральный `GameDirector`.

Он должен знать:

* текущую главу;
* текущую сцену;
* текущий narrative beat;
* этап визуальной эволюции героя;
* этап визуальной эволюции девушки;
* активный soundtrack;
* состояние мини-игры;
* возможность пропустить/продолжить реплику;
* checkpoint;
* сохранённый прогресс.

Игра должна быть детерминированной.

После reload игрок продолжает с разумного checkpoint.

---

# 6. ВИЗУАЛЬНЫЙ RENDERING

Основная игровая композиция должна находиться в PixiJS canvas.

DOM использовать только там, где он объективно удобнее:

* loading screen;
* settings;
* accessibility controls;
* fallback messages.

Не делать персонажей и мир набором `<div>`.

Не делать человека-палочку через CSS borders.

Не делать девушку белым CSS-овалом.

Не делать персонажей SVG-примитивами ради экономии времени.

---

# 7. ПЕРСОНАЖИ — ОБЯЗАТЕЛЬНО ИЗ АРТ-АССЕТОВ

Все основные визуальные стадии персонажей должны использовать **нормально созданные художественные изображения**.

## Hero

Необходимы стадии:

```text
hero_01_stick
hero_02_detailed_stick
hero_03_forming
hero_04_8bit
hero_05_16bit
hero_06_final
```

Это должны быть художественно связанные версии одного персонажа.

Stickman должен выглядеть намеренно минималистичным, но профессионально разработанным.

Не использовать стандартные circle + lines.

Он должен иметь:

* характер линий;
* хорошие пропорции;
* выразительную позу;
* читаемый силуэт;
* собственную визуальную идентичность.

---

# 8. GIRL CHARACTER

Необходимы стадии:

```text
girl_01_light
girl_02_silhouette
girl_03_hands_motion
girl_04_hair_profile
girl_05_face_partial
girl_06_eyes_face
girl_07_human
```

Первая версия — не пустой белый blob.

Это должна быть профессионально сгенерированная художественная фигура:

* мягкая человеческая анатомия;
* красивый силуэт;
* рассеянное внутреннее свечение;
* лёгкая volumetric aura;
* читаемое положение головы;
* естественные движения;
* ощущение человеческого присутствия.

Лицо в начале не должно быть доступно.

---

# 9. ПРИНЦИП ТРАНСФОРМАЦИИ ДЕВУШКИ

Нельзя просто менять:

```css
opacity: 0 -> 1
```

и считать это трансформацией.

Нужна полноценная художественная reveal-system.

Используй комбинацию:

* luminance masks;
* animated noise masks;
* displacement;
* bloom;
* soft dissolve;
* particle shedding;
* edge glow;
* cross-dissolve согласованных арт-стадий.

Когда проявляется новая черта, должно ощущаться, будто человеческая форма **проявляется внутри света**.

Белая аура остаётся частью финального персонажа, но становится намного тоньше.

---

# 10. ТРАНСФОРМАЦИЯ HERO

Hero transformation не должна выглядеть как смена PNG.

Создай staged morph language.

Например:

stick drawing
→ дополнительные штрихи
→ линии начинают дробиться
→ превращаются в квадратные частицы
→ частицы формируют 8-bit sprite
→ pixel density увеличивается
→ 16-bit
→ отдельные пиксели начинают становиться мазками/частицами
→ появляется полноценная иллюстрация.

Позиции тела между ключевыми assets должны быть композиционно согласованы.

---

# 11. PIXEL-ART СТАДИЯ

НЕ брать красивую иллюстрацию и просто применять `PixelateFilter`.

Это будет выглядеть дёшево.

Создай настоящие:

* 8-bit hero asset;
* 16-bit hero asset;
* соответствующие environment assets;
* UI assets;
* particles;
* sprite animation.

`PixelateFilter` можно использовать только в переходе между эстетиками.

Сама pixel-глава должна использовать настоящий pixel-art.

Pixel-art должен быть clean:

* intentional clusters;
* ограниченная палитра;
* readable silhouette;
* consistent pixel grid;
* nearest-neighbour scaling;
* никакого размытия.

---

# 12. ФОТОГРАФИИ И ИДЕНТИЧНОСТЬ ПЕРСОНАЖЕЙ

Проект состоит из двух production phases.

## PHASE A

Сначала полностью реализуй:

* архитектуру;
* главы;
* окружение;
* narrative flow;
* четыре мини-игры;
* audio system;
* camera system;
* transitions;
* dialogue system;
* save system;
* debug scenes;
* mobile controls;
* loading;
* основную визуальную режиссуру.

Для ранних стадий можно уже создать финальный по качеству:

* stickman;
* luminous girl.

Для поздних узнаваемых стадий временно используй **качественные нейтральные provisional assets**, которые будут заменены.

Они не должны выглядеть как серые прямоугольники.

---

# 13. ОБЯЗАТЕЛЬНЫЙ PHOTO CHECKPOINT

Когда Phase A:

* полностью запускается;
* все главы проходимы;
* все четыре мини-игры работают;
* переходы существуют;
* мобильное управление проверено;
* приложение протестировано в mobile WebKit;

остановись.

НЕ генерируй окончательные лица.

Напиши пользователю примерно:

«Основная игровая система и сцены готовы. Для финальной character-art стадии теперь нужны фотографии обоих персонажей. Пришли несколько фотографий каждого: лицо прямо, 3/4, профиль и, если возможно, полный рост. Одежду с фотографий я использовать не буду — фотографии нужны только для внешности и узнаваемых черт.»

После получения фотографий продолжай Phase B.

Это обязательная точка взаимодействия.

---

# 14. ЧТО БРАТЬ ИЗ ФОТОГРАФИЙ

Фотографии являются **identity reference**, а не costume reference.

Изображения нужны для:

* формы лица;
* глаз;
* бровей;
* носа;
* губ;
* волос;
* общей геометрии лица;
* телосложения в общих чертах;
* узнаваемого типажа.

ЗАПРЕЩЕНО копировать:

* футболки;
* худи;
* куртки;
* платья;
* украшения;
* реальные интерьеры;
* реальные фоны;
* бренды;
* логотипы;
* предметы из фотографии.

Персонажи существуют в отдельном художественном мире.

Одежду придумай заново.

Она должна принадлежать миру игры.

---

# 15. CHARACTER BIBLE ПОСЛЕ ФОТОГРАФИЙ

После получения фотографий сначала создай внутреннюю character bible.

Для каждого персонажа зафиксируй:

* shape language;
* proportions;
* facial landmarks;
* hairstyle;
* facial expression range;
* silhouette;
* visual personality;
* color accents.

Это внутренний production-документ.

Потом используй одну character bible для ВСЕХ стадий.

Нельзя генерировать каждую сцену как независимого человека.

Узнаваемость должна сохраняться.

---

# 16. ПРАВИЛЬНЫЙ ПОРЯДОК CHARACTER ART

Лучше сначала определить **финального персонажа**, а потом вывести из него предыдущие стадии.

Для hero:

```text
photo references
↓
final illustrated hero
↓
16-bit interpretation
↓
8-bit interpretation
↓
simplified forming version
↓
detailed stick version
↓
stickman
```

Для девушки:

```text
photo references
↓
final illustrated girl
↓
partial face
↓
eyes/face stage
↓
hair/profile
↓
body/hands silhouette
↓
light silhouette
```

Так визуальная идентичность будет намного стабильнее.

---

# 17. IMAGE GENERATION

Используй доступную в Codex image-generation capability для разработки character art и concept art.

Не довольствуйся первым результатом.

Для каждого важного asset:

1. сгенерируй;
2. визуально проверь;
3. сравни с character bible;
4. проверь анатомию;
5. проверь руки;
6. проверь лицо;
7. проверь style consistency;
8. при необходимости перегенерируй.

Явные AI artifacts запрещены:

* лишние пальцы;
* неправильные глаза;
* расплывающиеся аксессуары;
* бессмысленная одежда;
* случайный текст;
* сломанная перспектива;
* меняющееся лицо;
* разные причёски между сценами без причины.

Никакого текста внутри generated background images.

Весь текст рендерить отдельно.

---

# 18. ORIGINAL ART DIRECTION

Не копируй стиль конкретного существующего художника.

Не копируй конкретную визуальную новеллу.

Создай оригинальное направление:

**cinematic illustrated narrative / painterly 2D / subtle dreamlike atmosphere / restrained anime influence / editorial illustration / soft volumetric light.**

Не делать типичную «AI fantasy girl».

Не делать overly glossy anime.

Не делать generic cyberpunk.

Не делать беспричинный purple-blue neon.

Основные принципы:

* красивые силуэты;
* restrained palette;
* cinematic lighting;
* painterly texture;
* controlled glow;
* воздушная перспектива;
* аккуратное зерно;
* rich blacks;
* high-quality composition.

---

# 19. ЦВЕТОВАЯ ДРАМАТУРГИЯ

Цвет должен эволюционировать вместе с историей.

## Prologue

Charcoal / graphite / off-white.

Почти монохром.

## Light

Холодные серые + ivory-white.

Очень немного тёплого света.

## Approach

Добавляются:

* pale gold;
* desaturated amber;
* muted blue.

## Silence

Deep midnight blue.

Тёплый внутренний свет.

Большой контраст:

холод снаружи / тепло внутри.

## Noise

Более насыщенные:

* magenta;
* deep red;
* electric cyan;
* dirty amber.

Но не превращать главу в cyberpunk.

## Resolution

Настоящая ограниченная pixel palette.

Затем цвет начинает расширяться.

## Finale

Полноценная cinematic palette.

Тёплая кожа.

Глубокое окружение.

Остаточный белый свет девушки.

Максимальное ощущение:

**«мир наконец полностью проявился».**

---

# 20. BACKGROUNDS

Ключевые локации не должны быть голыми gradients.

Создавай normal authored backgrounds.

Для крупных сцен желательно иметь слои:

```text
background
midground
characters
foreground
atmosphere
particles
lighting overlay
```

Это позволит делать parallax.

Используй generated concept art → approved composition → final layered game assets.

---

# 21. CAMERA LANGUAGE

Камера должна быть частью режиссуры.

Реализовать:

* slow push-in;
* slow pull-out;
* subtle handheld drift;
* focus shift imitation;
* parallax;
* character framing;
* controlled screen shake только там, где оправдано;
* slight breathing camera motion.

Не двигать камеру постоянно.

Спокойные сцены должны уметь быть неподвижными.

---

# 22. CHARACTER IDLE MOTION

Финальные персонажи не должны ощущаться статичными PNG.

Добавить очень деликатные idle-анимации:

* дыхание;
* движение плеч;
* blink;
* небольшие движения головы;
* мягкое движение волос;
* едва заметное движение ткани;
* aura pulse у девушки.

Не делать rubber-body effect.

Амплитуды маленькие.

Движение должно ощущаться подсознательно.

Для этого можно использовать:

* layered sprites;
* meshes;
* masks;
* subtle displacement;
* GSAP timelines.

---

# 23. ANIMATION LANGUAGE

Используй GSAP для:

* cinematic timelines;
* camera cues;
* character entrances;
* dialogue transitions;
* title cards;
* layer choreography;
* chapter transitions;
* synchronized audio/visual beats.

Не превращай проект в коллекцию независимых CSS animations.

Каждая глава должна иметь собственный характер переходов.

---

# 24. ПЕРЕХОДЫ МЕЖДУ ГЛАВАМИ

Не использовать один `fadeToBlack()` везде.

## Prologue → Light

Чернильные / графитовые линии растворяются в свете.

## Light → Approach

Свет постепенно начинает давать миру цвет.

## Approach → Silence

Мир замедляется, внешний свет гаснет, остаётся окно и ночь.

## Silence → Noise

Резкий audio cut → вспышка концертного света → толпа.

## Noise → Resolution

Шум дробится на digital blocks/pixels.

## Resolution → Finale

Pixel-grid начинает разрушаться и превращаться в painterly particles.

Финальный мир собирается из них.

---

# 25. DIALOGUE UI

Диалоговое окно должно выглядеть как часть игры, а не Bootstrap-card.

Минималистичный дизайн.

В начале можно использовать более схематичный UI.

По мере истории интерфейс может становиться чуть богаче вместе с миром.

Требования:

* хороший line-height;
* не более примерно 2–4 строк одновременно;
* большие touch targets;
* читаемый текст;
* мягкая появляющаяся анимация;
* никакого стандартного браузерного текста.

Tap behaviour:

первый tap во время печати → мгновенно показать всю реплику;

следующий tap → следующая реплика.

---

# 26. TYPOGRAPHY

Использовать качественные шрифты с полноценной кириллицей.

Предпочтительное направление:

* UI/body: Onest / Manrope или аналогичный спокойный variable sans;
* chapter/title accent: Cormorant или другой качественный кириллический display serif.

Не использовать:

* Arial;
* Times;
* стандартный system font как основную типографику;
* Comic Sans;
* чрезмерно decorative handwriting.

Шрифты желательно self-hosted в WOFF2.

Не загружать 12 font weights.

---

# 27. ТЕКСТОВАЯ АНИМАЦИЯ

Не использовать постоянный механический typewriter со звуком на каждую букву.

Typewriter должен быть очень мягким.

Скорость может меняться:

* спокойные реплики — медленнее;
* короткие — быстрее;
* важная фраза может появиться с паузой;
* отдельные слова могут появляться чуть позже.

Используй timing как режиссёрский инструмент.

---

# 28. AUDIO

Audio — обязательная часть опыта.

Создать `AudioManager`.

Категории:

* ambient;
* music;
* UI;
* environmental SFX;
* narrative stingers.

Использовать Howler.js.

Первое осмысленное нажатие игрока должно одновременно разблокировать audio context на iOS/Android.

Не пытаться autoplay audio до пользовательского взаимодействия.

---

# 29. AUDIO DESIGN ПО ГЛАВАМ

## Prologue

Очень тихие:

* pencil;
* paper;
* room tone;
* distant hum.

## Light

Мягкий airy ambient.

Очень редкие high-frequency particles.

## Approach

Появляется музыкальная структура.

## Silence

Очень интимный ambient:

* помещение;
* ночь;
* далёкий город;
* практически неслышная музыка.

## Noise

Плотный концертный soundscape.

Важно не делать звук физически неприятным.

## Resolution

Музыка получает pixel/chiptune texture.

## Finale

Возвращаются мотивы предыдущих глав, но уже в полном звучании.

---

# 30. ПЕСНЯ STAY

Проект должен иметь отдельный слот:

```text
assets/audio/stay-user-track.*
```

Не скачивай copyrighted композицию самостоятельно.

Если пользователь позже предоставит файл и имеет право его использовать, интегрируй его.

До этого используй оригинальный placeholder track, выполняющий только похожую драматургическую функцию, но не копирующий мелодию.

---

# 31. MINIGAME 1 — FOLLOW THE LIGHT

Используй сюжетное описание из narrative spec.

Technical requirements:

* one-finger control;
* движение героя;
* очень простой navigation;
* никакой сложной физики;
* мягкий camera follow;
* responsive glow field;
* procedural particles.

Свет девушки должен влиять на пространство:

* рассеивать тени;
* проявлять дорожку;
* мягко активировать окружение.

Мини-игра должна занимать примерно 1–2 минуты.

Failure state отсутствует.

---

# 32. MINIGAME 2 — 14 ВРЕМЕНИ

Это surreal puzzle.

UI должен быть частью игрового мира.

Создать:

* необычные циферблаты;
* вращающиеся элементы;
* анимированные механические детали;
* неправильные значения;
* лёгкие glitch-переходы.

Puzzle должен создавать впечатление логики, которую невозможно полностью вывести математически.

Не делать игрока заложником puzzle.

Если взаимодействие длится слишком долго, система естественно подводит к решению.

Фраза «14 времени» должна восприниматься как внутренняя пасхалка.

---

# 33. MINIGAME 3 — НОЧНОЙ РАЗГОВОР

Это не quiz.

Нет правильных и неправильных ответов.

Система предлагает варианты направления разговора.

Любой выбор продолжает сцену.

Главная механика:

**дать игроку разрешение ничего не делать.**

В определённый момент:

* UI исчезает;
* музыка становится тише;
* персонажи просто находятся рядом;
* 10–15 секунд нет input prompt.

Нельзя ломать эту паузу popup'ами.

---

# 34. MINIGAME 4 — РЯДОМ

Концерт / толпа.

Главная механика:

удерживать близость и находить безопасный путь.

Не combat.

Не beat-em-up.

Не health bar.

Использовать:

* crowd flow;
* moving silhouettes;
* dynamic gaps;
* visual occlusion;
* proximity indicator, встроенный художественно.

Hero автоматически ориентируется на девушку.

Игрок контролирует путь и позиционирование.

При приближении неприятного силуэта можно мягко перекрывать траекторию телом героя.

Никаких ударов.

---

# 35. CROWD PERFORMANCE

Не создавать сотни полноценных animated sprites.

Использовать:

* sprite batching;
* impostor silhouettes;
* limited animation sets;
* depth layers;
* scale variation;
* alpha variation;
* controlled particle overlays.

Толпа должна выглядеть плотной, но оставаться дешёвой для GPU.

---

# 36. PIXEL RESOLUTION SEQUENCE

Pixel-глава должна иметь собственный UI skin.

Меняются:

* dialogue box;
* particles;
* character art;
* backgrounds;
* typography accents;
* SFX.

Но русский текст остаётся хорошо читаемым.

Не использовать пиксельный шрифт для длинных диалогов.

Pixel display font можно использовать только для:

* коротких системных сообщений;
* заголовков;
* labels.

---

# 37. FINAL SCENE

В финале убрать почти весь UI.

Максимум пространства оставить изображению и героям.

Мир полностью отрисован.

Оба персонажа имеют финальные формы.

Реплики появляются медленно.

Последний вопрос:

**«Будешь ли моей девушкой?»**

Можно слегка изменить грамматику, если другая естественная формулировка лучше ложится в диалог, но смысл должен остаться прямым и однозначным.

НЕ использовать:

* имя;
* baby;
* bebi;
* прозвище;
* пользовательский никнейм.

Перед вопросом должна быть полноценная эмоциональная пауза.

---

# 38. ПОСЛЕДНИЙ ИНТЕРАКТИВ

Не делай две кнопки:

```text
YES
NO
```

в стиле мема.

Финальный интерфейс должен оставаться уважительным.

Можно показать мягкую интерактивную кнопку продолжения/ответа, но сам вопрос должен существовать как настоящий вопрос человеку, а не как gag mechanic.

Не делать убегающую кнопку «нет».

Не манипулировать ответом.

Не блокировать страницу.

---

# 39. LOADING EXPERIENCE

Первый экран должен появляться почти сразу.

Не показывать стандартный progress bar на белом фоне.

Сделать художественный loader:

например:

линия постепенно рисуется и превращается в героя.

Пока игрок смотрит интро, prefetch следующих assets.

Загружать контент по главам.

Не грузить всю игру одним гигантским bundle перед title screen.

---

# 40. ASSET PIPELINE

Создать manifest.

Каждый asset имеет:

* ID;
* chapter;
* type;
* preload priority;
* dimensions;
* fallback;
* approximate memory cost.

Разделить:

```text
critical
chapter-current
chapter-next
lazy
```

При прохождении главы N в фоне подготавливать N+1.

---

# 41. IMAGE OPTIMIZATION

Не использовать 8K PNG для каждого задника.

Генерировать master assets высокого качества, затем экспортировать game-ready варианты.

Использовать современные compressed formats там, где это допустимо.

Alpha-assets оптимизировать отдельно.

Большие backgrounds разбивать на композиционные слои, если это уменьшает memory pressure.

Не держать все главы в GPU memory одновременно.

Освобождать textures уже далёких глав.

---

# 42. PERFORMANCE TARGET

Target:

**60 FPS на современном смартфоне.**

Кратковременный drop допустим во время тяжёлой transition, но gameplay не должен постоянно работать в 20–30 FPS.

Следить за:

* texture memory;
* draw calls;
* shader count;
* filters;
* overdraw;
* particle count;
* canvas resolution.

Ограничить renderer resolution на сверхвысоких DPR, если это необходимо.

Не рендерить условные 1290 × 2796 физические пиксели только потому, что устройство имеет DPR 3.

---

# 43. EFFECT QUALITY TIERS

Создай автоматические tiers.

## High

Полные:

* bloom;
* particles;
* displacement;
* parallax;
* high-res textures.

## Reduced

Меньше:

* particles;
* blur;
* bloom;
* displacement passes.

Не показывать пользователю сложный graphics menu.

Определять режим автоматически по runtime performance.

---

# 44. FILTERS

`pixi-filters` использовать точечно.

Разрешённые направления:

* AdvancedBloom;
* Glow;
* SimplexNoise;
* Displacement;
* MotionBlur;
* Pixelate;
* RGBSplit только для очень коротких intentional moments.

Не stack'ать 6 fullscreen filters одновременно.

Не использовать эффекты просто потому, что они существуют.

---

# 45. MOBILE INPUT

Всё управление одной рукой.

Основной input:

* tap;
* hold;
* horizontal/vertical drag;
* очень редкий swipe.

Не требовать:

* keyboard;
* hover;
* right click;
* precision cursor.

Touch target минимум примерно 44px там, где это UI.

---

# 46. SAVE SYSTEM

Сохранять:

* current chapter;
* checkpoint;
* completed minigames;
* dialogue progress;
* settings;
* audio state.

Использовать local persistence.

Игрок должен иметь:

* Continue;
* Start Over.

Не превращать это в сложное меню save slots.

Это персональная короткая история.

---

# 47. START SCREEN

Start screen должен быть атмосферным.

Не использовать стандартные:

```text
New Game
Continue
Settings
```

огромными системными кнопками.

Сделать художественную композицию.

Если сохранения нет:

**Начать**

Если есть:

**Продолжить**

Дополнительные настройки скрыть за маленькой ненавязчивой иконкой.

---

# 48. SETTINGS

Только действительно полезные:

* музыка;
* SFX;
* скорость текста;
* reduced motion.

Не делать десятки настроек.

---

# 49. ACCESSIBILITY

`prefers-reduced-motion` учитывать.

В reduced mode:

* уменьшить parallax;
* убрать сильные flashes;
* убрать screen shake;
* уменьшить displacement.

Диалоги должны иметь хороший contrast.

Важный текст не кодировать только цветом.

---

# 50. FLASHING

Концертная сцена не должна использовать опасные быстрые стробоскопические эффекты.

Сохрани впечатление света через:

* slow pulses;
* directional sweeps;
* glow;
* exposure changes;
* color changes.

---

# 51. DEBUG INTERFACE

Сделай development-only интерфейс:

```ts
window.__VN_DEBUG__
```

Он должен позволять получить:

* chapter;
* scene;
* beat;
* character stages;
* loaded assets;
* audio state;
* minigame state;
* FPS;
* renderer;
* graphics tier.

Добавь dev-only методы:

```text
goToScene(id)
restartScene()
completeMinigame()
setCharacterStage()
dumpState()
```

В production debug UI и query shortcuts не должны быть доступны обычному игроку.

---

# 52. NAMED TEST SCENES

Сделай воспроизводимые точки запуска для разработки:

```text
prologue_intro
light_follow
approach_fourteen_time
silence_room
noise_crowd
noise_cafe
resolution_8bit
resolution_16bit
finale_question
```

Чтобы не проходить двадцать минут каждый раз при visual QA.

---

# 53. PLAYWRIGHT MOBILE QA

Обязательно использовать Playwright.

Минимум:

* WebKit mobile emulation;
* Chromium mobile emulation.

Primary visual QA:

iPhone-sized WebKit.

Проверить:

* boot;
* first interaction;
* audio unlock;
* chapters;
* dialogue advance;
* all minigames;
* reload checkpoint;
* safe areas;
* final scene.

---

# 54. SCREENSHOT QA

Для всех named scenes сделать screenshots.

После реализации каждого крупного визуального этапа:

1. запусти сцену;
2. захвати screenshot;
3. реально посмотри на screenshot;
4. исправь:

   * alignment;
   * cropping;
   * unreadable text;
   * accidental overlaps;
   * ugly scaling;
   * AI artifacts;
   * excessive glow;
   * empty composition.

Не считать сцену законченной только потому, что DOM существует.

---

# 55. REAL DEVICE THINKING

Даже если используешь эмуляцию, проектировать нужно как реальный мобильный продукт.

Учитывать:

* палец закрывает часть экрана;
* Safari меняет высоту viewport;
* audio требует interaction;
* GPU и RAM ограничены;
* мобильная сеть может быть медленной;
* пользователь может свернуть браузер;
* экран может погаснуть;
* reload не должен уничтожать весь прогресс.

---

# 56. PRELOADING

Следующая сцена не должна начинаться с внезапного loading spinner.

Использовать:

* background asset prefetch;
* chapter boundary preload;
* small hidden narrative pauses;
* title cards.

Если asset ещё не готов, transition должен естественно выиграть время.

---

# 57. ERROR HANDLING

Если какой-либо необязательный visual effect не поддерживается:

игра продолжает работать.

Если WebGL недоступен:

показать красивое понятное сообщение, а не stack trace.

Если audio не разблокировался:

показать маленькую ненавязчивую кнопку звука.

---

# 58. NO AI LOOK — ВАЖНЕЙШЕЕ ТРЕБОВАНИЕ

Пользователь не должен смотреть на игру и думать:

«Это сделал ИИ за вечер.»

Поэтому запрещено оставлять:

* generic gradients;
* random glassmorphism;
* бессмысленные glowing cards;
* огромные rounded rectangles;
* разные стили иллюстраций;
* случайные emoji;
* стандартные lucide-icons в качестве арт-дирекшна;
* hero section;
* cards grid;
* web-dashboard language;
* chatbot aesthetics.

Это игра.

Не SaaS.

---

# 59. VISUAL CONSISTENCY PASS

После Phase B сделать отдельный art-direction audit.

Проверить всю игру от первого экрана до финала.

Искать:

* меняющиеся лица;
* различия пропорций;
* inconsistent line weight;
* inconsistent lighting;
* случайные palette shifts;
* different illustration styles;
* assets, которые ощущаются из другой игры.

Исправлять до единого художественного языка.

---

# 60. MOTION CONSISTENCY PASS

Отдельно проверить animation language.

Убрать:

* случайные easing;
* элементы, которые двигаются слишком быстро;
* бессмысленные bounce;
* чрезмерный spring;
* UI, который постоянно летает.

Основной motion характер:

**slow, deliberate, intimate, cinematic.**

---

# 61. STORY PACING QA

Пройти игру от начала до конца без debug skip.

Проверить:

* не слишком ли медленный пролог;
* не слишком ли много текста подряд;
* не затянуты ли мини-игры;
* хватает ли интерактивности;
* ощущается ли progression;
* эмоционально ли работает тишина;
* контрастирует ли концерт;
* достаточно ли времени перед финальным вопросом.

Не позволять технической реализации разрушить драматургию.

---

# 62. AUDIO MIX QA

Проверить на телефонной громкости.

Диалоговый интерфейс не должен конфликтовать с музыкой.

Не делать:

* оглушающие SFX;
* огромные volume jumps;
* clipping;
* постоянный low-frequency rumble.

---

# 63. CODE QUALITY

TypeScript strict mode.

Не оставлять:

* `any` без причины;
* giant god classes;
* мёртвый код;
* console spam;
* временные TODO;
* development cheats;
* случайные asset paths;
* magic timings по всему проекту.

Animation timings хранить централизованно или в scene definitions.

---

# 64. TESTING PHILOSOPHY

Не писать сотни бессмысленных unit tests.

Unit-тестировать то, где есть настоящая логика:

* state transitions;
* save/load;
* chapter progression;
* puzzle logic;
* deterministic crowd/minigame rules.

Визуал проверять Playwright + screenshots + реальным просмотром.

---

# 65. PERFORMANCE DEBUG MODE

В development добавить небольшой profiler:

* current FPS;
* average frame time;
* sprites;
* textures;
* draw calls, если доступно;
* current scene;
* particle count.

Использовать его для optimization pass.

Не показывать production-пользователю.

---

# 66. DEPLOYMENT

Игра должна быть static-deployable.

Не создавать backend без необходимости.

Никаких runtime API keys.

После build папка должна быть готова для:

* Vercel;
* Netlify;
* Cloudflare Pages;
* аналогичного static hosting.

Все character assets генерируются на этапе разработки, а не runtime.

---

# 67. PRIVACY ФОТОГРАФИЙ

Фотографии пользователя являются development reference.

Не включать исходные фотографии в production bundle.

В production должны попасть только созданные игровые art assets.

Не копировать фотографии в `public/`.

После создания production assets originals не должны требоваться приложению.

---

# 68. AGENTS.MD

Создай короткий полезный `AGENTS.md`.

Он должен фиксировать только долговременные правила проекта:

* mobile portrait only;
* PixiJS game, not web landing;
* story source;
* visual quality target;
* characters never implemented as DOM primitives;
* user photos are identity references, never costume references;
* all important changes must be visually inspected in mobile browser;
* do not stop at first functional version if Definition of Done is unmet.

Не превращай `AGENTS.md` в копию этого огромного ТЗ.

---

# 69. DOCUMENTATION

Создать:

```text
docs/ART_DIRECTION.md
docs/NARRATIVE.md
docs/ARCHITECTURE.md
docs/ASSET_PIPELINE.md
docs/QA.md
```

Документы должны быть короткими и практическими.

Не тратить больше времени на документацию, чем на игру.

---

# 70. PHASE A DEFINITION OF DONE

Phase A закончена только если:

* игра запускается на мобильном viewport;
* существует полноценный intro;
* реализованы все главы;
* реализованы все четыре мини-игры;
* narrative flow работает полностью;
* есть качественное окружение;
* early character stages существуют;
* переходы работают;
* camera direction работает;
* audio работает после первого tap;
* сохранение работает;
* все named test scenes работают;
* проект собирается production build;
* Playwright проходит основной путь;
* игра просмотрена через mobile screenshots;
* obvious visual bugs исправлены.

Только после этого запросить фотографии.

---

# 71. PHASE B

После получения фотографий:

1. проанализировать identity references;
2. создать character bible;
3. определить финальные игровые образы;
4. придумать новую игровую одежду;
5. создать финального hero;
6. создать финальную girl;
7. создать intermediate character stages;
8. создать 8-bit;
9. создать 16-bit;
10. заменить provisional assets;
11. поправить композиции под реальные силуэты;
12. выполнить visual consistency pass;
13. выполнить animation pass;
14. выполнить performance pass;
15. повторно пройти всю игру.

---

# 72. FINAL DEFINITION OF DONE

Проект считается завершённым только когда:

* ни одна ключевая сцена не выглядит placeholder;
* ни один персонаж не является HTML/CSS-примитивом;
* персонажи узнаваемы;
* реальная одежда с reference-фотографий не используется;
* художественный стиль консистентен;
* все главы визуально различаются;
* трансформации выглядят как события, а не замена файлов;
* игра комфортно работает на телефоне;
* мобильный Safari/WebKit протестирован;
* Chrome mobile протестирован;
* нет горизонтального scroll;
* нет accidental zoom/layout jump;
* нет console errors;
* нет broken asset requests;
* звук работает;
* сохранения работают;
* все четыре мини-игры работают;
* финальный вопрос появляется только после полной драматургической подготовки;
* production build успешен;
* пользователь может открыть ссылку и пройти всё от первого экрана до финала.

---

# 73. ФИНАЛЬНЫЙ QUALITY BAR

При каждом спорном решении задавай себе вопрос:

**«Так сделал бы разработчик полноценной небольшой narrative game или разработчик промо-сайта?»**

Всегда выбирай первое.

Ещё один критерий:

Если убрать URL-строку браузера и показать запись прохождения человеку, он должен решить, что смотрит на настоящую мобильную indie visual novel.

Не оптимизируй под:

«достаточно работает».

Оптимизируй под:

**«выглядит намеренно, цельно и законченно».**

---

# 74. ПОРЯДОК ВЫПОЛНЕНИЯ

Начни с анализа narrative spec и существующего repository.

Затем:

1. определи art direction;
2. создай несколько concept frames;
3. выбери наиболее цельное направление;
4. спроектируй architecture;
5. создай playable vertical slice;
6. проверь его на mobile WebKit;
7. доведи core systems;
8. реализуй остальные главы;
9. реализуй mini-games;
10. сделай polish pass;
11. выполни Phase A QA;
12. запроси фотографии;
13. после получения refs выполни Phase B;
14. выполни final full-playthrough;
15. исправляй найденные проблемы;
16. заверши только после выполнения Final Definition of Done.

Не требуй подтверждения после каждого этапа.

Не останавливайся после vertical slice.

Не оставляй пользователю задачи, которые можешь выполнить самостоятельно.

Начинай.
