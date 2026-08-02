//region plugins/passive/core/objects/game-actor.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from '../../_component/fixtures/install-passive-host-globals.js';

describe('J-Passive Game_Actor (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJPassive();
    await import('../../../../../src/plugins/passive/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly- Game_Actor.prototype.getPassiveStateSources
    // calls Game_Battler.prototype.getPassiveStateSources directly, not through an alias.
    await import('../../../../../src/plugins/passive/core/objects/Game_Battler.js');

    // patches globalThis.Game_Actor.prototype directly, no vm involved.
    await import('../../../../../src/plugins/passive/core/objects/Game_Actor.js');
  });

  /** Builds a fresh Game_Actor-shaped instance with initPassiveStatesMembers already run. */
  function buildActor()
  {
    const actor = Object.create(globalThis.Game_Actor.prototype);
    actor.initPassiveStatesMembers();
    actor.onBattlerDataChange = vi.fn();
    actor.equippedEquips = vi.fn(() => []);
    actor.currentClass = vi.fn(() => ({ id: 'class' }));
    actor.isLearnedSkill = vi.fn(() => false);
    return actor;
  }

  describe('onSetup (extended)', () =>
  {
    it('refreshes passive states after the base onSetup logic', () =>
    {
      // Arrange
      const actor = buildActor();
      const refreshSpy = vi.spyOn(actor, 'refreshPassiveStates').mockImplementation(() => {});

      // Act
      actor.onSetup(1);

      // Assert
      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe('getPassiveStateSources', () =>
  {
    it('adds equipped equips and the current class on top of the base battler sources', () =>
    {
      // Arrange
      const actor = buildActor();
      const equip = { id: 'equip' };
      const classData = { id: 'class' };
      actor.equippedEquips = () => [ equip ];
      actor.currentClass = () => classData;

      // Act
      const sources = actor.getPassiveStateSources();

      // Assert
      expect(sources).toContain(equip);
      expect(sources).toContain(classData);
    });
  });

  describe('buildTraitObjects (extended)', () =>
  {
    it('appends the actor\'s and party\'s passive states after the base trait objects', () =>
    {
      // Arrange
      const actor = buildActor();
      globalThis.J.PASSIVE.Aliased.Game_Actor.set('buildTraitObjects', () => [ { id: 'base' } ]);
      actor.__statesById = { 1: { id: 1 } };
      actor.addPassiveStateId(1);
      globalThis.$gameParty.passiveStates = () => [ { id: 'party' } ];

      // Act
      const result = actor.buildTraitObjects();

      // Assert
      expect(result).toEqual([ { id: 'base' }, { id: 1 }, { id: 'party' } ]);
    });
  });

  describe('learnSkill (extended)', () =>
  {
    it('refreshes passive states when the skill was not already known', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.isLearnedSkill = () => false;
      globalThis.J.PASSIVE.Aliased.Game_Actor.set('learnSkill', vi.fn());
      const refreshSpy = vi.spyOn(actor, 'refreshPassiveStates').mockImplementation(() => {});

      // Act
      actor.learnSkill(5);

      // Assert
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('does not refresh passive states when the skill was already known', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.isLearnedSkill = () => true;
      globalThis.J.PASSIVE.Aliased.Game_Actor.set('learnSkill', vi.fn());
      const refreshSpy = vi.spyOn(actor, 'refreshPassiveStates').mockImplementation(() => {});

      // Act
      actor.learnSkill(5);

      // Assert
      expect(refreshSpy).not.toHaveBeenCalled();
    });
  });

  describe('forgetSkill (extended)', () =>
  {
    it('refreshes passive states when the skill was known', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.isLearnedSkill = () => true;
      globalThis.J.PASSIVE.Aliased.Game_Actor.set('forgetSkill', vi.fn());
      const refreshSpy = vi.spyOn(actor, 'refreshPassiveStates').mockImplementation(() => {});

      // Act
      actor.forgetSkill(5);

      // Assert
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('does not refresh passive states when the skill was not known', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.isLearnedSkill = () => false;
      globalThis.J.PASSIVE.Aliased.Game_Actor.set('forgetSkill', vi.fn());
      const refreshSpy = vi.spyOn(actor, 'refreshPassiveStates').mockImplementation(() => {});

      // Act
      actor.forgetSkill(5);

      // Assert
      expect(refreshSpy).not.toHaveBeenCalled();
    });
  });

  describe('onEquipChange (extended)', () =>
  {
    it('refreshes passive states after the base logic', () =>
    {
      // Arrange
      const actor = buildActor();
      globalThis.J.PASSIVE.Aliased.Game_Actor.set('onEquipChange', vi.fn());
      const refreshSpy = vi.spyOn(actor, 'refreshPassiveStates').mockImplementation(() => {});

      // Act
      actor.onEquipChange();

      // Assert
      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe('onClassChange (extended)', () =>
  {
    it('refreshes passive states after the base logic', () =>
    {
      // Arrange
      const actor = buildActor();
      const baseOnClassChange = vi.fn();
      globalThis.J.PASSIVE.Aliased.Game_Actor.set('onClassChange', baseOnClassChange);
      const refreshSpy = vi.spyOn(actor, 'refreshPassiveStates').mockImplementation(() => {});

      // Act
      actor.onClassChange(3, true);

      // Assert
      expect(baseOnClassChange).toHaveBeenCalledWith(3, true);
      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe('getNotesSources (extended)', () =>
  {
    it('appends the party\'s passive states after the base note sources', () =>
    {
      // Arrange
      const actor = buildActor();
      globalThis.J.PASSIVE.Aliased.Game_Actor.set('getNotesSources', () => [ { id: 'base-note' } ]);
      globalThis.$gameParty.passiveStates = () => [ { id: 'party-note' } ];

      // Act
      const result = actor.getNotesSources();

      // Assert
      expect(result).toEqual([ { id: 'base-note' }, { id: 'party-note' } ]);
    });
  });
});
//endregion plugins/passive/core/objects/game-actor.test.js
