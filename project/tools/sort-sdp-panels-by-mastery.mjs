/**
 * Re-order config.sdp.json panels so masterySkillId increases monotonically.
 *
 * Blocks: TUT/ENC/FGT (intro) → wired decade strips (main) → SIN (outro).
 * Covenant (COV) removed — not part of the family budget.
 *
 * Usage: node project/tools/sort-sdp-panels-by-mastery.mjs [--apply]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '../data/config.sdp.json');
const apply = process.argv.includes('--apply');

const INTRO_PREFIXES = ['TUT', 'ENC', 'FGT'];
const INTRO_PREFIX_SET = new Set(INTRO_PREFIXES);
const OUTRO_PREFIXES = ['SIN'];
const OUTRO_PREFIX_SET = new Set(OUTRO_PREFIXES);

/**
 * @param {string} key
 * @returns {boolean}
 */
function isHeaderRow(key)
{
  return /^[A-Z]{3}___$/.test(key);
}

/**
 * @param {string} key
 * @returns {string|null}
 */
function panelPrefix(key)
{
  const headerMatch = /^([A-Z]{3})___$/.exec(key);

  if (headerMatch !== null)
  {
    return headerMatch[1];
  }

  const tierMatch = /^([A-Z]{3})_(\d{1,2})$/.exec(key);

  if (tierMatch !== null)
  {
    return tierMatch[1];
  }

  return null;
}

/**
 * @param {string} key
 * @returns {number}
 */
function panelTier(key)
{
  const tierMatch = /^([A-Z]{3})_(\d{1,2})$/.exec(key);

  if (tierMatch === null)
  {
    return 0;
  }

  return Number(tierMatch[2]);
}

/**
 * @param {object[]} panels
 * @param {string[]} prefixOrder
 * @returns {object[]}
 */
function sortIntroOrOutroBlock(panels, prefixOrder)
{
  const prefixRank = new Map(prefixOrder.map((prefix, index) => [prefix, index]));
  /** @type {Map<string, object>} */
  const headers = new Map();
  /** @type {object[]} */
  const numbered = [];

  for (const panel of panels)
  {
    const prefix = panelPrefix(panel.key);

    if (prefix === null)
    {
      numbered.push(panel);
      continue;
    }

    if (isHeaderRow(panel.key))
    {
      headers.set(prefix, panel);
      continue;
    }

    numbered.push(panel);
  }

  numbered.sort((left, right) =>
  {
    const leftPrefix = panelPrefix(left.key);
    const rightPrefix = panelPrefix(right.key);
    const leftRank = prefixRank.get(leftPrefix) ?? 999;
    const rightRank = prefixRank.get(rightPrefix) ?? 999;

    if (leftRank !== rightRank)
    {
      return leftRank - rightRank;
    }

    return panelTier(left.key) - panelTier(right.key);
  });

  const result = [];
  const seenPrefix = new Set();

  for (const panel of numbered)
  {
    const prefix = panelPrefix(panel.key);

    if (prefix !== null && seenPrefix.has(prefix) === false)
    {
      const header = headers.get(prefix);

      if (header !== undefined)
      {
        result.push(header);
      }

      seenPrefix.add(prefix);
    }

    result.push(panel);
  }

  prefixOrder.forEach((prefix) =>
  {
    if (seenPrefix.has(prefix) === false && headers.has(prefix))
    {
      result.push(headers.get(prefix));
    }
  });

  return result;
}

/**
 * @param {object} config
 * @returns {object[]}
 */
function sortPanels(config)
{
  const introRaw = [];
  const outroRaw = [];
  /** @type {Map<string, object>} */
  const headers = new Map();
  /** @type {object[]} */
  const mainNumbered = [];
  /** @type {object[]} */
  const mainOrphans = [];

  for (const panel of config.sdps)
  {
    const prefix = panelPrefix(panel.key);

    if (prefix === null)
    {
      mainOrphans.push(panel);
      continue;
    }

    if (INTRO_PREFIX_SET.has(prefix))
    {
      introRaw.push(panel);
      continue;
    }

    if (OUTRO_PREFIX_SET.has(prefix))
    {
      outroRaw.push(panel);
      continue;
    }

    if (isHeaderRow(panel.key))
    {
      headers.set(prefix, panel);
      continue;
    }

    mainNumbered.push(panel);
  }

  mainNumbered.sort((left, right) =>
  {
    const leftId = left.mastery.masterySkillId;
    const rightId = right.mastery.masterySkillId;

    if (leftId !== rightId)
    {
      return leftId - rightId;
    }

    return left.key.localeCompare(right.key);
  });

  const main = [];
  const seenHeaderPrefix = new Set();

  for (const panel of mainNumbered)
  {
    const prefix = panelPrefix(panel.key);

    if (prefix !== null && seenHeaderPrefix.has(prefix) === false)
    {
      const header = headers.get(prefix);

      if (header !== undefined)
      {
        main.push(header);
      }

      seenHeaderPrefix.add(prefix);
    }

    main.push(panel);
  }

  headers.forEach((header, prefix) =>
  {
    if (seenHeaderPrefix.has(prefix) === false)
    {
      main.push(header);
    }
  });

  if (mainOrphans.length > 0)
  {
    main.push(...mainOrphans);
  }

  const intro = sortIntroOrOutroBlock(introRaw, INTRO_PREFIXES);
  const outro = sortIntroOrOutroBlock(outroRaw, OUTRO_PREFIXES);

  return [...intro, ...main, ...outro];
}

/**
 * @param {object[]} panels
 * @returns {{ ok: boolean, issues: string[] }}
 */
function validateOrder(panels)
{
  const issues = [];
  let prevMainId = 0;

  for (const panel of panels)
  {
    const prefix = panelPrefix(panel.key);
    const skillId = panel.mastery.masterySkillId;

    if (prefix !== null && INTRO_PREFIX_SET.has(prefix))
    {
      continue;
    }

    if (prefix !== null && OUTRO_PREFIX_SET.has(prefix))
    {
      break;
    }

    if (isHeaderRow(panel.key) || skillId <= 0)
    {
      continue;
    }

    if (skillId < prevMainId)
    {
      issues.push(`${panel.key} skill ${skillId} after ${prevMainId}`);
    }

    prevMainId = skillId;
  }

  return { ok: issues.length === 0, issues };
}

const config = JSON.parse(readFileSync(configPath, 'utf8'));
const before = validateOrder(config.sdps);
const sorted = sortPanels(config);
const after = validateOrder(sorted);

console.log(`Before: ${before.ok ? 'OK' : `${before.issues.length} issue(s)`}`);

if (before.issues.length > 0)
{
  before.issues.forEach((line) => console.log(`  ${line}`));
}

console.log(`After:  ${after.ok ? 'OK' : `${after.issues.length} issue(s)`}`);

if (after.issues.length > 0)
{
  after.issues.forEach((line) => console.log(`  ${line}`));
}

const introHead = sorted.slice(0, 8).map((panel) => panel.key).join(', ');
const mainHead = sorted.find((panel) => panel.key === 'GHO___');
const mainIdx = sorted.findIndex((panel) => panel.key === 'GHO___');

console.log(`Intro head: ${introHead}`);
console.log(`GHO___ index: ${mainIdx} (next: ${sorted[mainIdx + 1]?.key})`);
console.log(`Panel count: ${config.sdps.length} → ${sorted.length}`);

if (apply === false)
{
  console.log('\nDry run — pass --apply to write config.sdp.json');
}
else
{
  config.sdps = sorted;
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`Wrote ${configPath}`);
}
