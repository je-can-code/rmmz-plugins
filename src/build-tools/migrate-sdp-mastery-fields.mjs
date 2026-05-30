import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * @param {string|number|null|undefined} value
 * @param {number} defaultValue
 * @returns {number}
 */
function parseIntField(value, defaultValue)
{
  if (value === undefined || value === null || value === '')
  {
    return defaultValue;
  }

  const parsed = Number.parseInt(String(value), 10);

  if (Number.isNaN(parsed))
  {
    return defaultValue;
  }

  return parsed;
}

/**
 * Ensures config.sdp.json matches the J-SDP loader contract:
 * - root `{ sdps, subgroups }` wrapper (legacy bare arrays upgraded)
 * - every panel row carries a nested `mastery` object
 * - numeric mastery tiers/ids (not strings)
 * - legacy flat root fields removed after nesting
 *
 * @param {string} filePath Absolute path to config.sdp.json.
 */
function migrateMasteryFields(filePath)
{
  const raw = readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  let config = parsed;
  let wrappedLegacyArray = false;

  if (Array.isArray(parsed))
  {
    config = {
      sdps: parsed,
      subgroups: [],
    };
    wrappedLegacyArray = true;
  }

  if (!config.sdps || Array.isArray(config.sdps) === false)
  {
    throw new Error(`${filePath}: expected a panel array or { sdps: [...] }.`);
  }

  if (!config.subgroups)
  {
    config.subgroups = [];
  }

  if (Array.isArray(config.subgroups) === false)
  {
    throw new Error(`${filePath}: "subgroups" must be an array when present.`);
  }

  let panelsPatched = 0;

  config.sdps.forEach(panel =>
  {
    let patched = false;
    let { mastery } = panel;

    if (mastery === undefined || mastery === null || typeof mastery !== 'object')
    {
      mastery = {
        subgroupKey: panel.subgroupKey ?? '',
        subgroupTier: panel.subgroupTier ?? 0,
        masterySkillId: panel.masterySkillId ?? 0,
      };
      patched = true;
    }

    const normalizedMastery = {
      subgroupKey: typeof mastery.subgroupKey === 'string'
        ? mastery.subgroupKey
        : String(mastery.subgroupKey ?? ''),
      subgroupTier: parseIntField(mastery.subgroupTier, 0),
      masterySkillId: parseIntField(mastery.masterySkillId, 0),
    };

    if (
      panel.mastery === undefined
      || panel.mastery.subgroupKey !== normalizedMastery.subgroupKey
      || panel.mastery.subgroupTier !== normalizedMastery.subgroupTier
      || panel.mastery.masterySkillId !== normalizedMastery.masterySkillId
    )
    {
      panel.mastery = normalizedMastery;
      patched = true;
    }

    if ('subgroupKey' in panel)
    {
      delete panel.subgroupKey;
      patched = true;
    }

    if ('subgroupTier' in panel)
    {
      delete panel.subgroupTier;
      patched = true;
    }

    if ('masterySkillId' in panel)
    {
      delete panel.masterySkillId;
      patched = true;
    }

    if (patched)
    {
      panelsPatched += 1;
    }
  });

  writeFileSync(filePath, `${JSON.stringify(config, null, 2)}\n`);

  console.log(
    `${filePath}: `
    + `${config.sdps.length} panels, ${config.subgroups.length} subgroups, `
    + `${panelsPatched} panel(s) nested under mastery`
    + `${wrappedLegacyArray ? ', legacy array wrapped' : ''}.`
  );
}

const targets = process.argv.slice(2);

if (!targets.length)
{
  console.error('Usage: bun run migrate:sdp-mastery <config.sdp.json> [...]');
  process.exit(1);
}

targets.forEach(target => migrateMasteryFields(resolve(target)));