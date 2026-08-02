//region plugins/popups/core/helpers/popup-layout-helper.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  installPopupsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPopups,
} from '../../_component/fixtures/install-popups-host-globals.js';

describe('PopupLayoutHelper (direct src import)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/popups/core/helpers/PopupLayoutHelper.js').default} */
  let PopupLayoutHelper;
  /** @type {typeof import('../../../../../src/plugins/popups/core/_models/Map_TextPop.js').default} */
  let Map_TextPop;
  /** @type {typeof import('../../../../../src/plugins/popups/core/_models/TextPopBuilder.js').default} */
  let TextPopBuilder;

  beforeAll(async () =>
  {
    installPopupsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    // the popups bootstrap constructs a J_EventEmitter as a bare global, the way the concatenated
    // plugin bundle sees it after vite stitches J-Base and J-Popups together.
    ({ default: globalThis.J_EventEmitter } = await import('../../../../../src/plugins/_base/core/models/J_EventEmitter.js'));

    // the ring layout table is built at module-evaluation time from J.POPUPS.Layout, so the parent
    // plugin's own configuration has to be in place before the helper is imported.
    setPluginContextToJPopups();
    await import('../../../../../src/plugins/popups/core/_metadata/initialization.js');

    ({ default: Map_TextPop } = await import('../../../../../src/plugins/popups/core/_models/Map_TextPop.js'));
    ({ default: TextPopBuilder } = await import('../../../../../src/plugins/popups/core/_models/TextPopBuilder.js'));
    ({ default: PopupLayoutHelper } = await import('../../../../../src/plugins/popups/core/helpers/PopupLayoutHelper.js'));
  });

  let previousGraphics;

  beforeEach(() =>
  {
    previousGraphics = globalThis.Graphics;

    // ring slot rotation is driven by the frame clock; pinning it makes stacking deterministic.
    globalThis.Graphics = { ...previousGraphics, frameCount: 1000 };
  });

  afterEach(() =>
  {
    globalThis.Graphics = previousGraphics;
  });

  describe('initializeRingLayouts', () =>
  {
    it('builds a layout spec for every stacking ring', () =>
    {
      // Arrange & Act- the centre-focus ring deliberately has no spec, since it never stacks.
      const { RingLayout } = PopupLayoutHelper;

      // Assert
      expect(RingLayout[Map_TextPop.LayoutRings.EnemyDamage]).toBeDefined();
      expect(RingLayout[Map_TextPop.LayoutRings.IncomingHeal]).toBeDefined();
      expect(RingLayout[Map_TextPop.LayoutRings.SlipDamage]).toBeDefined();
      expect(RingLayout[Map_TextPop.LayoutRings.Regen]).toBeDefined();
      expect(RingLayout[Map_TextPop.LayoutRings.RewardUp]).toBeDefined();
      expect(RingLayout[Map_TextPop.LayoutRings.LootDown]).toBeDefined();
      expect(RingLayout[Map_TextPop.LayoutRings.CenterFocus]).toBeUndefined();
    });

    it('mirrors damage and heal rings across the anchor', () =>
    {
      // Arrange & Act- damage drifts right, healing drifts left, so the two never overlap.
      const damage = PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.EnemyDamage];
      const heal = PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.IncomingHeal];

      // Assert
      expect(damage.baseX).toBe(24);
      expect(heal.baseX).toBe(-24);
      expect(damage.stepX).toBe(-heal.stepX);
    });

    it('gives the loot ring more slots than the reward ring', () =>
    {
      // Arrange & Act- a single kill can drop many items but grants only a few reward lines.
      const reward = PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.RewardUp];
      const loot = PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.LootDown];

      // Assert
      expect(reward.slotCount).toBe(10);
      expect(loot.slotCount).toBe(12);
    });
  });

  describe('resolvePopupLayout', () =>
  {
    it('reports the centre-focus ring as non-stacking', () =>
    {
      // Arrange & Act- centre-focus popups sit on the character and use variance alone.
      const resolved = PopupLayoutHelper.resolvePopupLayout({ layoutRing: Map_TextPop.LayoutRings.CenterFocus });

      // Assert
      expect(resolved).toEqual({ usesRing: false, ring: Map_TextPop.LayoutRings.CenterFocus });
    });

    it('reports any other ring as stacking', () =>
    {
      // Arrange & Act
      const resolved = PopupLayoutHelper.resolvePopupLayout({ layoutRing: Map_TextPop.LayoutRings.EnemyDamage });

      // Assert
      expect(resolved).toEqual({ usesRing: true, ring: Map_TextPop.LayoutRings.EnemyDamage });
    });
  });

  describe('consumeLayoutRingOffset', () =>
  {
    it('returns no offset for a non-stacking ring', () =>
    {
      // Arrange & Act
      const offset = PopupLayoutHelper.consumeLayoutRingOffset({}, Map_TextPop.LayoutRings.CenterFocus);

      // Assert
      expect(offset).toEqual({ x: 0, y: 0 });
    });

    it('returns no offset for a ring with no layout spec', () =>
    {
      // Arrange- an unknown ring id must degrade to "no offset" rather than reading undefined fields.
      // Act
      const offset = PopupLayoutHelper.consumeLayoutRingOffset({}, 'not-a-real-ring');

      // Assert
      expect(offset).toEqual({ x: 0, y: 0 });
    });

    it('places the first popup of a ring at the ring base position', () =>
    {
      // Arrange- slot index 0 contributes no step, leaving just the base offset.
      const character = {};

      // Act
      const offset = PopupLayoutHelper.consumeLayoutRingOffset(character, Map_TextPop.LayoutRings.EnemyDamage);

      // Assert
      expect(offset).toEqual({ x: 24, y: 24 });
    });

    it('staggers each successive popup by one step', () =>
    {
      // Arrange- this is the whole point of rings: two hits in the same frame must not draw on top
      // of each other.
      const character = {};

      // Act
      PopupLayoutHelper.consumeLayoutRingOffset(character, Map_TextPop.LayoutRings.EnemyDamage);
      const second = PopupLayoutHelper.consumeLayoutRingOffset(character, Map_TextPop.LayoutRings.EnemyDamage);

      // Assert
      const spec = PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.EnemyDamage];
      expect(second).toEqual({ x: 24 + spec.stepX, y: 24 + spec.stepY });
    });

    it('wraps back to the first slot once the ring is full', () =>
    {
      // Arrange- eight slots means the ninth popup reuses the first position.
      const character = {};
      const spec = PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.EnemyDamage];

      // Act
      for (let i = 0; i < spec.slotCount; i++)
      {
        PopupLayoutHelper.consumeLayoutRingOffset(character, Map_TextPop.LayoutRings.EnemyDamage);
      }
      const wrapped = PopupLayoutHelper.consumeLayoutRingOffset(character, Map_TextPop.LayoutRings.EnemyDamage);

      // Assert
      expect(wrapped).toEqual({ x: 24, y: 24 });
    });

    it('keeps separate slot counters per character', () =>
    {
      // Arrange- two enemies struck at once must each start their own ring rather than sharing one.
      const first = {};
      const second = {};

      // Act
      PopupLayoutHelper.consumeLayoutRingOffset(first, Map_TextPop.LayoutRings.EnemyDamage);
      const secondCharacterOffset =
        PopupLayoutHelper.consumeLayoutRingOffset(second, Map_TextPop.LayoutRings.EnemyDamage);

      // Assert
      expect(secondCharacterOffset).toEqual({ x: 24, y: 24 });
    });

    it('keeps separate slot counters per ring on one character', () =>
    {
      // Arrange- taking damage should not advance the reward ring's stacking.
      const character = {};

      // Act
      PopupLayoutHelper.consumeLayoutRingOffset(character, Map_TextPop.LayoutRings.EnemyDamage);
      const rewardOffset = PopupLayoutHelper.consumeLayoutRingOffset(character, Map_TextPop.LayoutRings.RewardUp);

      // Assert
      const spec = PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.RewardUp];
      expect(rewardOffset).toEqual({ x: spec.baseX, y: spec.baseY });
    });

    it('resets the ring after a long enough gap between popups', () =>
    {
      // Arrange- a fresh fight should start stacking from the top again rather than resuming
      // mid-ring from whatever happened minutes ago.
      const character = {};
      PopupLayoutHelper.consumeLayoutRingOffset(character, Map_TextPop.LayoutRings.EnemyDamage);
      PopupLayoutHelper.consumeLayoutRingOffset(character, Map_TextPop.LayoutRings.EnemyDamage);

      // Act
      globalThis.Graphics.frameCount = 1000 + globalThis.J.POPUPS.Layout.ResetDuration + 1;
      const afterGap = PopupLayoutHelper.consumeLayoutRingOffset(character, Map_TextPop.LayoutRings.EnemyDamage);

      // Assert
      expect(afterGap).toEqual({ x: 24, y: 24 });
    });

    it('treats a ring spec with no vertical base as having none', () =>
    {
      // Arrange- every shipped ring declares a non-zero baseY, so this exercises the fallback that
      // keeps a future ring authored without one from producing NaN offsets. Registered and removed
      // inside the test so the shared layout table is left exactly as it was found.
      const customRing = 'test-only-ring';
      PopupLayoutHelper.RingLayout[customRing] = {
        slotCount: 4,
        stepX: 10,
        stepY: 10,
        dirX: 1,
        dirY: 1,
        baseX: 5,
      };

      // Act
      const offset = PopupLayoutHelper.consumeLayoutRingOffset({}, customRing);

      // Assert
      expect(offset).toEqual({ x: 5, y: 0 });

      delete PopupLayoutHelper.RingLayout[customRing];
    });

    it('does not reset the ring for a gap inside the reset window', () =>
    {
      // Arrange- rapid consecutive hits are one burst and must keep stacking.
      const character = {};
      PopupLayoutHelper.consumeLayoutRingOffset(character, Map_TextPop.LayoutRings.EnemyDamage);

      // Act
      globalThis.Graphics.frameCount = 1000 + 1;
      const stillStacking = PopupLayoutHelper.consumeLayoutRingOffset(character, Map_TextPop.LayoutRings.EnemyDamage);

      // Assert
      const spec = PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.EnemyDamage];
      expect(stillStacking).toEqual({ x: 24 + spec.stepX, y: 24 + spec.stepY });
    });
  });

  describe('resolveMotionOffset', () =>
  {
    it('pushes damage to the right of the anchor', () =>
    {
      // Arrange & Act
      const offset = PopupLayoutHelper.resolveMotionOffset({ healing: false, popupType: Map_TextPop.Types.HpDamage });

      // Assert
      expect(offset.x).toBe(globalThis.J.POPUPS.Layout.PaddingX);
    });

    it('pushes healing to the left of the anchor', () =>
    {
      // Arrange & Act- mirroring the direction is what lets a player read heals and hits apart at a
      // glance during a busy fight.
      const offset = PopupLayoutHelper.resolveMotionOffset({ healing: true, popupType: Map_TextPop.Types.MpDamage });

      // Assert
      expect(offset.x).toBe(-globalThis.J.POPUPS.Layout.PaddingX);
    });

    it('lifts an hp heal above the other resource heals', () =>
    {
      // Arrange- hp, mp and tp heals land simultaneously, so each gets its own vertical lane.
      const base = globalThis.J.POPUPS.Layout.VerticalOffset + globalThis.J.POPUPS.Layout.PaddingY;

      // Act
      const offset = PopupLayoutHelper.resolveMotionOffset({ healing: true, popupType: Map_TextPop.Types.HpDamage });

      // Assert
      expect(offset.y).toBe(base - 16);
    });

    it('leaves an mp heal on the middle lane', () =>
    {
      // Arrange
      const base = globalThis.J.POPUPS.Layout.VerticalOffset + globalThis.J.POPUPS.Layout.PaddingY;

      // Act
      const offset = PopupLayoutHelper.resolveMotionOffset({ healing: true, popupType: Map_TextPop.Types.MpDamage });

      // Assert
      expect(offset.y).toBe(base);
    });

    it('drops a tp heal below the other resource heals', () =>
    {
      // Arrange
      const base = globalThis.J.POPUPS.Layout.VerticalOffset + globalThis.J.POPUPS.Layout.PaddingY;

      // Act
      const offset = PopupLayoutHelper.resolveMotionOffset({ healing: true, popupType: Map_TextPop.Types.TpDamage });

      // Assert
      expect(offset.y).toBe(base + 16);
    });

    it('leaves a healing popup of an unrelated type on the middle lane', () =>
    {
      // Arrange- rewards and loot are also "healing" in sign terms but have no resource lane.
      const base = globalThis.J.POPUPS.Layout.VerticalOffset + globalThis.J.POPUPS.Layout.PaddingY;

      // Act
      const offset = PopupLayoutHelper.resolveMotionOffset({ healing: true, popupType: Map_TextPop.Types.Experience });

      // Assert
      expect(offset.y).toBe(base);
    });

    it('applies no resource lane at all to damage popups', () =>
    {
      // Arrange- the lane split exists only on the healing side.
      const base = globalThis.J.POPUPS.Layout.VerticalOffset + globalThis.J.POPUPS.Layout.PaddingY;

      // Act
      const offset = PopupLayoutHelper.resolveMotionOffset({ healing: false, popupType: Map_TextPop.Types.TpDamage });

      // Assert
      expect(offset.y).toBe(base);
    });
  });

  describe('isValidTextPopForQueue', () =>
  {
    it('accepts a properly built popup', () =>
    {
      // Arrange
      const popup = new TextPopBuilder(10).isHpDamage()
        .build();

      // Act & Assert
      expect(PopupLayoutHelper.isValidTextPopForQueue(popup)).toBe(true);
    });

    it('rejects a nullish candidate', () =>
    {
      // Arrange & Act & Assert
      expect(PopupLayoutHelper.isValidTextPopForQueue(null)).toBe(false);
    });

    it('rejects an object that merely looks like a popup', () =>
    {
      // Arrange- the constructor check is what keeps a hand-rolled literal out of the sprite
      // pipeline, where it would fail much later and much less legibly.
      const impostor = { layoutRing: Map_TextPop.LayoutRings.EnemyDamage };

      // Act & Assert
      expect(PopupLayoutHelper.isValidTextPopForQueue(impostor)).toBe(false);
    });

    it('rejects a real popup carrying an unknown layout ring', () =>
    {
      // Arrange- a bad ring would find no layout spec later and silently stack everything at zero.
      const popup = new TextPopBuilder(10).build();
      popup.layoutRing = 'not-a-real-ring';

      // Act & Assert
      expect(PopupLayoutHelper.isValidTextPopForQueue(popup)).toBe(false);
    });
  });
});
//endregion plugins/popups/core/helpers/popup-layout-helper.test.js
