//region plugins/abs/ext/tools/_component/gap-close.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installAbsHostGlobals, setPluginContextToJAbs, setPluginContextToJBase } from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsTools } from './fixtures/install-abs-tools-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

/**
 * Builds a minimal note-source stub carrying the given tag string.
 * @param {string} note
 * @returns {object}
 */
function buildSkillRow(note)
{
  const row = Object.create(globalThis.RPG_Skill.prototype);
  row.id = 1;
  row.note = note;
  row.meta = {};
  row._original = function() { return this; };
  return row;
}

/**
 * Builds a plain duck-typed "character" carrying only what gap-close touches.
 * @param {object} [overrides]
 * @returns {object}
 */
function buildCharacter(overrides = {})
{
  return {
    x: 0,
    y: 0,
    isMoving: () => false,
    getEffectiveRadius: () => 0,
    canReachTileDelta: () => true,
    lastJump: null,
    jump(dx, dy)
    {
      this.lastJump = [ dx, dy ];
    },
    lastLocate: null,
    locate(x, y)
    {
      this.lastLocate = [ x, y ];
    },
    lastGlide: null,
    glideTo(dx, dy)
    {
      this.lastGlide = [ dx, dy ];
    },
    deltaXFrom(x0)
    {
      return this.x - x0;
    },
    deltaYFrom(y0)
    {
      return this.y - y0;
    },
    gapCloseKey: () => null,
    ...overrides,
  };
}

/**
 * Builds a real JABS_Battler-backed duck object with only the fields gap-close touches.
 * @param {object} character
 * @param {object} [fields]
 * @returns {object}
 */
function buildJabsBattler(character, fields = {})
{
  const battler = Object.create(globalThis.JABS_Battler.prototype);
  battler.initGeneralInfo();
  battler.getCharacter = () => character;
  battler.getX = () => character.x;
  battler.getY = () => character.y;
  battler.isEvent = () => false;
  battler.getBattler = () => ({ gapCloseKey: () => null, gapCloseEndSkillIds: () => [] });
  Object.assign(battler, fields);
  return battler;
}

describe('J-ABS-Tools gap close (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../../../../src/plugins/_base/database/implementations/RPG_Skill.js'));

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    await import('../../../../../../src/plugins/abs/core/objects/Game_CharacterBase.js');
    await import('../../../../../../src/plugins/abs/core/database/RPG_Skill.js');
    ({ default: globalThis.JABS_Battler } = await import('../../../../../../src/plugins/abs/core/models/JABS_Battler.js'));

    installPluginManagerWithParams(globalThis, 'J-ABS-Tools', {});

    setPluginContextToJabsTools();
    await import('../../../../../../src/plugins/abs/ext/tools/_metadata/initialization.js');

    // patches globalThis.JABS_Battler.prototype with gap-close methods, no vm involved.
    await import('../../../../../../src/plugins/abs/ext/tools/_models/JABS_Battler.js');

    // patches globalThis.RPG_Skill.prototype with jabsGapCloseMode/jabsGapClosePosition/etc.
    await import('../../../../../../src/plugins/abs/ext/tools/database/RPG_Skill.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.Math.sqrt = Math.sqrt;
    globalThis.$jabsEngine = { forceMapAction: vi.fn() };
  });

  describe('gap-closing state flags', () =>
  {
    it('initGeneralInfo seeds the gap-close state', () =>
    {
      const battler = buildJabsBattler(buildCharacter());
      expect(battler.isGapClosing()).toBe(false);
      expect(battler.gapCloseDestination()).toEqual([ 0, 0 ]);
    });

    it('beginGapClosing/endGapClosing/isGapClosing round-trip', () =>
    {
      const battler = buildJabsBattler(buildCharacter());
      battler.beginGapClosing();
      expect(battler.isGapClosing()).toBe(true);
      battler.endGapClosing();
      expect(battler.isGapClosing()).toBe(false);
    });

    it('setGapCloseDestination/gapCloseDestination round-trip', () =>
    {
      const battler = buildJabsBattler(buildCharacter());
      battler.setGapCloseDestination([ 3, 4 ]);
      expect(battler.gapCloseDestination()).toEqual([ 3, 4 ]);
    });

    it('hasGapCloseDestination is false at [0, 0]', () =>
    {
      const battler = buildJabsBattler(buildCharacter());
      expect(battler.hasGapCloseDestination()).toBe(false);
    });

    it('hasGapCloseDestination is true once a nonzero destination is set', () =>
    {
      const battler = buildJabsBattler(buildCharacter());
      battler.setGapCloseDestination([ 1, 0 ]);
      expect(battler.hasGapCloseDestination()).toBe(true);
    });

    it('clearGapCloseDestination resets back to [0, 0]', () =>
    {
      const battler = buildJabsBattler(buildCharacter());
      battler.setGapCloseDestination([ 5, 5 ]);
      battler.clearGapCloseDestination();
      expect(battler.gapCloseDestination()).toEqual([ 0, 0 ]);
    });
  });

  describe('update/updateGapClosing', () =>
  {
    it('update performs original logic then updates gap closing', () =>
    {
      const battler = buildJabsBattler(buildCharacter());
      const originalUpdate = vi.fn();
      globalThis.J.ABS.EXT.TOOLS.Aliased.JABS_Battler.set('update', originalUpdate);
      const spy = vi.spyOn(battler, 'updateGapClosing');

      battler.update();

      expect(originalUpdate).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });

    it('does nothing when not currently gap closing', () =>
    {
      const battler = buildJabsBattler(buildCharacter());
      expect(() => battler.updateGapClosing()).not.toThrow();
      expect(battler.isGapClosing()).toBe(false);
    });

    it('stops gap closing when the destination becomes invalid mid-flight', () =>
    {
      const battler = buildJabsBattler(buildCharacter());
      battler.beginGapClosing();
      // no destination was ever set (still [0,0]) -> hasGapCloseDestination is false.

      battler.updateGapClosing();

      expect(battler.isGapClosing()).toBe(false);
      expect(battler.gapCloseDestination()).toEqual([ 0, 0 ]);
    });

    it('finishes gap closing once the destination is reached', () =>
    {
      const character = buildCharacter({ x: 1, y: 0 });
      const battler = buildJabsBattler(character);
      battler.beginGapClosing();
      battler.setGapCloseDestination([ 1, 0 ]);
      const finishSpy = vi.spyOn(battler, 'onGapCloseFinished')
        .mockImplementation(() => {});

      battler.updateGapClosing();

      expect(finishSpy).toHaveBeenCalledTimes(1);
      expect(battler.isGapClosing()).toBe(false);
      expect(battler.gapCloseDestination()).toEqual([ 0, 0 ]);
      finishSpy.mockRestore();
    });

    it('keeps gap closing while a valid destination has not yet been reached', () =>
    {
      const character = buildCharacter({ x: 0, y: 0 });
      const battler = buildJabsBattler(character);
      battler.beginGapClosing();
      battler.setGapCloseDestination([ 10, 0 ]);

      battler.updateGapClosing();

      expect(battler.isGapClosing()).toBe(true);
    });
  });

  describe('isGapClosable', () =>
  {
    it('returns the battler\'s own gap close key when present', () =>
    {
      const battler = buildJabsBattler(buildCharacter());
      battler.getBattler = () => ({ gapCloseKey: () => 'boss-key' });

      expect(battler.isGapClosable()).toBe('boss-key');
    });

    it('falls back to the event\'s gap close key for an event-based battler', () =>
    {
      const character = buildCharacter({ gapCloseKey: () => 'event-key' });
      const battler = buildJabsBattler(character);
      battler.getBattler = () => ({ gapCloseKey: () => null });
      battler.isEvent = () => true;

      expect(battler.isGapClosable()).toBe('event-key');
    });

    it('returns null when neither the battler nor the event carries a key', () =>
    {
      const battler = buildJabsBattler(buildCharacter());
      battler.getBattler = () => ({ gapCloseKey: () => null });
      battler.isEvent = () => false;

      expect(battler.isGapClosable()).toBeNull();
    });
  });

  describe('gapCloseToTarget', () =>
  {
    it('does nothing when already gap closing', () =>
    {
      const character = buildCharacter();
      const battler = buildJabsBattler(character);
      battler.beginGapClosing();
      const action = { getBaseSkill: () => buildSkillRow('<gapCloseMode:jump>') };

      battler.gapCloseToTarget(action, buildJabsBattler(buildCharacter({ x: 5, y: 0 })));

      expect(character.lastJump).toBeNull();
    });

    it('refuses to gap close when respectTerrain is set and the path is unreachable', () =>
    {
      const character = buildCharacter({ canReachTileDelta: () => false });
      const battler = buildJabsBattler(character);
      const action = { getBaseSkill: () => buildSkillRow('<respectTerrain>') };

      battler.gapCloseToTarget(action, buildJabsBattler(buildCharacter({ x: 5, y: 0 })));

      expect(character.lastJump).toBeNull();
      expect(battler.isGapClosing()).toBe(false);
    });

    it('jumps to the target by default (jump mode, same position)', () =>
    {
      const character = buildCharacter({ x: 0, y: 0 });
      const battler = buildJabsBattler(character);
      const target = buildJabsBattler(buildCharacter({ x: 5, y: 0 }));
      const action = { getBaseSkill: () => buildSkillRow('') };

      battler.gapCloseToTarget(action, target);

      expect(character.lastJump).toEqual([ 5, 0 ]);
      expect(battler.isGapClosing()).toBe(true);
      expect(battler.gapCloseDestination()).toEqual([ 5, 0 ]);
    });

    it('blinks (locates) to the target when gapCloseMode is blink', () =>
    {
      const character = buildCharacter({ x: 0, y: 0 });
      const battler = buildJabsBattler(character);
      const target = buildJabsBattler(buildCharacter({ x: 5, y: 0 }));
      const action = { getBaseSkill: () => buildSkillRow('<gapCloseMode:blink>') };

      battler.gapCloseToTarget(action, target);

      expect(character.lastLocate).toEqual([ 5, 0 ]);
      expect(character.lastJump).toBeNull();
    });

    it('glides (travels) to the target when gapCloseMode is travel', () =>
    {
      const character = buildCharacter({ x: 0, y: 0 });
      const battler = buildJabsBattler(character);
      const target = buildJabsBattler(buildCharacter({ x: 5, y: 0 }));
      const action = { getBaseSkill: () => buildSkillRow('<gapCloseMode:travel>') };

      battler.gapCloseToTarget(action, target);

      expect(character.lastGlide).toEqual([ 5, 0 ]);
      expect(character.lastJump).toBeNull();
    });

    it('stamps the initiating skill id for the landing hook to read', () =>
    {
      const character = buildCharacter({ x: 0, y: 0 });
      const battler = buildJabsBattler(character);
      const target = buildJabsBattler(buildCharacter({ x: 5, y: 0 }));
      const skill = buildSkillRow('');
      skill.id = 42;
      const action = { getBaseSkill: () => skill };

      battler.gapCloseToTarget(action, target);

      expect(battler._gapCloseSourceSkillId).toBe(42);
    });

    it('proceeds with the jump when respectTerrain is set and the path is reachable', () =>
    {
      const character = buildCharacter({ x: 0, y: 0, canReachTileDelta: () => true });
      const battler = buildJabsBattler(character);
      const target = buildJabsBattler(buildCharacter({ x: 5, y: 0 }));
      const action = { getBaseSkill: () => buildSkillRow('<respectTerrain>') };

      battler.gapCloseToTarget(action, target);

      expect(character.lastJump).toEqual([ 5, 0 ]);
    });
  });

  describe('onGapCloseFinished', () =>
  {
    it('does nothing when no skills are registered to fire on landing', () =>
    {
      const battler = buildJabsBattler(buildCharacter());
      battler.onGapCloseFinished();
      expect(globalThis.$jabsEngine.forceMapAction).not.toHaveBeenCalled();
    });

    it('force-executes every registered skill from this battler\'s position', () =>
    {
      const battler = buildJabsBattler(buildCharacter());
      battler.resolveGapCloseEndSkillIds = () => [ 10, 11 ];

      battler.onGapCloseFinished();

      expect(globalThis.$jabsEngine.forceMapAction).toHaveBeenCalledWith(battler, 10);
      expect(globalThis.$jabsEngine.forceMapAction).toHaveBeenCalledWith(battler, 11);
    });
  });

  describe('resolveGapCloseEndSkillIds', () =>
  {
    it('is empty when there is no initiating skill and no battler-side tags', () =>
    {
      const battler = buildJabsBattler(buildCharacter());
      globalThis.$dataSkills = [];

      expect(battler.resolveGapCloseEndSkillIds()).toEqual([]);
    });

    it('merges ids from the initiating skill\'s thisOnGapCloseEnd with the battler\'s own gapCloseEndSkillIds', () =>
    {
      const battler = buildJabsBattler(buildCharacter());
      battler._gapCloseSourceSkillId = 7;
      const sourceSkill = buildSkillRow('<thisOnGapCloseEnd:[1, 2]>');
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[7] = sourceSkill;
      battler.getBattler = () => ({ gapCloseEndSkillIds: () => [ 3, 4 ] });

      expect(battler.resolveGapCloseEndSkillIds()).toEqual([ 1, 2, 3, 4 ]);
    });
  });

  describe('determineGapCloseCoordinates', () =>
  {
    it('lands directly on the target\'s tile for "same" position', () =>
    {
      const battler = buildJabsBattler(buildCharacter({ x: 0, y: 0 }));
      const target = buildJabsBattler(buildCharacter({ x: 5, y: 0 }));

      const [ dx, dy ] = battler.determineGapCloseCoordinates(target, globalThis.J.ABS.EXT.TOOLS.GapClosePositions.Same);

      expect(dx).toBeCloseTo(5);
      expect(dy).toBeCloseTo(0);
    });

    it('lands short of the target for "infront" position', () =>
    {
      const battler = buildJabsBattler(buildCharacter({ x: 0, y: 0, getEffectiveRadius: () => 0.5 }));
      const target = buildJabsBattler(buildCharacter({ x: 5, y: 0, getEffectiveRadius: () => 0.5 }));

      const [ dx ] = battler.determineGapCloseCoordinates(target, globalThis.J.ABS.EXT.TOOLS.GapClosePositions.Infront);

      // edgeOffset = radiiSum(1.05) / dominantAxisComponent(1) = 1.05; 5 - 1.05 = 3.95.
      expect(dx).toBeCloseTo(3.95);
    });

    it('lands beyond the target for "behind" position', () =>
    {
      const battler = buildJabsBattler(buildCharacter({ x: 0, y: 0, getEffectiveRadius: () => 0.5 }));
      const target = buildJabsBattler(buildCharacter({ x: 5, y: 0, getEffectiveRadius: () => 0.5 }));

      const [ dx ] = battler.determineGapCloseCoordinates(target, globalThis.J.ABS.EXT.TOOLS.GapClosePositions.Behind);

      // edgeOffset = radiiSum(1.05) / dominantAxisComponent(1) = 1.05; 5 + 1.05 = 6.05.
      expect(dx).toBeCloseTo(6.05);
    });

    it('returns [0, 0] when the caster is already on the target\'s tile (zero magnitude)', () =>
    {
      const battler = buildJabsBattler(buildCharacter({ x: 5, y: 5 }));
      const target = buildJabsBattler(buildCharacter({ x: 5, y: 5 }));

      const [ dx, dy ] = battler.determineGapCloseCoordinates(target, globalThis.J.ABS.EXT.TOOLS.GapClosePositions.Infront);

      expect(dx).toBe(0);
      expect(dy).toBe(0);
    });
  });

  describe('hasReachedGapCloseDestination', () =>
  {
    it('immediately stops and reports reached when there is no valid destination', () =>
    {
      const battler = buildJabsBattler(buildCharacter());
      battler.beginGapClosing();

      const result = battler.hasReachedGapCloseDestination();

      expect(result).toBe(true);
      expect(battler.isGapClosing()).toBe(false);
    });

    it('is true once within wiggle room and no longer moving', () =>
    {
      const character = buildCharacter({ x: 5, y: 5, isMoving: () => false });
      const battler = buildJabsBattler(character);
      battler.setGapCloseDestination([ 5, 5 ]);

      expect(battler.hasReachedGapCloseDestination()).toBe(true);
    });

    it('is false while still outside wiggle room on the X axis', () =>
    {
      const character = buildCharacter({ x: 0, y: 5, isMoving: () => false });
      const battler = buildJabsBattler(character);
      battler.setGapCloseDestination([ 5, 5 ]);

      expect(battler.hasReachedGapCloseDestination()).toBe(false);
    });

    it('is false while still outside wiggle room on the Y axis', () =>
    {
      const character = buildCharacter({ x: 5, y: 0, isMoving: () => false });
      const battler = buildJabsBattler(character);
      battler.setGapCloseDestination([ 5, 5 ]);

      expect(battler.hasReachedGapCloseDestination()).toBe(false);
    });

    it('is false while within range but the character is still actively moving', () =>
    {
      const character = buildCharacter({ x: 5, y: 5, isMoving: () => true });
      const battler = buildJabsBattler(character);
      battler.setGapCloseDestination([ 5, 5 ]);

      expect(battler.hasReachedGapCloseDestination()).toBe(false);
    });
  });

  it('gapCloseWiggleRoom is a static 0.5 tiles of tolerance', () =>
  {
    expect(globalThis.JABS_Battler.gapCloseWiggleRoom()).toBe(0.5);
  });
});
//endregion plugins/abs/ext/tools/_component/gap-close.test.js
