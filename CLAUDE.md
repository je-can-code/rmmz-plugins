# rmmz-plugins

A monorepo of plugins for RPG Maker MZ ("RMMZ"), authored by **Jeremy** (JE) — the leading `J` in every
namespace (`J.ABS`, `J.SDP`, `J.PIXEL`) stands for him. ESM source under `src/plugins/**` is bundled by
Vite/Rolldown into one readable script per ship.

Where things live is documented separately in [`docs/project-structure.md`](docs/project-structure.md).
This file is the rules: what to write, how to write it, and what never to write.

---

## Working with Jeremy

Be warm, optimistic, and personable. Show character — humor and enthusiasm are welcome when they fit.
Use emoji liberally in conversation; they add tone and clarity.

**Never put emoji in code, comments, commit messages, or PR bodies.** Chat only.

Ask questions to clarify before executing, and explain what you did and why. Prefer **discuss → plan →
execute**: surface assumptions, agree on the shape of the work, then build it. A quick "here's what I'm
about to do — sound right?" followed by a yes is a sufficient plan.

**Gamepad terminology:** use PlayStation names. Face buttons are **Cross** (bottom), **Circle** (right),
**Square** (left), **Triangle** (top). Shoulders are **L1/R1**, triggers **L2/R2**, and the **D-pad** is
the D-pad. Do not say "A/B/X/Y" unless Jeremy asks for a cross-platform mapping table.

## Working in this repo

- Read files with the file tools. Do not shell out to `cat`, `sed`, `awk`, `head`, or `tail` to read or
  search source.
- **Never modify code with regex, `sed`, or `perl`.** Read the file, then edit it. If a change is
  genuinely mechanical across many files, ask before starting the pass.
- **Bun only** for anything you run. Never `npm`, never `yarn`, never `node`, never Python — a
  throwaway data script is `bun script.js`. (Some `package.json` scripts shell out to `node`
  internally; that is existing wiring, not license to invoke it yourself.)
- When you are about to say "make sure X exists" or "ensure you've implemented Y" — go look. Confirm it
  exists, or say plainly that it does not.
- If a needed method or property is genuinely missing, implement it. Do not work around its absence with
  a guard.

### CodeGraph

A CodeGraph MCP server is configured at user scope, so `codegraph_*` tools are available here. The
server ships its own usage instructions and they load automatically — follow those for tool selection
rather than looking for a second copy in this file.

**The one thing the server does not warn you about:** `codegraph sync` can cheerfully report *"Already
up to date"* while the index is badly stale. On 2026-07-30 this repo's index claimed 1,810 files against
a tree holding 2,200, and every symbol added in the preceding six weeks returned no results — `sync`
did not notice any of it. A full `codegraph index` repaired it (2,784 files; edges 17.6k → 38.9k).

So if a lookup returns nothing for a symbol you are confident exists, **do not conclude it is absent.**
Run `codegraph status`, compare its file count against a real `find`, and if they disagree run
`codegraph index` — not `sync` — before trusting another answer.

---

## Build and verify

```bash
bun run hotfix
```

That is three phases, and it is more than a build:

| Phase | What runs |
|---|---|
| `verify-pre-compile` | `lint`, then eight source gates: `verify:docs`, `no-typeof`, `no-instanceof`, `no-optional-chaining`, `no-direct-property-getset`, `no-private-in-serializable`, `no-late-window-command-state`, `no-self-calling-accessors` |
| `compile` | `clean:out`, then `build:all` |
| `verify-post-compile` | `verify:ships`, **the full test suite**, then `copy:to-all` |

**`hotfix` is the most important command in this repo** — you can learn essentially no other command and
still be useful here. It runs the tests, so a green hotfix means the ships built *and* the suite passed.

Most of the style rules below are not honor-system: there is a gate with a matching name, and each
gate's source file opens with a long comment explaining its reasoning. When a rule surprises you, read
the gate — that is where the argument lives.

**`hotfix` is the build.** Do not run `bun run build:<plugin>` plus a manual `cp` to save time — the full
run is sub-second in practice, and single-ship runs risk a partial `out/`, skipped destinations, and
drift from what actually gets committed. Never copy built plugin files by hand. If `hotfix` fails, fix
the root cause rather than falling back to manual copies.

*(Exception: a one-off `build:<plugin>` is fine when Jeremy explicitly asks for it and expects no
mirroring.)*

`verify:ships` fails the build if:

- any `out/**/*.js` has a line-start `import` or `export`
- any `out/**/*.js` has `$1` suffix collisions (except `RegExp.$1`)
- any non-`_base` source file imports from `_base/`
- any non-`_base` source file redefines or exports `TextManager` / `ColorManager` as a class, or exports
  `IconManager` as a class
- any plugin source uses `var`
- any plugin source file exports anything other than `export default` (exempt: `_metadata/meta.js`)
- any plugin source assigns bootstrap wiring onto `J.*` outside `_metadata/initialization.js`
- any plugin source mutates runtime state on `J.*`

`verify:docs` gates JSDoc shape across `src/plugins/**` and `src/build-tools/**` — including the build
tools themselves. Scope it while iterating:

```bash
bun run verify:docs --glob 'src/plugins/<ship>/**/*.js'
```

**Lint is not scoped to your diff.** Fix every lint error surfaced during a session, including
pre-existing ones in files you did not otherwise touch. Warnings may remain when justified.

---

## Architecture

### The ship bundle contract

RMMZ loads **one script per plugin** — there is no `import`/`export` at runtime. Rolldown emits a single
readable file (not an IIFE) per ship into `out/`.

| Scope | Rule |
|---|---|
| **Same ship** | `import` / `export default` between colocated modules. Every new file must be reachable from that ship's `entry.js` |
| **Cross-ship** | **Never** import from another plugin's tree. After the owning ship loads, use its globally hoisted top-level bindings (`ParameterRegistry`, `IconManager`, …) directly |
| **RMMZ engine globals** (`TextManager`, `ColorManager`, …) | **Augment in place**: `TextManager.maxTp = function() { … }`. The engine defines them before plugins load |
| **`IconManager`** (a J-Base global, not an engine one) | **Defined** in `_base/managers/IconManager.js` as a static class. Extension ships **augment** it: `IconManager.foo = function() { … }` |

```javascript
// BAD — cross-plugin source import bundles a second copy into this ship.
import ParameterRegistry from '../../../_base/core/ParameterRegistry.js';

// GOOD — J-Base loads first; the binding is a hoisted global by then.
ParameterRegistry.register(…);
```

### The `J.*` namespace is for bootstrap only

`_metadata/initialization.js` owns everything on `J.*`, and it holds only four kinds of thing:

- the namespace shell (`globalThis.J ||= {}`, then `J.SDP = {}`)
- the `Metadata` plugin instance
- `Aliased` alias maps
- `RegExp` tables and small `Helpers` surfaces used across the ship at runtime

**Never re-export a same-ship class onto `J.*`.** If the class ships in the same bundle, colocated
modules reach it by `import`. Hanging it on the namespace creates two paths to one thing, one of them
dead for maintainers.

**Never mirror a hoisted global onto `J.*` or `globalThis`.** The only permitted `globalThis` write in a
plugin is `globalThis.J ||= {}`.

**The rule runs both directions.** Nothing that belongs in `initialization.js` may appear in any other
source file. If a feature file needs an alias map, **assume it already exists** and add the declaration
to `initialization.js` — do not instantiate it inline where it is used. `verify:ships` catches the
`J.*` assignment mechanically, but the authoring habit is the point: bootstrap lives in one file so a
reader can learn the whole shape of a ship by opening it.

```javascript
// BAD — SdpMasteryManager is colocated in this ship; import it.
J.SDP.MasteryManager = SdpMasteryManager;

// BAD — ParameterRegistry is already a hoisted global from the J-Base bundle.
J.BASE.ParameterRegistry = ParameterRegistry;

// BAD — Scene_Difficulty is already hoisted.
globalThis.Scene_Difficulty = Scene_Difficulty;
```

**The test:** does this class's source file ship in the same bundled `.js` as the caller? → `import`.
Does it ship in another plugin's `.js`? → use the global class name.

### Namespace convention

Namespaces mirror the directory path and ownership chain:

**`J.<OWNER>.<EXT>.<CONSUMER>`** — the leftmost segment after `J` is the plugin that *owns and defines*
the namespace. Each segment to the right narrows scope.

| Namespace | Meaning | Lives in |
|---|---|---|
| `J.ABS` | Core ABS plugin | `src/plugins/abs/core/` |
| `J.ABS.EXT` | "ABS owns these; they are optional extensions of ABS" | defined in `abs/core`, consumed by `abs/ext/*` |
| `J.ABS.EXT.ALLYAI` | Ally AI is an extension of J-ABS | `src/plugins/abs/ext/allyai/` |
| `J.PIXEL` | Core Pixelistics plugin | `src/plugins/pixel/core/` |
| `J.PIXEL.EXT.ABS` | The ABS bridge is an extension of J-Pixelistics | `src/plugins/pixel/ext/abs/` |

**The test:** which plugin's directory does this file live in? That plugin owns the top-level segment. A
file in `pixel/ext/abs/` uses `J.PIXEL.EXT.ABS.*`, never `J.ABS.EXT.PIXEL.*` — which would assert the
opposite ownership.

### Augment vs. inherit

- **Augment** — change behavior on a class defined outside this plugin (engine or another plugin). Use
  prototype syntax and the alias map pattern. Never `class` / `extends` for augmentation.
- **Inherit** — a new class deriving from an engine base (`Scene_*`, `Window_*`, `Spriteset_*`). Use
  modern `class X extends Y`.
- **Edit our own class** — keep whatever style it was authored in. Do not convert a prototype class to
  modern syntax just because it exists now.
- **New helper or manager**, not derived from an engine class → modern `class`.

The alias pattern:

```javascript
/**
 * Extends {@link #SOME_METHOD}.<br/>
 * Also does [the thing that is happening here].
 */
J.SOME.Aliased.SOME_TYPE.set('SOME_METHOD', SOME_TYPE.prototype.SOME_METHOD);
SOME_TYPE.prototype.SOME_METHOD = function(...args)
{
  // perform original logic.
  const original = J.SOME.Aliased.SOME_TYPE.get('SOME_METHOD')
    .call(this, ...args);

  // new or modified logic, which may produce an updated result.
  this.someSideEffect(original);

  // return whatever is relevant, if anything.
  return original;
};
```

### Serialized models

Models saved to file via `JsonEx` use **modern `class` syntax** and call
`SerializableRegistry.register(ClassName)` at the bottom of the file — after the closing `}`, before
`//endregion`.

```javascript
class SkillEquipSlot
{
  // …
}

export default SkillEquipSlot;
SerializableRegistry.register(SkillEquipSlot);
```

This is **mandatory**. Without registration `JsonEx` cannot restore the class on load, so any prototype
method on the model silently breaks after a save/load cycle. See
`src/plugins/_base/core/SerializableRegistry.js` and `JABS_HitstopData.js` for the reference pattern.

**`Map` and `Set` are safe in stored fields.** J-Base extends `JsonEx._encode` / `_decode` to handle
both (`src/plugins/_base/core/JsonEx.js`). Prototype constructors are no longer required for
serializable models — the registry replaced that workaround.

**No `#private` fields or methods in a registered class** (`verify:no-private-in-serializable`). RMMZ
rebuilds saved objects from the prototype and copies properties across — **the constructor never runs**.
Private members are brand-checked against instances the constructor actually produced, so a restored
object carries the prototype without ever having been branded, and the first `this.#anything` it touches
throws. Use underscore-prefixed fields with accessors instead.

The registry audit of pre-existing models is ongoing; **new models must always register.**

### `Window_Command` subclasses seed state early

Vanilla's `Window_Command.prototype.initialize` ends by refreshing, and refreshing is what calls the
subclass's `makeCommandList`. So by the time a subclass's own constructor body or class-field
initializers run, **the command list has already been built** — and it was built against undefined
state. Both natural places to put state are too late.

Seed it in the `initMembers` hook instead, which runs early enough to be visible to `makeCommandList`.
`verify:no-late-window-command-state` enforces this.

### Database objects at runtime

Vanilla MZ stores `$data*` as arrays of JSON blobs. **J-Base hydrates those into custom class
instances** (`src/plugins/_base/database/`, e.g. `RPG_BaseItem extends RPG_Base`). When working with
`$data*` entries, `RPGManager`, or notetag getters, assume the hydrated models — not stock engine
prototypes, and not "plain JSON forever." Synthetic rows must follow the same constructor patterns as
real rows when they participate in note parsing.

Read state through the accessor, not the table: `battler.state(id)`, never `$dataStates[id]`.

Use `RPGManager` for all notetag parsing. **Never parse a `note` string by hand.**

### Miscellaneous

- No IIFEs. Object-driven namespacing and aliasing instead.
- No `async` / `await` — RMMZ's runtime does not accommodate it. There are currently zero occurrences in
  plugin source; keep it that way.
- Wrap file contents in `//region` / `//endregion`, with the region name being exactly the filename.
  These are **navigation aids for reading source**, not ship artifacts — Rolldown strips them, so of
  2208 in source only ~98 survive into `project/js/plugins/`. They earned their keep in the pre-ESM
  era of very long single files; post-migration each file holds one class, so they matter less and
  roughly a hundred newer files skip them. Match the file you are in; wrap anything new.
- `PluginManager.registerCommand` uses **`J.*.Metadata.name`** (lowercase). J-Base also sets a legacy
  `Metadata.Name`; do not use `.Name` anywhere else.
- Never add a nested block that trips oxlint's `no-lone-blocks`.

---

## Code style

### Formatting

- **Allman braces** — opening `{` on its own line, for functions, classes, and every block, including
  arrow functions.
- **2-space indent**, semicolons always, **single quotes** for strings — in code and in doc examples.
- **No trailing newline on plugin files.** The last character of the file is the last character of the
  last line. When writing a file, do not append `\n` after `//endregion`.
- Line length caps at **120**, except `_annotations.js` (200). This, Allman braces, indent, quote style,
  and the no-trailing-newline rule are **layout conventions carried by the formatter, not by lint**.
  Oxlint has no `max-len` and no `eol-last`; its config schema exposes 855 rules and none are layout
  rules, because oxc leaves formatting to a formatter by design.
- **The formatter is JetBrains/WebStorm**, and its configuration is committed at
  `.idea/codeStyles/Project.xml` — `BRACE_STYLE`, `CLASS_BRACE_STYLE`, and `METHOD_BRACE_STYLE` are all
  `2` (next line), with `ELSE_ON_NEW_LINE` / `CATCH_ON_NEW_LINE` and a 2-space indent. That file is the
  machine-readable source of truth for layout. Nothing in CI enforces it, so when writing code by hand,
  match it deliberately.
- Template literals for interpolation, never `+` concatenation.
- Destructure when using more than one property from an object or array.
- Trailing commas in multiline arrays/objects are fine and often useful — they signal that more entries
  are available.
- Spaces around operators, after commas, and inside array brackets: `const [ , traitName ] = match;`
- One class per file — prototype or modern, never two.
- Prefer array methods (`forEach`, `map`, `filter`) over `for..of` — a genuine preference rather than a
  ban; `for..of` appears where an early exit or an index actually earns it.
- Prefer modern idioms: `this._j ||= {}` over `if (!this._j) this._j = {}`.
- `#private` for modern class syntax, **except in any class registered with `SerializableRegistry`** —
  see below. Underscore prefixes are the prototype-era convention and are used very rarely here.
- **`var` is forbidden.** Shipped bundles may contain Rolldown-emitted `var ClassName = class` — that is
  bundler output, not source style.
- **No optional chaining (`?.`), ever.** Code that appears to need it should be rewritten so it does not.
- **No nested ternaries.** Spell them out as `if` blocks.

### Comments and JSDocs

Jeremy's plugin code uses **pedagogical comments** on purpose — the same quality that made BlizzABS
(RMXP, by Blizzard) legible to newcomers. The comments are a voice-over so someone opening the file can
follow intent, control flow, and policy without reverse-engineering them. That is why "obvious" labels
matter: they landmark alias chains, guards, and loops for a human reader.

The audience is a developer years from now with nobody to ask. Write for them: explain the **why**, not
only the what.

**JSDocs — always, and always multiline.** Classes, functions, fields, getters, setters, properties. One-line
`/** … */` blocks are not acceptable.

```javascript
/**
 * Allied battlers within default proximity, excluding self.<br/>
 * Used by {@code alliesNearby} gates — self never counts toward the tally.
 * @param {Game_Battler} battler The battler whose neighborhood we measure.
 * @returns {JABS_Battler[]}
 */
```

- The summary states intent, policy, when and why. `verify:docs` requires at least 15 characters of real
  prose — but the bar is comprehension, not character count.
- `@param` needs a type **and** a description. The name must match the declared parameter exactly,
  including any `_` prefix.
- `@returns` is type-only; the summary carries the meaning.
- **Never echo Jeremy's feedback into a JSDoc.** Document what the method is for, never the history of
  how it got there. Changelogs live in `_annotations.js`, nowhere else.
- Never write "this replaced X" or "used to be Y" in any comment.
- Regex definitions get a `<pre>` block with the structure, an example, and the parsed translation:

```javascript
/**
 * The AP reward an enemy yields on defeat.
 *
 * <pre>
 * Structure:
 *  <ap:AMOUNT>
 *
 * Example:
 *  <ap:12>
 *
 * Translation:
 *  AP gained: 12
 * </pre>
 * @type {RegExp}
 */
J.APT.RegExp.ApReward = /<ap: ?(\d+)>/i;
```

**Inline comments — almost every line of a body of substance.** Lowercase, ending in a period, on the
line **above** the code. Never on the same line as code, and never both above and beside.

They matter most in functions that stack conditions — `isX` / `canX` / `shouldX` — where every guard is
a policy decision that deserves to be named.

The exemption is simply **where it does not make sense**: a body that is one trivial read or write
(`return this._j._abs._someProperty;`), a one-line function whose JSDoc already says everything, and
manifest-ish files like `entry.js`, `meta.js`, and vite configs.

**The alias landmark.** An alias chain should carry `// perform original logic.` above the
`.get(…).call(this)`. It is a floor, not a quota: **if a comment already sits there and means the same
thing, that satisfies the requirement — do not stack a second one on top of it.** Roughly 90 sites in
this repo already have redundant twins from tools that pattern-matched the exact sentence instead of
reading the one that was already there. Do not add to them.

### Do not write defensive code

This codebase assumes valid state. The following are forbidden:

```javascript
if (!J || !J.ABS || !J.ABS.EXT || !J.ABS.EXT.STAR || !this._j || !this._j._abs) { … }
someMethod().filter(x => !!x)   // the contract already excludes null
(someMethod() || [])            // the contract already returns an array
typeof this.getUuid === 'function'
```

Every one of these implies null can arrive from something that guarantees it will not, which leaves a
future reader asking a question with no answer. **The correct response to a contract violation is a loud
bug, not a silent filter.** If you do not know what a method returns, read it.

**`typeof` is effectively banned.** There is exactly one legitimate use in the whole repo:
`_base/_utilities/JsonMapper.js`, the implementation of the RMMZ plugin-parameter parser. That file *is*
the type boundary, so inspecting raw types is its entire job. Everywhere else the shape is guaranteed —
all JSON in this project is written by the JMZ data editor, and `JSON.parse` either succeeds with the
right shape or throws. If the editor does not yet write a field, fix the editor, not the plugin.

**`instanceof` is banned too**, with a small reviewed allowlist (`verify:no-instanceof`). Plugin code
should never need it: hydrated `RPG_*` models carry semantic predicates — `isSkill()`, `isEquipItem()`,
`isActor()`, `isMapScene()` — and `SerializableRegistry` restores real prototypes across `JsonEx`
round-trips, so deserialization guards are pointless. Reach for the predicate. If you believe you have
found a genuine exception, raise it rather than adding yourself to the allowlist.

Never guard engine globals. Never write save-migration guards — `||=` in `initMembers` guarantees the
fields exist. Never probe from core whether an extension is loaded; core does not know about
extensions, extensions alias into core.

**The one real exception is cross-plugin, and only cross-plugin:** when a path must work whether or not
an optional sibling plugin is installed, check the namespace once.

```javascript
// GOOD — J-ABS is genuinely optional here.
if (J.ABS)
{
  // JABS-specific behavior.
}
```

One check, at the namespace, in a path that is honestly optional. Not a chain.

### Return values

Methods return a **typed sentinel** when there is nothing meaningful to return: `0` for numbers,
`String.empty` for strings, `[]` for arrays, `false` for booleans. `null` and `undefined` are almost
never returned.

When a method *can* return null, its JSDoc says so explicitly and says when. The main case is
`RPGManager` note-parsing with a `nullIfEmpty` parameter (default `false`); callers opt in when null
carries more meaning than the sentinel, and immediately null-coalesce into a plugin parameter default.
That coalescing is intentional — do not remove it.

### State

State is shaped `this._j.<PLUGIN_ABBREVIATION>.<CONTAINER>.<NAME>` — for example
`this._j._abs._input._lastInput`.

- Declare every property in `initMembers`, or the plugin-specific equivalent (`initJabsMembers`). Never
  instantiate a property dynamically.
- In modern class syntax, declare fields in the class body above the constructor, with defaults and
  JSDocs.
- **Never touch `this._foo` directly** outside the constructor and the owning mutator. Everything else
  goes through `someProperty()` / `setSomeProperty(value)`. Reaching past an accessor couples callers to
  storage they do not own, and turns any future change to that storage into a repo-wide search.
  Enforced by `verify:no-direct-property-getset`. **Namespaces are not fields** — the nested underscore
  properties that model namespaces (`this._j._abs._input`) are exempt.
- **An accessor may never call itself** — that is unbounded recursion, and it is the natural failure
  mode of the rule above: the accessor is the one place that *must* touch the field directly. Enforced
  by `verify:no-self-calling-accessors`.
- Never mutate state outside a setter.
- Boolean getters read `hasSomeState` / `isSomeState`; boolean setters read `flagSomeState` /
  `toggleSomeState`.
- Never initialize state inside a getter or setter. The one exception is a window that must compute
  properties at initialization — use a shared init function (like `_root()`) to establish defaults.
- **`is*` / `can*` / `should*` methods must be free of side effects.** They answer a question. They do
  not change anything.

### Complexity

- Target cyclomatic complexity ≤ 20 per method; extract private helpers before exceeding it.
- Do not duplicate blocks longer than ~8 lines — extract a helper.
- Prefer data-driven rendering (build an array, iterate) over repeated if-blocks drawing similar rows.
- When two functions differ only by a small behavior, implement one and have the other delegate.
- Every function is one of two things: an **orchestrator** calling helpers in sequence to perform an
  overall process, or a **helper** with exactly one job.
- Prefer readability over concision. Do not hesitate to write a small method that does one menial
  transformation if it makes the caller readable top to bottom.
- Name variables in camelCase, not one or two letters — except coordinates (`x`, `y`, `cx`, `cy`).

### Logging

Never ship logging in production code. `console.log` is for debugging only; the `J.LOG` namespace is
in-game logging, which is a different thing entirely.

### Tags

Notetags take one of these shapes:

- `<tag:value>` — `<sight:5>`
- `<tag:[value1, value2, …]>` — `<drop:[item, 1, 25%]>`
- `<tagForBooleanValue>` — `<showMinimap>`

- After a `:`, allow exactly one optional space before the capture: `: ?`.
- Tags are case-insensitive unless casing is semantically meaningful.
- A matched tag is a valid tag. If it does not match the regex it is simply invalid and gets ignored.
- Multi-line tags are acceptable but not preferred; keep one line per value or concept.
- Whether duplicate tags are allowed is **contextual** — some plugins permit multiples, others do not.
  Ask rather than deducing, unless you have specific knowledge of the tag in question.

---

## Testing

```bash
bunx vitest run test/plugins/<path>   # fast — iterate with this
bun run test                          # rebuilds every ship first; only when you need that
```

Tests import plugin source directly as ESM, stubbing globals on `globalThis` and using `vi.mock` where
needed. Reserve VM-style bundle evaluation for prototype-patch and metadata testing.

- `test/plugins/<family>/**` mirrors `src/plugins/<family>/**` for unit tests; `_component/` within a
  family holds scenario and real-chain tests.
- **One `it` per code branch**, not per behavior, with inline `// Arrange` / `// Act` / `// Assert`
  comments in every test.
- Push a single file toward complete coverage before moving to the next. Depth over breadth.
- Each JABS extension pack gets its own isolated fixture — never share one between packs.
- `vi.spyOn` on a bare-global plugin object leaks into later tests in the same file. Restore manually,
  per test; do not rely on `restoreAllMocks`.
- **Scenes, sprites, and windows are deliberately coverage-invisible.** Logic found in a view gets
  extracted into a service and tested there — never covered in place.
- If writing a test surfaces a real bug or dead code, **stop and raise it** rather than testing around
  it. A block that only calls `console.error` is a deletion candidate, not a coverage gap.

---

## Git and pull requests

- **Never push directly to `main`.** All work goes through a feature branch and a PR, no exceptions.
- **Squash-merge every PR.** No merge commits, no rebase merges.
- Scope a work item to a single PR. Do not propose phased or split implementations without a hard
  blocker.
- **Never reference Claude, Cursor, AI, or any AI tool** in a commit message, PR body, code comment, or
  anywhere else in the repo. No `Co-Authored-By` trailers, no "Generated with" footers. Jeremy is the
  sole author of everything here, and commits must read in his own engineering voice.
- Use the `gh` CLI for GitHub operations. Write PR bodies to a temp file and pass `--body-file` rather
  than inlining a heredoc — bodies contain backticks and `$`, and the shell will happily mangle both.
- **PR body format:** one `## \`J-PluginName\` [major/minor/patch] update` section per touched ship, with
  bullet points beneath. No generic Summary / Test Plan tables.
- **Commit the full tree.** PR scope is explained in the description, not by omitting files. Include the
  built output under `project/js/plugins/` that `hotfix` produced.
- **Version bumps and changelogs are PR-time work only.** While building a feature, do not edit
  `meta.js` (`PLUGIN_VERSION`) or the `CHANGELOG:` blocks in `_annotations.js`. At PR time, reverse-
  analyze the diff per ship to decide major / minor / patch, then write the changelog. A ship only gets
  a version section if its tree actually changed.
- Assume a sibling Claude session may be working in this repo right now. Unexplained changes in the tree
  are usually them, not corruption.

---

## Known in-flight work

- **`abs/ext/star` is incomplete and off-limits** — no tests, no bug fixes, no refactors — until Jeremy
  finishes the plugin. Its `StarPhases.js` TDZ bug is known and already flagged; do not re-raise it.
- **`SerializableRegistry` audit** of pre-existing models is ongoing. New models always register.

Historical work items live in `.backlog/`, split into `unstarted/` and `completed/`. That directory is a
record of decisions, not a set of active instructions.
