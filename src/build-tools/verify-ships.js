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
 * @param {string} filePath The file path driving this step.
 * @param {string} contents The contents driving this step.
 * @returns {string[]}
 */
function collectGlobalThisWriteViolations(filePath, contents)
{
  const violations = [];
  const lines = contents.split('\n');

  // iterate the loop counter until the guard exits.
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++)
  {
    const line = lines[lineIndex];

    // when line.includes('globalThis')  equals  false, take this branch.
    if (line.includes('globalThis') === false)
    {
      continue;
    }

    // when ALLOWED_GLOBAL_THIS_J_BOOTSTRAP.test(line), take this branch.
    if (ALLOWED_GLOBAL_THIS_J_BOOTSTRAP.test(line))
    {
      continue;
    }

    // capture write match for downstream policy in this routine.
    const writeMatch = line.match(GLOBAL_THIS_WRITE);

    // when writeMatch  equals  null, take this branch.
    if (writeMatch === null)
    {
      continue;
    }

    // capture property name for downstream policy in this routine.
    const [, propertyName] = writeMatch;

    // when LEGACY_GLOBAL_THIS_PROPERTIES.has(propertyName), take this branch.
    if (LEGACY_GLOBAL_THIS_PROPERTIES.has(propertyName))
    {
      continue;
    }

    // Append the row to the working collection.
    violations.push(
      `${filePath}:${lineIndex + 1}: globalThis write on "${propertyName}" (only "globalThis.J ||= {};" allowed)`
    );
  }

  // hand back violations to the caller.
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

  // iterate the loop counter until the guard exits.
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++)
  {
    const line = lines[lineIndex];

    // when line.includes('J.')  equals  false, take this branch.
    if (line.includes('J.') === false)
    {
      continue;
    }

    // when line.includes('new '), take this branch.
    if (line.includes('new '))
    {
      continue;
    }

    // when /=\s*J\./.test(line), take this branch.
    if (/=\s*J\./.test(line))
    {
      continue;
    }

    // capture mirror match for downstream policy in this routine.
    const mirrorMatch = line.match(J_NAMESPACE_CLASS_MIRROR);

    // when mirrorMatch  equals  null, take this branch.
    if (mirrorMatch === null)
    {
      continue;
    }

    // capture class name for downstream policy in this routine.
    const [, className] = mirrorMatch;
    violations.push(
      `${filePath}:${lineIndex + 1}: needless J namespace class mirror (J.* = ${className}; import or use hoisted global)`
    );
  }

  // hand back violations to the caller.
  return violations;
}

/**
 * @param {string} filePath The file path driving this step.
 * @param {string} contents The contents driving this step.
 * @returns {string[]}
 */
function collectShippedModuleAndBundlerViolations(filePath, contents)
{
  const violations = [];

  // when SHIPPED_MODULE_LINE.test(contents), take this branch.
  if (SHIPPED_MODULE_LINE.test(contents))
  {
    violations.push(`${filePath}: contains import/export (RMMZ cannot load module syntax)`);
  }

  // capture dollar one matches for downstream policy in this routine.
  const dollarOneMatches = contents.match(new RegExp(BUNDLER_DOLLAR_ONE.source, 'g'));

  // when dollarOneMatches  and  dollarOneMatches.length > 0, take this branch.
  if (dollarOneMatches && dollarOneMatches.length > 0)
  {
    const unique = [ ...new Set(dollarOneMatches) ];
    violations.push(`${filePath}: bundler rename collision(s): ${unique.join(', ')}`);
  }

  // hand back violations to the caller.
  return violations;
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

  // capture violations for downstream policy in this routine.
  const violations = [];
  const lines = contents.split('\n');
  let defaultExportCount = 0;

  // iterate the loop counter until the guard exits.
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++)
  {
    const line = lines[lineIndex];

    // when /^\s*export\s+default\b/.test(line), take this branch.
    if (/^\s*export\s+default\b/.test(line))
    {
      defaultExportCount++;
      continue;
    }

    // when NON_DEFAULT_EXPORT.test(line), take this branch.
    if (NON_DEFAULT_EXPORT.test(line))
    {
      violations.push(
        `${filePath}:${lineIndex + 1}: use export default only (one class/object per file; meta.js exempt)`
      );
    }
  }

  // when defaultExportCount > 1, take this branch.
  if (defaultExportCount > 1)
  {
    violations.push(
      `${filePath}: multiple export default declarations (${defaultExportCount})`
    );
  }

  // hand back violations to the caller.
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

  // capture violations for downstream policy in this routine.
  const violations = [];
  const lines = contents.split('\n');

  // iterate the loop counter until the guard exits.
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++)
  {
    const line = lines[lineIndex];

    // when line.includes('J.')  equals  false, take this branch.
    if (line.includes('J.') === false)
    {
      continue;
    }

    // when J_NAMESPACE_BOOTSTRAP_ASSIGNMENT.test(line)  equals  false, take this branch.
    if (J_NAMESPACE_BOOTSTRAP_ASSIGNMENT.test(line) === false)
    {
      continue;
    }

    // Append the row to the working collection.
    violations.push(
      `${filePath}:${lineIndex + 1}: J namespace bootstrap assignment belongs in initialization.js only`
    );
  }

  // hand back violations to the caller.
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

  // capture violations for downstream policy in this routine.
  const violations = [];
  const lines = contents.split('\n');

  // iterate the loop counter until the guard exits.
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++)
  {
    const line = lines[lineIndex];

    // when line.includes('J.')  equals  false, take this branch.
    if (line.includes('J.') === false)
    {
      continue;
    }

    // when J_NAMESPACE_RUNTIME_ASSIGNMENT.test(line)  equals  false, take this branch.
    if (J_NAMESPACE_RUNTIME_ASSIGNMENT.test(line) === false)
    {
      continue;
    }

    // Append the row to the working collection.
    violations.push(
      `${filePath}:${lineIndex + 1}: runtime state must not mutate J.* (use a runtime class or $gameSystem)`
    );
  }

  // hand back violations to the caller.
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

  // when CROSS_PLUGIN_BASE_IMPORT.test(contents), take this branch.
  if (CROSS_PLUGIN_BASE_IMPORT.test(contents))
  {
    violations.push(`${filePath}: cross-plugin import from _base/ (use hoisted globals from J-Base after load, e.g. ParameterRegistry)`);
  }

  // when ENGINE_GLOBAL_CLASS.test(contents), take this branch.
  if (ENGINE_GLOBAL_CLASS.test(contents))
  {
    violations.push(`${filePath}: redefines engine global as class (use IconManager.foo = function augmentation)`);
  }

  // when ENGINE_GLOBAL_EXPORT.test(contents), take this branch.
  if (ENGINE_GLOBAL_EXPORT.test(contents))
  {
    violations.push(`${filePath}: export default on engine global (causes IconManager$1-style collisions)`);
  }

  // hand back violations to the caller.
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

  // walk each entry in the iterable for this routine.
  for (const filePath of files)
  {
    const contents = await fs.readFile(filePath, 'utf-8');
    violations.push(...collector(path.normalize(filePath), contents));
  }

  // hand back violations to the caller.
  return violations;
}

/** @type {ShipVerifyCheck[]} */
const CHECKS = [
  {
    name: 'shipped-no-module-syntax-or-dollar-one',
    description: 'Shipped bundles must not contain import/export or $1 bundler collisions.',
    run: async () =>
    {
      const files = await listJsFiles(`${OUT_DIR}/**/*.js`);
      return scanFiles(files, collectShippedModuleAndBundlerViolations);
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

  // walk each entry in the iterable for this routine.
  for (const check of CHECKS)
  {
    const violations = await check.run();
    results.push({ check, violations });
  }

  // capture total violations for downstream policy in this routine.
  const totalViolations = results.reduce((count, entry) => count + entry.violations.length, 0);

  // when totalViolations  equals  0, take this branch.
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

  // walk each entry in the iterable for this routine.
  for (const { check, violations } of results)
  {
    if (violations.length === 0)
    {
      continue;
    }

    // Emit this message even when logging is muted.
    Logger.logAnyway(`  [${check.name}]`, LogStyle.brightRed);

    // walk each entry in the iterable for this routine.
    for (const message of violations)
    {
      Logger.logAnyway(`    • ${message}`, LogStyle.brightRed);
    }
  }

  // hand back 1 to the caller.
  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-ships