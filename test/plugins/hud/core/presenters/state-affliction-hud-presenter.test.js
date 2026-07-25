//region plugins/hud/core/presenters/state-affliction-hud-presenter.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('StateAfflictionHudPresenter (direct src import)', () =>
{
  let StateAfflictionHudPresenter;
  let StateAfflictionCollection;
  let StateAfflictionViewModel;
  let StateAfflictionBattlerIdentity;

  beforeAll(async () =>
  {
    vi.resetModules();

    String.empty = '';

    // the real collection/viewModel/identity classes are pure data shapes with no bare-global
    // dependencies of their own (besides String.empty), so import them for real rather than faking.
    ({ default: StateAfflictionCollection } = await import('../../../../../../src/plugins/abs/core/models/StateAfflictionCollection.js'));
    ({ default: StateAfflictionViewModel } = await import('../../../../../../src/plugins/abs/core/models/StateAfflictionViewModel.js'));
    ({ default: StateAfflictionBattlerIdentity } = await import('../../../../../../src/plugins/abs/core/models/StateAfflictionBattlerIdentity.js'));
    globalThis.StateAfflictionBattlerIdentity = StateAfflictionBattlerIdentity;

    // StateAfflictionProvider pulls in the full JABS engine collection pipeline; only its two
    // static entry points are called here, so a bare stub is enough.
    globalThis.StateAfflictionProvider = {
      collectForBattler: vi.fn(),
      canCollect: vi.fn()
        .mockReturnValue(false),
    };

    globalThis.ImageManager = { iconWidth: 32, iconHeight: 32 };
    globalThis.$gameSystem = {
      numberFontFace: vi.fn()
        .mockReturnValue('rmmz-numbers'),
      mainFontSize: vi.fn()
        .mockReturnValue(26),
    };
    globalThis.$jabsEngine = { getJabsStatesByUuid: vi.fn() };

    function FakeSprite()
    {
      this.visible = false;
      this.iconIndex = null;
      this.x = 0;
      this.y = 0;
      this.text = String.empty;
    }

    FakeSprite.prototype.setIconIndex = function(iconIndex)
    {
      this.iconIndex = iconIndex;
    };
    FakeSprite.prototype.move = function(x, y)
    {
      this.x = x;
      this.y = y;
    };
    FakeSprite.prototype.show = function()
    {
      this.visible = true;
    };
    FakeSprite.prototype.hide = function()
    {
      this.visible = false;
    };
    FakeSprite.prototype.setText = function(text)
    {
      this.text = text;
    };
    FakeSprite.prototype.setFontFace = vi.fn();
    FakeSprite.prototype.setFontSize = vi.fn();
    FakeSprite.prototype.setAlignment = vi.fn();
    FakeSprite.prototype.setMinWidth = vi.fn();

    function Sprite_Icon(iconIndex)
    {
      FakeSprite.call(this);
      this.iconIndex = iconIndex;
    }

    Sprite_Icon.prototype = Object.create(FakeSprite.prototype);
    globalThis.Sprite_Icon = Sprite_Icon;

    function Sprite_BaseText()
    {
      FakeSprite.call(this);
    }

    Sprite_BaseText.prototype = Object.create(FakeSprite.prototype);
    Sprite_BaseText.Alignments = { Left: 'left', Center: 'center', Right: 'right' };
    globalThis.Sprite_BaseText = Sprite_BaseText;

    ({ default: StateAfflictionHudPresenter } = await import('../../../../../../src/plugins/hud/core/presenters/StateAfflictionHudPresenter.js'));
  });

  let hostWindow;
  let spriteCache;
  let battler;

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.StateAfflictionProvider.canCollect.mockReturnValue(false);

    hostWindow = { addChild: vi.fn() };
    spriteCache = new Map();
    battler = { getUuid: () => 'uuid-1', state: vi.fn() };
  });

  function makeViewModel(overrides = {})
  {
    const viewModel = new StateAfflictionViewModel();
    Object.assign(viewModel, {
      stateId: 1,
      stackCount: 1,
      durationFrames: 180,
      isEternal: false,
      ...overrides,
    });

    return viewModel;
  }

  describe('render', () =>
  {
    it('does nothing further when the collection is empty', () =>
    {
      // Arrange
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);
      const collection = new StateAfflictionCollection();
      globalThis.StateAfflictionProvider.collectForBattler.mockReturnValue(collection);

      // Act
      presenter.render(battler, { slotX: vi.fn(), negativeRowY: vi.fn(), positiveRowY: vi.fn() });

      // Assert
      expect(hostWindow.addChild).not.toHaveBeenCalled();
    });

    it('renders a slot for every negative and positive view model at the layout-provided coordinates', () =>
    {
      // Arrange
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);
      const collection = new StateAfflictionCollection();
      collection.negative = [ makeViewModel({ stateId: 1 }) ];
      collection.positive = [ makeViewModel({ stateId: 2 }) ];
      globalThis.StateAfflictionProvider.collectForBattler.mockReturnValue(collection);
      battler.state.mockReturnValue({ iconIndex: 99 });
      const layoutSpec = {
        slotX: vi.fn()
          .mockReturnValue(40),
        negativeRowY: vi.fn()
          .mockReturnValue(10),
        positiveRowY: vi.fn()
          .mockReturnValue(50),
      };

      // Act
      presenter.render(battler, layoutSpec);

      // Assert
      const iconKeys = [ ...spriteCache.keys() ].filter(key => key.startsWith('affliction-icon-'));
      expect(iconKeys).toHaveLength(2);
      expect(layoutSpec.negativeRowY).toHaveBeenCalled();
      expect(layoutSpec.positiveRowY).toHaveBeenCalled();
    });

    it('hides every sprite belonging to the previous battler when the target switches', () =>
    {
      // Arrange
      const previousBattler = { getUuid: () => 'uuid-old' };
      const staleIconSprite = new globalThis.Sprite_Icon(1);
      staleIconSprite.show();
      spriteCache.set('affliction-icon-1-uuid-old', staleIconSprite);
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);
      const emptyCollection = new StateAfflictionCollection();
      globalThis.StateAfflictionProvider.collectForBattler.mockReturnValue(emptyCollection);

      // render once against the previous battler to seed #lastBattler.
      presenter.render(previousBattler, { slotX: vi.fn(), negativeRowY: vi.fn(), positiveRowY: vi.fn() });

      // Act
      presenter.render(battler, { slotX: vi.fn(), negativeRowY: vi.fn(), positiveRowY: vi.fn() });

      // Assert
      expect(staleIconSprite.visible).toEqual(false);
    });
  });

  describe('hideStaleSlots', () =>
  {
    it('hides a cached slot whose state id is no longer active', () =>
    {
      // Arrange
      const staleSprite = new globalThis.Sprite_Icon(1);
      staleSprite.show();
      spriteCache.set('affliction-icon-5-uuid-1', staleSprite);
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);
      const collection = new StateAfflictionCollection();

      // Act
      presenter.hideStaleSlots(battler, collection);

      // Assert
      expect(staleSprite.visible).toEqual(false);
    });

    it('leaves a cached slot alone when its state id is still active', () =>
    {
      // Arrange
      const activeSprite = new globalThis.Sprite_Icon(1);
      activeSprite.show();
      spriteCache.set('affliction-icon-5-uuid-1', activeSprite);
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);
      const collection = new StateAfflictionCollection();
      collection.negative = [ makeViewModel({ stateId: 5 }) ];

      // Act
      presenter.hideStaleSlots(battler, collection);

      // Assert
      expect(activeSprite.visible).toEqual(true);
    });

    it('ignores sprite-cache keys that do not belong to any affliction slot', () =>
    {
      // Arrange
      const unrelatedSprite = new globalThis.Sprite_Icon(1);
      unrelatedSprite.show();
      spriteCache.set('some-other-sprite-key', unrelatedSprite);
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);
      const collection = new StateAfflictionCollection();

      // Act
      presenter.hideStaleSlots(battler, collection);

      // Assert
      expect(unrelatedSprite.visible).toEqual(true);
    });

    it('hides tracked-but-expired JABS states when the provider can collect', () =>
    {
      // Arrange
      globalThis.StateAfflictionProvider.canCollect.mockReturnValue(true);
      const expiredSprite = new globalThis.Sprite_Icon(1);
      expiredSprite.show();
      spriteCache.set('affliction-icon-7-uuid-1', expiredSprite);
      const trackedStatesMap = new Map([ [ 7, { stateId: 7, expired: true } ] ]);
      globalThis.$jabsEngine.getJabsStatesByUuid.mockReturnValue(trackedStatesMap);
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);
      const collection = new StateAfflictionCollection();
      collection.negative = [ makeViewModel({ stateId: 7 }) ];

      // Act
      presenter.hideStaleSlots(battler, collection);

      // Assert
      expect(expiredSprite.visible).toEqual(false);
    });

    it('does not hide tracked JABS states that have not expired', () =>
    {
      // Arrange
      globalThis.StateAfflictionProvider.canCollect.mockReturnValue(true);
      const activeSprite = new globalThis.Sprite_Icon(1);
      activeSprite.show();
      spriteCache.set('affliction-icon-7-uuid-1', activeSprite);
      const trackedStatesMap = new Map([ [ 7, { stateId: 7, expired: false } ] ]);
      globalThis.$jabsEngine.getJabsStatesByUuid.mockReturnValue(trackedStatesMap);
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);
      const collection = new StateAfflictionCollection();
      collection.negative = [ makeViewModel({ stateId: 7 }) ];

      // Act
      presenter.hideStaleSlots(battler, collection);

      // Assert
      expect(activeSprite.visible).toEqual(true);
    });
  });

  describe('parseCachedStateId (static)', () =>
  {
    it('parses a valid icon key belonging to the given uuid', () =>
    {
      // Arrange/Act
      const result = StateAfflictionHudPresenter.parseCachedStateId('affliction-icon-12-uuid-1', 'uuid-1');

      // Assert
      expect(result).toEqual(12);
    });

    it('parses a valid timer key belonging to the given uuid', () =>
    {
      // Arrange/Act
      const result = StateAfflictionHudPresenter.parseCachedStateId('affliction-timer-12-uuid-1', 'uuid-1');

      // Assert
      expect(result).toEqual(12);
    });

    it('parses a valid stack key belonging to the given uuid', () =>
    {
      // Arrange/Act
      const result = StateAfflictionHudPresenter.parseCachedStateId('affliction-stack-12-uuid-1', 'uuid-1');

      // Assert
      expect(result).toEqual(12);
    });

    it('returns null for a key with an unrecognized prefix', () =>
    {
      // Arrange/Act
      const result = StateAfflictionHudPresenter.parseCachedStateId('something-else-12-uuid-1', 'uuid-1');

      // Assert
      expect(result).toEqual(null);
    });

    it('returns null for a key belonging to a different battler uuid', () =>
    {
      // Arrange/Act
      const result = StateAfflictionHudPresenter.parseCachedStateId('affliction-icon-12-uuid-2', 'uuid-1');

      // Assert
      expect(result).toEqual(null);
    });

    it('returns null when the parsed middle segment is not a finite number', () =>
    {
      // Arrange/Act
      const result = StateAfflictionHudPresenter.parseCachedStateId('affliction-icon-abc-uuid-1', 'uuid-1');

      // Assert
      expect(result).toEqual(null);
    });
  });

  describe('renderSlot', () =>
  {
    it('shows a timer sprite with a formatted seconds string for a non-eternal affliction', () =>
    {
      // Arrange
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);
      const viewModel = makeViewModel({ stateId: 1, durationFrames: 150, isEternal: false });
      battler.state.mockReturnValue({ iconIndex: 5 });

      // Act
      presenter.renderSlot(battler, viewModel, 0, 0);

      // Assert
      const timerSprite = spriteCache.get('affliction-timer-1-uuid-1');
      expect(timerSprite.text).toEqual('2.5');
      expect(timerSprite.visible).toEqual(true);
    });

    it('hides the timer sprite with empty text for an eternal affliction', () =>
    {
      // Arrange
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);
      const viewModel = makeViewModel({ stateId: 1, isEternal: true });
      battler.state.mockReturnValue({ iconIndex: 5 });

      // Act
      presenter.renderSlot(battler, viewModel, 0, 0);

      // Assert
      const timerSprite = spriteCache.get('affliction-timer-1-uuid-1');
      expect(timerSprite.text).toEqual(String.empty);
      expect(timerSprite.visible).toEqual(false);
    });

    it('falls back to icon index 0 when the battler has no matching state', () =>
    {
      // Arrange
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);
      const viewModel = makeViewModel({ stateId: 1 });
      battler.state.mockReturnValue(null);

      // Act
      presenter.renderSlot(battler, viewModel, 0, 0);

      // Assert
      const iconSprite = spriteCache.get('affliction-icon-1-uuid-1');
      expect(iconSprite.iconIndex).toEqual(0);
    });

    it('shows a stack sprite with the count when stacked more than once', () =>
    {
      // Arrange
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);
      const viewModel = makeViewModel({ stateId: 1, stackCount: 3 });
      battler.state.mockReturnValue({ iconIndex: 5 });

      // Act
      presenter.renderSlot(battler, viewModel, 0, 100);

      // Assert
      const stackSprite = spriteCache.get('affliction-stack-1-uuid-1');
      expect(stackSprite.text).toEqual('x3');
      expect(stackSprite.visible).toEqual(true);
      expect(stackSprite.y).toEqual(100 - globalThis.ImageManager.iconHeight);
    });

    it('hides the stack sprite with empty text when not stacked', () =>
    {
      // Arrange
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);
      const viewModel = makeViewModel({ stateId: 1, stackCount: 1 });
      battler.state.mockReturnValue({ iconIndex: 5 });

      // Act
      presenter.renderSlot(battler, viewModel, 0, 0);

      // Assert
      const stackSprite = spriteCache.get('affliction-stack-1-uuid-1');
      expect(stackSprite.text).toEqual(String.empty);
      expect(stackSprite.visible).toEqual(false);
    });
  });

  describe('hideSlotSprites', () =>
  {
    it('hides only the sprites present in the cache for the given state id', () =>
    {
      // Arrange
      const identity = StateAfflictionBattlerIdentity.fromBattler(battler);
      const iconSprite = new globalThis.Sprite_Icon(1);
      iconSprite.show();
      spriteCache.set(identity.buildIconKey(9), iconSprite);
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);

      // Act
      presenter.hideSlotSprites(identity, 9);

      // Assert
      expect(iconSprite.visible).toEqual(false);
    });

    it('does nothing when no sprites for the state id are cached', () =>
    {
      // Arrange
      const identity = StateAfflictionBattlerIdentity.fromBattler(battler);
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);

      // Act/Assert (no throw)
      expect(() => presenter.hideSlotSprites(identity, 42)).not.toThrow();
    });
  });

  describe('getOrCreateIconSprite', () =>
  {
    it('creates, caches, and parents a new icon sprite when none is cached', () =>
    {
      // Arrange
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);

      // Act
      const sprite = presenter.getOrCreateIconSprite(battler, 3, 77);

      // Assert
      expect(sprite.iconIndex).toEqual(77);
      expect(spriteCache.get('affliction-icon-3-uuid-1')).toBe(sprite);
      expect(hostWindow.addChild).toHaveBeenCalledWith(sprite);
      expect(sprite.visible).toEqual(false);
    });

    it('reuses and updates the icon index of a cached icon sprite', () =>
    {
      // Arrange
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);
      const firstSprite = presenter.getOrCreateIconSprite(battler, 3, 77);
      hostWindow.addChild.mockClear();

      // Act
      const secondSprite = presenter.getOrCreateIconSprite(battler, 3, 88);

      // Assert
      expect(secondSprite).toBe(firstSprite);
      expect(secondSprite.iconIndex).toEqual(88);
      expect(hostWindow.addChild).not.toHaveBeenCalled();
    });
  });

  describe('getOrCreateTimerSprite', () =>
  {
    it('creates, configures, caches, and parents a new timer sprite when none is cached', () =>
    {
      // Arrange
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);

      // Act
      const sprite = presenter.getOrCreateTimerSprite(battler, 3);

      // Assert
      expect(spriteCache.get('affliction-timer-3-uuid-1')).toBe(sprite);
      expect(hostWindow.addChild).toHaveBeenCalledWith(sprite);
      expect(sprite.setFontFace).toHaveBeenCalledWith('rmmz-numbers');
      expect(sprite.setFontSize).toHaveBeenCalledWith(20);
      expect(sprite.setAlignment).toHaveBeenCalledWith(globalThis.Sprite_BaseText.Alignments.Center);
      expect(sprite.setMinWidth).toHaveBeenCalledWith(globalThis.ImageManager.iconWidth);
    });

    it('reuses a cached timer sprite without reconfiguring it', () =>
    {
      // Arrange
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);
      const firstSprite = presenter.getOrCreateTimerSprite(battler, 3);
      firstSprite.setFontFace.mockClear();
      hostWindow.addChild.mockClear();

      // Act
      const secondSprite = presenter.getOrCreateTimerSprite(battler, 3);

      // Assert
      expect(secondSprite).toBe(firstSprite);
      expect(secondSprite.setFontFace).not.toHaveBeenCalled();
      expect(hostWindow.addChild).not.toHaveBeenCalled();
    });
  });

  describe('getOrCreateStackSprite', () =>
  {
    it('creates, configures, caches, and parents a new stack sprite when none is cached', () =>
    {
      // Arrange
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);

      // Act
      const sprite = presenter.getOrCreateStackSprite(battler, 3);

      // Assert
      expect(spriteCache.get('affliction-stack-3-uuid-1')).toBe(sprite);
      expect(hostWindow.addChild).toHaveBeenCalledWith(sprite);
      expect(sprite.setFontSize).toHaveBeenCalledWith(22);
    });

    it('reuses a cached stack sprite without reconfiguring it', () =>
    {
      // Arrange
      const presenter = new StateAfflictionHudPresenter(hostWindow, spriteCache);
      const firstSprite = presenter.getOrCreateStackSprite(battler, 3);
      firstSprite.setFontSize.mockClear();
      hostWindow.addChild.mockClear();

      // Act
      const secondSprite = presenter.getOrCreateStackSprite(battler, 3);

      // Assert
      expect(secondSprite).toBe(firstSprite);
      expect(secondSprite.setFontSize).not.toHaveBeenCalled();
      expect(hostWindow.addChild).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/hud/core/presenters/state-affliction-hud-presenter.test.js
