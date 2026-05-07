/**
 * Drift check / regen aid: extracts `Game_Interpreter.prototype.commandNNN` bodies from `rmmz_objects.js`
 * and prints a candidate `INTERPRETER_COMMAND_PARAM_TYPES` object for `rmmz-defs-infer.js`.
 *
 * Run: `node src/build-tools/generate-interpreter-command-param-types.mjs`
 *
 * After pasting into `rmmz-defs-infer.js`, keep `command231` / `command232` mapped to
 * `INTERPRETER_COMMAND231_PARAMS` / `INTERPRETER_COMMAND232_PARAMS` (lint line cap on tuple width).
 */

/* eslint-env node */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, 'project/js/rmmz_objects.js'), 'utf8');

const MZ_AUDIO_FILE = '{ name: string; pan: number; pitch: number; volume: number }';
const MZ_SCREEN_RGBA = '[number, number, number, number]';

function extractMethods(src)
{
  const out = [];
  let i = 0;
  const prefix = 'Game_Interpreter.prototype.';
  while (i < src.length)
  {
    const idx = src.indexOf(prefix + 'command', i);
    if (idx === -1)
    {
      break;
    }
    const sub = src.slice(idx);
    const m = sub.match(/^Game_Interpreter\.prototype\.(command\d+)\s*=\s*function\s*\(([^)]*)\)\s*\{/);
    if (!m)
    {
      i = idx + 10;
      continue;
    }
    const name = m[1];
    const paramList = m[2].trim();
    let depth = 1;
    let j = idx + m[0].length;
    const startBody = j;
    while (j < src.length && depth > 0)
    {
      const c = src[j];
      if (c === '{')
      {
        depth++;
      }
      else if (c === '}')
      {
        depth--;
      }
      j++;
    }
    const body = src.slice(startBody, j - 1);
    out.push({ name, paramList, body });
    i = j;
  }
  return out;
}

function numTuple(n)
{
  return `readonly [${Array(n).fill('number').join(', ')}]`;
}

/** @type {Record<string, string>} */
const FIXED = Object.freeze({
  command101: 'readonly [string, number, number, number, string]',
  command102: 'readonly [readonly string[], number, number, number, number]',
  command103: 'readonly [number, number]',
  command104: 'readonly [number, number]',
  command105: 'readonly [number, number]',
  command108: 'readonly [string]',
  command111: 'readonly unknown[]',
  command117: 'readonly [number]',
  command119: 'readonly [string]',
  command121: 'readonly [number, number, number]',
  command122: 'readonly unknown[]',
  command123: 'readonly [string, number]',
  command124: 'readonly [number, number]',
  command125: 'readonly [number, number, number]',
  command126: 'readonly [number, number, number, number]',
  command127: 'readonly [number, number, number, number, number]',
  command128: 'readonly [number, number, number, number, number]',
  command129: 'readonly [number, number, number]',
  command132: `readonly [${MZ_AUDIO_FILE}]`,
  command133: `readonly [${MZ_AUDIO_FILE}]`,
  command134: 'readonly [number]',
  command135: 'readonly [number]',
  command136: 'readonly [number]',
  command137: 'readonly [number]',
  command138: `readonly [readonly ${MZ_SCREEN_RGBA}]`,
  command139: `readonly [${MZ_AUDIO_FILE}]`,
  command140: `readonly [number, ${MZ_AUDIO_FILE}]`,
  command201: 'readonly [number, number, number, number, number, number]',
  command223: `readonly [${MZ_SCREEN_RGBA}, number]`,
  command224: `readonly [${MZ_SCREEN_RGBA}, number]`,
  command231: 'readonly [number, string, number, number, number, number, number, number, number, number]',
  command232: numTuple(13),
  command234: `readonly [number, ${MZ_SCREEN_RGBA}, number]`,
  command241: `readonly [${MZ_AUDIO_FILE}]`,
  command242: 'readonly [number]',
  command245: `readonly [${MZ_AUDIO_FILE}]`,
  command246: 'readonly [number]',
  command249: `readonly [${MZ_AUDIO_FILE}]`,
  command250: `readonly [${MZ_AUDIO_FILE}]`,
  command261: 'readonly [string]',
  command285: 'readonly unknown[]',
  command302: 'readonly unknown[]',
  command303: 'readonly [number, number]',
  command320: 'readonly [number, string]',
  command322: 'readonly [number, string, number, string, number, string]',
  command324: 'readonly [number, string]',
  command325: 'readonly [number, string]',
  command356: 'readonly [string]',
  command357: 'readonly [string, string, unknown, string]',
  command402: 'readonly [number]',
});

const methods = extractMethods(SRC);
const withParams = methods.filter(m => m.paramList === 'params');

/** @type {Record<string, string>} */
const out = {};

for (const m of withParams)
{
  if (FIXED[m.name] !== undefined)
  {
    out[m.name] = FIXED[m.name];
    continue;
  }

  const indices = [...m.body.matchAll(/\bparams\[(\d+)\]/g)].map(x => +x[1]);
  const max = indices.length ? Math.max(...indices) : -1;
  if (max < 0)
  {
    out[m.name] = 'readonly unknown[]';
    continue;
  }

  out[m.name] = numTuple(max + 1);
}

const keys = Object.keys(out).sort((a, b) =>
{
  const na = +a.replace(/\D/g, '');
  const nb = +b.replace(/\D/g, '');
  return na - nb;
});

let lines = 'const INTERPRETER_COMMAND_PARAM_TYPES = Object.freeze({\n';
for (const k of keys)
{
  lines += `  ${k}: '${out[k]}',\n`;
}
lines += '});\n';

process.stdout.write(lines);
process.stderr.write(`interpreter command param keys: ${keys.length}\n`);
