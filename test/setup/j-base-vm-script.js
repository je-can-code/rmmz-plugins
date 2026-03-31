//region j-base-vm-script
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from './repo-root.js';

const J_BASE_FILENAME = 'J-Base.js';

let jBaseVmScript = null;

/**
 * Cached compiled {@link out/J-Base.js} for VM evaluation (parse once per Vitest/Node process).
 *
 * @returns {vm.Script}
 */
export function getJBaseVmScript()
{
  if (jBaseVmScript !== null)
  {
    return jBaseVmScript;
  }

  const absolutePath = path.join(repoRoot, 'out', J_BASE_FILENAME);

  if (fs.existsSync(absolutePath) === false)
  {
    throw new Error(`Missing ${absolutePath}. Run bun run build:base before bun test.`);
  }

  const code = fs.readFileSync(absolutePath, 'utf8');

  jBaseVmScript = new vm.Script(code, { filename: J_BASE_FILENAME });

  return jBaseVmScript;
}

/**
 * Evaluates J-Base in `sandbox` at most once (same VM global object as shipped plugins).
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
