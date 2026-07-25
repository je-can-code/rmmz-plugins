//region plugins/prof/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installProfHostGlobals, setPluginContextToJBase, setPluginContextToJProf } from './fixtures/install-prof-host-globals.js';

describe('J-Proficiency metadata and regex (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installProfHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    // registerFormulaContext() is a static method prof's own initialization.js calls at import time.
    await import('../../../../src/plugins/_base/objects/Game_Action.js');

    setPluginContextToJProf();
    await import('../../../../src/plugins/prof/core/_metadata/initialization.js');
  });

  it('exposes J.PROF namespace and loads conditionals from config', () =>
  {
    // Arrange & Act
    globalThis.$dataActors = [];
    for (let i = 1; i <= 5; i++)
    {
      globalThis.$dataActors[i] = { id: i };
    }
    globalThis.J.PROF.Metadata.initializeProficiencies();

    // Assert
    expect(globalThis.J.PROF.Metadata.name).toBe('J-Proficiency');
    expect(globalThis.J.PROF.Metadata.conditionals.length).toBe(5);
    expect(globalThis.J.PROF.Metadata.conditionals[0].key).toBe('vitest_unlock_skill');
  });

  it('proficiency bonus regex captures integers', () =>
  {
    // Arrange & Act
    const m = globalThis.J.PROF.RegExp.ProficiencyBonus.exec('<proficiencyBonus:4>');

    // Assert
    expect(m[1]).toBe('4');
  });
});
//endregion plugins/prof/_component/metadata.test.js
