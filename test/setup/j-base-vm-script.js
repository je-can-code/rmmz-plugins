//region j-base-vm-script
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from './repo-root.js';

const J_BASE_FILENAME = 'J-Base.js';

/**
 * Compiles {@link out/J-Base.js} fresh for VM evaluation. Previously this was cached as a single
 * module-level `vm.Script` reused across every test file in the process- reusing one Script instance
 * across many separate vm contexts silently breaks vitest's v8 coverage attribution for anything J-Base
 * touches (proven by comparison against feature-plugin VM helpers, which compile fresh per call and
 * report real coverage). Recompiling per call costs a bit of CPU but matches what every other shipped
 * plugin's VM helper already does.
 *
 * @returns {vm.Script}
 */
export function getJBaseVmScript()
{
  const absolutePath = path.join(repoRoot, 'out', J_BASE_FILENAME);

  if (fs.existsSync(absolutePath) === false)
  {
    throw new Error(`Missing ${absolutePath}. Run bun run build:base before bun test.`);
  }

  const code = fs.readFileSync(absolutePath, 'utf8');

  return new vm.Script(code, { filename: absolutePath });
}

/**
 * Evaluates J-Base in `sandbox` at most once per sandbox (same VM global object as shipped plugins).
 *
 * @param {object} sandbox
 */
export function evaluateJBaseInSandboxOnce(sandbox)
{
  if (sandbox.__rmmzJBaseEvaluated === true)
  {
    return;
  }

  getJBaseVmScript().runInContext(sandbox);
  sandbox.__rmmzJBaseEvaluated = true;
}
//endregion j-base-vm-script
