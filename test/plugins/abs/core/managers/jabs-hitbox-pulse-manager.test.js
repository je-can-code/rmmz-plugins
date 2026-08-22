//region plugins/abs/core/managers/jabs-hitbox-pulse-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a fake pulse sprite carrying only what the manager touches, so tests don't need
 * a real PIXI-backed Sprite_HitboxPulse.
 * @returns {object}
 */
function buildFakePulse()
{
  return {
    parent: null,
    reset: vi.fn(),
    setup: vi.fn(),
    setWorldPosition: vi.fn(),
    setRotation: vi.fn(),
    update: vi.fn(),
    isExpired: vi.fn(() => false),
  };
}

/**
 * Builds a fake PIXI-container-like layer that actually tracks children (so
 * addChild/removeChild/parent assignment behaves like the real thing).
 * @returns {object}
 */
function buildFakeLayer()
{
  const children = [];
  const layer = {
    children,
    addChild: vi.fn((child) =>
    {
      child.parent = layer;
      children.push(child);
    }),
    removeChild: vi.fn((child) =>
    {
      child.parent = null;
      const idx = children.indexOf(child);
      if (idx >= 0) children.splice(idx, 1);
    }),
  };
  return layer;
}

describe('J-ABS JABS_HitboxPulseManager (direct src import)', () =>
{
  let JABS_HitboxPulseManager;
  let JABS_HitboxPulseOptions;
  let FakeSpriteHitboxPulse;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // eslint-disable-next-line prefer-arrow-callback -- must be new-able, arrow functions can't be.
    FakeSpriteHitboxPulse = vi.fn(function()
    {
      return buildFakePulse();
    });
    vi.doMock('../../../../../src/plugins/abs/core/sprites/Sprite_HitboxPulse.js', () => ({ default: FakeSpriteHitboxPulse }));

    ({ default: JABS_HitboxPulseOptions } = await import('../../../../../src/plugins/abs/core/models/JABS_HitboxPulseOptions.js'));
    ({ default: JABS_HitboxPulseManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_HitboxPulseManager.js'));
  });

  beforeEach(() =>
  {
    FakeSpriteHitboxPulse.mockClear();
    JABS_HitboxPulseManager._layer = null;
    JABS_HitboxPulseManager._active = [];
    JABS_HitboxPulseManager._pool = [];
    JABS_HitboxPulseManager._cap = 8;
    JABS_HitboxPulseManager._defaults = JABS_HitboxPulseOptions.defaults();
    JABS_HitboxPulseManager._sustainedByUuid = {};
  });

  describe('accessors', () =>
  {
    it('setLayer/getLayer round-trip the assigned layer', () =>
    {
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      expect(JABS_HitboxPulseManager.getLayer()).toBe(layer);
    });

    it('getLayer is null before any layer is assigned', () =>
    {
      expect(JABS_HitboxPulseManager.getLayer()).toBeNull();
    });

    it('getActive/getPool return the live internal collections', () =>
    {
      expect(JABS_HitboxPulseManager.getActive()).toBe(JABS_HitboxPulseManager._active);
      expect(JABS_HitboxPulseManager.getPool()).toBe(JABS_HitboxPulseManager._pool);
    });

    it('getCap/setCap round-trip the concurrent pulse cap', () =>
    {
      JABS_HitboxPulseManager.setCap(12);
      expect(JABS_HitboxPulseManager.getCap()).toBe(12);
    });

    it('setCap floors a fractional value', () =>
    {
      JABS_HitboxPulseManager.setCap(5.9);
      expect(JABS_HitboxPulseManager.getCap()).toBe(5);
    });

    it('setCap clamps a negative value to 0', () =>
    {
      JABS_HitboxPulseManager.setCap(-3);
      expect(JABS_HitboxPulseManager.getCap()).toBe(0);
    });

    it('setCap treats a falsy input as 0', () =>
    {
      JABS_HitboxPulseManager.setCap(undefined);
      expect(JABS_HitboxPulseManager.getCap()).toBe(0);
    });

    it('getDefaultOptions returns a clone, not the live defaults instance', () =>
    {
      const options = JABS_HitboxPulseManager.getDefaultOptions();
      expect(options).not.toBe(JABS_HitboxPulseManager._defaults);
      expect(options).toBeInstanceOf(JABS_HitboxPulseOptions);
    });

    it('setDefaultOptions clones the provided options rather than aliasing them', () =>
    {
      const provided = JABS_HitboxPulseOptions.defaults();
      JABS_HitboxPulseManager.setDefaultOptions(provided);
      expect(JABS_HitboxPulseManager._defaults).not.toBe(provided);
    });
  });

  describe('configure', () =>
  {
    it('does nothing when no options are provided', () =>
    {
      const before = JABS_HitboxPulseManager._defaults;
      JABS_HitboxPulseManager.configure(null);
      expect(JABS_HitboxPulseManager._defaults).toBe(before);
    });

    it('applies overrides onto the existing defaults', () =>
    {
      JABS_HitboxPulseManager.configure({ duration: 99 });
      expect(JABS_HitboxPulseManager._defaults.duration).toBe(99);
    });

    it('updates the cap via setCap when maxConcurrentPulses is provided', () =>
    {
      JABS_HitboxPulseManager.configure({ maxConcurrentPulses: 3 });
      expect(JABS_HitboxPulseManager.getCap()).toBe(3);
    });

    it('leaves the cap untouched when maxConcurrentPulses is not provided', () =>
    {
      JABS_HitboxPulseManager.setCap(6);
      JABS_HitboxPulseManager.configure({ duration: 5 });
      expect(JABS_HitboxPulseManager.getCap()).toBe(6);
    });
  });

  describe('spawn', () =>
  {
    it('does nothing when no layer has been assigned yet', () =>
    {
      JABS_HitboxPulseManager.spawn({ x: 1, y: 1 });
      expect(JABS_HitboxPulseManager.getActive()).toHaveLength(0);
    });

    it('creates a new pulse from the pool-less path and tracks it as active', () =>
    {
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);

      JABS_HitboxPulseManager.spawn({ x: 5, y: 6, facing: 6 });

      expect(FakeSpriteHitboxPulse).toHaveBeenCalledTimes(1);
      expect(JABS_HitboxPulseManager.getActive()).toHaveLength(1);
      expect(layer.children).toHaveLength(1);
    });

    it('keeps every pulse alive while the active count is still under the cap', () =>
    {
      // Arrange- the default cap of 8 leaves plenty of headroom for two spawns, so nothing may be
      // evicted. A single spawn cannot prove that: with an empty active list the eviction branch
      // shifts `undefined` and quietly does nothing, so it looks identical either way.
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);

      // Act
      JABS_HitboxPulseManager.spawn({ x: 1, y: 1, facing: 6 });
      JABS_HitboxPulseManager.spawn({ x: 2, y: 2, facing: 4 });

      // Assert- an eviction would have recycled the first pulse into the pool and popped it right
      // back out, leaving one active pulse and only one sprite ever constructed.
      expect(JABS_HitboxPulseManager.getActive()).toHaveLength(2);
      expect(FakeSpriteHitboxPulse).toHaveBeenCalledTimes(2);
      expect(layer.children).toHaveLength(2);
    });

    it('reuses a pooled pulse instead of constructing a new one when the pool has entries', () =>
    {
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      const pooled = buildFakePulse();
      JABS_HitboxPulseManager.getPool()
        .push(pooled);

      JABS_HitboxPulseManager.spawn({ x: 1, y: 1, facing: 2 });

      expect(FakeSpriteHitboxPulse).not.toHaveBeenCalled();
      expect(pooled.reset).toHaveBeenCalledTimes(1);
      expect(JABS_HitboxPulseManager.getActive()).toContain(pooled);
    });

    it('evicts the oldest active pulse once the cap is reached, recycling it into the pool', () =>
    {
      // Arrange: cap 1 means the eviction pushes the oldest into the pool mid-call, and since
      // the pool now has exactly one entry, this same spawn immediately pops and reuses it-
      // real behavior, not a new allocation.
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      JABS_HitboxPulseManager.setCap(1);
      JABS_HitboxPulseManager.spawn({ x: 1, y: 1, facing: 2 });
      const [ first ] = JABS_HitboxPulseManager.getActive();

      // Act
      JABS_HitboxPulseManager.spawn({ x: 2, y: 2, facing: 4 });

      // Assert
      expect(JABS_HitboxPulseManager.getActive()).toHaveLength(1);
      expect(JABS_HitboxPulseManager.getActive()[0]).toBe(first);
      expect(JABS_HitboxPulseManager.getPool()).toHaveLength(0);
      expect(first.reset).toHaveBeenCalledTimes(2);
      expect(first.setWorldPosition).toHaveBeenLastCalledWith(2, 2);
      // the evicted pulse has to be detached before it is re-attached, or the layer accumulates a
      // second reference to the same sprite on every eviction and leaks children forever.
      expect(layer.removeChild).toHaveBeenCalledWith(first);
      expect(layer.children).toEqual([ first ]);
    });

    it('tolerates a zero cap where the eviction slot has nothing to shift', () =>
    {
      // Arrange: cap 0 means `active.length(0) >= cap(0)` is already true before anything
      // is ever spawned, so `active.shift()` returns undefined- the eviction branch must
      // handle a falsy "oldest" gracefully.
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      JABS_HitboxPulseManager.setCap(0);

      // Act & Assert
      expect(() => JABS_HitboxPulseManager.spawn({ x: 1, y: 1, facing: 2 })).not.toThrow();
    });

    it('evicts an oldest pulse that is already detached from the layer without calling removeChild', () =>
    {
      // Arrange
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      JABS_HitboxPulseManager.setCap(1);
      const alreadyDetached = buildFakePulse();
      alreadyDetached.parent = null;
      JABS_HitboxPulseManager.getActive()
        .push(alreadyDetached);

      // Act
      JABS_HitboxPulseManager.spawn({ x: 2, y: 2, facing: 4 });

      // Assert
      expect(layer.removeChild).not.toHaveBeenCalled();
      expect(JABS_HitboxPulseManager.getActive()).toHaveLength(1);
    });
  });

  describe('update', () =>
  {
    it('does nothing when there are no active pulses', () =>
    {
      expect(() => JABS_HitboxPulseManager.update()).not.toThrow();
    });

    it('ticks every active pulse', () =>
    {
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      const pulse = buildFakePulse();
      layer.addChild(pulse);
      JABS_HitboxPulseManager.getActive()
        .push(pulse);

      JABS_HitboxPulseManager.update();

      expect(pulse.update).toHaveBeenCalledTimes(1);
    });

    it('retires an expired pulse back into the pool and detaches it from the layer', () =>
    {
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      const pulse = buildFakePulse();
      pulse.isExpired.mockReturnValue(true);
      layer.addChild(pulse);
      JABS_HitboxPulseManager.getActive()
        .push(pulse);

      JABS_HitboxPulseManager.update();

      expect(JABS_HitboxPulseManager.getActive()).toHaveLength(0);
      expect(JABS_HitboxPulseManager.getPool()).toContain(pulse);
      expect(pulse.parent).toBeNull();
    });

    it('leaves a non-expired pulse active without touching the pool', () =>
    {
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      const pulse = buildFakePulse();
      layer.addChild(pulse);
      JABS_HitboxPulseManager.getActive()
        .push(pulse);

      JABS_HitboxPulseManager.update();

      expect(JABS_HitboxPulseManager.getActive()).toHaveLength(1);
      expect(JABS_HitboxPulseManager.getPool()).toHaveLength(0);
    });

    it('recycles an expired pulse that is already detached from the layer without calling removeChild', () =>
    {
      // Arrange
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      const pulse = buildFakePulse();
      pulse.isExpired.mockReturnValue(true);
      pulse.parent = null;
      JABS_HitboxPulseManager.getActive()
        .push(pulse);

      // Act
      JABS_HitboxPulseManager.update();

      // Assert
      expect(layer.removeChild).not.toHaveBeenCalled();
      expect(JABS_HitboxPulseManager.getPool()).toContain(pulse);
    });
  });

  describe('clear', () =>
  {
    it('detaches and recycles all active pulses, and empties the pool', () =>
    {
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      const pulse = buildFakePulse();
      layer.addChild(pulse);
      JABS_HitboxPulseManager.getActive()
        .push(pulse);
      JABS_HitboxPulseManager.getPool()
        .push(buildFakePulse());

      JABS_HitboxPulseManager.clear();

      expect(JABS_HitboxPulseManager.getActive()).toHaveLength(0);
      expect(JABS_HitboxPulseManager.getPool()).toHaveLength(0);
      expect(layer.children).toHaveLength(0);
    });

    it('skips removeChild for an active pulse that is already detached from the layer', () =>
    {
      // Arrange
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      const pulse = buildFakePulse();
      pulse.parent = null;
      JABS_HitboxPulseManager.getActive()
        .push(pulse);

      // Act
      JABS_HitboxPulseManager.clear();

      // Assert
      expect(layer.removeChild).not.toHaveBeenCalled();
      expect(JABS_HitboxPulseManager.getActive()).toHaveLength(0);
    });

    it('releases every sustained pulse and detaches it from the layer, even though the pool is wiped right after', () =>
    {
      // Arrange
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      const sustained = buildFakePulse();
      layer.addChild(sustained);
      JABS_HitboxPulseManager._sustainedByUuid['action-uuid'] = sustained;

      // Act
      JABS_HitboxPulseManager.clear();

      // Assert: releaseSustainedPulse's own detach ran (real behavior)- clear()'s trailing
      // `pool.length = 0` then wipes the whole pool anyway, sustained pulse included.
      expect(JABS_HitboxPulseManager._sustainedByUuid).toEqual({});
      expect(sustained.parent).toBeNull();
      expect(JABS_HitboxPulseManager.getPool()).toHaveLength(0);
    });

    it('empties the collections without attempting a detach when the layer is already gone', () =>
    {
      // Arrange- a map transition drops the layer before the manager is cleared, leaving an active
      // pulse that was never attached to anything. Both the pulse's parent and the layer are null
      // here, so a detach check that skipped the layer half of the guard would match `null` against
      // `null`, decide the pulse is attached, and remove a child from nothing.
      const pulse = buildFakePulse();
      JABS_HitboxPulseManager.getActive()
        .push(pulse);

      // Act
      JABS_HitboxPulseManager.clear();

      // Assert
      expect(JABS_HitboxPulseManager.getActive()).toHaveLength(0);
      expect(JABS_HitboxPulseManager.getPool()).toHaveLength(0);
    });

    it('tolerates an already-clear manager with nothing to do', () =>
    {
      expect(() => JABS_HitboxPulseManager.clear()).not.toThrow();
    });
  });

  describe('syncSustainedActionPulse', () =>
  {
    /**
     * Builds a minimal duck-typed JABS_Action carrying only what syncSustainedActionPulse touches.
     * @param {object} fields
     * @returns {object}
     */
    function buildJabsAction(fields = {})
    {
      return {
        getUuid: () => 'action-uuid',
        getNeedsRemoval: () => false,
        isDelayCompleted: () => true,
        composeHitboxPulsePlainOptions: () => ({ x: 1, y: 2, facing: 6 }),
        ...fields,
      };
    }

    it('releases any sustained pulse and stops when hitbox pulses are globally disabled', () =>
    {
      // Arrange
      const originalEnabled = globalThis.J.ABS.Metadata.HitboxPulse.enabled;
      globalThis.J.ABS.Metadata.HitboxPulse.enabled = false;
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      const sustained = buildFakePulse();
      layer.addChild(sustained);
      JABS_HitboxPulseManager._sustainedByUuid['action-uuid'] = sustained;

      // Act
      JABS_HitboxPulseManager.syncSustainedActionPulse(buildJabsAction());

      // Assert
      expect(JABS_HitboxPulseManager._sustainedByUuid['action-uuid']).toBeUndefined();
      globalThis.J.ABS.Metadata.HitboxPulse.enabled = originalEnabled;
    });

    it('skips quietly when there is no layer yet (early-map bootstrap)', () =>
    {
      expect(() => JABS_HitboxPulseManager.syncSustainedActionPulse(buildJabsAction())).not.toThrow();
      expect(JABS_HitboxPulseManager._sustainedByUuid).toEqual({});
    });

    it('releases the sustained pulse when the action needs removal', () =>
    {
      // Arrange
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      const sustained = buildFakePulse();
      layer.addChild(sustained);
      JABS_HitboxPulseManager._sustainedByUuid['action-uuid'] = sustained;

      // Act
      JABS_HitboxPulseManager.syncSustainedActionPulse(buildJabsAction({ getNeedsRemoval: () => true }));

      // Assert
      expect(JABS_HitboxPulseManager._sustainedByUuid['action-uuid']).toBeUndefined();
    });

    it('releases the sustained pulse while the action\'s delay has not yet completed', () =>
    {
      // Arrange
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      const sustained = buildFakePulse();
      layer.addChild(sustained);
      JABS_HitboxPulseManager._sustainedByUuid['action-uuid'] = sustained;

      // Act
      JABS_HitboxPulseManager.syncSustainedActionPulse(buildJabsAction({ isDelayCompleted: () => false }));

      // Assert
      expect(JABS_HitboxPulseManager._sustainedByUuid['action-uuid']).toBeUndefined();
    });

    it('creates a new sustained pulse (pool-less) and attaches it to the layer on first sync', () =>
    {
      // Arrange
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);

      // Act
      JABS_HitboxPulseManager.syncSustainedActionPulse(buildJabsAction());

      // Assert
      expect(FakeSpriteHitboxPulse).toHaveBeenCalledTimes(1);
      const pulse = JABS_HitboxPulseManager._sustainedByUuid['action-uuid'];
      expect(pulse).toBeDefined();
      expect(layer.children).toContain(pulse);
      expect(pulse.setWorldPosition).toHaveBeenCalledWith(1, 2);
    });

    it('reuses a pooled sprite for a new sustained pulse when the pool has entries', () =>
    {
      // Arrange
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      const pooled = buildFakePulse();
      JABS_HitboxPulseManager.getPool()
        .push(pooled);

      // Act
      JABS_HitboxPulseManager.syncSustainedActionPulse(buildJabsAction());

      // Assert
      expect(FakeSpriteHitboxPulse).not.toHaveBeenCalled();
      expect(JABS_HitboxPulseManager._sustainedByUuid['action-uuid']).toBe(pooled);
    });

    it('reuses the already-tracked sustained pulse on subsequent syncs instead of creating a new one', () =>
    {
      // Arrange
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      JABS_HitboxPulseManager.syncSustainedActionPulse(buildJabsAction());
      FakeSpriteHitboxPulse.mockClear();

      // Act
      JABS_HitboxPulseManager.syncSustainedActionPulse(buildJabsAction());

      // Assert
      expect(FakeSpriteHitboxPulse).not.toHaveBeenCalled();
      expect(layer.addChild).toHaveBeenCalledTimes(1);
    });
  });

  describe('releaseSustainedPulse', () =>
  {
    it('does nothing when there is no sustained pulse tracked for the uuid', () =>
    {
      // Arrange- a layer is attached and the pool already holds a sprite, so a release that ran on
      // past the missing-pulse guard would dereference `undefined` for its parent, and failing that
      // would file `undefined` into the pool behind the real sprite for a later spawn to pop.
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      const pooled = buildFakePulse();
      JABS_HitboxPulseManager.getPool()
        .push(pooled);

      // Act
      JABS_HitboxPulseManager.releaseSustainedPulse('missing-uuid');

      // Assert
      expect(JABS_HitboxPulseManager.getPool()).toEqual([ pooled ]);
      expect(layer.removeChild).not.toHaveBeenCalled();
    });

    it('detaches only when the pulse is actually attached to the current layer', () =>
    {
      // Arrange: pulse tracked but never attached to any layer.
      const layer = buildFakeLayer();
      JABS_HitboxPulseManager.setLayer(layer);
      const pulse = buildFakePulse();
      JABS_HitboxPulseManager._sustainedByUuid['action-uuid'] = pulse;

      // Act
      JABS_HitboxPulseManager.releaseSustainedPulse('action-uuid');

      // Assert- no removeChild call since it was never attached, but it's still pooled.
      expect(layer.removeChild).not.toHaveBeenCalled();
      expect(JABS_HitboxPulseManager.getPool()).toContain(pulse);
    });
  });

  describe('directionToRadians', () =>
  {
    it.each([
      [ 6, 0 ],
      [ 3, Math.PI / 4 ],
      [ 2, Math.PI / 2 ],
      [ 1, Math.PI - Math.PI / 4 ],
      [ 4, Math.PI ],
      [ 7, -Math.PI + Math.PI / 4 ],
      [ 8, -Math.PI / 2 ],
      [ 9, -Math.PI / 4 ],
    ])('maps direction %i to the expected radian value', (dir, expected) =>
    {
      expect(JABS_HitboxPulseManager.directionToRadians(dir)).toBeCloseTo(expected);
    });

    it('defaults to 0 (pointing right) for an unrecognized direction code', () =>
    {
      expect(JABS_HitboxPulseManager.directionToRadians(5)).toBe(0);
    });
  });
});
//endregion plugins/abs/core/managers/jabs-hitbox-pulse-manager.test.js
