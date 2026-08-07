//region plugins/diff/core/__models/difficulty-layer.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * A single layer of difficulty, and the config it reads its own state out of.
 *
 * None of the state below lives on the layer. A layer is built fresh from the plugin's parsed
 * metadata every boot, so anything the player can change about it - locked, hidden, enabled - has to
 * live in `$gameSystem` where a savefile can carry it. That indirection is the whole design and it is
 * what these tests are actually about: every accessor here has to reach through to the config for the
 * layer's own key, and one that read a field off itself instead would work perfectly until a load.
 */
describe('DifficultyLayer', () =>
{
  /** @type {typeof import('../../../../../src/plugins/diff/core/__models/DifficultyLayer.js').default} */
  let DifficultyLayer;

  /**
   * The per-key config `$gameSystem` hands back, standing in for what a savefile carries.
   * @type {Map<string, object>}
   */
  let configs;

  /**
   * Builds a layer whose config starts at a known state.
   * @param {string} key The layer's key.
   * @param {object=} config The config that layer's key resolves to.
   * @returns {DifficultyLayer} The layer under test.
   */
  const buildLayer = (key, config = {}) =>
  {
    configs.set(key, {
      unlocked: true,
      hidden: false,
      enabled: false,
      ...config,
    });

    return new DifficultyLayer(key);
  };

  beforeAll(async () =>
  {
    vi.resetModules();

    // the J-Base sentinel the class fields default to, normally installed by _base's initialization.
    if (Object.getOwnPropertyDescriptor(String, 'empty') === undefined)
    {
      Object.defineProperty(String, 'empty', { value: '' });
    }

    globalThis.J = { DIFFICULTY: { Metadata: { defaultKey: 'normal' } } };

    ({ default: DifficultyLayer } = await import(
      '../../../../../src/plugins/diff/core/__models/DifficultyLayer.js'));
  });

  beforeEach(() =>
  {
    configs = new Map();

    globalThis.$gameSystem = {
      getDifficultyConfigByKey: key => configs.get(key),
      getRemainingLayerPoints: () => 10,
    };
  });

  //region which layer this is
  describe('isDefaultLayer()', () =>
  {
    it('recognizes the layer the game falls back to', () =>
    {
      // Arrange
      const layer = buildLayer('normal');

      // Act
      const isDefault = layer.isDefaultLayer();

      // Assert
      expect(isDefault)
        .toBe(true);
    });

    it('does not mistake an ordinary layer for the default', () =>
    {
      // Arrange
      const layer = buildLayer('brutal');

      // Act
      const isDefault = layer.isDefaultLayer();

      // Assert
      expect(isDefault)
        .toBe(false);
    });
  });

  describe('isAppliedLayer()', () =>
  {
    it('recognizes the synthetic layer holding the combined effects', () =>
    {
      // Arrange: the applied layer is not one the player picks - it is the sum of the ones they did.
      const layer = buildLayer(DifficultyLayer.appliedKey);

      // Act
      const isApplied = layer.isAppliedLayer();

      // Assert
      expect(isApplied)
        .toBe(true);
    });

    it('does not mistake an ordinary layer for the applied one', () =>
    {
      // Arrange
      const layer = buildLayer('brutal');

      // Act
      const isApplied = layer.isAppliedLayer();

      // Assert
      expect(isApplied)
        .toBe(false);
    });
  });
  //endregion which layer this is

  //region whether the player can afford it
  describe('canPayCost()', () =>
  {
    it('affords a layer costing less than what remains', () =>
    {
      // Arrange
      const layer = buildLayer('brutal');
      layer.cost = 4;

      // Act
      const canPay = layer.canPayCost();

      // Assert
      expect(canPay)
        .toBe(true);
    });

    it('affords a layer costing exactly what remains, spending the budget to the last point', () =>
    {
      // Arrange
      const layer = buildLayer('brutal');
      layer.cost = 10;

      // Act
      const canPay = layer.canPayCost();

      // Assert
      expect(canPay)
        .toBe(true);
    });

    it('cannot afford a layer costing more than what remains', () =>
    {
      // Arrange
      const layer = buildLayer('brutal');
      layer.cost = 11;

      // Act
      const canPay = layer.canPayCost();

      // Assert
      expect(canPay)
        .toBe(false);
    });
  });
  //endregion whether the player can afford it

  //region locked or not
  describe('isUnlocked()', () =>
  {
    it('reports a layer the player has earned access to', () =>
    {
      // Arrange
      const layer = buildLayer('brutal', { unlocked: true });

      // Act
      const isUnlocked = layer.isUnlocked();

      // Assert
      expect(isUnlocked)
        .toBe(true);
    });

    it('reports a layer the player has not earned access to', () =>
    {
      // Arrange
      const layer = buildLayer('brutal', { unlocked: false });

      // Act
      const isUnlocked = layer.isUnlocked();

      // Assert
      expect(isUnlocked)
        .toBe(false);
    });
  });

  describe('lock()', () =>
  {
    it('writes the lock into the config rather than onto the layer', () =>
    {
      // Arrange: the layer is rebuilt from metadata every boot, so a flag stored on it would be lost.
      const layer = buildLayer('brutal', { unlocked: true });

      // Act
      layer.lock();

      // Assert
      expect(configs.get('brutal').unlocked)
        .toBe(false);
      expect(layer.isUnlocked())
        .toBe(false);
    });
  });

  describe('unlock()', () =>
  {
    it('writes the unlock into the config rather than onto the layer', () =>
    {
      // Arrange
      const layer = buildLayer('brutal', { unlocked: false });

      // Act
      layer.unlock();

      // Assert
      expect(configs.get('brutal').unlocked)
        .toBe(true);
      expect(layer.isUnlocked())
        .toBe(true);
    });
  });
  //endregion locked or not

  //region listed or not
  describe('isHidden()', () =>
  {
    it('reports a layer kept out of the list', () =>
    {
      // Arrange
      const layer = buildLayer('brutal', { hidden: true });

      // Act
      const isHidden = layer.isHidden();

      // Assert
      expect(isHidden)
        .toBe(true);
    });

    it('reports a layer the list shows', () =>
    {
      // Arrange
      const layer = buildLayer('brutal', { hidden: false });

      // Act
      const isHidden = layer.isHidden();

      // Assert
      expect(isHidden)
        .toBe(false);
    });
  });

  describe('hide()', () =>
  {
    it('takes the layer out of the list without touching whether it is unlocked', () =>
    {
      // Arrange: hidden and locked are separate ideas - a layer can be earned and still not listed.
      const layer = buildLayer('brutal', {
        hidden: false,
        unlocked: true,
      });

      // Act
      layer.hide();

      // Assert
      expect(layer.isHidden())
        .toBe(true);
      expect(layer.isUnlocked())
        .toBe(true);
    });
  });

  describe('unhide()', () =>
  {
    it('puts the layer back in the list', () =>
    {
      // Arrange
      const layer = buildLayer('brutal', { hidden: true });

      // Act
      layer.unhide();

      // Assert
      expect(layer.isHidden())
        .toBe(false);
    });
  });
  //endregion listed or not

  //region turned on or not
  describe('isEnabled()', () =>
  {
    it('reports a layer currently in force', () =>
    {
      // Arrange
      const layer = buildLayer('brutal', { enabled: true });

      // Act
      const isEnabled = layer.isEnabled();

      // Assert
      expect(isEnabled)
        .toBe(true);
    });

    it('reports a layer the player has turned back off', () =>
    {
      // Arrange
      const layer = buildLayer('brutal', { enabled: false });

      // Act
      const isEnabled = layer.isEnabled();

      // Assert
      expect(isEnabled)
        .toBe(false);
    });
  });

  describe('enable()', () =>
  {
    it('puts the layer into force', () =>
    {
      // Arrange
      const layer = buildLayer('brutal', { enabled: false });

      // Act
      layer.enable();

      // Assert
      expect(layer.isEnabled())
        .toBe(true);
    });
  });

  describe('disable()', () =>
  {
    it('takes the layer back out of force without relocking or hiding it', () =>
    {
      // Arrange
      const layer = buildLayer('brutal', {
        enabled: true,
        unlocked: true,
        hidden: false,
      });

      // Act
      layer.disable();

      // Assert
      expect(layer.isEnabled())
        .toBe(false);
      expect(layer.isUnlocked())
        .toBe(true);
      expect(layer.isHidden())
        .toBe(false);
    });
  });
  //endregion turned on or not

  //region reading the right config
  describe('config lookup', () =>
  {
    it('reads through to the config for this layer\'s own key, never a neighbour\'s', () =>
    {
      // Arrange: every accessor here funnels through one lookup, and getting the key wrong would have
      // one layer answering with another's state - visible only as difficulties that will not stick.
      buildLayer('normal', { enabled: true });
      const brutal = buildLayer('brutal', { enabled: false });
      const lookup = vi.spyOn(globalThis.$gameSystem, 'getDifficultyConfigByKey');

      // Act
      const isEnabled = brutal.isEnabled();

      // Assert
      expect(lookup)
        .toHaveBeenCalledWith('brutal');
      expect(isEnabled)
        .toBe(false);

      lookup.mockRestore();
    });
  });
  //endregion reading the right config
});
//endregion plugins/diff/core/__models/difficulty-layer.test.js