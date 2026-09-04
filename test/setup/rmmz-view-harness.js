//region rmmz-view-harness
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from './repo-root.js';

/**
 * Boots the entire RPG Maker MZ view layer- real PIXI, real `Window_*`, real `Scene_*`- with only
 * the rendering primitives replaced.
 *
 * `rmmz-engine-loader.js` deliberately stops at `rmmz_core.js` / `rmmz_objects.js`, because the
 * data layer is all a `Game_*` test needs. Scenes and windows need considerably more, and the
 * received wisdom was that they simply could not be tested: `Window` extends `PIXI.Container`,
 * `Window_Base` builds its contents out of `Bitmap`, and `Bitmap` wants a canvas nobody has in
 * Node. That reasoning is sound but its conclusion is wrong. PIXI's display objects are pure
 * JavaScript and only reach for WebGL at render time, and the vendored library sits right there in
 * `project/js/libs/`. Replace the two things that genuinely rasterize- `Bitmap` and the shader-
 * compiling filters- and everything above them runs honestly.
 *
 * What that buys is not pixels. It is the wiring: whether a `Window_Command` subclass builds the
 * list it claims to, whether a filter actually removes rows, whether confirming a command leaves
 * the cursor somewhere the player can reach, whether a scene's `initMembers` chain reaches the
 * base class. That category of defect is invisible to service-level tests because it is not logic
 * living in the wrong place- it is the seams between objects, and the seams only exist once the
 * real objects do.
 *
 * The cost is one honest blind spot, documented on {@link installBitmapMock}.
 */

/**
 * Engine scripts, in the order RPG Maker's own `index.html` concatenates them. The order is load-
 * bearing: each file wires prototype chains at top level against whatever the previous one declared.
 * @type {string[]}
 */
const ENGINE_FILES = [
  'project/js/rmmz_core.js',
  'project/js/rmmz_managers.js',
  'project/js/rmmz_objects.js',
  'project/js/rmmz_sprites.js',
  'project/js/rmmz_windows.js',
  'project/js/rmmz_scenes.js',
];

/**
 * Every text string handed to {@link Bitmap#drawText}, in the order it was drawn.
 *
 * Windows are tested by what they decided to render rather than by how it looked, so the mock keeps
 * a transcript. Assert against this to prove a row carried the right label without owning a single
 * pixel.
 * @type {string[]}
 */
export const drawnText = [];

/**
 * Executes one vendored engine script against the real Node global object.
 * @param {string} relativePath The repo-relative path of the script to execute.
 */
function runEngineScript(relativePath)
{
  const absolutePath = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(absolutePath, 'utf-8');

  // runInThisContext rather than a vm sandbox, so top-level `function Foo() {}` declarations land
  // as real ambient globals- the same shape the engine's own <script> tag loading produces.
  vm.runInThisContext(source, { filename: absolutePath });
}

/**
 * Installs the smallest browser surface PIXI and the engine touch while loading.
 *
 * Nothing here renders and nothing here is a guess at engine behavior; these are shape-only shims
 * standing in for a document, which is why the harness needs neither jsdom nor a native canvas
 * binding. Any of these growing a real implementation is a sign something under test is trying to
 * rasterize, which is the one thing this harness is built not to do.
 */
export function installDomShim()
{
  const context2d = {
    measureText: text => ({ width: String(text).length * 10 }),
    isContextLost: () => false,
    canvas: {
      width: 0,
      height: 0,
    },
    save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, clip() {},
    putImageData() {}, setTransform() {}, translate() {}, scale() {}, rotate() {},
    fillText() {}, strokeText() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, stroke() {}, fill() {},
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };

  const canvasElement = () => ({
    width: 0,
    height: 0,
    style: {},
    getContext: () => context2d,
    addEventListener() {},
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0 }),
  });

  const plainElement = () => ({
    style: {},
    classList: {
      add() {},
      remove() {},
    },
    appendChild() {}, removeChild() {}, addEventListener() {}, setAttribute() {},
  });

  globalThis.document = {
    createElement: tag => (tag === 'canvas'
      ? canvasElement()
      : plainElement()),
    createElementNS: () => plainElement(),
    getElementById: () => null,
    querySelector: () => null,
    addEventListener() {},
    body: plainElement(),
    documentElement: plainElement(),
    head: plainElement(),
    hidden: false,
    fonts: {
      add() {},
      load: () => Promise.resolve(),
      ready: Promise.resolve(),
    },
  };

  // modern Node ships accessor-only globals of its own for some of these names, so every one goes
  // in by definition rather than assignment- a plain `=` against `navigator` throws outright.
  const defineGlobal = (name, value) => Object.defineProperty(globalThis, name, {
    value,
    writable: true,
    configurable: true,
  });

  defineGlobal('window', globalThis);
  defineGlobal('self', globalThis);
  defineGlobal('navigator', {
    userAgent: 'node',
    language: 'en',
    platform: 'node',
  });
  defineGlobal('location', {
    href: 'file:///',
    protocol: 'file:',
    search: '',
  });

  globalThis.performance ||= { now: () => 0 };
  globalThis.requestAnimationFrame = () => 0;
  globalThis.addEventListener = () => {};
  globalThis.alert = () => {};
  globalThis.XMLHttpRequest = function() { this.open = () => {}; this.send = () => {}; };
  globalThis.Image = function() { this.addEventListener = () => {}; };
  globalThis.AudioContext = function() {};
  globalThis.FontFace = function() { this.load = () => Promise.resolve(); };
}

/**
 * Turns every PIXI filter, and RPG Maker's own `ColorFilter`, into an inert shell.
 *
 * This is the least obvious requirement in the whole harness, and skipping it fails in a place that
 * looks unrelated. PIXI compiles a real WebGL shader when a `Filter` is *constructed*, not when it
 * is drawn, because that is how it discovers the shader's attributes- so merely building a window
 * reaches for a GL context. `Window` gives its client area an `AlphaFilter` and `Scene_MenuBase`
 * blurs its background, meaning the crash arrives before any test has asserted anything.
 *
 * Every filter class goes rather than a hand-picked few. A missed one surfaces as an inscrutable
 * `gl.createShader is not a function` from deep inside a test about something else entirely.
 *
 * Must run after PIXI loads and before any engine file that might construct a filter.
 */
export function installInertFilters()
{
  const InertFilter = function()
  {
    this.uniforms = {};
    this.enabled = true;
    this.blendMode = 0;
  };

  globalThis.PIXI.filters ||= {};

  Object.keys(globalThis.PIXI.filters)
    .forEach(name =>
    {
      globalThis.PIXI.filters[name] = InertFilter;
    });

  globalThis.PIXI.Filter = InertFilter;

  // RPG Maker's own filter has the same shader problem, and every Sprite builds one.
  globalThis.ColorFilter = function() { this.uniforms = {}; };

  [ 'setHue', 'setColorTone', 'setBlendColor', 'setBrightness' ].forEach(name =>
  {
    globalThis.ColorFilter.prototype[name] = function() {};
  });
}

/**
 * Replaces `Bitmap` with a mock that records instead of rasterizing.
 *
 * `Bitmap` is the boundary between decisions and pixels, so it is the right place to cut. Drawing
 * calls become no-ops, except that text is appended to {@link drawnText} so a test can assert what
 * a window chose to say, and `getPixel` answers with a stable color because `ColorManager` reads
 * the palette straight out of the windowskin's pixels.
 *
 * The blind spot: `measureTextWidth` returns a fabricated width. Anything that wraps, truncates,
 * ellipsizes, or centers based on real font metrics will execute happily and prove nothing. Treat
 * layout arithmetic that depends on measured text as untested no matter what the coverage report
 * says, and keep asserting it in front of a running game.
 *
 * Must run after `rmmz_core.js` (which declares the real `Bitmap`) and before anything builds one.
 */
export function installBitmapMock()
{
  globalThis.Bitmap = function(width, height)
  {
    // dimensions are held the way the real `Bitmap` holds them - behind a canvas, read through an
    // accessor - rather than as plain instance properties. J-Base redefines `width` and `height` as
    // getter-only accessors over exactly this storage, and an instance property assigned in a
    // constructor throws against a prototype getter with no setter.
    this._canvas = {
      width: width || 0,
      height: height || 0,
    };

    // and this is the real `Bitmap`'s own default, seeded here because a mock constructor never
    // reaches the `initialize` that would otherwise establish it.
    this._deviceScale = 1;

    this.fontFace = '';
    this.fontSize = 0;
    this.fontBold = false;
    this.fontItalic = false;
    this.textColor = '#ffffff';
    this.outlineColor = '#000000';
    this.outlineWidth = 3;
    this.paintOpacity = 255;
    this.smooth = true;
    this.url = '';
  };

  const bitmap = globalThis.Bitmap.prototype;

  bitmap.resize = function(width, height)
  {
    this._canvas.width = width;
    this._canvas.height = height;
  };

  // present the same accessors the real `Bitmap` does, so the mock behaves the same whether or not
  // a J-Base bundle has loaded over the top of it and redefined them identically.
  Object.defineProperty(bitmap, 'width', {
    get()
    {
      return this._canvas.width / this._deviceScale;
    },
    configurable: true,
  });

  Object.defineProperty(bitmap, 'height', {
    get()
    {
      return this._canvas.height / this._deviceScale;
    },
    configurable: true,
  });

  bitmap.drawText = function(text)
  {
    drawnText.push(String(text));
  };

  // everything that would otherwise rasterize; nothing under test cares what any of them produced.
  [
    'clear', 'clearRect', 'fillRect', 'gradientFillRect', 'strokeRect', 'drawCircle', 'fillAll',
    'blt', 'bltImage', 'destroy', 'retain', 'touch',
  ].forEach(name =>
  {
    bitmap[name] = function() {};
  });

  bitmap.measureTextWidth = text => String(text).length * 10;
  bitmap.getPixel = () => '#ffffff';
  bitmap.getAlphaPixel = () => 255;
  bitmap.isReady = () => true;

  // load listeners fire immediately; nothing here is ever actually pending.
  bitmap.addLoadListener = function(callback)
  {
    callback(this);
  };

  Object.defineProperty(bitmap, 'canvas', {
    get()
    {
      return this._canvas;
    },
    configurable: true,
  });

  // replacing the constructor wholesale drops the statics the real `Bitmap` carries, and this is the
  // one anything reads an image through. The result arrives already loaded and generously sized, for
  // the same reason `ImageManager` hands back oversized mocks: a consumer that slices the result into
  // a grid throws against anything smaller, and a test about drawing should not fail over that.
  globalThis.Bitmap.load = function(url)
  {
    const loaded = new globalThis.Bitmap(816, 624);
    loaded.url = url;

    return loaded;
  };
}

/**
 * Pins the `Graphics` values window layout reads, without booting a renderer.
 *
 * Assignment is not an option here. Several of these are accessor-only on `Graphics`, and the test
 * files are ESM- which is strict mode- so a plain `=` against a getter with no setter throws rather
 * than silently doing nothing.
 */
function installGraphicsStub()
{
  const stubbed = [
    [ 'width', 1920 ],
    [ 'height', 1080 ],
    [ 'boxWidth', 1920 ],
    [ 'boxHeight', 1080 ],
    [ 'frameCount', 0 ],
    [ 'app', { renderer: { resize() {}, resolution: 1 } } ],
    [ 'deviceScale', 1 ],
    [ 'effekseer', { setRestorationOfStatesFlag() {} } ],
    [ 'isWebGL', () => true ],
    [ 'setLoadingImage', () => {} ],
    [ 'startLoading', () => {} ],
    [ 'endLoading', () => {} ],
    [ 'printError', () => {} ],
  ];

  stubbed.forEach(([ name, value ]) => Object.defineProperty(globalThis.Graphics, name, {
    value,
    writable: true,
    configurable: true,
  }));
}

/**
 * Points every image and audio manager at something harmless.
 *
 * The bitmaps are deliberately oversized rather than token 1x1 stubs: `Sprite_Button` slices a
 * ButtonSet into a grid and throws "ButtonSet image is too small" against anything undersized, and
 * faces and characters are read as sheets too. One generous size satisfies every caller.
 */
function installAssetStubs()
{
  const mockBitmap = () => new globalThis.Bitmap(1024, 1024);

  globalThis.ImageManager.loadBitmap = mockBitmap;

  [
    'loadSystem', 'loadFace', 'loadCharacter', 'loadPicture', 'loadBattleback1', 'loadBattleback2',
    'loadEnemy', 'loadSvActor', 'loadSvEnemy', 'loadParallax', 'loadTitle1', 'loadTitle2',
  ].forEach(name =>
  {
    globalThis.ImageManager[name] = mockBitmap;
  });

  // audio has no bearing on wiring and reaches for WebAudio.
  [
    'playBgm', 'playBgs', 'playMe', 'playSe',
    'stopBgm', 'stopBgs', 'stopMe', 'stopSe',
    'fadeOutBgm', 'fadeOutBgs', 'fadeOutMe',
  ].forEach(name =>
  {
    globalThis.AudioManager[name] = () => {};
  });
}

/**
 * Boots the whole view layer. Safe to call once per test file; a repeat call in the same realm is
 * a no-op, matching {@link installRealRmmzEngine}'s contract.
 *
 * Order is not negotiable. PIXI must exist before `rmmz_core.js` parses, filters must be inert
 * before anything constructs one, and `Bitmap` must be replaced after core declares it but before
 * a window builds contents from it.
 */
export function installRmmzViewLayer()
{
  if (globalThis.__rmmzViewLayerInstalled === true) return;

  globalThis.__rmmzViewLayerInstalled = true;

  installDomShim();

  // the vendored library, not a stub- rmmz_core.js declares its display classes as
  // `Object.create(PIXI.X.prototype)` at top level and cannot parse-execute without the real thing.
  runEngineScript('project/js/libs/pixi.js');

  installInertFilters();

  runEngineScript(ENGINE_FILES[0]);

  installBitmapMock();
  installGraphicsStub();

  ENGINE_FILES.slice(1)
    .forEach(runEngineScript);

  installAssetStubs();

  // normally Scene_Boot's job; without it ColorManager has no palette to read colors out of.
  globalThis.ColorManager.loadWindowskin();
}

/**
 * Builds a minimal-but-real database and the standard `$game*` objects.
 *
 * The rows are synthetic, but they are fed through the engine's own `DataManager.createGameObjects`,
 * so every `$game*` object is the genuine class behaving exactly as it does in the running game.
 * Tests needing richer data should overwrite the `$data*` tables before calling this.
 *
 * **Call this before loading any J plugin bundle.** J-Base hydrates the `$data*` tables into
 * `RPG_*` models and patches `Game_Actor.setup` to expect them, so re-seeding raw rows afterwards
 * hands the patched engine plain JSON and it fails deep inside equipment setup. Repeat calls are
 * therefore no-ops rather than a reset, which keeps a second `beforeAll` in the same file harmless.
 *
 * @param {number} partySize How many copies of the sample actor to seed the party with.
 */
export function installMinimalDatabase(partySize = 1)
{
  if (globalThis.__rmmzMinimalDatabaseInstalled === true) return;

  globalThis.__rmmzMinimalDatabaseInstalled = true;

  // TextManager reads every UI string out of these, so they carry real words. Blank terms make
  // any assertion on drawn text a comparison between two empty strings, which proves nothing.
  const terms = {
    basic: [ 'Level', 'Lv', 'HP', 'HP', 'MP', 'MP', 'TP', 'TP', 'EXP', 'EXP' ],
    commands: [
      'Fight', 'Escape', 'Attack', 'Guard', 'Item', 'Skill', 'Equip', 'Status', 'Formation',
      'Save', 'Game End', 'Options', 'Weapon', 'Armor', 'Key Item', 'Equip', 'Optimize', 'Clear',
      'New Game', 'Continue', null, 'To Title', 'Cancel', null, 'Buy', 'Sell',
    ],
    params: [
      'Max HP', 'Max MP', 'Attack', 'Defense', 'M.Attack', 'M.Defense', 'Agility', 'Luck',
      'Hit', 'Evasion',
    ],
    messages: {},
  };

  // Game_Vehicle reads characterName off each of these while $gameMap is being built.
  const vehicle = () => ({
    bgm: {},
    characterName: '',
    characterIndex: 0,
    startMapId: 0,
    startX: 0,
    startY: 0,
  });

  globalThis.$dataSystem = {
    gameTitle: 'harness',
    locale: 'en_US',
    versionId: 1,
    advanced: {
      gameId: 1,
      screenWidth: 1920,
      screenHeight: 1080,
      windowOpacity: 192,
    },
    windowTone: [ 0, 0, 0 ],
    // SoundManager indexes this by system-sound number whenever a command is confirmed.
    sounds: Array.from({ length: 24 }, () => ({ name: '', volume: 0, pitch: 100, pan: 0 })),
    terms,
    partyMembers: Array.from({ length: partySize }, () => 1),
    switches: [ '' ],
    variables: [ '' ],
    elements: [ '', 'Physical' ],
    skillTypes: [ '', 'Magic' ],
    weaponTypes: [ '', 'Sword' ],
    armorTypes: [ '', 'Shield' ],
    equipTypes: [ '', 'Weapon', 'Shield', 'Body', 'Feet', 'Accessory' ],
    testBattlers: [],
    boat: vehicle(),
    ship: vehicle(),
    airship: vehicle(),
    titleBgm: {},
    battleBgm: {},
    victoryMe: {},
    defeatMe: {},
    gameoverMe: {},
    startMapId: 1,
    startX: 0,
    startY: 0,
    optDisplayTp: true,
    optExtraExp: false,
    optSlipDeath: false,
    optFloorDeath: false,
    optSideView: false,
    optTransparent: false,
    optFollowers: true,
    optDrawTitle: true,
    battleback1Name: '',
    battleback2Name: '',
    battlerName: '',
    battlerHue: 0,
    editMapId: 1,
    itemCategories: [ true, true, true, true ],
    magicSkills: [],
    attackMotions: [],
    menuCommands: [ true, true, true, true, true, true ],
    tileSize: 48,
  };

  const growthCurve = () => Array.from({ length: 100 }, (unused, level) => 100 + (level * 10));

  globalThis.$dataClasses = [ null, {
    id: 1,
    name: 'Harness',
    expParams: [ 30, 20, 30, 30 ],
    params: Array.from({ length: 8 }, growthCurve),
    learnings: [],
    traits: [],
    note: '',
  } ];

  globalThis.$dataActors = [ null, {
    id: 1,
    name: 'Harness Actor',
    nickname: '',
    classId: 1,
    initialLevel: 1,
    maxLevel: 99,
    characterName: '',
    characterIndex: 0,
    faceName: '',
    faceIndex: 0,
    battlerName: '',
    equips: [ 0, 0, 0, 0, 0 ],
    profile: '',
    traits: [],
    note: '',
  } ];

  [
    '$dataSkills', '$dataItems', '$dataWeapons', '$dataArmors', '$dataStates', '$dataEnemies',
    '$dataTroops', '$dataAnimations', '$dataTilesets', '$dataCommonEvents', '$dataMapInfos',
  ].forEach(name =>
  {
    globalThis[name] = [ null ];
  });

  globalThis.$dataMap = {
    data: [],
    events: [],
    width: 1,
    height: 1,
    scrollType: 0,
    note: '',
  };

  // the engine's own factory, so every $game* object is the genuine class.
  globalThis.DataManager.createGameObjects();

  // createGameObjects only allocates; the starting party is seeded separately by setupNewGame.
  globalThis.$gameParty.setupStartingMembers();

  globalThis.ConfigManager.touchUI = true;
  globalThis.Input.clear();
  globalThis.TouchInput.clear();
}

/**
 * Empties the recorded draw transcript, so one test cannot read another's output.
 */
export function clearDrawnText()
{
  drawnText.length = 0;
}
//endregion rmmz-view-harness
