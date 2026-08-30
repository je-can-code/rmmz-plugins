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

/** Bootstrap assignment onto the J namespace tree (excludes runtime property writes). */
const J_NAMESPACE_BOOTSTRAP_ASSIGNMENT = /^\s*J\.[\w.]+\s*=\s*(?:function|\(|class\b|\{|\[|new\b|[A-Z])/;

/** Runtime state writes hanging off J.* (Metadata flags, debug toggles). */
const J_NAMESPACE_RUNTIME_ASSIGNMENT = /^\s*J\.[\w.]+\.(?:enabled|lastShakeFrame)\s*=/;

/** Named or non-default export forms (one entity per file → export default only). */
const NON_DEFAULT_EXPORT = /^\s*export\s+(?!default\b)(?:class|const|let|var|function|\{)/;

/**
 * Whether this source file is allowed to assign onto `J.*` (bootstrap only).
 * @param {string} filePath Repository-relative plugin source path.
 * @returns {boolean}
 */
function isJNamespaceBootstrapFile(filePath)
{
  return filePath.includes('_metadata/initialization.js')
    || filePath.endsWith('/initialization.js');
}

/**
 * Whether this source file is exempt from the export-default-only rule.
 * @param {string} filePath Repository-relative plugin source path.
 * @returns {boolean}
 */
function isExportDefaultExemptFile(filePath)
{
  return filePath.includes('_metadata/meta.js');
}

/**
 * Grandfathered globalThis property names until $ singleton bootstraps migrate to hoisted `var`.
 * Shrink this set over time; new names must not be added.
 *
 * A name may appear here without being new, when it consolidates entries already on the list and
 * the set gets shorter as a result: `$mapLogs` replaced `$actionLogManager`, `$diaLogManager` and
 * `$lootLogManager`, three bootstraps for one service. The rule this comment is really stating is
 * that the count only ever goes down, so a consolidation qualifies and a genuinely new global does
 * not.
 */
const LEGACY_GLOBAL_THIS_PROPERTIES = new Set([
  '$actionMap',
  '$gameEnemies',
  '$gameTime',
  '$hudManager',
  '$jabsController1',
  '$jabsEngine',
  '$mapLogs',
]);

/**
 * @typedef {{ name: string, description: string, run: () => Promise<string[]> }} ShipVerifyCheck
 */

/**
 * @param {string} filePath The file path driving this step.
 * @param {string} contents The contents driving this step.
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

    const [, propertyName] = writeMatch;

    if (LEGACY_GLOBAL_THIS_PROPERTIES.has(propertyName))
    {
      continue;
    }

    // Append the row to the working collection.
    violations.push(
      `${filePath}:${lineIndex + 1}: globalThis write on "${propertyName}" (only "globalThis.J ||= {};" allowed)`
    );
  }

  return violations;
}

/**
 * @param {string} filePath The file path driving this step.
 * @param {string} contents The contents driving this step.
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

    const [, className] = mirrorMatch;
    violations.push(
      `${filePath}:${lineIndex + 1}: needless J namespace class mirror (J.* = ${className}; import or use hoisted global)`
    );
  }

  return violations;
}

/**
 * Checks that the shipped bundle contains no ESM import/export syntax.
 * RMMZ loads plugins as classic scripts — module syntax is a hard runtime failure.
 * @param {string} filePath The file path driving this step.
 * @param {string} contents The contents driving this step.
 * @returns {string[]}
 */
function collectShippedModuleSyntaxViolations(filePath, contents)
{
  if (SHIPPED_MODULE_LINE.test(contents))
  {
    return [ `${filePath}: contains import/export (RMMZ cannot load module syntax)` ];
  }

  return [];
}

/**
 * Checks that the shipped bundle contains no Rolldown $1 rename collisions.
 * These appear when a same-ship class is instantiated or referenced in a source file
 * that does not import it — Rolldown cannot deduplicate the binding and appends $1.
 * Fix: add `import ClassName from '../path/to/ClassName.js';` in the offending source file.
 * @param {string} filePath The file path driving this step.
 * @param {string} contents The contents driving this step.
 * @returns {string[]}
 */
function collectShippedDollarOneViolations(filePath, contents)
{
  const dollarOneMatches = contents.match(new RegExp(BUNDLER_DOLLAR_ONE.source, 'g'));

  if (!dollarOneMatches || dollarOneMatches.length === 0)
  {
    return [];
  }

  const unique = [ ...new Set(dollarOneMatches) ];
  return [
    `${filePath}: bundler rename collision(s): ${unique.join(', ')}`,
    `  ^^^ FIX: a same-ship class was used with \`new\` (or referenced) in a source file` +
    ` without being imported. Add \`import ClassName from '../path/to/ClassName.js';\`` +
    ` at the top of every source file that instantiates or references it directly.`,
  ];
}

/**
 * @param {string} filePath The file path driving this step.
 * @param {string} contents The contents driving this step.
 * @returns {string[]}
 */
function collectExportDefaultOnlyViolations(filePath, contents)
{
  if (isExportDefaultExemptFile(filePath))
  {
    return [];
  }

  const violations = [];
  const lines = contents.split('\n');
  let defaultExportCount = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++)
  {
    const line = lines[lineIndex];

    if (/^\s*export\s+default\b/.test(line))
    {
      defaultExportCount++;
      continue;
    }

    if (NON_DEFAULT_EXPORT.test(line))
    {
      violations.push(
        `${filePath}:${lineIndex + 1}: use export default only (one class/object per file; meta.js exempt)`
      );
    }
  }

  if (defaultExportCount > 1)
  {
    violations.push(
      `${filePath}: multiple export default declarations (${defaultExportCount})`
    );
  }

  return violations;
}

/**
 * @param {string} filePath The file path driving this step.
 * @param {string} contents The contents driving this step.
 * @returns {string[]}
 */
function collectJNamespaceBootstrapViolations(filePath, contents)
{
  if (isJNamespaceBootstrapFile(filePath))
  {
    return [];
  }

  const violations = [];
  const lines = contents.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++)
  {
    const line = lines[lineIndex];

    if (line.includes('J.') === false)
    {
      continue;
    }

    if (J_NAMESPACE_BOOTSTRAP_ASSIGNMENT.test(line) === false)
    {
      continue;
    }

    // Append the row to the working collection.
    violations.push(
      `${filePath}:${lineIndex + 1}: J namespace bootstrap assignment belongs in initialization.js only`
    );
  }

  return violations;
}

/**
 * @param {string} filePath The file path driving this step.
 * @param {string} contents The contents driving this step.
 * @returns {string[]}
 */
function collectJNamespaceRuntimeViolations(filePath, contents)
{
  if (isJNamespaceBootstrapFile(filePath))
  {
    return [];
  }

  const violations = [];
  const lines = contents.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++)
  {
    const line = lines[lineIndex];

    if (line.includes('J.') === false)
    {
      continue;
    }

    if (J_NAMESPACE_RUNTIME_ASSIGNMENT.test(line) === false)
    {
      continue;
    }

    // Append the row to the working collection.
    violations.push(
      `${filePath}:${lineIndex + 1}: runtime state must not mutate J.* (use a runtime class or $gameSystem)`
    );
  }

  return violations;
}

/**
 * @param {string} filePath The file path driving this step.
 * @param {string} contents The contents driving this step.
 * @returns {string[]}
 */
function collectSourceBoundaryViolations(filePath, contents)
{
  const violations = [];

  if (CROSS_PLUGIN_BASE_IMPORT.test(contents))
  {
    violations.push(`${filePath}: cross-plugin import from _base/ (use hoisted globals from J-Base after load, e.g. ParameterRegistry)`);
  }

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
 * @param {string} globPattern The glob pattern driving this step.
 * @param {import('glob').GlobOptions} [options] The [options] driving this step.
 * @returns {Promise<string[]>}
 */
async function listJsFiles(globPattern, options)
{
  return glob(globPattern, options);
}

/**
 * @param {string[]} files The files driving this step.
 * @param {(filePath: string, contents: string) => string[]} collector The collector driving this step.
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
    description: 'Shipped bundles must not contain import/export — RMMZ loads plugins as classic scripts.',
    run: async () =>
    {
      const files = await listJsFiles(`${OUT_DIR}/**/*.js`);
      return scanFiles(files, collectShippedModuleSyntaxViolations);
    },
  },
  {
    name: 'shipped-no-dollar-one-collisions',
    description: 'Shipped bundles must not contain $1 bundler rename collisions (missing same-ship imports in source).',
    run: async () =>
    {
      const files = await listJsFiles(`${OUT_DIR}/**/*.js`);
      return scanFiles(files, collectShippedDollarOneViolations);
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
      return scanFiles(files, collectSourceBoundaryViolations);
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
  {
    name: 'source-export-default-only',
    description: 'Plugin source uses export default only (meta.js exempt).',
    run: async () =>
    {
      const files = await listJsFiles(`${SRC_PLUGINS_DIR}/**/*.js`, {
        ignore: [ '**/entry.js' ],
      });
      return scanFiles(files, collectExportDefaultOnlyViolations);
    },
  },
  {
    name: 'source-j-namespace-bootstrap-in-init-only',
    description: 'J.* bootstrap assignments belong in initialization.js only.',
    run: async () =>
    {
      const files = await listJsFiles(`${SRC_PLUGINS_DIR}/**/*.js`);
      return scanFiles(files, collectJNamespaceBootstrapViolations);
    },
  },
  {
    name: 'source-j-namespace-no-runtime-state',
    description: 'Runtime counters/toggles must not hang off J.*.',
    run: async () =>
    {
      const files = await listJsFiles(`${SRC_PLUGINS_DIR}/**/*.js`);
      return scanFiles(files, collectJNamespaceRuntimeViolations);
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

  // Emit this message even when logging is muted.
  Logger.logAnyway('Ship verify FAILED:', LogStyle.brightRed);

  for (const { check, violations } of results)
  {
    if (violations.length === 0)
    {
      continue;
    }

    // Emit this message even when logging is muted.
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