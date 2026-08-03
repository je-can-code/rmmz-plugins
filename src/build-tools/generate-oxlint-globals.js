/**
 * Generates the `globals` block of .oxlintrc.json so `no-undef` can be turned on without
 * drowning in false positives from this codebase's ambient-global architecture (plugins
 * reference each other's classes and engine singletons as bare identifiers, never imported,
 * because at runtime every plugin bundle shares one global scope).
 *
 * Two sources feed the list:
 *  - project/js/rmmz_*.js (vanilla RPG Maker MZ) - read from the already-generated
 *    src/defs/generated/rmmz/**\/*.d.ts declarations (see `bun run defs:generate`), rather than
 *    re-parsing the engine source. Both `declare var $foo` singletons and per-class file
 *    basenames (Game_Actor.d.ts -> Game_Actor) are collected.
 *  - src/plugins/**\/*.js (every J-* plugin) - regex-scanned for the declaration idioms this
 *    codebase actually uses: `class Foo`, `export default Foo`, `Foo.prototype.bar =`,
 *    `Object.defineProperty(Foo.prototype, ...)`, bare `$foo = ...`, and `globalThis.$foo = ...`.
 *
 * A short hand-list covers what's left: real third-party/runtime globals with no declaration
 * anywhere in this repo to scrape (PIXI, nw.js, Node interop used intentionally in the poses
 * extension). See engine-requirements-style notes at the bottom for what remains unhandled.
 *
 * Usage: bun src/build-tools/generate-oxlint-globals.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PLUGINS_DIR = path.join(REPO_ROOT, 'src', 'plugins');
const DEFS_DIR = path.join(REPO_ROOT, 'src', 'defs', 'generated', 'rmmz');
const OXLINTRC_PATH = path.join(REPO_ROOT, '.oxlintrc.json');

/**
 * Real third-party/runtime globals with no declaration anywhere in this repo. Kept short and
 * hand-curated on purpose- these can never be scraped since nothing in-repo declares them.
 * @type {string[]}
 */
const RUNTIME_GLOBALS = [
  'PIXI', // rendering library RPG Maker MZ is built on.
  'nw', // nw.js desktop shell RPG Maker MZ deploys games with by default.
  'require', // nw.js/Node interop, intentionally used in abs/ext/poses for on-disk asset checks.
  'process', // same nw.js interop- see abs/ext/poses/_metadata/initialization.js.
  'Buffer', // same nw.js interop- decoding a save thumbnail's base64 into the bytes that hit disk.
  '__PLUGIN_NAME__', // vite `define` build-time string substitution, not a real identifier at runtime.
  '__PLUGIN_VERSION__', // see vite-plugin_rmmz-header-prepender.js- same substitution mechanism.
];

/**
 * Recursively collects every .js file under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function collectFiles(dir, extension)
{
  const results = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true }))
  {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory())
    {
      results.push(...collectFiles(full, extension));
    }
    else if (entry.name.endsWith(extension))
    {
      results.push(full);
    }
  }

  return results;
}

/**
 * Scrapes plugin-declared global names from every source file under src/plugins.
 * @returns {Set<string>}
 */
function scrapePluginGlobals()
{
  const names = new Set();
  const files = collectFiles(PLUGINS_DIR, '.js');

  const patterns = [
    /^class\s+(\w+)/gm,
    /export\s+default\s+(\w+)/g,
    /(\w+)\.prototype\.\w+\s*=/g,
    /Object\.defineProperty\((\w+)\.prototype/g,
    /^\s*(\$\w+)\s*=\s*(?!==)/gm,
    // matches both `globalThis.Foo = ...` and the `globalThis.J ||= {}` compound-assignment
    // idiom used for the root J namespace ("declare if not already present").
    /globalThis\.(\$?\w+)\s*(?:\|\|=|=(?!=))/g,
  ];

  for (const file of files)
  {
    const content = fs.readFileSync(file, 'utf8');

    for (const pattern of patterns)
    {
      for (const match of content.matchAll(pattern))
      {
        names.add(match[1]);
      }
    }
  }

  return names;
}

/**
 * Scrapes vanilla RMMZ global names from the already-generated .d.ts declarations, rather than
 * re-parsing project/js/rmmz_*.js with a second, less reliable AST/regex pass.
 * @returns {Set<string>}
 */
function scrapeVanillaGlobals()
{
  const names = new Set();
  const files = collectFiles(DEFS_DIR, '.d.ts');

  for (const file of files)
  {
    // the basename (minus extension) of most generated files is a real vanilla class name-
    // e.g. objects/Game_Actor.d.ts documents the global `Game_Actor` class. Underscore-prefixed
    // files (_globals.d.ts, _rpg-data-models.d.ts, _builtins-augment.d.ts) are not class names.
    const stem = path.basename(file, '.d.ts');

    if (!stem.startsWith('_'))
    {
      names.add(stem);
    }

    const content = fs.readFileSync(file, 'utf8');

    for (const match of content.matchAll(/declare\s+(?:var|let|const)\s+(\$?\w+)/g))
    {
      names.add(match[1]);
    }
  }

  return names;
}

const pluginGlobals = scrapePluginGlobals();
const vanillaGlobals = scrapeVanillaGlobals();
const merged = new Set([ ...pluginGlobals, ...vanillaGlobals, ...RUNTIME_GLOBALS ]);

const sorted = [ ...merged ].sort();
const globals = {};
for (const name of sorted) globals[name] = 'writable';

const cfg = JSON.parse(fs.readFileSync(OXLINTRC_PATH, 'utf8'));
cfg.globals = globals;
fs.writeFileSync(OXLINTRC_PATH, `${JSON.stringify(cfg, null, 2)}\n`);

console.log(`Wrote ${sorted.length} globals to .oxlintrc.json (${pluginGlobals.size} plugin-scraped, ${vanillaGlobals.size} vanilla-scraped, ${RUNTIME_GLOBALS.length} hand-listed).`);
