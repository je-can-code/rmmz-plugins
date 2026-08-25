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
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    // registerFormulaContext() is a static method prof's own initialization.js calls at import time.
    await import('../../../../src/plugins/_base/core/objects/Game_Action.js');

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
    // Arrange- the summary is emitted by the loader, which is what publishes the parsed root.
    const logSpy = vi.spyOn(console, 'info')
      .mockImplementation(() => {});
    globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = true;

    // Act
    globalThis.J.PROF.Helpers.loadExternalConfig();

    // Assert- the summary counts the rows in the parsed config.
    const [ [ logged ] ] = logSpy.mock.calls;
    expect(logged).toContain('5 proficiency conditionals');

    globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = false;
    logSpy.mockRestore();
  });

  it('publishes the whole parsed root so extensions can read their own blocks', () =>
  {
    // Arrange- the root was published at import time; nothing further is needed.

    // Act
    const { ExternalConfig } = globalThis.J.PROF.Metadata;

    // Assert- the untouched sibling block proves the root survived rather than only the slice core uses.
    expect(ExternalConfig.conditionals.length).toBe(5);
    expect(ExternalConfig.vitestSiblingBlock).toBe('untouched');
  });

  it('refuses to load before the metadata it must publish onto exists', () =>
  {
    // Arrange- stand the metadata down so the loader has nowhere to publish.
    const { Metadata } = globalThis.J.PROF;
    delete globalThis.J.PROF.Metadata;

    // Act & Assert
    expect(() => globalThis.J.PROF.Helpers.loadExternalConfig())
      .toThrow('J.PROF.Metadata must be assigned before J.PROF.Helpers.loadExternalConfig().');

    globalThis.J.PROF.Metadata = Metadata;
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
