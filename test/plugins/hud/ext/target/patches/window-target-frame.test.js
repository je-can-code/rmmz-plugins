//region plugins/hud/ext/target/patches/window-target-frame.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Window_TargetFrame afflictions patch (direct src import)', () =>
{
  let Window_TargetFrame;
  let FakeStateAfflictionHudPresenter;
  let FakeStateAfflictionHudLayoutSpec;

  /** @type {import('vitest').Mock} the "original" (aliased) initialize. */
  let originalInitialize;
  /** @type {import('vitest').Mock} the "original" (aliased) updateTarget. */
  let originalUpdateTarget;

  beforeAll(async () =>
  {
    vi.resetModules();

    function StubWindowTargetFrame()
    {
    }

    originalInitialize = vi.fn();
    originalUpdateTarget = vi.fn();
    StubWindowTargetFrame.prototype.initialize = originalInitialize;
    StubWindowTargetFrame.prototype.updateTarget = originalUpdateTarget;
    StubWindowTargetFrame.prototype.hasTargetIcon = () => false;
    StubWindowTargetFrame.prototype.targetBattlerGaugesY = () => 0;

    vi.doMock(
      '../../../../../../src/plugins/hud/ext/target/windows/Window_TargetFrame.js',
      () => ({ default: StubWindowTargetFrame })
    );

    globalThis.J = {
      HUD: {
        EXT: {
          TARGET: {
            Aliased: { Window_TargetFrame: new Map() },
          },
        },
      },
    };

    FakeStateAfflictionHudPresenter = vi.fn(function(window, spriteCache)
    {
      this.window = window;
      this.spriteCache = spriteCache;
      this.render = vi.fn();
    });
    globalThis.StateAfflictionHudPresenter = FakeStateAfflictionHudPresenter;

    FakeStateAfflictionHudLayoutSpec = vi.fn(function()
    {
      this.originX = 0;
      this.originY = 0;
      this.rowGap = 0;
    });
    globalThis.StateAfflictionHudLayoutSpec = FakeStateAfflictionHudLayoutSpec;

    globalThis.ImageManager = { iconWidth: 32 };

    await import('../../../../../../src/plugins/hud/ext/target/patches/Window_TargetFrame.js');
    ({ default: Window_TargetFrame } = await import(
      '../../../../../../src/plugins/hud/ext/target/windows/Window_TargetFrame.js'
    ));
  });

  beforeEach(() =>
  {
    originalInitialize.mockClear();
    originalUpdateTarget.mockClear();
    FakeStateAfflictionHudPresenter.mockClear();
  });

  function buildWindow(overrides = {})
  {
    const window = Object.create(Window_TargetFrame.prototype);
    window._j = { _spriteCache: {}, _battler: null, _inactivityTimer: 0 };
    return Object.assign(window, overrides);
  }

  describe('initialize', () =>
  {
    it('calls through to the original aliased implementation', () =>
    {
      // Arrange
      const window = buildWindow();
      const rect = { x: 0, y: 0 };

      // Act
      window.initialize(rect);

      // Assert
      expect(originalInitialize).toHaveBeenCalledWith(rect);
    });

    it('wires an affliction presenter using this window and its sprite cache', () =>
    {
      // Arrange
      const window = buildWindow();
      const rect = { x: 0, y: 0 };

      // Act
      window.initialize(rect);

      // Assert
      expect(FakeStateAfflictionHudPresenter).toHaveBeenCalledWith(window, window._j._spriteCache);
      expect(window._afflictionPresenter).toBeInstanceOf(FakeStateAfflictionHudPresenter);
    });
  });

  describe('targetAfflictionLayoutSpec', () =>
  {
    it('anchors the layout at the base indent when there is no target icon', () =>
    {
      // Arrange
      const window = buildWindow({ hasTargetIcon: () => false, targetBattlerGaugesY: () => 10 });

      // Act
      const layout = window.targetAfflictionLayoutSpec();

      // Assert
      expect(layout.originX).toBe(32);
    });

    it('pushes the layout right by an icon width when a target icon is drawn', () =>
    {
      // Arrange
      const window = buildWindow({ hasTargetIcon: () => true, targetBattlerGaugesY: () => 10 });

      // Act
      const layout = window.targetAfflictionLayoutSpec();

      // Assert
      expect(layout.originX).toBe(32 + 32);
    });

    it('positions the layout below the gauge stack with a fixed offset', () =>
    {
      // Arrange
      const window = buildWindow({ hasTargetIcon: () => false, targetBattlerGaugesY: () => 100 });

      // Act
      const layout = window.targetAfflictionLayoutSpec();

      // Assert
      expect(layout.originY).toBe(144);
    });

    it('sets a fixed row gap', () =>
    {
      // Arrange
      const window = buildWindow({ hasTargetIcon: () => false, targetBattlerGaugesY: () => 0 });

      // Act
      const layout = window.targetAfflictionLayoutSpec();

      // Assert
      expect(layout.rowGap).toBe(24);
    });
  });

  describe('updateTargetAfflictions', () =>
  {
    it('does nothing when there is no affliction presenter yet', () =>
    {
      // Arrange
      const window = buildWindow();
      window._afflictionPresenter = null;
      window._j._battler = {};
      window._j._inactivityTimer = 100;

      // Act & Assert: no throw means the early return was taken before touching a null presenter.
      expect(() => window.updateTargetAfflictions()).not.toThrow();
    });

    it('does nothing when there is no framed battler', () =>
    {
      // Arrange
      const render = vi.fn();
      const window = buildWindow({ _afflictionPresenter: { render } });
      window._j._battler = null;
      window._j._inactivityTimer = 100;

      // Act
      window.updateTargetAfflictions();

      // Assert
      expect(render).not.toHaveBeenCalled();
    });

    it('does nothing while the inactivity timer has not yet crossed the threshold', () =>
    {
      // Arrange
      const render = vi.fn();
      const window = buildWindow({ _afflictionPresenter: { render } });
      window._j._battler = {};
      window._j._inactivityTimer = 59;

      // Act
      window.updateTargetAfflictions();

      // Assert
      expect(render).not.toHaveBeenCalled();
    });

    it('renders the affliction presenter with the framed battler and layout once past the threshold', () =>
    {
      // Arrange
      const render = vi.fn();
      const battler = {};
      const window = buildWindow({
        _afflictionPresenter: { render },
        hasTargetIcon: () => false,
        targetBattlerGaugesY: () => 0,
      });
      window._j._battler = battler;
      window._j._inactivityTimer = 60;

      // Act
      window.updateTargetAfflictions();

      // Assert
      expect(render).toHaveBeenCalledWith(battler, expect.any(FakeStateAfflictionHudLayoutSpec));
    });
  });

  describe('updateTarget', () =>
  {
    it('calls through to the original aliased implementation', () =>
    {
      // Arrange
      const window = buildWindow();
      window.updateTargetAfflictions = vi.fn();

      // Act
      window.updateTarget();

      // Assert
      expect(originalUpdateTarget).toHaveBeenCalled();
    });

    it('updates the target afflictions after the original logic runs', () =>
    {
      // Arrange
      const window = buildWindow();
      window.updateTargetAfflictions = vi.fn();

      // Act
      window.updateTarget();

      // Assert
      expect(window.updateTargetAfflictions).toHaveBeenCalled();
    });
  });
});
//endregion plugins/hud/ext/target/patches/window-target-frame.test.js
