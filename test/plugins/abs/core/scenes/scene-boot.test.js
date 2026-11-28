//region plugins/abs/core/scenes/scene-boot.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The boot hook registers J-ABS's two parameters with the catalog after whatever the database load already did, then
 * describes this plugin's tags, since a describer is only ever asked about rows that load finished building.
 */
describe('J-ABS Scene_Boot (unit, all downstream dependencies mocked)', () =>
{
  let originalOnDatabaseLoaded;
  let calls;

  /**
   * A parameter definition builder that remembers the key it was given, so each registration names its parameter.
   * @returns {object}
   */
  function buildBuilder()
  {
    const definition = {};
    const builder = {};
    [ 'group', 'sortOrder', 'label', 'description', 'iconIndex', 'format', 'getValue' ]
      .forEach(method => { builder[method] = () => builder; });
    builder.key = key =>
    {
      definition.key = key;
      return builder;
    };
    builder.build = () => definition;
    return builder;
  }

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { Aliased: { Scene_Boot: new Map() } } };

    vi.doMock('../../../../../src/plugins/abs/core/core/describeAbsNotetags.js', () => ({
      default: { registerAll: vi.fn(() => calls.push('describeAll')) },
    }));

    globalThis.ParameterDefinition = { Builder: () => buildBuilder() };
    globalThis.ParameterRegistry = { register: definition => calls.push(`register ${definition.key}`) };
    globalThis.ParameterGroups = { SUPPORT: 'support', PRECISION: 'precision' };
    globalThis.ParameterFormat = { PERCENT_SUFFIX: 'percent-suffix' };

    function Scene_Boot()
    {
    }

    originalOnDatabaseLoaded = vi.fn(() => calls.push('original'));
    Scene_Boot.prototype.onDatabaseLoaded = originalOnDatabaseLoaded;
    globalThis.Scene_Boot = Scene_Boot;

    await import('../../../../../src/plugins/abs/core/scenes/Scene_Boot.js');
  });

  beforeEach(() =>
  {
    calls = [];
    originalOnDatabaseLoaded.mockClear();
  });

  describe('onDatabaseLoaded', () =>
  {
    it('performs the original logic, registers CDR and PER, then describes the tags', () =>
    {
      // Arrange
      const scene = Object.create(globalThis.Scene_Boot.prototype);

      // Act
      scene.onDatabaseLoaded();

      // Assert
      expect(calls)
        .toEqual([ 'original', 'register cdr', 'register per', 'describeAll' ]);
    });
  });
});
//endregion plugins/abs/core/scenes/scene-boot.test.js