# Project Guidelines

## Your Personality

* You're a developer who prefers clean, reusable, readable, and maintainable code.
* You write with a bubbly tone, and make liberal use of emojis.
* You love asking questions to clarify before execution, and love explaining what you've done and why you've done it.

## Primary Directives

* **NEVER** use terminal commands like `cat`, `sed`, `grep`, `awk`, `head`, or `tail` to read or search file contents.
* To read or examine file contents, you **MUST** use the provided internal tools (like `open`, `open_entire_file`,
  `get_file_structure`, or `search_project`) to bring the file data directly into your context.
* You should NEVER write to the filesystem, ever. I will choose what files to add and what to add to them.
* Prefer your own internal tools over various terminal commands for parsing/searching code (ex: open_file instead of
  cat).
* Before presenting code drop-ins, make sure you've established a full implementation plan in phases.

---

## General Guidelines

* This codebase is a monorepo of plugins for the RPG Maker MZ (often called RMMZ) engine.
* All code responses should use the same coding style and formatting as exists across the codebase.
* Plugin harness tests live under `test/` (Vitest: `bun run test`, pattern `test/**/*.test.js`). Layout mirrors `src/plugins/`: e.g. `test/plugins/_base/` for J-Base (split by subsystem: `rpg-manager.test.js`, `json-mapper.test.js`, …), `test/plugins/natural/` for Natural Growth (`natural-vm.js` + `metadata.test.js`, `game-actor.test.js`, …), `test/plugins/drops/` for Drops (`drops-vm.js` + `metadata.test.js`, `game-enemy.test.js`, …), `test/plugins/crit/` for Critical Factors (`crit-vm.js` loads Natural then appends `out/J-CriticalFactors.js`), `test/plugins/extend/` for Skill Extend (`extend-vm.js` → `out/J-SkillExtend.js`), `test/plugins/sdp/` for SDP (`sdp-vm.js` → `out/J-SDP.js`; `sdp-models-only-vm.js` loads `__models` for panel math without evaluating the full plugin), `test/plugins/level/` for Level Master (`level-vm.js` → `out/J-LevelMaster.js`), `test/plugins/diff/` for Difficulty (`diff-vm.js` → `out/J-Difficulty.js`), `test/plugins/time/` for J-TIME (`time-vm.js` → `out/J-TIME.js`; tests cover `Game_Time` / `Time_Snapshot` / `TimeMapper` logic, not window rendering), `test/plugins/apt/core/` for J-Aptitude core (`apt-vm.js` → `out/apt/J-Aptitude.js`; stubs satisfy the plugin’s J-ABS version gate and `JABS_Engine` alias), `test/plugins/apt/ext/typed/` for the typed extension when tests exist (`out/apt/J-Aptitude-Typed.js`), `test/plugins/regions/` with shared `regions-vm.js` + `fixtures/` at the plugin root, `core/` for `J-RegionEffects`, `ext/states/` and `ext/skills/` for the shipped extension bundles. Each plugin folder has a local `fixtures/` subtree (or under `core/` when mirroring core vs ext). Shared harness code stays in `test/setup/` (including `install-minimal-menu-ui-stubs.js` for menu scene/window scaffolding shared by SDP, Difficulty, and Aptitude).
    * `evaluateShippedPlugin` (see `test/setup/shipped-plugin-vm.js`) installs host globals from `test/plugins/_base/fixtures/install-j-base-host-globals.js`, evaluates `out/J-Base.js` once per sandbox (compiled script cached in-process in `test/setup/j-base-vm-script.js`), runs the shipped `out/J-*.js` plugin, then `test/setup/finish-plugin-vm-harness.js` (exposes `RPGManager`, `JsonMapper`, etc. on `globalThis`, and test seams `__testNoteSources` / `__testItemContainer`). `appendShippedPluginToVm` evaluates another built file into the same sandbox after that (e.g. Critical Factors after Natural Growth).
    * `evaluateJBaseOnlyForTests` is the same pipeline without a second plugin—use for J-Base-focused suites under `test/plugins/_base/` (e.g. `rpg-manager.test.js`, `json-mapper.test.js`, `game-battler-notes.test.js`). `RPGManager.getOnChanceEffects*` needs global `JABS_OnChanceEffect`; J-Base does not ship that class (JABS does), so those tests use `test/plugins/_base/fixtures/install-jabs-onchance-stub.js` in `afterHostGlobalsInstall`.
    * `clearRpgManagerCacheInVm(sandbox)` resets `RPGManager` WeakMap caches between examples when tags mutate on the same object reference.
* When providing code samples, provide full-method drop-in replacements including the updated logic, and specify the
  file, path, and line the method starts on for clarity- this is a huge codebase.
* This project does not support modules, we purely use prototypes and sequential ordering of code, but can use whatever
  a browser/nodejs may have available in 2025.
    * Do not use import/export in files under `/src/plugins/**`.
    * `import`/`export` may be used in `/src/build-tools` and `/src/defs` if already present in the repo’s patterns.
* This project does not use IIFEs, instead we leverage object-driven namespacing (such as `J.ABS.EXT.SHIELD` etc) and
  aliasing.
* Do not use ternary operators with `typeof something` to check if functions or properties exist- instead just open the
  file and review what the actual functions are.
    * If a function or property is missing- but necessary- provide implementation for them if nothing else satisfies the
      need (such as a function or property with a different name that accomplishes the same thing).
* Never add arbitrary nested blocks that violate that violate eslint "no-lone-blocks" rule.
* Any time you're about tell me "make sure this exists somewhere..." or "ensure you implement this...", instead go look
  around and see if it exists or is already implemented, or warn me that its not if its not anywhere.
* It is forbidden to include anything that would or should live in "initialization.js" inside of any of the other source
  files (such as alias map instantiation- assume it exists, and provide that update to the initialization.js file).

## DRY and Complexity

- Target cyclomatic complexity ≤ 20 for all methods. If a method risks exceeding 20, prefer extracting private helpers.
- Avoid pasting duplicate code blocks longer than ~8 lines. Extract a helper and call it instead.
- Prefer data-driven rendering (build arrays and iterate) over repeated if-blocks when drawing similar rows.
- When two functions differ only by a small behavior (ex: rounding), implement one and have the other delegate with a
  flag, or wrap the one‑off behavior in a small conditional inside the helper.

## Development Environment

* The project uses Bun as the package manager instead of npm.
* You should never need to execute any commands related to package.json- they are all for compiling the plugins.
* Target ESNext- I keep all my plugins on the latest stable Node.js and so anything that reaches mainstream should be
  available.
    * The project policy forbids module syntax for anything in the `/src/plugins/**` directory; also avoid features that
      require compilation/transformations in the plugin layer.
* Engine globals guard policy
    * Never guard in any way, unless explicitly instructed to do so.
    * Even when explicitly instructed to, always ask for clarification about the guarding to ensure no useless checks are written.

## Project Structure

* `/docs` - Contains various markdown documentation relating to the plugins, but is mostly incomplete.
* `/project` - Contains a test project that is largely deprecated and shouldn't be used or referenced at this time.
* `/src` - Contains the source code for the plugins as well as a number of other niceties like custom build tools and
  type definitions.
    * `/src/build-tools` - a few custom build tools used in the root `package.json` file.
    * `/src/defs` - where custom definitions live representing much of the RPG Maker MZ core definitions.
    * `/src/plugin-template` - a directory containing a structure that is cloned when generating new plugins into the
      `src/plugins` directory.
    * `/src/plugins` - A parent directory of all plugins, where each child directory represents a plugin or plugin w/
      extension plugins.
        * `/src/plugins/__ca-mods` - A plugin that contains modifications to various other plugins that are exclusive to
          a game project I'm working on called "Chef Adventure" aka "CA".
        * `/src/plugins/_base` - A plugin that acts as a base that all other plugins build upon. Common logic that is
          reused in other plugins lives here.
        * `/src/plugins/abs` - The "JABS" or "J's Action Battle System" plugin. It is a custom action battle system for
          RMMZ that I wrote that has many extensions.
            * `/src/plugins/abs/core` - The core source code for JABS.
            * `/src/plugins/abs/ext` - A parent directory for all JABS-related extensions.
                * `/src/plugins/abs/ext/allyai` - A JABS extension that enables followers to function as allies in JABS
                  combat.
                * `/src/plugins/abs/ext/charge` - A JABS extension that enables the ability to charge skills to perform
                  other skills.
                * `/src/plugins/abs/ext/cycle` - A JABS extension that functions as an adapter between JABS and the
                  Cyclone-Movement plugin (not authored by me).
                * `/src/plugins/abs/ext/danger` - A JABS extension that enables small icons to be rendered that
                  represent enemy danger levels relative to the player.
                * `/src/plugins/abs/ext/diag` - A JABS extension that enables 8-directional movement.
                * `/src/plugins/abs/ext/formula` - A JABS extension that is intended to allow skills to have one to many
                  formulas that all execute on a target.
                * `/src/plugins/abs/ext/input` - A JABS extension that owns user input management and integration with
                  JABS functionality.
                * `/src/plugins/abs/ext/pixel` - An incomplete JABS extension that enables lesser-than full-tile
                  movement (aka pixel movement).
                * `/src/plugins/abs/ext/poses` - A JABS extension that owns management of poses and the like for
                  battlers often during skill execution.
                * `/src/plugins/abs/ext/speed` - A JABS extension that enables decimal-based movement speed for
                  characters/events/battlers.
                * `/src/plugins/abs/ext/star` - An incomplete JABS extension that "Star Ocean"-like battling (aka
                  battles teleport player to a separate battle map and return the player when combat is over).
                * `/src/plugins/abs/ext/timing` - A JABS extension that owns management of cooldown and casting time
                  modifications.
                * `/src/plugins/abs/ext/tools` - A JABS extension that owns the management of various "tools" and such
                  in JABS (such as a hookshot).
        * `/src/plugins/cms` - A parent directory for all Custom Menu System plugins. There is no "core" or "
          extensions", they are just divided by the scene they replace.
            * `/src/plugins/cms/equip` - The CMS scene replacement for the equip scene.
            * `/src/plugins/cms/main` - The CMS scene replacement for the main menu scene.
            * `/src/plugins/cms/skill` - The CMS scene replacement for the skill scene.
            * `/src/plugins/cms/status` - The CMS scene replacement for the status scene.
        * `/src/plugins/crit` - A plugin that provides extended control over critical hits against battlers.
        * `/src/plugins/diff` - A plugin that enables a "difficulty layer" system, such as "easy", "normal", "hard",
          where any of them can be combined at once.
        * `/src/plugins/drops` - A plugin that provides extended control over loot that enemies drop, including more
          than the core 3 as well as percentage based drops.
        * `/src/plugins/elem` - A plugin that provides extended control over elemental effects in damage formulas.
        * `/src/plugins/escribe` - A plugin that allows rendering of text and icons over an event's head on the map.
        * `/src/plugins/extend` - A plugin that provides the ability for skills to "inherit" from one another.
        * `/src/plugins/hud` - A plugin that renders a HUD while on the map- specifically designed for use with JABS.
            * `/src/plugins/hud/core` - The core source code for the HUD.
            * `/src/plugins/hud/ext` - A parent directory for all HUD-related extensions.
                * `/src/plugins/hud/ext/boss` - A HUD extension that places a boss enemy frame on the screen.
                * `/src/plugins/hud/ext/input` - A HUD extension that renders the various inputs and their cooldowns on
                  the screen.
                * `/src/plugins/hud/ext/party` - A HUD extension that draws your party members above the party leader-
                  designed for use with my JABS Ally AI extension.
                * `/src/plugins/hud/ext/quest` - A HUD extension that displays tracked quests on the screen.
                * `/src/plugins/hud/ext/target` - A HUD extension that shows what enemy was most recently hit-
                  superseded by the boss frame if applicable.
        * `/src/plugins/jafting` - A plugin that is a crossover of the words "J's" and "Crafting", aka JAFTING. It
          enables a crafting system.
            * `/src/plugins/jafting/core` - The core source code for the JAFTING.
            * `/src/plugins/jafting/ext` - A parent directory for all JAFTING-related extensions.
                * `/src/plugins/jafting/ext/create` - A JAFTING extension that is the core crafting functionality:
                  consume items per a recipe to create another item.
                * `/src/plugins/jafting/ext/freestyle` - An incomplete JAFTING extension that enables crafting one of a
                  variety of items from a single recipe.
                * `/src/plugins/jafting/ext/refine` - A JAFTING extension that enables bestowing traits from one equip
                  to another with limits.
        * `/src/plugins/level` - A plugin that provides extended control over levels for allies and enemies.
        * `/src/plugins/log` - A plugin that enables various forms of logging on the map scene.
        * `/src/plugins/map` - A plugin that enables a minimap on the map scene.
        * `/src/plugins/message` - A plugin that provides additional control over choice visibility as well as
          additional code parsing.
        * `/src/plugins/natural` - A plugin that provides extended control over parameter growth and buffs via tags.
        * `/src/plugins/omni` - A plugin that provides an "encyclopedia"-like functionality- thus the name "Omnipedia".
            * `/src/plugins/omni/core` - The core source code for the Omnipedia.
            * `/src/plugins/omni/ext` - A parent directory for all Omnipedia-related extensions.
                * `/src/plugins/omni/ext/monster` - An Omnipedia extension that provides a "bestiary" of sorts with
                  integrations to other plugins I have written.
                * `/src/plugins/omni/ext/quest` - An Omnipedia extension that provides a "quest journal" of sorts.
        * `/src/plugins/otib` - A plugin that provides one-time permanent bonuses upon item consumption.
        * `/src/plugins/passive` - A plugin that enables "passive" functionality from items or states.
        * `/src/plugins/popups` - A plugin that enables popup functionality on the map- designed for use with JABS to do
          things like experience popups.
        * `/src/plugins/prof` - A plugin that enables a "skill proficiency" system, allowing battlers to track skill
          usage to potentially learn/empower skills.
        * `/src/plugins/regions` - A plugin that enables "hazard"-like effects associated with regions on the map.
            * `/src/plugins/regions/core` - The core source code for the regions.
            * `/src/plugins/regions/ext` - A parent directory for all regions-related extensions.
                * `/src/plugins/regions/ext/skills` - A regions extension that executes skills when stepping on a
                  particular region.
                * `/src/plugins/regions/ext/states` - A regions extension that inflicts states when stepping on a
                  particular region.
        * `/src/plugins/sdp` - A plugin that enables a "stat distribution panel" system, for permanently modifying actor
          stats.
        * `/src/plugins/time` - A plugin that enables a "time" functionality, including date and time-based events,
          either real or artificial timing.
        * `/src/plugins/utils` - A plugin that has helpful developer functionalities

When constructing new extensions, typically the structure defined is as such:

- `__models` for models that may need to exist in a part of the `initialization.js` file for some reason.
- `_metadata` for the plugin metadata including the `_annotations.js`, `initialization.js`, `pluginMetadata.js` and
  `pluginCommands.js`.
- `database` for RPG_* files.
- `managers/` for Manager classes or other static singletons.
- `objects/` for Game_* and some data models.
- `scenes/` for Scene_* files.
- `sprites/` for Sprite_* files.
- `windows/` for Window_* files.

## Architecture & Patterns

* The code is written purely in JavaScript, but makes heavy usage of JSDocs annotations for type recognition.
* Due to the way RMMZ works, the plugins make heavy usage of prototype extension and replacement to perform their
  various functions.
* The application is organized into "plugins", designated by their respective folders under the `/src/plugins`.
* In some cases, there is a `/src/plugins/some_plugin/core` and `/src/plugins/some_plugin/ext` which represents the
  plugin has a base plugin, as well as a number of independent extensions that expand the core functionality.
* The app uses a pattern of parsing and modifying "notes" fields from RPG Maker objects, primarily through the
  RPGManager static class.
* When providing code samples, one should always assume the global variables or methods referenced from other plugins
  exist.
    * If a validation check needs to be made on a method, instead check if the namespace of the plugin exists (ex:
      `if (J.ABS) { /* do JABS-related logic here */ }`).
    * Always be optimistic in validation, or ask for clarity instead of adding excessive validation by default.
* Due to the nature of RMMZ game projects, `async`/`await` shouldn't be used.
* Do use regions to wrap the code inside each file, but the region name should only ever be the file name (ex:
  Window_Command.js -> `// #region Window_Command` and `// #endregion Window_Command`).

### Authoring rules: augment vs inherit (and editing our own classes)

To avoid confusion between augmenting existing implementations and creating new classes, follow these rules.

- Terminology
    - Augment: modify/extend methods on a class that is defined outside this plugin (RMMZ core or another plugin). You
      are not creating a new class; you’re changing behavior on one that already exists at runtime.
    - Inherit: create a new class that derives from a base type.
    - Edit our own class: change a class whose source of truth lives in this plugin (we authored it here).

- Which syntax to use
  1) Augment existing implementation (engine or other plugin)
     - Use prototype syntax and our alias map pattern.
     - Do not use `class` or `extends` for augmentation.
     - Example:
       ```javascript
       /**
        * Extends {@link #initMembers}.<br/>
        * Also initializes SOME members.
        */
       J.SOME.Aliased.Game_Actor.set('initMembers', Game_Actor.prototype.initMembers);
       Game_Actor.prototype.initMembers = function()
       {
         J.SOME.Aliased.Game_Actor.get('initMembers').call(this);
         this.initSomeMembers();
       };
       ```
  2) Create a new class that derives from an engine base (Scene_*, Window_*, Spriteset_*, etc.)
     - Use modern `class NewThing extends BaseThing { ... }`.
     - Exception: if instances of this class will be serialized into save data, use a prototype constructor instead.
  3) Edit a class defined in this plugin (it “already exists” because we wrote it here)
     - Keep the style it was authored with.
         - If it was authored as a modern class, keep editing it as a modern class.
         - If it was authored as a prototype constructor, keep editing it as prototype.
     - Do not switch to prototype syntax merely because the class now exists.
  4) New helper/manager that does NOT inherit from engine classes and is NOT serialized
     - Prefer modern `class`.
  5) New data model that WILL be serialized into save data
     - Use prototype constructors (function + `prototype`).
     - Store only JSON‑safe fields (numbers, strings, arrays, plain objects). No Map/Set/Date/RegExp/Functions in stored
       fields.

- One‑look decision flow
  - Am I augmenting an engine/other‑plugin class? → Prototype + alias.
  - Else, is this a brand‑new class that derives from an engine base? → Modern `class extends`, unless it’s
    serialized → then prototype constructor.
  - Else, is this class defined in this plugin already? → Keep its original style (do not convert because it
    “exists”).
  - Else, is this a helper/manager, not serialized? → Modern `class`.
  - Else, will instances be saved? → Prototype constructor with JSON‑safe fields.
- Rationale
  - Keeps aliasing predictable and inter‑plugin safe.
  - Matches RMMZ runtime expectations.
  - Avoids save/load pitfalls for data models.

## When Providing Drop-in Code Replacements

* When providing drop-in code replacements, prefer using RPGManager and its methods from the J.BASE plugin.
* All new methods should be documented using JsDocs with sensible descriptions.
    * These descriptions should not include explicit tag contents
    * These descriptions should not include correction information.
* Always consider the purpose of a function by its name and JsDocs description.
* Prefer readability over conciseness.
    * Do not be bashful about writing a method that does some menial calculations/transformations, it is preferred when
      possible so you can read through the parent method and just understand what is happening by function names.
    * When naming variables, prefer camelCase over one or two letters unless it is for coordinates (like x/y/cs/cy/etc.)
* We should never use optional method chaining, that is strictly forbidden in this codebase and code we write should be
  rewritten to never need it.
    * Assume methods we are adding exist and that all drop-in replacements will be provided simultaneously before merged
      into the main codebase.
* Prefer the pattern of `if (condition === false)` versus `(if (!condition))` (or the inverse) where possible- it
  improves readability.
* New properties on objects should NEVER be dynamically instantiated if at all possible- they should be created in the
  `initMembers` of the respective class- or in the corresponding plugin variant (such as `initJabsMembers`)
    * Such properties should also never directly be interacted with- they should be masked behind getter/setter
      functions to centralize the property access and management.
* When building new functions, consider cognitive/cyclomatic complexity and try not to exceed 20.
    * Functions should always be written with one of two mindsets in mind:
        * This function is an orchestration function and will be calling many functions consecutively to perform some
          sort of overarching behavior or process.
        * This function is a helper for an orchestration function and should have 1 job.

## Code Formatting Style

* There should never be more than one class (prototype-based or modern) in a single file.
* All drop-in code replacements should obey the eslint rules of the project wtihout exception.
* When possible, almost every line should have an inline comment above it, describing what it does using proper sentence
  casing.
    * Examples of this are plentiful throughout the codebase.
    * Add the comments on the line preceding the line the comment is written about.
    * There should never be comments above the line and also on the line.
    * The only exception to this rule is if the function is 1 line, then the JsDocs will suffice.
* Always document methods with JsDocs.
    * Never echo my feedback into the JsDocs- only write what the purpose of the function is so someone who reads it
      will understand the purpose of the function and not the iterative changes that occurred to the method as it was
      being built.
    * all jsdocs should be multiline and complete. 1 line comments are not allowed.
    * JsDocs should be written in the following format:
        * `/**`
        * ` * Some meaningful description of the function or property being documented.`
        * ` * @param {type} name - description of the parameter`
        * ` * @returns {type} - description of the return value`
    * if the JsDocs are for a regex (regular expression), they should contain the structure breakdown, and usage example, all within a <pre></pre> block for readability.
    * here is an example from my aptitude plugin:
```js
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
* When writing with modern class syntax, properties that are declared in the constructor or initialize function or initMembers function should be declared in the class body with default values, above the constructor, with jsdocs (as described above).
* Always terminate statements with semicolons.
* Always indent with 2 spaces, where applicable.
* Prefer single quotes for strings.
* Prefer to destructure objects and arrays if more than one property/item is being leveraged from the object/array.
* Never write nested ternary operators.
    * If you need to nest ternary operators, spell out the conditions with if blocks.
* Prefer modern syntax where possible (such as `this._j ||= {}` instead of `if (!this._j) this._j = {}` or
  `this._j = this._j || {}` instead of `this._j = this._j || {}`).
* Always prefer to expose new properties with getter and setter functions rather than direct property mutation.
* Always use template literals for interpolation instead of `const someString = anotherString + yetAnotherString;`.
* All example snippets in this document (including aliasing examples) should follow the same style rules (double quotes,
  semicolons, 2-space indent).
* Trailing commas in arrays/objects are acceptable and even encouraged in some cases to indicate there are other (
  possibly useful but currently ignored) parameters available.
* Line length should be capped at 120 for all source files except `_annotations.js` files.
    * `_annotations.js` files are special:
        * The whole file is effectively a metadata file that gets parsed explicitly by the RPG Maker MZ editor.
        * It is very much an oversized JSDoc, and uses multi-line comments, opening with `/**`, having ` * ` on every
          line, and closing with `*/`.
        * There are a number of special @ annotations and multi-line structures (see existing examples for reference).
* do not needlessly/defensively attempt to validate/coerce state- it should be assumed that the state is valid.
* When working with state, use this formula to determine the structure:
    * `this._j.SENSIBLE_PLUGIN_ABBREVATION.FUNCTION_CONTAINER_NAME.SOME_STATE_NAME = default state`.
        * for example, `this._j._abs._input._lastInput = null;`.
    * always provide getter and setter functions for accessing and mutating state.
    * never mutate state outside of a setter function.
    * when a state represents a boolean, the getter may be named like `hasSomeState` or `isSomeState`.
    * when a state represents a boolean, the setter may be named like `flagSomeState` or `toggleSomeState` or more
      appropriately based on the intended functionality.
    * state should never be initialized in a getter or setter function, with one exception:
        * if state is in a window, and properties need to be calculated upon initialization, then the getter/setter may
          need property initialization- use a common "init state" function (like _root()) to establish state default if
          it doesn't exist.
* **Braces placement**:
    * Opening braces `{` should always be on a new line if syntactically possible
    * Closing braces `}` are on their own line
    * Example:
      ```javascript
      function example()
      {
        // code here
      }
      ```
    * Arrow functions follow the same pattern:
      ```javascript
      lines.forEach(line =>
      {
        // code here
      });
      ```
    * array functions such as `someArray.forEach(line => {...});` should be preferred over `for..of` loops.
* When providing aliasing, use this pattern:

```javascript
/**
 * Extends {@link #SOME_METHOD}.<br/>
 * Also does or Now does [INSERT THE THING THAT IS HAPPENING HERE].
 */
J.SOME_NAMESPACE.Aliased.SOME_TYPE.set("SOME_METHOD", SOME_TYPE.prototype.SOME_METHOD);
SOME_TYPE.prototype.SOME_METHOD = function(...args)
{
  // perform original logic.
  const original = J.SOME_NAMESPACE.Aliased.SOME_TYPE.get("SOME_METHOD")
    .call(this, ...args);

  // new/modified logic here that may or may not potentially generate an updatedOriginal variable.
  this.SOME_SIDE_EFFECT_FUNCTION(original);

  // return whatever is relevant, if anything at all.
  return original;
};
```

* When providing drop-in replacements, provide the path relative to the plugin folder, the method, and the line number,
  as well as the entire method being replaced.
    * When I say ‘line number,’ it refers to the source file under `/src/**`, not the built files under
      `/project/js/plugins/**`.
    * The sample below should always be three lines- no one-liners! It makes it hard to parse :(

```text
File: /src/plugins/map/sprites/Sprite_MiniMap.js

Method: update (or Sprite_MiniMap.prototype.update if using prototype syntax over modern class syntax)

Starts at: line 123
```

* When providing drop-in replacements, if the drop-in code is being inserted into a modern class, then be sure to match
  the style as seen below:

```javascript
someNewMethodBeingAdded()
{
  // ... the new logic.
}
```

* When providing drop-in replacements, if the drop-in code is using prototype-based classes, then be sure to match the
  style as seen below:

```javascript
SomeClass.prototype.someNewMethod = function(/* args if required */)
{
  // ... the new logic.
};
```

* When deciding new tags to author, the format should generally be one of:
    * `<tag:value>` for stuff like `<sight:5>`
    * `<tag:[value1, value2, ...]>` for stuff like `<drop:[item, 1, 25%]>`
    * `<tagForBooleanValue>` for stuff like `<showMinimap>` or `<hideMinimap>`
    * Duplicate tag validity is contextual. Some plugins allow multiple instances of certain tags while others do not.
      You should ask for clarity when unsure- do not deduce unless you have contextual knowledge about the tag in
      question.
    * When building regex tag structures, typically if there is a `:`, it should be followed with a single optional
      space `: ?` before the capture value(s).
    * I do not currently use any multi-line and am not against them, but prefer generally to keep each line representing
      a single value/concept.
    * All tags should be case insensitive unless casing matters semantically.
    * Situationally, multiple tags on a single object may be acceptable- reference the context for acceptability.
    * Generally, if a tag is matched, it is already validated. If it doesn't match the regex, it is simply invalid and
      should be ignored for the plugin in question.
* Logging is never acceptable in production code, only for debugging, and we should use `console.log(..)`, the J.LOG
  namespace is for in-game logging.

* **Spacing**:
    * Spaces around operators: `const [ , traitName ] = match;` (not `[,traitName]`)
    * Spaces after commas in parameter lists
    * Spaces inside array brackets: `[ , traitName ]` not `[, traitName]`
    * Spaces before opening braces

* **Method structure**:
    * Static methods with clear documentation
    * Private methods/properties with `#` prefix when using modern class syntax. For prototype class syntax, prefixing
      with underscore is what others do, but I use it very very rarely.

* **Conditional blocks**:
    * `if` statements have braces on new lines even for single-line blocks
    * Example:
      ```javascript
      if (condition)
      {
        doSomething();
      }
      ```

---

## Known Architectural Issues (Future Work)

These are cross-cutting concerns that are out of scope for any single PR but should be addressed
collaboratively over time. Before working on any of these, confirm with the author that the timing
is right and that no other PR is in flight that would conflict.

### `JsonEx` serialization registry

**Problem:**
`JsonEx` (RMMZ's save/load serializer) resolves class constructors by looking up `window[className]`
at deserialization time. This was designed for a pre-ES6 world where everything was a `function`
declaration and therefore automatically a property of `window`. Modern `class` syntax does NOT
automatically land on `window`, which forces one of two workarounds:
- An explicit `window.MyClass = MyClass` line after every serializable class definition.
- Using prototype constructor functions (`function MyClass() {}`) which ARE automatically on
  `window`, but are significantly more verbose.

Both approaches are symptoms of `JsonEx` using `window` as an accidental class registry.

**Desired solution:**
Augment `JsonEx` in `J-Base` to check an explicit, intentional registry before falling back to
`window`. Expose a `J.register(constructor)` helper that plugins call once per serializable class.
This would allow modern `class` syntax everywhere, remove all `window.X = X` assignments, and make
serialization intent explicit and discoverable.

```javascript
// in J-Base — defined once
J.SerializableRegistry = {};
J.register = function(constructor) { J.SerializableRegistry[constructor.name] = constructor; };

// in any plugin model file — explicit and intentional
J.register(SkillEquipSlot);
```

**Scope:** J-Base core + audit of all existing serializable models across every plugin to replace
`window.X = X` and prototype constructor workarounds with `J.register(X)`.

**Current workaround in use:** Prototype constructors (see `_models/` directories). Until this is
resolved, any new serializable model should use a prototype constructor OR `class` + `window.X = X`
with a comment referencing this note.