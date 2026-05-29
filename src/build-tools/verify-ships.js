//region verify-ships
/**
 * Verifies shipped plugin bundles and source import boundaries.
 *
 * RMMZ cannot load import/export in plugin scripts. Vite/Rolldown must emit a
 * single readable file per ship with no module syntax and no $1 suffix collisions.
 *
 * Each check in CHECKS runs independently; failures are grouped by check name.
 */
import * as fs from 'fs/promises';
import { glob } from 'glob';
import path from 'node:path';
import Logger, { LogStyle } from './logger.js';

const OUT_DIR = './out';
const SRC_PLUGINS_DIR = './src/plugins';

/** Matches ESM import/export at the start of a line (not inside strings). */
const SHIPPED_MODULE_LINE = /^\s*(import\s|export\s)/m;

/** Bundler rename collisions (exclude legitimate RegExp.$1). */
const BUNDLER_DOLLAR_ONE = /\b(?!RegExp)[A-Za-z_$][\w$]*\$1\b/;

/** Cross-plugin boundary violation: importing J-Base source from another ship. */
const CROSS_PLUGIN_BASE_IMPORT = /from\s+['"][^'"]*_base\//;

/** RMMZ engine globals — IconManager is J-Base-owned; see _base/managers/IconManager.js. */
const ENGINE_GLOBAL_CLASS = /^class\s+(TextManager|ColorManager)\b/m;

/** Engine globals must not be default-exported from plugin ships. */
const ENGINE_GLOBAL_EXPORT = /export\s+default\s+(IconManager|TextManager|ColorManager)\b/;

/** Allowed namespace bootstrap — the only permitted globalThis write in new code. */
const ALLOWED_GLOBAL_THIS_J_BOOTSTRAP = /^\s*globalThis\.J\s*\|\|=\s*\{\}\s*;?\s*$/;

/** Detects writes to globalThis (plain, ||=, ??=). */
const GLOBAL_THIS_WRITE = /globalThis\.(\$?[\w$]+)\s*(?:=|\|\|=|\?\?=)/;

/** Same-ship / hoisted-global mirror onto J.* — bare PascalCase identifier, no `new`. */
const J_NAMESPACE_CLASS_MIRROR = /^\s*J\.[\w.]+\s*=\s*([A-Z][\w$]*)\s*;?\s*$/;

/**
 * Grandfathered globalThis property names until $ singleton bootstraps migrate to hoisted `var`.
 * Shrink this set over time; new names must not be added.
 */
const LEGACY_GLOBAL_THIS_PROPERTIES = new Set([
  '$actionLogManager',
  '$actionMap',
  '$diaLogManager',
  '$gameEnemies',
  '$gameTime',
  '$hudManager',
  '$jabsController1',
  '$jabsEngine',
  '$lootLogManager',
]);

/**
 * @typedef {{ name: string, description: string, run: () => Promise<string[]> }} ShipVerifyCheck
 */

/**
 * @param {string} filePath
 * @param {string} contents
 * @returns {string[]}
 */
function collectGlobalThisWriteViolations(filePath, contents)
{
  const violations = [];
  const lines = contents.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++)
  {
    const line = lines[lineIndex];

    if (line.includes('globalThis') === false)
    {
      continue;
    }

    if (ALLOWED_GLOBAL_THIS_J_BOOTSTRAP.test(line))
    {
      continue;
    }

    const writeMatch = line.match(GLOBAL_THIS_WRITE);

    if (writeMatch === null)
    {
      continue;
    }

    const [ , propertyName ] = writeMatch;

    if (LEGACY_GLOBAL_THIS_PROPERTIES.has(propertyName))
    {
      continue;
    }

    violations.push(
      `${filePath}:${lineIndex + 1}: globalThis write on "${propertyName}" (only "globalThis.J ||= {};" allowed)`
    );
  }

  return violations;
}

/**
 * @param {string} filePath
 * @param {string} contents
 * @returns {string[]}
 */
function collectJNamespaceClassMirrorViolations(filePath, contents)
{
  const violations = [];
  const lines = contents.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++)
  {
    const line = lines[lineIndex];

    if (line.includes('J.') === false)
    {
      continue;
    }

    if (line.includes('new '))
    {
      continue;
    }

    if (/=\s*J\./.test(line))
    {
      continue;
    }

    const mirrorMatch = line.match(J_NAMESPACE_CLASS_MIRROR);

    if (mirrorMatch === null)
    {
      continue;
    }

    const [ , className ] = mirrorMatch;
    violations.push(
      `${filePath}:${lineIndex + 1}: needless J namespace class mirror (J.* = ${className}; import or use hoisted global)`
    );
  }

  return violations;
}

/**
 * @param {string} filePath
 * @param {string} contents
 * @returns {string[]}
 */
function collectShippedModuleSyntaxViolations(filePath, contents)
{
  const violations = [];

  if (SHIPPED_MODULE_LINE.test(contents))
  {
    violations.push(`${filePath}: contains import/export (RMMZ cannot load module syntax)`);
  }

  return violations;
}

/**
 * @param {string} filePath
 * @param {string} contents
 * @returns {string[]}
 */
function collectShippedBundlerDollarOneViolations(filePath, contents)
{
  const violations = [];
  const dollarOneMatches = contents.match(new RegExp(BUNDLER_DOLLAR_ONE.source, 'g'));

  if (dollarOneMatches && dollarOneMatches.length > 0)
  {
    const unique = [ ...new Set(dollarOneMatches) ];
    violations.push(`${filePath}: bundler rename collision(s): ${unique.join(', ')}`);
  }

  return violations;
}

/**
 * @param {string} filePath
 * @param {string} contents
 * @returns {string[]}
 */
function collectSourceCrossPluginViolations(filePath, contents)
{
  const violations = [];

  if (CROSS_PLUGIN_BASE_IMPORT.test(contents))
  {
    violations.push(`${filePath}: cross-plugin import from _base/ (use hoisted globals from J-Base after load, e.g. ParameterRegistry)`);
  }

  return violations;
}

/**
 * @param {string} filePath
 * @param {string} contents
 * @returns {string[]}
 */
function collectSourceEngineGlobalViolations(filePath, contents)
{
  const violations = [];

  if (ENGINE_GLOBAL_CLASS.test(contents))
  {
    violations.push(`${filePath}: redefines engine global as class (use IconManager.foo = function augmentation)`);
  }

  if (ENGINE_GLOBAL_EXPORT.test(contents))
  {
    violations.push(`${filePath}: export default on engine global (causes IconManager$1-style collisions)`);
  }

  return violations;
}

/**
 * @param {string} globPattern
 * @param {import('glob').GlobOptions} [options]
 * @returns {Promise<string[]>}
 */
async function listJsFiles(globPattern, options)
{
  return glob(globPattern, options);
}

/**
 * @param {string[]} files
 * @param {(filePath: string, contents: string) => string[]} collector
 * @returns {Promise<string[]>}
 */
async function scanFiles(files, collector)
{
  const violations = [];

  for (const filePath of files)
  {
    const contents = await fs.readFile(filePath, 'utf-8');
    violations.push(...collector(path.normalize(filePath), contents));
  }

  return violations;
}

/** @type {ShipVerifyCheck[]} */
const CHECKS = [
  {
    name: 'shipped-no-module-syntax',
    description: 'Shipped bundles must not contain import/export.',
    run: async () =>
    {
      const files = await listJsFiles(`${OUT_DIR}/**/*.js`);
      return scanFiles(files, collectShippedModuleSyntaxViolations);
    },
  },
  {
    name: 'shipped-no-bundler-dollar-one',
    description: 'Shipped bundles must not contain $1 bundler rename collisions.',
    run: async () =>
    {
      const files = await listJsFiles(`${OUT_DIR}/**/*.js`);
      return scanFiles(files, collectShippedBundlerDollarOneViolations);
    },
  },
  {
    name: 'shipped-no-globalthis-except-j',
    description: 'Shipped bundles may only write globalThis.J ||= {} (legacy $ singletons grandfathered in source list).',
    run: async () =>
    {
      const files = await listJsFiles(`${OUT_DIR}/**/*.js`);
      return scanFiles(files, collectGlobalThisWriteViolations);
    },
  },
  {
    name: 'shipped-no-j-namespace-class-mirror',
    description: 'Shipped bundles must not mirror hoisted classes onto J.*.',
    run: async () =>
    {
      const files = await listJsFiles(`${OUT_DIR}/**/*.js`);
      return scanFiles(files, collectJNamespaceClassMirrorViolations);
    },
  },
  {
    name: 'source-no-cross-plugin-base-import',
    description: 'Plugin source must not import from another ship\'s _base/ tree.',
    run: async () =>
    {
      const files = await listJsFiles(`${SRC_PLUGINS_DIR}/**/*.js`, {
        ignore: [ '**/_base/**' ],
      });
      return scanFiles(files, collectSourceCrossPluginViolations);
    },
  },
  {
    name: 'source-no-engine-global-class-reexport',
    description: 'Plugin source must not redefine or default-export engine globals.',
    run: async () =>
    {
      const files = await listJsFiles(`${SRC_PLUGINS_DIR}/**/*.js`, {
        ignore: [ '**/_base/**' ],
      });
      return scanFiles(files, collectSourceEngineGlobalViolations);
    },
  },
  {
    name: 'source-no-globalthis-except-j',
    description: 'Plugin source may only write globalThis.J ||= {} (legacy $ singletons grandfathered).',
    run: async () =>
    {
      const files = await listJsFiles(`${SRC_PLUGINS_DIR}/**/*.js`);
      return scanFiles(files, collectGlobalThisWriteViolations);
    },
  },
  {
    name: 'source-no-j-namespace-class-mirror',
    description: 'Plugin source must not mirror hoisted classes onto J.*.',
    run: async () =>
    {
      const files = await listJsFiles(`${SRC_PLUGINS_DIR}/**/*.js`);
      return scanFiles(files, collectJNamespaceClassMirrorViolations);
    },
  },
];

/**
 * @returns {Promise<number>}
 */
async function main()
{
  const results = [];

  for (const check of CHECKS)
  {
    const violations = await check.run();
    results.push({ check, violations });
  }

  const totalViolations = results.reduce((count, entry) => count + entry.violations.length, 0);

  if (totalViolations === 0)
  {
    Logger.logAnyway(
      `Ship verify: OK (${CHECKS.length} independent checks passed).`,
      LogStyle.brightGreen
    );
    return 0;
  }

  Logger.logAnyway('Ship verify FAILED:', LogStyle.brightRed);

  for (const { check, violations } of results)
  {
    if (violations.length === 0)
    {
      continue;
    }

    Logger.logAnyway(`  [${check.name}]`, LogStyle.brightRed);

    for (const message of violations)
    {
      Logger.logAnyway(`    • ${message}`, LogStyle.brightRed);
    }
  }

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-ships