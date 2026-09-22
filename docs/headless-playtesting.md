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

Everything below is run from the **CA repository root** (`ca/`), not from `chef-adventure/` - the
game directory is the argument, and the manifest being edited lives inside it.

```bash
SCRATCH=/tmp/headless            # anywhere outside both repositories

# 1. a display that exists only in memory, once per session.
pgrep -x Xvfb >/dev/null || (Xvfb :77 -screen 0 1280x720x24 -nolisten tcp & sleep 2)

# 2. put the probe where the manifest can name it, backing the manifest up first.
cp chef-adventure/package.json "$SCRATCH/package.json.backup"
cp "$SCRATCH/probe.js" chef-adventure/_probe.js
bun -e '
const fs = require("fs");
const manifest = JSON.parse(fs.readFileSync("chef-adventure/package.json", "utf8"));
manifest.inject_js_start = "_probe.js";
fs.writeFileSync("chef-adventure/package.json", JSON.stringify(manifest, null, 2));'

# 3. clear last run's answers, or you will read them again and believe them.
rm -f /tmp/PROBE_READY /tmp/PROBE_REPORT.json

# 4. boot the real game on the virtual display.
env -u WAYLAND_DISPLAY DISPLAY=:77 nw ./chef-adventure/ "test" \
  --user-data-dir="$SCRATCH/nw-profile" \
  --ozone-platform=x11 \
  --enable-unsafe-swiftshader > "$SCRATCH/nw.log" 2>&1 &

# 5. wait for the probe to say it got there, then look.
for i in $(seq 1 90); do
  if [ -f /tmp/PROBE_READY ]; then echo "ready at ${i}s"; break; fi
  sleep 1
done
DISPLAY=:77 import -window root "$SCRATCH/shot.png"
cat /tmp/PROBE_REPORT.json

# 6. always, even when something went wrong.
pkill -x nw
cp "$SCRATCH/package.json.backup" chef-adventure/package.json
rm -f chef-adventure/_probe.js
```

That boots the real game, with real NW.js, real Node `require`, real storage and every plugin, on a
display that exists only in memory. Then it walks itself to the thing under test, writes down what it
found, and takes a picture of it.

Steps 2, 3 and 6 are the ones that get skipped and the ones that cost the most: a stale report reads
as a successful run, and an unrestored manifest leaves the game pointing at a probe that no longer
exists.

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

## The probe

The `MAP_READY` trick below is the smallest form of something worth building properly. What actually
earns its keep is a **probe**: one injected script holding a small state machine, driven off a
`setInterval`, that walks the game to the situation under test, records what it finds, and writes a
report the shell can read.

How a script gets into the game at all is [its own section](#injecting-the-script) further down; this
is what to put in it. The shape, which every run in the messaging work used some version of:

```js
(function () {
  const fs = require('fs');
  const REPORT = '/tmp/PROBE_REPORT.json';
  const READY = '/tmp/PROBE_READY';

  // the two shims from above.
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attributes) {
    if (attributes && typeof attributes === 'object') { attributes.failIfMajorPerformanceCaveat = false; }
    return originalGetContext.call(this, type, attributes);
  };
  navigator.getGamepads = () => [];

  // anything the game complains about, captured rather than lost to stderr.
  const errors = [];
  window.addEventListener('error', e => errors.push(String(e.message)));
  const originalError = console.error;
  console.error = function (...args) { errors.push(args.map(String).join(' ')); return originalError.apply(console, args); };

  const log = [];
  let phase = 'boot';
  let ticks = 0;

  const finish = () => {
    fs.writeFileSync(REPORT, JSON.stringify({ phase, log, errors }, null, 2));
    fs.writeFileSync(READY, phase);
  };

  const tick = setInterval(() => {
    try {
      ticks += 1;
      if (ticks > 3000) { phase = 'timeout'; finish(); clearInterval(tick); return; }

      const scene = SceneManager._scene;
      if (!scene) return;
      const sceneName = scene.constructor.name;

      // ... phases ...
    } catch (e) {
      phase = 'threw';
      errors.push(String(e && e.stack ? e.stack : e));
      finish();
      clearInterval(tick);
    }
  }, 200);
})();
```

Four things in there are not decoration:

- **The whole body is inside a `try`.** A probe that throws stops ticking and writes nothing, and
  from the shell that is indistinguishable from a game that never booted. Catching means the failure
  arrives as a report saying `threw` with a stack in it.
- **`console.error` is captured, not just `window.onerror`.** The engine reports plenty through the
  former without ever raising the latter, and stderr from a backgrounded NW.js process is a poor
  place to go looking.
- **A tick ceiling.** Software rendering makes boot times wildly variable, so a probe with no ceiling
  can hang a shell wait for its full timeout with nothing written at the end of it.
- **A ready-marker separate from the report.** The report is rewritten as the run progresses; the
  marker is written once, at the end, and is the only thing the shell should wait on.

**The probe is a diagnostic instrument, and it earns that framing.** During the chatter work five
NPCs refused to say anything and the plugin looked wrong. The probe reported `eventRunning: true` at
every single sample, which is a fact about the map rather than about the plugin - the event pages had
been given `trigger: 3`, and trigger 3 is Autorun rather than the "autonomous" the name suggests, so
`$gameMap.isEventRunning()` never went false and no idle behaviour could ever fire. Nothing in the
suite could have caught that. Reading one number off a running game ended it immediately.

## Getting to a specific place

`commandNewGame()` reaches a map. Reaching **the** map is three phases and a wait on each, because
every one of them completes asynchronously:

```js
if (phase === 'boot' && sceneName === 'Scene_Title') {
  scene.commandNewGame();
  phase = 'newgame';
  return;
}

if (phase === 'newgame' && sceneName === 'Scene_Map' && scene.isActive()) {
  // the opening event owns the message system; stand it down so the probe owns it instead.
  $gameMap._interpreter.clear();
  $gameMessage.clear();

  // mapId, x, y, direction, fade.
  $gamePlayer.reserveTransfer(383, 16, 12, 2, 0);
  phase = 'transferring';
  return;
}

if (phase === 'transferring' && $gameMap.mapId() === 383 && scene.isActive()) {
  phase = 'arrived';
  return;
}
```

- **Clear the interpreter and the message queue on arrival.** A new game starts its opening event
  immediately, and that event owns `$gameMessage`. A probe that starts writing messages into a
  running cutscene gets neither its own message nor a useful error.
- **Wait on `$gameMap.mapId()`, not on the scene name.** The scene is already `Scene_Map` before the
  transfer resolves, so a probe keyed on the name alone proceeds on the wrong map.
- **`$gamePlayer.locate(x, y)` moves within the map you are already on**, with no transfer and no
  fade. That is how one run visited two NPCs - stand beside the first, sample, `locate` to the
  second, sample again.

Once there, drive the system under test directly rather than through an event:

```js
$gameMessage.setSpeakerName('\\N[1]');
$gameMessage.setFaceImage('face_je', 0);
$gameMessage.add('Plain \\C[2]red\\C[0] and \\*bold\\* and \\_slant\\_.');
```

This is the same trade the doc already names for `commandNewGame`: it proves what happens once the
message system is handed something, and nothing about the interpreter path that normally hands it
over. For the interpreter path, run a real event.

## Waiting on it, and cleaning up afterwards

The shell half is a poll on the marker, a capture, and an unconditional teardown:

```bash
for i in $(seq 1 90); do
  if [ -f /tmp/PROBE_READY ]; then echo "ready at ${i}s"; break; fi
  sleep 1
done

DISPLAY=:77 import -window root "$SCRATCH/shot.png"
cat /tmp/PROBE_REPORT.json

pkill -x nw
cp "$SCRATCH/package.json.backup" chef-adventure/package.json
rm -f chef-adventure/_probe.js
```

- **Delete the marker and the report before launching.** Both live in `/tmp` and both survive the
  previous run, so a probe that dies on boot will otherwise be read as a probe that succeeded,
  reporting last time's numbers.
- **Restore the manifest in the same command that kills the process**, not in a follow-up. A run that
  ends early - a timeout, a mistake, a stop - otherwise leaves a tracked file rewritten, and the next
  `hotfix` copies plugins into a game whose manifest is still pointing at a deleted probe.
- **`pkill -x nw` is the blunt form** and will take every NW.js process on the machine with it.
  `pkill -f 'nw ./chef-adventure/'` is the narrower one.

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

**Put the script inside the game directory.** The value is resolved against the package root, so
pointing it at a scratchpad path with a `../../../..` prefix is not the way to keep the tree clean -
copy the probe in under a throwaway name and delete it afterwards:

```bash
cp "$SCRATCH/probe.js" chef-adventure/_probe.js
cp chef-adventure/package.json "$SCRATCH/package.json.backup"
bun -e '
const fs = require("fs");
const manifest = JSON.parse(fs.readFileSync("chef-adventure/package.json", "utf8"));
manifest.inject_js_start = "_probe.js";
fs.writeFileSync("chef-adventure/package.json", JSON.stringify(manifest, null, 2));'
```

Back up the manifest **before** rewriting it, and restore from that copy rather than deleting the
key by hand - the file carries window sizing and chromium args that are easy to lose.

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

**The capture is not the game's own resolution.** CA is authored at 1920x1080 and the virtual display
above is 1280x720, so the frame arrives scaled by about 0.667. A coordinate read off a sprite inside
the game - `sprite.x`, `Graphics.boxWidth`, anything the probe reports - has to be multiplied by that
ratio before it names a pixel in the PNG. Getting this backwards sends you looking for a bug several
hundred pixels away from where the thing you are checking actually landed. Either scale the
coordinate, or size the Xvfb screen to match the game and skip the arithmetic.

Cropping and magnifying is what makes a small detail arguable rather than squinted at - a gap between
an icon and the letter after it, a border that may or may not be one pixel off:

```bash
magick shot.png -crop 260x60+250+600 +repage -scale 500% detail.png
```

`+repage` matters. Without it the crop keeps the original canvas offset, and everything downstream -
further crops, pixel samples, an append into a comparison strip - is measured against a geometry that
is no longer what the image looks like.

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