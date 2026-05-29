import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Legacy SDP panel long-param id → registry key.
 * Keep in sync with {@link ParameterKeys.LEGACY_LONG_PARAM_TO_KEY}.
 */
const LEGACY_LONG_PARAM_TO_KEY = {
  0: 'mhp',
  1: 'mmp',
  2: 'atk',
  3: 'def',
  4: 'mat',
  5: 'mdf',
  6: 'agi',
  7: 'luk',
  8: 'hit',
  9: 'eva',
  10: 'cri',
  11: 'cev',
  12: 'mev',
  13: 'mrf',
  14: 'cnt',
  15: 'hrg',
  16: 'mrg',
  17: 'trg',
  18: 'tgr',
  19: 'grd',
  20: 'rec',
  21: 'pha',
  22: 'mcr',
  23: 'tcr',
  24: 'pdr',
  25: 'mdr',
  26: 'fdr',
  27: 'exr',
  28: 'cdm',
  29: 'cdr',
  30: 'mtp',
  31: 'msb',
  32: 'prof',
  33: 'sdr',
  35: 'lst',
  36: 'mst',
  37: 'tst',
  38: 'sar',
  39: 'ser',
  40: 'apr',
  41: 'gdr',
  42: 'dor',
  43: 'hcr',
};

/**
 * Rewrites panel parameter blobs from legacy numeric ids to registry keys.
 * @param {string} filePath Absolute path to config.sdp.json.
 */
function migrateConfigFile(filePath)
{
  const raw = readFileSync(filePath, 'utf8');
  const config = JSON.parse(raw);
  const isWrapped = !Array.isArray(config);
  const panels = isWrapped
    ? config.sdps
    : config;

  if (!panels)
  {
    throw new Error(`${filePath}: expected a panel array or { sdps: [...] }.`);
  }

  let migratedCount = 0;
  let skippedCount = 0;

  panels.forEach(panel =>
  {
    if (!panel.panelParameters) return;

    panel.panelParameters.forEach(entry =>
    {
      if (entry.parameterKey)
      {
        skippedCount += 1;
        return;
      }

      const legacyId = Number.parseInt(String(entry.parameterId), 10);
      const parameterKey = LEGACY_LONG_PARAM_TO_KEY[legacyId];

      if (!parameterKey)
      {
        throw new Error(`${filePath}: unknown parameterId ${legacyId} on panel "${panel.key}".`);
      }

      entry.parameterKey = parameterKey;
      delete entry.parameterId;
      migratedCount += 1;
    });
  });

  const output = isWrapped
    ? config
    : panels;
  writeFileSync(filePath, `${JSON.stringify(output, null, 2)}\n`);

  console.log(`${filePath}: migrated ${migratedCount}, already keyed ${skippedCount}.`);
}

const targets = process.argv.slice(2);

if (!targets.length)
{
  console.error('Usage: bun run migrate:sdp-keys <config.sdp.json> [...]');
  process.exit(1);
}

targets.forEach(target => migrateConfigFile(resolve(target)));
