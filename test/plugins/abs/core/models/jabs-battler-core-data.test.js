//region plugins/abs/core/models/jabs-battler-core-data.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

describe('JABS_BattlerCoreData (direct src import)', () =>
{
  let JABS_BattlerCoreData;
  let JABS_BattlerRole;
  let JABS_BattlerCoreDataBuilder;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    ({ default: JABS_BattlerRole } = await import('../../../../../src/plugins/abs/core/models/JABS_BattlerRole.js'));
    ({ default: JABS_BattlerCoreDataBuilder } = await import('../../../../../src/plugins/abs/core/models/JABS_BattlerCoreDataBuilder.js'));
    ({ default: JABS_BattlerCoreData } = await import('../../../../../src/plugins/abs/core/models/JABS_BattlerCoreData.js'));
  });

  /**
   * Builds a full, valid set of constructor params, with any field overridable.
   * @param {object} overrides
   * @returns {object}
   */
  function buildParams(overrides = {})
  {
    return {
      battlerId: 5,
      teamId: 1,
      battlerAI: { code: 'ai' },
      battlerRole: new JABS_BattlerRole(),
      sightRange: 4,
      alertedSightBoost: 2,
      pursuitRange: 6,
      alertedPursuitBoost: 4,
      alertDuration: 300,
      guardRange: 8,
      canIdle: true,
      showHpBar: true,
      showStates: true,
      showBattlerName: true,
      isInvincible: false,
      isInanimate: false,
      ...overrides,
    };
  }

  it('every getter reflects the value provided at construction', () =>
  {
    // Arrange
    const params = buildParams();

    // Act
    const data = new JABS_BattlerCoreData(params);

    // Assert
    expect(data.battlerId()).toBe(5);
    expect(data.team()).toBe(1);
    expect(data.ai()).toBe(params.battlerAI);
    expect(data.battlerRole()).toBe(params.battlerRole);
    expect(data.sightRange()).toBe(4);
    expect(data.alertedSightBoost()).toBe(2);
    expect(data.pursuitRange()).toBe(6);
    expect(data.alertedPursuitBoost()).toBe(4);
    expect(data.alertDuration()).toBe(300);
    expect(data.guardRange()).toBe(8);
    expect(data.canIdle()).toBe(true);
    expect(data.showHpBar()).toBe(true);
    expect(data.showStates()).toBe(true);
    expect(data.showBattlerName()).toBe(true);
    expect(data.isInvincible()).toBe(false);
    expect(data.isInanimate()).toBe(false);
  });

  it('defaults battlerRole to a fresh JABS_BattlerRole when omitted', () =>
  {
    // Arrange
    const params = buildParams({ battlerRole: undefined });

    // Act
    const data = new JABS_BattlerCoreData(params);

    // Assert
    expect(data.battlerRole()).toBeInstanceOf(JABS_BattlerRole);
  });

  it('defaults guardRange to null when omitted', () =>
  {
    // Arrange
    const params = buildParams({ guardRange: undefined });

    // Act
    const data = new JABS_BattlerCoreData(params);

    // Assert
    expect(data.guardRange()).toBeNull();
  });

  it('preserves an explicit null guardRange (ward-pursuit fallback)', () =>
  {
    // Arrange
    const params = buildParams({ guardRange: null });

    // Act
    const data = new JABS_BattlerCoreData(params);

    // Assert
    expect(data.guardRange()).toBeNull();
  });

  it('initMembers is a no-op extension hook that does not throw', () =>
  {
    // Arrange
    const data = new JABS_BattlerCoreData(buildParams());

    // Act & Assert
    expect(() => data.initMembers()).not.toThrow();
  });

  it('static Builder returns a fresh JABS_BattlerCoreDataBuilder', () =>
  {
    // Act
    const builder = JABS_BattlerCoreData.Builder();

    // Assert
    expect(builder).toBeInstanceOf(JABS_BattlerCoreDataBuilder);
  });
});
//endregion plugins/abs/core/models/jabs-battler-core-data.test.js
