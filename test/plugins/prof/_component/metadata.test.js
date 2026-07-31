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
  it('reports how many conditionals it loaded when external file load info is enabled', () =>
  {
    // Arrange
    globalThis.$dataActors = [];
    for (let i = 1; i <= 5; i++)
    {
      globalThis.$dataActors[i] = { id: i };
    }
    const logSpy = vi.spyOn(console, 'log')
      .mockImplementation(() => {});
    globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = true;

    // Act
    globalThis.J.PROF.Metadata.initializeProficiencies();

    // Assert- the summary counts the classified conditionals, not the raw config rows.
    const [ [ logged ] ] = logSpy.mock.calls;
    expect(logged).toContain('5 proficiency conditionals');

    globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = false;
    logSpy.mockRestore();
  });

  describe('proficiency formula context', () =>
  {
    it('registers a p variable for damage formulas to read', () =>
    {
      // Arrange & Act
      const names = globalThis.Game_Action.formulaContextProviders.map(provider => provider.name);

      // Assert- without this, a formula referencing `p` would throw at damage time rather than
      // resolving to the caster's proficiency with the skill.
      expect(names).toContain('p');
    });

    it('resolves p to the proficiency the action has with the skill being used', () =>
    {
      // Arrange
      const { getter } = globalThis.Game_Action.formulaContextProviders
        .find(provider => provider.name === 'p');
      const action = { skillProficiency: () => 42 };

      // Act & Assert- the getter reads off the action itself, not the attacker.
      expect(getter(action)).toBe(42);
    });
  });
});
//endregion plugins/prof/_component/metadata.test.js
