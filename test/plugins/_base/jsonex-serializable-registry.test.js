//region plugins/_base/jsonex-serializable-registry.test.js
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

import { describe, expect, it } from "vitest";

import { repoRoot } from "../../setup/repo-root.js";
import { evaluateJBaseOnlyForTests } from "../../setup/shipped-plugin-vm.js";

describe("JsonEx SerializableRegistry pilot (JABS_HitstopData)", () =>
{
  it("restores prototype without window globals", () =>
  {
    const sandbox = { console };
    evaluateJBaseOnlyForTests({ sandbox });

    const modelPath = path.join(
      repoRoot,
      "src/plugins/abs/ext/hitstop/_models/JABS_HitstopData.js",
    );
    const modelSource = fs.readFileSync(modelPath, "utf8")
      .replace(/export default JABS_HitstopData;\r?\n?/, "");

    vm.runInContext(modelSource, sandbox, { filename: modelPath });

    const result = vm.runInContext(`
(() =>
{
  // ensure we are not relying on the old global export.
  window.JABS_HitstopData = undefined;

  // build one instance and deep-copy it via JsonEx.
  const data = new JABS_HitstopData();
  data.setFrames(10);
  const copy = JsonEx.makeDeepCopy(data);

  // verify prototype restoration and behavior.
  return {
    windowHasConstructor: !!window.JABS_HitstopData,
    isInstance: copy instanceof JABS_HitstopData,
    hasTick: typeof copy.tick === 'function',
    frames: copy.getFrames(),
  };
})();
`, sandbox);

    expect(result.windowHasConstructor).toBe(false);
    expect(result.isInstance).toBe(true);
    expect(result.hasTick).toBe(true);
    expect(result.frames).toBe(10);
  });
});
//endregion plugins/_base/jsonex-serializable-registry.test.js
