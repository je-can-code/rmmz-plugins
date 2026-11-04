# Ban loose JSDoc types (`any`, `*`, `object`)

## Decisions

- **2026-10-16, the goal.** Jeremy: "I want to flat out block and negate the possibility of using anonymous
  meaningless 'types' like any or object or *." The plugins cannot be TypeScript, but their JSDoc can still behave
  as if they were: "I can't use typescript but I can still pretend I have types."
- **2026-10-16, the way out is a reviewed allowlist.** A few places really do accept anything (see
  [The allowlist](#the-allowlist)). They get an allowlist like `verify:no-instanceof`'s, each entry with a written
  reason. TypeScript's `unknown` was the alternative, and it was not chosen.
- **2026-10-16, parked.** Measured and written up, not started: "we shouldn't actually execute this", and "I want
  this slop cleaned up."
- **2026-10-16, the scope, settled the same day:**
  - **Signatures are the standard, `void` included.** He first called plain `Function` acceptable, on the
    understanding that nothing better existed. Shown signatures: "that should be the standard- even if there is no
    input type or output type (void), that IS the type". Plain `Function` stays only where it means "any class"
    (about 28 tags in the save code and `SerializableRegistry`), which no signature can spell.
  - **The arrow form, `(actor: Game_Actor) => boolean`.** "arrow form is fine as a standard, I prefer it in most
    cases anyway." It names the parameters, and every TypeScript version reads it; TypeScript 7 no longer parses the
    Closure form, `function(Game_Actor): boolean`, which is in 69 tags today. Those convert, and a signature with
    nothing in or out is `() => void`.
  - **A changed signature should alarm at its call sites.** "if it changes on one side or the other, we should
    raise alarm bells (omg you added an input/output to that function which means we should validate the callsites
    somehow)." A comment scan cannot do that. It is a type checker's job: see
    [The TypeScript checker](#the-typescript-checker-measured-2026-10-16).
  - **Every configuration is typed against a class:** "all configurations should be typed against a class like
    'WeatherConfig' or 'SdpConfig' etc."
  - **`Array` and `Map` name their contents** ("Array and map should be qualified with their types"). Proposed, as a
    reading of that rather than his words: `Set`, `WeakMap` and `Promise` the same. Outside the save code's
    stored-value union, that touches 3 tags.
  - **One array spelling, not both.** Jeremy: "we should standardize around either ALL Array<T> or T[], not both."
    The recommendation is `T[]`: it is what he writes by hand, and it already outnumbers `Array<T>` 1,747 to 69.
    The 69 convert, with parentheses around a union: `(string|number)[]`.
  - **Build tools are out.** "I make those explicitly all-in-one and don't want to worry about types there."
  - **`unknown` is banned with the rest.** It should "never show up except in the places we would probably
    whitelist anyway- the boundaries of external data parsing."
  - **The allowlist is by file**, like `verify:no-instanceof`'s.
  - **No typedefs.** "We shouldn't have any typedefs in this repo, right? Why would we?" A shape that lives in the
    code is a class. Proposed, as what follows from that: the two typedefs that exist today become classes too,
    and the gate flags `@typedef` so none come back.
  - **J-ABS-Star's one loose type gets fixed** ("We can fix the one loose type in STAR."), an exception to that
    plugin's standing exclusion, for that one line.
  - **J-Weather's config shapes become classes**, hydrated from `config.weather.json` the way J-Base hydrates
    `$data*` into its `RPG_*` models.

## Severity

**Low** crash risk on its own, since a JSDoc type never runs. **Medium** for maintainability: every loose type is a
place the gates cannot check, and a place a reader has to go and read the code to learn what arrives.

## Gain

- Every type names something a reader can look up, and WebStorm's completion follows the names.
- A parameter renamed to a real class (`{Object} character` becoming `{Game_Character}`) is judged by
  `verify:no-phantom-calls` from that moment on, with no change to the gate.
- A shape that becomes a class is a real type: calls on it are judged like any other class's, and its declared
  fields give a follow-up check something to judge property reads against. That is where the unchecked reads
  counted below would finally be covered.

## Context

`verify:docs` asks only that a `@param` has a type, so `{object}` passes it. The typed-parameter rule in
`verify:no-phantom-calls` judges a parameter only when its type names classes it knows, so it skips every loose
one. Measured 2026-10-16: 292 parameters typed `object`, `Object`, `any` or `*`, across 261 functions, whose
bodies make **411 property reads and 12 method calls** that nothing verifies. A misspelled config key reads
`undefined`, and nothing says so.

Some of these types are not just loose but wrong, and loose is what let them stay wrong. The blob parsers in three
`_pluginMetadata.js` files (`sdp/core`, `passive/ext/difficulty`, `jafting/ext/create`) type the parsed blob
`{any}`, though it is an array they go on to `.map()` or `.forEach()`. And
`hud/ext/party/sprites/Sprite_ActorValue.js` types `actor` as `{Game_Actor}` on line 11 and `{object}` on line 29.
Expect more of these during the cleanup.

## Source

### The census (2026-10-16)

Every typed JSDoc tag was read (`@param`, `@returns`, `@type`, `@property`, `@typedef` and the rest), and every
part of each type was judged, nested ones included. So `object[]`, `?object`, `Object<string, any>` and
`{{tail: object}}` all count. An earlier count of 315 covered only top-level `@param` types, which is why this one
is about double.

| Scope | Typed tags | Loose | Bare containers | Files |
|---|---:|---:|---:|---:|
| `src/plugins` | 18,518 | 628 | 91 | 165 |
| `src/build-tools` (out of scope) | 911 | 148 | 0 | 20 |

**Loose** is `object` or `Object` (492 in the plugins), `any` (110), `*` (17) and `{}` (9). **Bare containers**
are `Function` with no signature (75), `Array` with no element type (10), and `Map`, `Set`, `WeakMap` or
`Promise` with no type arguments.

### Per ship

| Ship | Loose | Bare containers | Files |
|---|---:|---:|---:|
| `_base/ext/save` | 106 | 40 | 14 |
| `weather/ext/time` | 102 | 0 | 16 |
| `_base/core` | 100 | 24 | 26 |
| `weather/core` | 99 | 0 | 10 |
| `message/ext/bubbles` | 38 | 1 | 8 |
| `passive/ext/conditional` | 37 | 0 | 12 |
| `motion/core` | 25 | 0 | 4 |
| `message/core` | 13 | 1 | 6 |
| `abs/ext/input` | 13 | 0 | 3 |
| `abs/core` | 10 | 6 | 12 |
| `motion/ext/abs` | 9 | 0 | 2 |
| `sdp/core` | 9 | 0 | 6 |
| `message/ext/chatter` | 8 | 0 | 3 |
| `popups/core` | 8 | 0 | 4 |
| `jafting/core` | 5 | 2 | 2 |
| `abs/ext/metrics` | 5 | 0 | 1 |
| `abs/ext/allyai` | 4 | 0 | 2 |
| `abs/ext/boss` | 4 | 0 | 1 |
| `jafting/ext/create` | 4 | 0 | 2 |
| `passive/ext/difficulty` | 4 | 0 | 3 |
| `popups/ext/abs` | 4 | 0 | 2 |
| `lighting/core` | 3 | 0 | 2 |
| `hud/ext/input` | 2 | 0 | 1 |
| `omni/ext/monster` | 2 | 0 | 1 |
| `pixel/core` | 2 | 0 | 2 |
| `prof/core` | 2 | 0 | 2 |
| `prof/ext/knowledge` | 2 | 0 | 1 |
| `abs/ext/danger` | 1 | 0 | 1 |
| `abs/ext/juice` | 1 | 0 | 1 |
| `abs/ext/star` | 1 | 0 | 1 |
| `apt/core` | 1 | 0 | 1 |
| `hud/ext/party` | 1 | 0 | 1 |
| `omni/ext/quest` | 1 | 0 | 1 |
| `time/core` | 1 | 0 | 1 |
| `utils/core` | 1 | 0 | 1 |
| `passive/core` | 0 | 10 | 3 |
| `abs/ext/formula` | 0 | 3 | 2 |
| `cms/core` | 0 | 2 | 2 |
| `cms/ext/equip` | 0 | 1 | 1 |
| `level/core` | 0 | 1 | 1 |
| **total** | **628** | **91** | **165** |

### What the loose types are

The big clusters, so whoever picks up a ship knows what they are walking into:

- **J-Weather and J-Weather-Time (`weather/core` 99, `weather/ext/time` 102), a third of the total on their own.**
  Nearly all of it is the parsed `config.weather.json`, handed around as `{object}`. In J-Weather: `params` (33),
  `config` (23), `particle` (12), `layer` (11). In J-Weather-Time: `sky` (33), `table`, `digest`, `config`,
  `reading`, `day`. These are fixed shapes the plugins define themselves, so each one becomes a class.
- **J-Base-Save (`_base/ext/save`, 106 + 40).** Encoded section data (`{object} data`, and 19 `@returns {object}`),
  the stored-value union `object|Array|Map|Set|string|number|boolean|null`, `SaveCodec`'s declaration tree nodes
  `{value: Function|null, children: Map<string, object>}`, and class constructors and hook functions typed
  `Function`. The stored values are an allowlist candidate. The tree nodes have a real shape. The constructors can
  only be spelled `Function`, and the hooks could carry signatures (see the open questions).
- **J-Base (`_base/core`, 100 + 24).** The path search records in `TilePathSearch.js` and
  `PathSearchMemory.js` (`request`, `search`, `node`, and `character`, which is a `Game_Character`). The
  compute-and-cache helpers in `JCache.js` and `RPGManager.js` (`{object}` keys, `{Function} computeFn`,
  `@returns {any}`). `Window_FilterableList.js`'s `{*} item`. `RPG_Base`'s `{any} baseItem`, which is a raw
  database row. `Game_Event`'s `{any=} defaultValue`. `SerializableRegistry`'s constructors. And `Diagnostics` and
  `JsonMapper`, both allowlist candidates.
- **J-Passive-Conditional (`passive/ext/conditional`, 37).** Notetag tuples typed `any[]` and `any[][]`. Each
  tuple has a fixed layout, so each gets a tuple type.
- **J-Message-Bubbles (`message/ext/bubbles`, 38 + 1).** Layout records: `tail`, `entry`, `segment`, `legendGap`,
  `interruptions`.
- **J-Motion (`motion/core`, 25).** Motion `definition` and `state` records, plus `Object<string, any>` defaults
  holding `any` authored, configured and baked values.
- **Build tools (148, out of scope).** About half are acorn syntax-tree nodes, going by their names. The rest are
  parsed JSON and report records.

## Work

### The toolbox

Everything but the allowlist is fixed with a spelling the repo already uses somewhere:

| The loose type is really | Spell it | Already in |
|---|---|---|
| an instance of a class | the class name, `{Game_Character}` | everywhere |
| a shape the code builds or parses | a class of its own | J-Base's `RPG_*` models, hydrated from `$data*` |
| whatever the caller hands a generic helper | `@template T`, then `{T}` | `ExternalJsonConfigLoader.js` (`TConfigJson`, `TConfigResult`) |
| a notetag tuple | a tuple type, `{[number, string, number]}` | 124 tags, `TimeConditional.js` among them |
| a list or a map | `{Foo[]}`, `{Map<string, Foo>}` | 1,747 `T[]` already |
| a callback | an arrow signature, `{(battler: Game_Battler) => number}` | `ExternalJsonConfigLoaderOptions.js` |
| a configuration | a class named for it, such as `WeatherConfig` | J-Base's `RPG_*` models |

### The allowlist

Candidates, not yet triaged file by file:

- **`Diagnostics`' `details`.** Whatever devtools should print: a game object, an error, a plain record. It is
  printed, never read.
- **J-Base-Save's stored values** (`SaveEncoder`, `SaveDecoder`). Anything a registered model can hold.
- **`JsonMapper`.** Already the one file allowed `typeof`, because it is the type boundary for plugin parameters.

Entries are whole files and take `verify:no-instanceof`'s shape: the path in a list, and the reason in the gate's
header comment. Adding an entry is raised with Jeremy, never done quietly.

### The gate

Working name `verify:no-loose-types`; the real name is still Jeremy's to pick.

- Scan `src/plugins/**` only.
- Read every `/** */` block through acorn's `onComment`. A plain text scan mistakes a glob string such as
  `'src/plugins/**/*.js'` for the start of a comment.
- For each `@tag {type}`, take the type by matching braces rather than by regex, so multi-line types and
  `{{...}}` records come out whole. Skip `{@link ...}` and `{@code ...}`, which are not types.
- Blank out string literal types and record keys, then flag these anywhere in what is left:
  - `any`: `\bany\b`
  - `*`: `\*`
  - `object`: `\bobject\b`
  - bare `Object`: `(?<![\w$.])Object\b(?!\s*\.?\s*<)`
  - a bare `?` (Closure's unknown type): `(?<![\w$\])>}])\?(?=\s*(?:[|,>)\]}]|$))`
  - `{}`: `\{\s*\}`
  - `unknown`: `\bunknown\b`
  - any `Array`, bare or generic, since the spelling is `T[]`: `(?<![\w$.])Array\b`
  - `Map`, `Set`, `WeakMap`, `WeakSet` or `Promise` with no type arguments:
    `(?<![\w$.])(?:Map|Set|WeakMap|WeakSet|Promise)\b(?!\s*\.?\s*<)`
  - a Closure function type, since the spelling is the arrow form: `\bfunction\s*\(`
  - plain `Function`, outside the allowlisted "any class" files: `(?<![\w$.])Function\b`
- Flag every `@typedef` tag as well.
- Selftest, wired like `verify:no-phantom-calls:selftest`. The must-pass near misses start with the ones the
  census actually tripped over:
  - qualified names: `rm.types.Map`, `import('acorn').Function`
  - postfix nullables: `number?`, `Error?`

  Then the shapes the blanking exists for, and the spellings that are legal:
  - a typed map: `Object<string, number>`, `Map<string, Game_Event>`
  - a string literal type: `'any'`
  - a record key that happens to be a type word: `{{object: Game_Event}}`
  - an arrow signature, `(battler: Game_Battler) => number`, and `() => void`

  The must-fail plants: one per atom, one nested (`Map<string, object>`), one multi-line record, one
  `Array<Game_Event>`, one Closure signature, one plain `Function` outside the allowlist, and one `@typedef`.

### Steps

1. Settle the open questions below.
2. Build the gate and its selftest, but keep it out of `verify-pre-compile`. Run by hand, it is the work list.
3. Triage the allowlist. Each candidate either gets its reason written into the gate's header, or a real type.
4. Clean up ship by ship, J-Weather, J-Weather-Time and J-Base-Save first (half the total between them). A shape
   that becomes a class is real code: it needs tests to keep coverage at 100%, and J-Weather's need hydrating
   from `config.weather.json`. Run `verify:no-phantom-calls` after each ship: every parameter renamed to a class
   becomes judgeable, and may surface a real bug.
5. Turn the two existing typedefs into classes: `JabsTeamDefinition` (`abs/core/managers/JABS_TeamRules.js`) and
   `RecipeSpendLine` (`jafting/ext/create/managers/RecipeSpendResolver.js`).
6. Fix J-ABS-Star's `{any} params` (`abs/ext/star/objects/Game_Interpreter.js:6`).
7. Respell the 69 `Array<T>` as `T[]`, and the 69 Closure signatures as arrows.
8. When the gate reports zero, wire it into `verify-pre-compile` after `verify:docs`, and add it to the gate list in
   `CLAUDE.md`.

## The TypeScript checker (measured 2026-10-16)

The gates in this repo do pieces of a type checker's job, and the real one can read plain JavaScript: with
`checkJs`, TypeScript checks `.js` files against their JSDoc types, with no `.ts` anywhere and no change to what
ships. `tsconfig.json` already points it at `src/plugins`, `project/js` and `src/defs`, with `checkJs` off.

Turned on against a scratch config (nothing in the repo changed):

- **TypeScript 6.0.3** checks the whole tree in 5.5 seconds and reports **21,218 errors in `src/plugins`**, across
  97 ships. TypeScript 6 turns strict mode on by default, and about 4,000 of them are strict-mode complaints
  (implicit `any`, possibly `undefined`). Most of the rest are things the checker cannot see, not bugs:
  - **Cross-ship globals.** 4,342 "Cannot find name", `RPGManager` alone 622. Every source file is a module, so a
    class another ship hoists into a global is invisible to it.
  - **Members added by other files.** 7,869 of the 9,480 "Property does not exist" are on engine and J classes:
    J-Base's `String.empty` (571), the `_j` state namespace on `Game_Battler`, `Game_Party`, `Game_Actor` and the
    rest, `getAllNotes` on `Game_Battler`.
  - **547 are reads on a value typed `{object}`**, which TypeScript already refuses: the loose types this item
    bans.
- **TypeScript 7.0.2**, the native port that `typescript` now installs, crashed on the tree (an internal panic).
  Its change notes (`microsoft/typescript-go`, `CHANGES.md`) also drop constructor functions (`function C() {}`
  with methods assigned to `C.prototype`), which is how the RMMZ engine itself is written, and the Closure function
  syntax. Members a plugin adds to a class from another file were never visible to TypeScript in any version;
  TypeScript's way to declare them is an interface beside the class, `interface Game_Actor { foo(): void; }` in a
  `.d.ts`, which a generator could write for every ship.
- **The generated engine defs do not parse.** `src/defs/generated/rmmz/**` declares 113 getters inside
  `declare namespace` blocks (`get app(): unknown;` in `Graphics.d.ts`), which TypeScript rejects (TS1434). The
  measurement respelled them as `let` in its scratch copy; `generate-rmmz-engine-defs.js` would need the same fix.

So a real checker is possible, but not drop-in. It would first need generated declarations for every ship's
globals and for every member a ship adds to another's class, the way `defs:generate` already does for the engine.

## Open questions

- **Allowlist granularity, again.** By file was the call, with a reason invited. Here is one: `SaveCodec.js` mixes
  `Function` meaning "any class" with hooks (`seed`, `encode`, `decode`) that should carry signatures. A
  whole-file entry would let the hooks keep plain `Function`.
- **Should the gate also ban inline record types?** 651 tags in 215 files spell a shape inline, such as
  `{{x: number, y: number}}`: a typedef without the name. The gate as described allows them. The answer decides the
  size of the cleanup: roughly a hundred loose `object` shapes become classes already (112 distinct ship-and-name
  pairs are typed `object`).

## Definition of done

- [ ] `bun run verify:no-loose-types` (or whatever it ends up named) reports zero, and runs in `verify-pre-compile`
- [ ] its `--selftest` passes: every plant flagged, every near miss clean
- [ ] every allowlist entry has its reason in the gate's header comment
- [ ] coverage is still 100%: the new classes are code, and carry tests
- [ ] `CLAUDE.md` lists the gate with the others
- [ ] `bun run hotfix` green

## Notes

- Counted 2026-10-16 with a throwaway census script. The gate replaces it, so none of it is committed.
- Related: the typed-parameter rule in `src/build-tools/verify-no-phantom-calls.js`, which is what skips
  loose-typed parameters today.
