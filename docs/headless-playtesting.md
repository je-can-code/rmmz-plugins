# Running the game headlessly

Three J-Lighting defects shipped past fifteen source gates, 100% coverage and a 96% mutation score
in a single day. Every one of them existed only once the engine actually booted, and every one died
within seconds of a frame being visible. The suite is good at *is this logic correct* and blind to
*does the engine still start*.

This is how to close that gap. Nothing here is automated yet - the design questions for a standing
smoke gate are still open - but the mechanism works today and is worth knowing before spending an
afternoon guessing at a rendering bug, which is what it replaced.

---

## The short version

```bash
# once per session
Xvfb :77 -screen 0 1280x720x24 -nolisten tcp &

# per run, from the game's directory
env -u WAYLAND_DISPLAY DISPLAY=:77 nw ./chef-adventure/ "test" \
  --user-data-dir=/tmp/nw-headless \
  --ozone-platform=x11 \
  --enable-unsafe-swiftshader &

# whenever you want to see what it is doing
DISPLAY=:77 import -window root shot.png
```

That boots the real game, with real NW.js, real Node `require`, real storage and every plugin, on a
display that exists only in memory. Then it takes a picture of it.

---

## Why each piece is there

Every one of these was learned by it going wrong first.

### `--ozone-platform=x11`, and unsetting `WAYLAND_DISPLAY`

This is what makes it **invisible**. Chromium's ozone layer auto-detects Wayland, so on a Wayland
session `xvfb-run` alone is not enough - the process ignores the virtual X server it was handed and
opens a window on the real desktop anyway.

Verify rather than assume:

```bash
ls -l /proc/<pid>/fd | grep -c wayland     # 0 means it cannot reach the compositor
tr '\0' '\n' < /proc/<pid>/environ | grep DISPLAY
```

### Its own `--user-data-dir`

Without one, launching a second instance hands off to a game that is already open - Chromium prints
*"Opening in existing browser session"* and your run quietly becomes a new window inside somebody
else's session. A private profile also means no saves, configs or window state are shared.

### `--enable-unsafe-swiftshader`, **and** a context shim

Software WebGL needs both. The flag enables SwiftShader; the shim is needed because PIXI asks for a
context with `failIfMajorPerformanceCaveat: true` and Chromium honours that by refusing a software
renderer outright:

```
ContextResult::kFatalFailure: fail_if_major_perf_caveat + software gl
```

PIXI's own documentation on that setting names headless unit tests as the reason to disable it. The
shim strips the attribute from the request and touches nothing else:

```js
const original = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(type, attributes) {
  if (attributes && typeof attributes === 'object') { attributes.failIfMajorPerformanceCaveat = false; }
  return original.call(this, type, attributes);
};
```

Without it, `Graphics` reports **"Failed to initialize graphics"** and nothing else happens.

### Unplugging the gamepad

A headless run still sees the machine's real controllers. A drifting stick will walk through menus
on its own: two captures during the J-Lighting work landed on the quest journal with the selection
creeping between frames, which looked exactly like a plugin bug.

```js
navigator.getGamepads = () => [];
```

This belongs in the same category as the virtual display - a peripheral the run should not have -
rather than in the category of things that must never be faked. **Storage is in that second
category:** shimming `require('fs')` was considered and rejected, because plugins modify the save
path and a harness that falsifies it is no longer testing the game that ships.

---

## Getting past the title screen

Playtest mode boots to `Scene_Title`. To reach a map, call the scene API directly from the injected
script:

```js
SceneManager._scene.commandNewGame();
```

**This is not input simulation.** It proves nothing about key bindings or the input path - only
about what happens once a scene change occurs. For real input, either poke `Input._currentState`
from the same script, or attach over the DevTools Protocol and use `Input.dispatchKeyEvent`, which
synthesises events at the browser level and goes through the whole real path.

## Never guess a delay

Boot time varies wildly under software rendering - the same command reached the map in 8 seconds on
one run and was still on the title at 20 on another. Guessing produces screenshots of title screens
and quest journals.

`require('fs')` works inside NW.js, so have the game tell you when it is ready:

```js
if (SceneManager._scene.constructor.name === 'Scene_Map' && SceneManager._scene.isActive()) {
  require('fs').writeFileSync('/tmp/MAP_READY', 'ready');
}
```

and have the shell wait for that file before capturing.

---

## Injecting the script

`inject_js_start` is a **manifest key only**. `--inject-js-start` is not a command-line flag; passing
it does nothing at all and the script silently never runs (confirmed by making the shim log on
entry and watching for the line).

So injection means temporarily writing `inject_js_start` into the game's `package.json` and
restoring it afterwards. That mutates a tracked file for the duration of the run, which is tolerable
for a one-off diagnosis and **not** tolerable for anything that runs on every build.

The alternative, for a standing gate, is the DevTools Protocol: launch with
`--remote-debugging-port`, attach from outside, and use `Page.addScriptToEvaluateOnNewDocument`.
That injects the same shims without touching a single file in the game, and gives structured
exception capture instead of grepping Chromium's stderr.

---

## Seeing what it did

`import -window root` (ImageMagick) grabs the virtual display to a PNG, which can then simply be
looked at. `magick` also samples individual pixels, which is how a rendering claim gets checked
rather than eyeballed:

```bash
magick shot.png -format "%[pixel:p{640,400}]" info:
```

**Capture the control frame first.** The single most expensive mistake in the J-Lighting work was
chasing a rendering bug through four wrong hypotheses - the parent filter, the blend mode, the
sprite sizing, the texture contents - before capturing one frame with the effect disabled entirely.
That frame proved the mysterious colour washes were tileset art and the plugin had been correct all
along: sampling matched points across the two images gave multiply ratios of 0.21/0.29/0.29 against
an expected 0.18/0.29/0.29.

A control frame and two pixel samples would have ended it in five minutes.

---

## What this cannot tell you

- **Anything about how it looks.** Software rendering proves the thing runs. Whether a torch reads
  as warm, or a room feels oppressive, is still eyes on a real window.
- **Anything in the input path**, unless real events are dispatched over CDP.
- **Timing and performance.** SwiftShader is far slower than a GPU; frame counts here mean nothing.