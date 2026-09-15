# J's Land of Plugins

Monorepo for RPG Maker MZ plugins maintained by JE. Chef Adventure (`../ca`) is the primary playtest game; built ships are copied there via the copy step in `hotfix`.

## Building

Use **Bun** (not npm/yarn). The default workflow after changing plugin source:

```bash
bun run hotfix
```

That is three phases, and it is more than a build:

| Phase | What runs |
|---|---|
| `verify-pre-compile` | `lint`, then fifteen source gates (`verify:docs`, `no-typeof`, `no-instanceof`, …) |
| `compile` | `clean:out`, then `build:all` |
| `verify-post-compile` | `verify:ships`, the full test suite, then `copy:to-all` (into `project/js/plugins/` and `../ca/chef-adventure/js/plugins/j`) |

A green `hotfix` therefore means the ships built *and* the suite passed. There is no per-ship build
script and no partial build — see below.

### How ships are built

Every plugin **ship** is a Vite bundle:

1. **Source** under `src/plugins/<family>/…` uses ESM (`import` / `export default`) between colocated `.js` files.
2. **`entry.js`** at the ship root imports `_metadata/initialization.js` first, then the rest of the ship graph.
3. **`vite.config.*.js`** beside the ship merges [`vite.config.shared.js`](vite.config.shared.js) (Rolldown, no minify, MZ header plugin).
4. **`_metadata/meta.js`** exports `PLUGIN_NAME`, `PLUGIN_VERSION`, `PLUGIN_DESC_TAG` (build-time only; not bundled).
5. **`_metadata/initialization.js`** constructs `J.*.Metadata` with `__PLUGIN_NAME__` / `__PLUGIN_VERSION__` injected at compile time.
6. Output lands in **`out/`** as a **single** `.js` file (plus `.map`) — what RMMZ loads at runtime. No `import`/`export` in the shipped file.

`bun run build:all` (`src/build-tools/build-all.js`) builds every ship in parallel, discovering them by
globbing `src/plugins/**/vite.config.*.js`. **That glob is the whole registry** — a ship is registered by
having a vite config and by nothing else, and there is no `build:<plugin>` script to add. Prefer full
`hotfix` before commit so `out/` and the copies stay in sync.

### New plugin scaffold

```bash
bun run plugin:init <path-under-plugins>   # e.g. abs/ext/myext
```

Copies `src/plugin-template/` into `src/plugins/<path>/` (includes `entry.js`, `vite.config.js`, and the
`_metadata/` set). Follow **`SCAFFOLD.md`** in the new folder. Nothing in this repo needs registering
afterwards — the vite config is the registration — but the built plugin does have to be added to Chef
Adventure's own `js/plugins.js`, since `project/` here holds the vendored engine and a mirror of `out/`
rather than a loadable project.

### Build tools (`src/build-tools/`)

| Script | Role |
|--------|------|
| `build-all.js` | Builds every ship in parallel, discovered by globbing their vite configs |
| `verify-*.js` | The source gates run by `verify-pre-compile`; each file opens with the reasoning behind its rule |
| `verify-ships.js` | Post-compile checks on `out/**` and the boundaries between ships |
| `copy.js` + `mirror.js` | Mirror `out/` to destination trees |
| `obliterator.js` | Delete `out/` (`clean:out`) |
| `init.js` | `plugin:init` scaffold |
| `mutate.js` | `bun run mutate <file-or-ship>` — mutation testing |
| `logger.js` | Shared CLI logging |
| `vite-plugin_rmmz-header-prepender.js` | Prepends MZ `/*:` header; defines `__PLUGIN_NAME__` / `__PLUGIN_VERSION__` |
| `generate-rmmz-engine-defs.js` + `rmmz-defs-infer.js` | `bun run defs:generate` — ambient typings from `project/js/rmmz_*.js` |

### Plugin commands

Register with **`PluginManager.registerCommand(J.*.Metadata.name, …)`** — the key must match `Utils.extractFileName($plugins[n].name)` (e.g. `"J-ABS"`). `PluginMetadata` exposes **`name`** (lowercase). J-Base also sets legacy **`Metadata.Name`** for older call sites; new code should use **`.name`**.

### Tests & typings

```bash
bun run test              # build:all + vitest
bun run defs:generate     # refresh src/defs/generated/rmmz/
```

See `CLAUDE.md` for style, architecture, and namespace rules, and `docs/project-structure.md` for the
repository layout.
