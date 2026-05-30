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
 * @param {string|number|null|undefined} value
 * @param {number} defaultValue
 * @returns {number}
 */
function parseFloatField(value, defaultValue)
{
  if (value === undefined || value === null || value === '')
  {
    return defaultValue;
  }

  const parsed = Number.parseFloat(String(value));

  if (Number.isNaN(parsed))
  {
    return defaultValue;
  }

  return parsed;
}

/**
 * Ensures config.sdp.json matches the J-SDP loader contract:
 * - root `{ sdps, subgroups }` wrapper (legacy bare arrays upgraded)
 * - every panel row carries nested `identity`, `progression`, and `mastery` objects
 * - numeric fields normalized (not strings)
 * - legacy flat root fields removed after nesting
 *
 * @param {string} filePath Absolute path to config.sdp.json.
 */
function migratePanelShape(filePath)
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

  // eslint-disable-next-line complexity -- legacy panel fields normalize in one pass per row
  config.sdps.forEach(panel =>
  {
    let patched = false;

    let { identity } = panel;

    if (identity === undefined || identity === null || typeof identity !== 'object')
    {
      identity = {
        name: panel.name ?? '',
        iconIndex: panel.iconIndex ?? 0,
        unlockedByDefault: panel.unlockedByDefault === true,
        description: panel.description ?? '',
        topFlavorText: panel.topFlavorText ?? '',
      };
      patched = true;
    }

    const normalizedIdentity = {
      name: typeof identity.name === 'string' ? identity.name : String(identity.name ?? ''),
      iconIndex: parseIntField(identity.iconIndex, 0),
      unlockedByDefault: identity.unlockedByDefault === true,
      description: typeof identity.description === 'string'
        ? identity.description
        : String(identity.description ?? ''),
      topFlavorText: typeof identity.topFlavorText === 'string'
        ? identity.topFlavorText
        : String(identity.topFlavorText ?? ''),
    };

    if (
      panel.identity === undefined
      || JSON.stringify(panel.identity) !== JSON.stringify(normalizedIdentity)
    )
    {
      panel.identity = normalizedIdentity;
      patched = true;
    }

    let { progression } = panel;

    if (progression === undefined || progression === null || typeof progression !== 'object')
    {
      progression = {
        maxRank: panel.maxRank ?? 1,
        rarity: panel.rarity ?? 0,
        baseCost: panel.baseCost ?? 0,
        flatGrowthCost: panel.flatGrowthCost ?? 0,
        multGrowthCost: panel.multGrowthCost ?? 1,
      };
      patched = true;
    }

    const normalizedProgression = {
      maxRank: parseIntField(progression.maxRank, 1),
      rarity: parseIntField(progression.rarity, 0),
      baseCost: parseIntField(progression.baseCost, 0),
      flatGrowthCost: parseIntField(progression.flatGrowthCost, 0),
      multGrowthCost: parseFloatField(progression.multGrowthCost, 1),
    };

    if (
      panel.progression === undefined
      || JSON.stringify(panel.progression) !== JSON.stringify(normalizedProgression)
    )
    {
      panel.progression = normalizedProgression;
      patched = true;
    }

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
      || JSON.stringify(panel.mastery) !== JSON.stringify(normalizedMastery)
    )
    {
      panel.mastery = normalizedMastery;
      patched = true;
    }

    const legacyRootFields = [
      'name',
      'iconIndex',
      'unlockedByDefault',
      'description',
      'topFlavorText',
      'maxRank',
      'rarity',
      'baseCost',
      'flatGrowthCost',
      'multGrowthCost',
      'subgroupKey',
      'subgroupTier',
      'masterySkillId',
    ];

    legacyRootFields.forEach(field =>
    {
      if (field in panel)
      {
        delete panel[field];
        patched = true;
      }
    });

    if (patched)
    {
      panelsPatched += 1;
    }
  });

  writeFileSync(filePath, `${JSON.stringify(config, null, 2)}\n`);

  console.log(
    `${filePath}: `
    + `${config.sdps.length} panels, ${config.subgroups.length} subgroups, `
    + `${panelsPatched} panel(s) normalized to identity/progression/mastery`
    + `${wrappedLegacyArray ? ', legacy array wrapped' : ''}.`
  );
}

const targets = process.argv.slice(2);

if (!targets.length)
{
  console.error('Usage: bun run migrate:sdp-panel-shape <config.sdp.json> [...]');
  process.exit(1);
}

targets.forEach(target => migratePanelShape(resolve(target)));