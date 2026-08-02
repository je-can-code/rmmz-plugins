//region plugins/passive/_component/lifecycle-hooks.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from './fixtures/install-passive-host-globals.js';

describe('J-Passive lifecycle hooks (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJPassive();
    await import('../../../../src/plugins/passive/core/_metadata/initialization.js');

    // patches globalThis.Game_Actor.prototype/Game_Party.prototype directly, no vm involved.
    await import('../../../../src/plugins/passive/core/objects/Game_Actor.js');
    await import('../../../../src/plugins/passive/core/objects/Game_Party.js');

    // isolate these extension points from host behavior.
    globalThis.J.PASSIVE.Aliased.Game_Actor.set('onEquipChange', () => {});
    globalThis.J.PASSIVE.Aliased.Game_Actor.set('onClassChange', () => {});
    globalThis.J.PASSIVE.Aliased.Game_Party.set('gainItem', () => {});
  });

  beforeEach(() =>
  {
    globalThis.RPGManager?.clearCache();
  });

  describe('Game_Actor', () =>
  {
    it('onLearnNewSkill (direct hook call) does not trigger refreshPassiveStates', () =>
    {
      // Arrange- passive only wraps learnSkill/forgetSkill, not the raw onLearnNewSkill/
      // onForgetSkill hooks, since those fire too early (before the skill list actually changes).
      const actor = new globalThis.Game_Actor();
      actor.initMembers();
      actor.refreshPassiveStates = vi.fn();

      // Act
      actor.onLearnNewSkill(1);

      // Assert
      expect(actor.refreshPassiveStates).not.toHaveBeenCalled();
    });

    it('onForgetSkill (direct hook call) does not trigger refreshPassiveStates', () =>
    {
      // Arrange
      const actor = new globalThis.Game_Actor();
      actor.initMembers();
      actor.refreshPassiveStates = vi.fn();

      // Act
      actor.onForgetSkill(1);

      // Assert
      expect(actor.refreshPassiveStates).not.toHaveBeenCalled();
    });

    it('onEquipChange triggers refreshPassiveStates', () =>
    {
      // Arrange
      const actor = new globalThis.Game_Actor();
      actor.initMembers();
      actor.refreshPassiveStates = vi.fn();

      // Act
      actor.onEquipChange();

      // Assert
      expect(actor.refreshPassiveStates).toHaveBeenCalledTimes(1);
    });

    it('onClassChange triggers refreshPassiveStates', () =>
    {
      // Arrange
      const actor = new globalThis.Game_Actor();
      actor.initMembers();
      actor.refreshPassiveStates = vi.fn();

      // Act
      actor.onClassChange();

      // Assert
      expect(actor.refreshPassiveStates).toHaveBeenCalledTimes(1);
    });
  });

  describe('Game_Party', () =>
  {
    it('gainItem triggers refreshPassiveStates', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party.initialize();
      party.refreshPassiveStates = vi.fn();

      // Act
      party.gainItem({ id: 1 }, 1, false);

      // Assert
      expect(party.refreshPassiveStates).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/passive/_component/lifecycle-hooks.test.js
