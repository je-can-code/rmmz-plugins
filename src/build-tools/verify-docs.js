//region verify-docs
/**
 * Verifies plugin and build-tool source documentation before ship.<br/>
 * JSDocs survive Vite bundles and are the durable author-facing contract in {@code out/};
 * inline comments are source-only but must still read as pedagogical voice-over per guidelines.
 *
 * Modeled after {@link verify-ships.js}: grouped failures, non-zero exit, wired into {@code hotfix}.
 *
 * Usage:
 *   node src/build-tools/verify-docs.js
 *   node src/build-tools/verify-docs.js --glob "src/build-tools/logger.js"
 *   node src/build-tools/verify-docs.js --stats
 */
import * as acorn from 'acorn';
import { ancestor as walkAncestor } from 'acorn-walk';
import { glob } from 'glob';
import * as fs from 'fs/promises';
import path from 'node:path';
import Logger, { LogStyle } from './logger.js';

/** Default scan targets — full ocean, not per-ship rollout. */
const DEFAULT_GLOBS = [
  'src/plugins/**/*.js',
  'src/build-tools/**/*.js',
];

/** Shipped entry shims and meta-only files do not carry author-facing API surface. */
const EXEMPT_BASENAMES = new Set([
  'entry.js',
  'meta.js',
]);

/** Build configs and declaration files are tooling, not pedagogical plugin source. */
const EXEMPT_SUFFIXES = [
  'vite.config.',
  '.d.ts',
];

/** Harness fixtures are validated by tests, not doc voice-over rules. */
const EXEMPT_PATH_PARTS = [
  '/test/',
  '/__tests__/',
  '/fixtures/',
];

/** Minimum prose length for the JSDoc summary line(s) before {@code @param}/{@code @returns}. */
const MIN_DESCRIPTION_LENGTH = 15;

/** Alias chains must keep this landmark comment (guidelines + BlizzABS voice-over). */
const ALIAS_LANDMARK = 'perform original logic';

/**
 * One documentation violation emitted by a rule check.
 * @typedef {{ file: string, line: number, rule: string, detail: string }} DocViolation
 */

/**
 * Decides whether a file path is excluded from documentation verification entirely.
 * @param {string} filePath Repository-relative path to a candidate source file.
 * @returns {boolean} True when the file should not be scanned.
 */
function isExemptFile(filePath)
{
  const base = path.basename(filePath);

  if (EXEMPT_BASENAMES.has(base)) return true;

  if (EXEMPT_SUFFIXES.some(suffix => base.includes(suffix))) return true;

  if (EXEMPT_PATH_PARTS.some(part => filePath.includes(part))) return true;

  return false;
}

/**
 * Splits a raw block comment into summary prose and {@code @} tag lines.
 * @param {string} raw Full {@code /** … *\/} source including delimiters.
 * @returns {{ description: string, tags: string[] }} Parsed summary and tag lines.
 */
function parseJsdocBlock(raw)
{
  const body = raw.replace(/^\/\*\*/, '').replace(/\*\/$/, '');
  const lines = body.split('\n').map(line => line.replace(/^\s*\*\s?/, '').trim());

  /** @type {string[]} */
  const descriptionLines = [];
  /** @type {string[]} */
  const tags = [];

  for (const line of lines)
  {
    if (line.startsWith('@'))
    {
      tags.push(line);
    }
    else if (tags.length === 0 && line.length > 0)
    {
      descriptionLines.push(line);
    }
  }

  return {
    description: descriptionLines.join(' ').trim(),
    tags,
  };
}

/**
 * Whether a {@code @param}/{@code @returns} tag includes prose after the type/name slot.
 * @param {string} tagLine Single tag line from a JSDoc block (without leading {@code *}).
 * @returns {boolean} True when the tag carries author-facing description text.
 */
function tagHasProseAfterName(tagLine)
{
  const paramMatch = tagLine.match(/^@param\s+\{[^}]+\}\s+(\S+)\s*(.*)$/);

  if (paramMatch)
  {
    return paramMatch[2].trim().length >= 3;
  }

  const returnsMatch = tagLine.match(/^@returns?\s+\{[^}]+\}\s*(.*)$/);

  if (returnsMatch)
  {
    return returnsMatch[1].trim().length >= 3;
  }

  // @type and other tags — prose optional.
  return true;
}

/**
 * Extracts declared parameter names from a function AST node.
 * Handles simple identifiers, default-value patterns, and rest elements.
 * Destructured patterns (ObjectPattern, ArrayPattern) are skipped — they have no single name.
 * @param {import('acorn').Function | null} fnNode The function node to inspect.
 * @returns {string[]} The declared parameter names in declaration order.
 */
function extractFunctionParamNames(fnNode)
{
  if (!fnNode || !Array.isArray(fnNode.params)) return [];

  /** @type {string[]} */
  const names = [];

  for (const param of fnNode.params)
  {
    if (param.type === 'Identifier')
    {
      names.push(param.name);
    }
    else if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier')
    {
      names.push(param.left.name);
    }
    else if (param.type === 'RestElement' && param.argument.type === 'Identifier')
    {
      names.push(param.argument.name);
    }
  }

  return names;
}

/**
 * Detects type-echo summaries that repeat the identifier without policy or intent.
 * @param {string} description Joined summary prose from {@link parseJsdocBlock}.
 * @returns {boolean} True when the summary is too short or obviously useless.
 */
function isGarbageDescription(description)
{
  if (description.length < MIN_DESCRIPTION_LENGTH) return true;

  if (/^(gets?|returns?|sets?|initializes?|creates?|handles?|checks?)\s+(the\s+)?[\w.]+\.?$/i.test(description))
  {
    return true;
  }

  return false;
}

/**
 * Finds the JSDoc block immediately preceding an AST node anchor position.
 * @param {import('acorn').Comment[]} comments All comments collected during parse.
 * @param {number} nodeStart Character offset where the documented node begins.
 * @returns {import('acorn').Comment|null} Nearest preceding block JSDoc, or null.
 */
function findJsdocBefore(comments, nodeStart)
{
  /** @type {import('acorn').Comment|null} */
  let candidate = null;

  for (const comment of comments)
  {
    if (comment.type !== 'Block') continue;

    if (comment.start >= nodeStart) continue;

    if (comment.value.startsWith('*') === false) continue;

    if (comment.end <= nodeStart && (candidate === null || comment.end > candidate.end))
    {
      candidate = comment;
    }
  }

  return candidate;
}

/**
 * Whether an ancestor chain places the node inside another function body.<br/>
 * Nested closures are implementation details — only module-level and class methods are gated.
 * @param {import('acorn').Node[]} ancestors AST ancestors from {@code acorn-walk.ancestor}.
 * @returns {boolean} True when the node lives inside another function.
 */
function isNestedInFunction(ancestors)
{
  return ancestors.some(ancestor =>
    ancestor.type === 'FunctionDeclaration'
    || ancestor.type === 'FunctionExpression'
    || ancestor.type === 'MethodDefinition');
}

/**
 * Whether an assignment lives at module scope (prototype alias), not inside a function.
 * @param {import('acorn').Node[]} ancestors AST ancestors from {@code acorn-walk.ancestor}.
 * @returns {boolean} True when the assignment is a top-level prototype alias target.
 */
function isTopLevelAssignment(ancestors)
{
  return ancestors.some(ancestor => ancestor.type === 'Program');
}

/**
 * Validates summary prose and {@code @param}/{@code @returns} tags on one JSDoc block.
 * @param {string} jsdocRaw Reconstructed {@code /** … *\/} comment text.
 * @param {string} file Repository-relative file path for reporting.
 * @param {number} line 1-based line number of the documented node.
 * @param {string[]} actualParamNames Declared parameter names from the function AST node.
 * @returns {DocViolation[]} JSDoc content violations (empty when clean).
 */
function validateJsdocContent(jsdocRaw, file, line, actualParamNames = [])
{
  /** @type {DocViolation[]} */
  const violations = [];
  const { description, tags } = parseJsdocBlock(jsdocRaw);

  if (isGarbageDescription(description))
  {
    violations.push({
      file,
      line,
      rule: 'jsdoc-summary',
      detail: 'JSDoc needs a substantive summary before @tags (intent/policy, not type echo).',
    });
  }

  for (const tag of tags)
  {
    // @returns carries type only — intent lives in the summary and @param tags.
    if (tag.startsWith('@param') === false) continue;

    if (tagHasProseAfterName(tag) === false)
    {
      violations.push({
        file,
        line,
        rule: 'jsdoc-tag-prose',
        detail: `@tag must include prose after the type/name — not bare \`${tag}\`.`,
      });
    }

    // skip when the function has no extractable params (destructured, anonymous, etc.).
    if (actualParamNames.length === 0) continue;

    // extract the name from `@param {type} name` or `@param {type} [name]`.
    const nameMatch = tag.match(/^@param\s+\{[^}]+\}\s+\[?(\w+)\]?/);

    if (!nameMatch) continue;

    const [ , docName ] = nameMatch;

    // skip dot-notation entries — these document object properties, not direct params.
    if (tag.includes('.')) continue;

    if (actualParamNames.includes(docName) === false)
    {
      violations.push({
        file,
        line,
        rule: 'jsdoc-param-name',
        detail: `@param name '${docName}' does not match any declared parameter [${actualParamNames.join(', ')}] — keep JSDoc in sync with the signature.`,
      });
    }
  }

  return violations;
}



/**
 * Validates pedagogical inline comments inside one function body.
 * @param {string} source Full file source text.
 * @param {import('acorn').Node & { body?: import('acorn').Node, id?: import('acorn').Identifier | null }} fnNode Function AST node.
 * @param {string} file Repository-relative file path for reporting.
 * @param {string|null} [nameOverride] Prototype alias name when {@code fnNode.id} is absent.
 * @returns {DocViolation[]} Inline documentation violations (empty when clean).
 */
function validateFunctionBody(source, fnNode, file, _nameOverride = null)
{
  /** @type {DocViolation[]} */
  const violations = [];

  if (!fnNode.body || fnNode.body.type !== 'BlockStatement') return violations;

  const bodyStart = fnNode.body.start;
  const line = source.slice(0, bodyStart).split('\n').length;
  const bodySource = source.slice(bodyStart, fnNode.body.end);

  if (/(?:\.Aliased\.[\w.]+\.get|Aliased\.[\w.]+\.get)\(/.test(bodySource)
    && bodySource.includes(ALIAS_LANDMARK) === false)
  {
    violations.push({
      file,
      line,
      rule: 'alias-landmark',
      detail: `Alias chain must include an inline "${ALIAS_LANDMARK}." comment.`,
    });
  }

  return violations;
}

/**
 * Runs all documentation rules against one source file.
 * @param {string} filePath Repository-relative path to the file being verified.
 * @param {string} source Full file contents.
 * @returns {DocViolation[]} All violations found in the file.
 */
function verifyFile(filePath, source)
{
  /** @type {DocViolation[]} */
  const violations = [];

  /** @type {import('acorn').Comment[]} */
  const comments = [];

  let program;

  try
  {
    program = acorn.parse(source, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ranges: true,
      onComment: comments,
    });
  }
  catch (error)
  {
    violations.push({
      file: filePath,
      line: 1,
      rule: 'parse-error',
      detail: `Could not parse: ${error.message}`,
    });

    return violations;
  }

  /**
   * Applies JSDoc and inline body checks to one documentable AST anchor.
   * @param {import('acorn').Node} node AST node whose start position anchors JSDoc lookup.
   * @param {import('acorn').Node | null} fnNode Function node for inline body checks, if any.
   * @param {string|null} [nameOverride] Prototype alias name for init-member detection.
   */
  function checkDocumentedNode(node, fnNode, nameOverride = null)
  {
    const anchorStart = node.start;
    const line = source.slice(0, anchorStart).split('\n').length;
    const jsdoc = findJsdocBefore(comments, anchorStart);

    if (!jsdoc)
    {
      violations.push({
        file: filePath,
        line,
        rule: 'missing-jsdoc',
        detail: 'Public function/method/alias needs a multiline JSDoc block immediately above it.',
      });

      return;
    }

    const actualParamNames = extractFunctionParamNames(fnNode);
    violations.push(...validateJsdocContent(`/**${jsdoc.value}*/`, filePath, line, actualParamNames));

    if (fnNode)
    {
      violations.push(...validateFunctionBody(source, fnNode, filePath, nameOverride));
    }
  }

  walkAncestor(program, {
    FunctionDeclaration(node, _state, ancestors)
    {
      if (isNestedInFunction(ancestors)) return;

      checkDocumentedNode(node, node);
    },
    MethodDefinition(node, _state, ancestors)
    {
      if (isNestedInFunction(ancestors)) return;

      if (node.value.type === 'FunctionExpression')
      {
        checkDocumentedNode(node, node.value);
      }
    },
    AssignmentExpression(node, _state, ancestors)
    {
      if (isTopLevelAssignment(ancestors) === false) return;

      if (node.right.type !== 'FunctionExpression') return;

      if (node.left.type !== 'MemberExpression') return;

      const nameOverride = node.left.property.type === 'Identifier'
        ? node.left.property.name
        : null;

      checkDocumentedNode(node, node.right, nameOverride);
    },
  });

  return violations;
}

/**
 * Resolves CLI glob arguments; defaults to the full plugin + build-tool trees.
 * @param {string[]} args Raw {@code process.argv} tail after the node executable.
 * @returns {string[]} Glob patterns to scan.
 */
function resolveGlobPatterns(args)
{
  const globFlagIndex = args.indexOf('--glob');

  if (globFlagIndex >= 0)
  {
    return [ args[globFlagIndex + 1] ];
  }

  return DEFAULT_GLOBS;
}

/**
 * Prints grouped violation counts when {@code --stats} is passed (no file paths).
 * @param {DocViolation[]} violations All violations collected across the run.
 */
function printViolationStats(violations)
{
  /** @type {Map<string, number>} */
  const counts = new Map();

  for (const violation of violations)
  {
    counts.set(violation.rule, (counts.get(violation.rule) || 0) + 1);
  }

  for (const [ rule, count ] of [ ...counts.entries() ].sort((a, b) => b[1] - a[1]))
  {
    Logger.logAnyway(`  ${rule}: ${count}`, LogStyle.dim);
  }
}

/**
 * CLI entry — scans sources, prints grouped failures, exits non-zero when any rule fails.
 * @returns {Promise<number>} Process exit code (0 = clean, 1 = violations present).
 */
async function main()
{
  const args = process.argv.slice(2);
  const statsOnly = args.includes('--stats');
  const globPatterns = resolveGlobPatterns(args);

  /** @type {string[]} */
  const files = [];

  for (const pattern of globPatterns)
  {
    const matched = await glob(pattern, { nodir: true });

    files.push(...matched);
  }

  /** @type {DocViolation[]} */
  const allViolations = [];

  for (const filePath of [ ...new Set(files) ].sort())
  {
    if (isExemptFile(filePath)) continue;

    const source = await fs.readFile(filePath, 'utf8');
    allViolations.push(...verifyFile(filePath, source));
  }

  if (statsOnly)
  {
    Logger.logAnyway(`Doc verify stats (${files.length} files scanned):`, LogStyle.cyan);
    printViolationStats(allViolations);

    return allViolations.length === 0 ? 0 : 1;
  }

  if (allViolations.length === 0)
  {
    Logger.logAnyway(
      `Doc verify: OK (${files.length} files scanned).`,
      LogStyle.brightGreen
    );

    return 0;
  }

  // Emit this message even when logging is muted.
  Logger.logAnyway('Doc verify FAILED:', LogStyle.brightRed);
  printViolationStats(allViolations);

  const byRule = new Map();

  for (const violation of allViolations)
  {
    if (byRule.has(violation.rule) === false) byRule.set(violation.rule, []);

    byRule.get(violation.rule).push(violation);
  }

  for (const [ rule, items ] of byRule)
  {
    Logger.logAnyway(`  [${rule}]`, LogStyle.brightRed);

    for (const item of items)
    {
      Logger.logAnyway(`    • ${item.file}:${item.line}: ${item.detail}`, LogStyle.brightRed);
    }
  }

  return 1;
}

process.exit(await main());
//endregion verify-docs