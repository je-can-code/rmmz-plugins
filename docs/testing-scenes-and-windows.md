# Testing scenes and windows

For a long time the answer to "can we test a `Scene_*` or a `Window_*`?" was no, and the reasoning
was sound: `Window` extends `PIXI.Container`, `Window_Base` builds its contents out of `Bitmap`, and
`Bitmap` wants a canvas that does not exist in Node. So `test/setup/install-minimal-menu-ui-stubs.js`
replaces the whole view layer with no-ops, and `vitest.config.js` excludes `scenes/**`, `sprites/**`
and `windows/**` from coverage.

The reasoning was right and the conclusion was wrong. PIXI's display objects are pure JavaScript and
only reach for WebGL when something actually renders, and the real library is vendored at
`project/js/libs/pixi.js`. Replace the two things that genuinely rasterize — `Bitmap`, and the
filters that compile shaders — and everything above them runs honestly.

`test/setup/rmmz-view-harness.js` is that harness. It needs **no new dependencies**: no jsdom, no
node-canvas, no headless-gl.

## Why bother

The point is not pixels. It is *wiring*, and wiring is a category of defect that service-level tests
structurally cannot reach.

Every scene bug found during the 2026-07-31 testplay session was wiring:

| Defect | Symptom |
|---|---|
| `Scene_MenuFacetBase.initMembers` never called `super.initMembers` | Every facet scene crashed on its first modal |
| Four handlers in `Scene_JabsAllyAi` refreshed but never re-activated | Scene froze; no window held the cursor |
| `Tool` / `Dash` icon indices registered in the wrong order | Legends showed Square where Triangle was meant |
| SDP legend named a `more` semantic nothing was bound to | A control that advertised a feature and did nothing |

None of those is logic sitting in the wrong place, so "extract it to a service and test it there"
had nothing to extract. They are seams between objects, and a seam only exists once both objects
are real. That is exactly what stubbing `Scene_Base` to a no-op destroys — with a faked base class
every assertion about the chain is circular.

## Usage

```javascript
import { beforeAll, describe, expect, it } from 'vitest';
import { installMinimalDatabase, installRmmzViewLayer } from '../../../setup/rmmz-view-harness.js';

describe('Window_Whatever', () =>
{
  beforeAll(() =>
  {
    installRmmzViewLayer();
    installMinimalDatabase();
  });

  it('builds one row per unlocked panel', () =>
  {
    // Arrange & Act
    const window = new Window_Whatever(new Rectangle(0, 0, 400, 200));

    // Assert
    expect(window.maxItems()).toBe(3);
  });
});
```

Both installers are idempotent per realm, so a second `beforeAll` in the same file is harmless.

To exercise a plugin's own scenes, load its built bundle after the harness — see
`test/plugins/_base/scenes/scene-menu-facet-base.test.js` for the working pattern.

**Order matters: seed the database before loading any J plugin bundle.** J-Base hydrates the
`$data*` tables into `RPG_*` models and patches `Game_Actor.setup` to expect them, so re-seeding raw
rows afterwards hands the patched engine plain JSON and it fails deep inside equipment setup.

### Asserting on what was drawn

`Bitmap.drawText` is recorded rather than rasterized. Import `drawnText` for the transcript and
`clearDrawnText()` to reset it between tests.

```javascript
window.refresh();
expect(drawnText).toContain('Ultanium Guard');
```

## The one blind spot

`measureTextWidth` returns a fabricated width. Anything that wraps, truncates, ellipsizes, or
centers based on real font metrics will execute happily and prove nothing.

**Treat layout arithmetic that depends on measured text as untested no matter what the coverage
report says.** That still belongs in front of a running game.

## The recipe, and why each step exists

Reconstructing this from scratch is unpleasant, because several steps fail somewhere that looks
unrelated to the cause. In order:

1. **DOM shim** — `document.createElement`, `navigator`, `window`, `self`, `location`. PIXI reads
   these at load. Modern Node ships accessor-only globals for some of these names, so they must go
   in via `Object.defineProperty`; a plain `=` against `navigator` throws.
2. **Load the real vendored PIXI**, before `rmmz_core.js`. Core declares its display classes as
   `Object.create(PIXI.X.prototype)` at top level and cannot parse-execute without it. Do **not**
   mock PIXI — faking `addChild` / `children` / `transform` / `destroy` is far more work than
   loading the real thing, and it drifts.
3. **Neutralize every `PIXI.filters` class and RMMZ's `ColorFilter`.** *This is the least obvious
   step.* PIXI compiles a real WebGL shader when a `Filter` is **constructed**, not when it is
   drawn, because that is how it discovers the shader's attributes. `Window` gives its client area
   an `AlphaFilter` and `Scene_MenuBase` blurs its background, so merely building a window reaches
   for a GL context. Replace all of them, not a hand-picked few — a missed one surfaces as
   `gl.createShader is not a function` from inside a test about something else.
4. **`rmmz_core.js`**, then replace `Bitmap` wholesale. `getPixel` must return a color, because
   `ColorManager` reads the palette out of the windowskin's pixels.
5. **`Graphics` values via `defineProperty`.** Several are accessor-only, and test files are ESM —
   strict mode — so assigning to a getter with no setter throws rather than silently failing.
6. **`rmmz_managers`, `rmmz_objects`, `rmmz_sprites`, `rmmz_windows`, `rmmz_scenes`**, in that order.
7. **`ImageManager.load*` returns generously sized mock bitmaps.** `Sprite_Button` slices a ButtonSet
   into a grid and throws "ButtonSet image is too small" against anything undersized.
8. **`DataManager.createGameObjects()`**, then `$gameParty.setupStartingMembers()` — the first only
   allocates; the starting party is seeded separately by `setupNewGame`. Then `Input.clear()`,
   `TouchInput.clear()`, `ColorManager.loadWindowskin()` (normally Scene_Boot's job).

## Coverage

`vitest.config.js` still excludes `scenes/**`, `sprites/**` and `windows/**`. That exclusion is
deliberate and should be lifted **per family, as tests land** — flipping it wholesale would add
hundreds of 0% files and bury the real targets, the same reasoning the config already applies to
`abs/ext/star`.

The standing rule in `CLAUDE.md` — logic found in a view gets extracted into a service — is
unchanged. This harness is not permission to write business logic inside a window. It exists for the
wiring that has nowhere else to live.

## Config-driven plugins

J-SDP reads `data/config.sdp.json` through Node's `require('fs')` at load time, so its bundle needs
that config present. `test/plugins/sdp/_component/fixtures/build-sdp-config-json.js` already solves
this for the existing suite and is the piece to reuse.
