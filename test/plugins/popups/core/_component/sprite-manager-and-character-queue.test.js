//region plugins/popups/core/_component/sprite-manager-and-character-queue.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPopupsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPopups,
} from '../../_component/fixtures/install-popups-host-globals.js';

/**
 * Sprite_MapDamage drags in the whole Sprite/Bitmap chain, which is UI rather than logic. Stubbing it
 * keeps this file about the conversion *decisions* the manager makes.
 */
vi.mock('../../../../../src/plugins/popups/core/sprites/Sprite_MapDamage.js', () => ({
  default: class Sprite_MapDamage
  {
    constructor()
    {
      this._j = { _popups: {} };
      this.duration = 0;
      this.icons = [];
      this.criticalApplied = false;
      this.released = false;
      this.repositioned = false;
    }

    setXVariance(value)
    {
      this.xVariance = value;
    }

    setYVariance(value)
    {
      this.yVariance = value;
    }

    addIcon(iconIndex)
    {
      this.icons.push(iconIndex);
    }

    addDuration(value)
    {
      this.duration += value;
    }

    setHealingFlag(value)
    {
      this.healingFlag = value;
    }

    setDamageFlag(value)
    {
      this.damageFlag = value;
    }

    setDamageColor(value)
    {
      this.damageColor = value;
    }

    setupCriticalEffect()
    {
      this.criticalApplied = true;
    }

    createValue(value)
    {
      this.createdValue = value;
    }

    repositionChildren()
    {
      this.repositioned = true;
    }

    releaseAccumulatePhase()
    {
      this.released = true;
    }
  },
}));

describe('popups core sprite conversion and character queueing (direct src import)', () =>
{
  let TextPopSpriteManager;
  let PopupNumericDisplay;
  let TextPopBuilder;
  let Map_TextPop;
  let PopupLayoutHelper;

  beforeAll(async () =>
  {
    installPopupsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.J_EventEmitter } = await import('../../../../../src/plugins/_base/models/J_EventEmitter.js'));

    setPluginContextToJPopups();
    await import('../../../../../src/plugins/popups/core/_metadata/initialization.js');

    ({ default: Map_TextPop } = await import('../../../../../src/plugins/popups/core/_models/Map_TextPop.js'));
    ({ default: TextPopBuilder } = await import('../../../../../src/plugins/popups/core/_models/TextPopBuilder.js'));
    ({ default: PopupLayoutHelper } = await import('../../../../../src/plugins/popups/core/helpers/PopupLayoutHelper.js'));
    ({ default: PopupNumericDisplay } = await import('../../../../../src/plugins/popups/core/helpers/PopupNumericDisplay.js'));
    ({ default: TextPopSpriteManager } = await import('../../../../../src/plugins/popups/core/_models/TextPopSpriteManager.js'));

    globalThis.PopupLayoutHelper = PopupLayoutHelper;
  });

  describe('TextPopSpriteManager.convert', () =>
  {
    it('refuses to be constructed, being a static class', () =>
    {
      // Arrange & Act & Assert- the throw is the documentation; there is no instance state to hold.
      expect(() => new TextPopSpriteManager()).toThrow(/static class/);
    });

    it('folds the ring offset into the sprite variance', () =>
    {
      // Arrange- the ring offset is what separates simultaneous popups; losing it would stack them.
      const popup = new TextPopBuilder(10).setCoordinateVariance(3, 4)
        .build();

      // Act
      const sprite = TextPopSpriteManager.convert(popup, { x: 10, y: 20 });

      // Assert
      expect(sprite.xVariance).toBe(13);
      expect(sprite.yVariance).toBe(24);
    });

    it('defaults the ring offset to nothing when none is supplied', () =>
    {
      // Arrange
      const popup = new TextPopBuilder(10).setCoordinateVariance(3, 4)
        .build();

      // Act
      const sprite = TextPopSpriteManager.convert(popup);

      // Assert
      expect(sprite.xVariance).toBe(3);
      expect(sprite.yVariance).toBe(4);
    });

    it('tolerates a partially-specified ring offset', () =>
    {
      // Arrange- rings that only move along one axis pass a single component.
      const popup = new TextPopBuilder(10).setCoordinateVariance(3, 4)
        .build();

      // Act
      const sprite = TextPopSpriteManager.convert(popup, { y: 20 });

      // Assert
      expect(sprite.xVariance).toBe(3);
      expect(sprite.yVariance).toBe(24);
    });

    it('attaches an icon when the popup carries one', () =>
    {
      // Arrange
      const popup = new TextPopBuilder(10).setIconIndex(64)
        .build();

      // Act
      const sprite = TextPopSpriteManager.convert(popup);

      // Assert
      expect(sprite.icons).toEqual([ 64 ]);
    });

    it('attaches no icon when the popup opts out with a negative index', () =>
    {
      // Arrange- an index of -1 is the "no icon" sentinel; passing it through to addIcon would draw
      // whatever sits at the end of the icon sheet.
      const popup = new TextPopBuilder(10).setIconIndex(-1)
        .build();

      // Act
      const sprite = TextPopSpriteManager.convert(popup);

      // Assert
      expect(sprite.icons).toEqual([]);
    });

    it('applies the critical treatment only to critical popups', () =>
    {
      // Arrange
      const critical = new TextPopBuilder(10).setCritical(true)
        .build();
      const ordinary = new TextPopBuilder(10).build();

      // Act
      const criticalSprite = TextPopSpriteManager.convert(critical);
      const ordinarySprite = TextPopSpriteManager.convert(ordinary);

      // Assert
      expect(criticalSprite.criticalApplied).toBe(true);
      expect(ordinarySprite.criticalApplied).toBe(false);
    });

    it('marks resource damage with the damage flag', () =>
    {
      // Arrange & Act
      const sprite = TextPopSpriteManager.convert(new TextPopBuilder(10).isHpDamage()
        .build());

      // Assert
      expect(sprite.damageFlag).toBe(true);
    });

    it('does not mark a reward popup with the damage flag', () =>
    {
      // Arrange & Act- rewards share the popup pipeline but are not hits.
      const sprite = TextPopSpriteManager.convert(new TextPopBuilder(10).isExperience()
        .build());

      // Assert
      expect(sprite.damageFlag).toBe(false);
    });

    const durationCases = [
      [ 'isHpDamage', 30 ],
      [ 'isExperience', 30 ],
      [ 'isGold', 30 ],
      [ 'isSdpPoints', 30 ],
      [ 'isLoot', 30 ],
      [ 'isLevelUp', 90 ],
    ];

    for (const [ preset, expectedDuration ] of durationCases)
    {
      it(`gives a ${preset} popup a ${expectedDuration}-frame duration bonus`, () =>
      {
        // Arrange & Act- rarer, more important popups linger longer so the player can read them.
        const sprite = TextPopSpriteManager.convert(new TextPopBuilder(10)[preset]().build());

        // Assert
        expect(sprite.duration).toBe(expectedDuration);
      });
    }

    const sharedDurationTypes = [
      [ 'MpDamage', 30 ],
      [ 'TpDamage', 30 ],
      [ 'Parry', 0 ],
      [ 'Slip', 0 ],
    ];

    for (const [ typeName, expectedDuration ] of sharedDurationTypes)
    {
      it(`gives a ${typeName} popup a ${expectedDuration}-frame duration bonus`, () =>
      {
        // Arrange- these share a switch arm with types covered above, but each case label is its own
        // decision point: a mis-grouped label would silently give the wrong on-screen lifetime.
        const popup = new TextPopBuilder(10).build();
        popup.popupType = Map_TextPop.Types[typeName];

        // Act
        const sprite = TextPopSpriteManager.convert(popup);

        // Assert
        expect(sprite.duration).toBe(expectedDuration);
      });
    }

    it('gives a skill-learned popup a longer duration than ordinary damage', () =>
    {
      // Arrange & Act
      const sprite = TextPopSpriteManager.convert(new TextPopBuilder('Fireball').isSkillLearned(1)
        .build());

      // Assert
      expect(sprite.duration).toBe(60);
    });

    it('gives a skill-usage popup no duration bonus at all', () =>
    {
      // Arrange & Act- these fire constantly, so any bonus would clutter the screen.
      const sprite = TextPopSpriteManager.convert(new TextPopBuilder('Fireball').isSkillUsed(1)
        .build());

      // Assert
      expect(sprite.duration).toBe(0);
    });

    it('gives an unrecognised popup type no duration bonus', () =>
    {
      // Arrange- the default arm of the switch keeps an unknown type from producing NaN.
      const popup = new TextPopBuilder(10).build();
      popup.popupType = 'not-a-real-type';

      // Act
      const sprite = TextPopSpriteManager.convert(popup);

      // Assert
      expect(sprite.duration).toBe(0);
    });

    it('releases the motion phase immediately for a discrete popup', () =>
    {
      // Arrange & Act
      const sprite = TextPopSpriteManager.convert(new TextPopBuilder(10).build());

      // Assert
      expect(sprite.released).toBe(true);
    });

    it('holds the motion phase for a merge-driven popup', () =>
    {
      // Arrange- accumulating popups wait for their flush rather than animating per contribution.
      const popup = new TextPopBuilder(10).setJInstantRelease(false)
        .build();

      // Act
      const sprite = TextPopSpriteManager.convert(popup);

      // Assert
      expect(sprite.released).toBe(false);
    });

    it('carries the text accent and source model onto the sprite', () =>
    {
      // Arrange- downstream merge logic reads the source model back off the sprite.
      const popup = new TextPopBuilder(10).setTextAccent('outline')
        .build();

      // Act
      const sprite = TextPopSpriteManager.convert(popup);

      // Assert
      expect(sprite._j._popups._textAccent).toBe('outline');
      expect(sprite._j._popups._sourcePopup).toBe(popup);
    });

    it('stores a null accent when the popup declares none', () =>
    {
      // Arrange & Act
      const sprite = TextPopSpriteManager.convert(new TextPopBuilder(10).build());

      // Assert
      expect(sprite._j._popups._textAccent).toBe(null);
    });

    it('renders an empty popup value as the empty-string sentinel', () =>
    {
      // Arrange- a blank label is legitimate (an icon-only popup), and the model normalises it to
      // String.empty rather than leaving a falsy value that later string work would choke on.
      const popup = new TextPopBuilder('').build();

      // Act
      const sprite = TextPopSpriteManager.convert(popup);

      // Assert
      expect(popup.value).toBe(String.empty);
      expect(sprite.createdValue).toBe(String.empty);
    });
  });

  describe('PopupNumericDisplay.formatNumericPopupDisplayString', () =>
  {
    it('rounds a numeric label to a whole number', () =>
    {
      // Arrange & Act- merged strike totals accumulate float dust that must not reach the screen.
      const result = PopupNumericDisplay.formatNumericPopupDisplayString('12.0000001');

      // Assert
      expect(result).toBe('12');
    });

    it('renders a healing label as a signed magnitude', () =>
    {
      // Arrange & Act- merge refreshes bypass the builder's minus strip, so the sign is applied here.
      const result = PopupNumericDisplay.formatNumericPopupDisplayString('-42', true);

      // Assert
      expect(result).toBe('+42');
    });

    it('leaves prose untouched', () =>
    {
      // Arrange & Act- mitigation stacks and item names must survive verbatim.
      const result = PopupNumericDisplay.formatNumericPopupDisplayString('PARRY x3');

      // Assert
      expect(result).toBe('PARRY x3');
    });

    it('returns an empty string unchanged', () =>
    {
      // Arrange & Act
      const result = PopupNumericDisplay.formatNumericPopupDisplayString('');

      // Assert
      expect(result).toBe('');
    });

    it('returns a whitespace-only string unchanged', () =>
    {
      // Arrange- trimming to nothing is the same "no content" case as an empty string.
      // Act
      const result = PopupNumericDisplay.formatNumericPopupDisplayString('   ');

      // Assert
      expect(result).toBe('   ');
    });

    it('returns an undefined value as an empty string', () =>
    {
      // Arrange & Act
      const result = PopupNumericDisplay.formatNumericPopupDisplayString(undefined);

      // Assert
      expect(result).toBe('');
    });

    it('returns a null value as an empty string', () =>
    {
      // Arrange & Act
      const result = PopupNumericDisplay.formatNumericPopupDisplayString(null);

      // Assert
      expect(result).toBe('');
    });

    it('returns a label that looks numeric but is not finite unchanged', () =>
    {
      // Arrange- a string of only dots and dashes passes the character test but parses to NaN.
      // Act
      const result = PopupNumericDisplay.formatNumericPopupDisplayString('--');

      // Assert
      expect(result).toBe('--');
    });

    it('accepts a real number rather than only a string', () =>
    {
      // Arrange & Act
      const result = PopupNumericDisplay.formatNumericPopupDisplayString(7.6);

      // Assert
      expect(result).toBe('8');
    });
  });

  describe('popup lifecycle events', () =>
  {
    let emitSpy;

    beforeEach(() =>
    {
      emitSpy = vi.spyOn(globalThis.J.POPUPS.Helpers.PopupEmitter, 'emit');
    });

    afterEach(() =>
    {
      emitSpy.mockRestore();
    });

    it('announces a spawned popup sprite to subscribers', () =>
    {
      // Arrange- extensions hook these to decorate or track popups without patching the core.
      const character = {};
      const popup = new TextPopBuilder(1).build();
      const sprite = {};

      // Act
      globalThis.J.POPUPS.notifyPopupSpriteSpawned(character, popup, sprite);

      // Assert
      expect(emitSpy).toHaveBeenCalledWith(
        globalThis.J.POPUPS.EventNames.SpriteSpawned,
        { character, popup, sprite });
    });

    it('announces a finished popup sprite to subscribers', () =>
    {
      // Arrange
      const character = {};
      const popup = new TextPopBuilder(1).build();
      const sprite = {};

      // Act
      globalThis.J.POPUPS.notifyPopupSpriteFinished(character, popup, sprite);

      // Assert
      expect(emitSpy).toHaveBeenCalledWith(
        globalThis.J.POPUPS.EventNames.SpriteFinished,
        { character, popup, sprite });
    });

    it('announces a cleared combo chain to subscribers', () =>
    {
      // Arrange
      const jabsBattler = {};

      // Act
      globalThis.J.POPUPS.notifyComboChainCleared(jabsBattler, 'mainhand');

      // Assert
      expect(emitSpy).toHaveBeenCalledWith(
        globalThis.J.POPUPS.EventNames.ComboChainCleared,
        { jabsBattler, cooldownKey: 'mainhand' });
    });

    it('announces a merge flush request to subscribers', () =>
    {
      // Arrange & Act
      globalThis.J.POPUPS.notifyMergeFlushAll('scene-change');

      // Assert
      expect(emitSpy).toHaveBeenCalledWith(
        globalThis.J.POPUPS.EventNames.MergeFlushAll,
        { reason: 'scene-change' });
    });
  });

  describe('Game_Character popup queue', () =>
  {
    let proto;
    let previousDisablePopups;

    beforeAll(async () =>
    {
      // the character patch reaches PopupLayoutHelper as a bare global, matching the built bundle.
      await import('../../../../../src/plugins/popups/core/objects/Game_Character.js');

      proto = globalThis.Game_Character.prototype;
    });

    beforeEach(() =>
    {
      previousDisablePopups = globalThis.J.POPUPS.Metadata.disablePopups;
    });

    afterEach(() =>
    {
      globalThis.J.POPUPS.Metadata.disablePopups = previousDisablePopups;
    });

    /**
     * Builds a character stand-in with an initialized popup queue.
     * @returns {object}
     */
    const buildCharacter = () => Object.assign(Object.create(proto), {
      _j: { _textPops: [], _textPopRequest: false },
    });

    it('queues a valid popup', () =>
    {
      // Arrange
      globalThis.J.POPUPS.Metadata.disablePopups = false;
      const character = buildCharacter();
      const popup = new TextPopBuilder(10).isHpDamage()
        .build();

      // Act
      proto.addTextPop.call(character, popup);

      // Assert
      expect(character._j._textPops).toEqual([ popup ]);
    });

    it('queues nothing while popups are disabled', () =>
    {
      // Arrange- the kill switch has to short-circuit before any validation or emission work.
      globalThis.J.POPUPS.Metadata.disablePopups = true;
      const character = buildCharacter();

      // Act
      proto.addTextPop.call(character, new TextPopBuilder(10).build());

      // Assert
      expect(character._j._textPops).toEqual([]);
    });

    it('rejects and warns about a malformed popup', () =>
    {
      // Arrange- a hand-rolled object would fail much later inside the sprite pipeline, so it is
      // refused at the queue boundary with a diagnostic instead.
      globalThis.J.POPUPS.Metadata.disablePopups = false;
      const warnSpy = vi.spyOn(console, 'warn')
        .mockImplementation(() =>
        {
        });
      const character = buildCharacter();

      // Act
      proto.addTextPop.call(character, { layoutRing: Map_TextPop.LayoutRings.EnemyDamage });

      // Assert
      expect(character._j._textPops).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('reads back everything currently queued', () =>
    {
      // Arrange
      const character = buildCharacter();
      const popup = new TextPopBuilder(10).build();
      character._j._textPops.push(popup);

      // Act & Assert
      expect(proto.getTextPops.call(character)).toEqual([ popup ]);
    });

    it('empties the queue in place rather than replacing the array', () =>
    {
      // Arrange- the sprite layer holds a reference to this same array, so reassigning it would
      // leave that layer pointed at stale contents.
      const character = buildCharacter();
      const queue = character._j._textPops;
      queue.push(new TextPopBuilder(10).build());

      // Act
      proto.emptyDamagePops.call(character);

      // Assert
      expect(character._j._textPops).toBe(queue);
      expect(queue).toHaveLength(0);
    });

    it('clears the queue through the preferred alias too', () =>
    {
      // Arrange
      const character = buildCharacter();
      character._j._textPops.push(new TextPopBuilder(10).build());

      // Act
      proto.clearPendingTextPops.call(character);

      // Assert
      expect(character._j._textPops).toHaveLength(0);
    });
  });
});
//endregion plugins/popups/core/_component/sprite-manager-and-character-queue.test.js
