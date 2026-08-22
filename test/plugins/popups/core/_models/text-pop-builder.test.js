//region plugins/popups/core/_models/text-pop-builder.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import {
  installPopupsHostGlobals,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-popups-host-globals.js';

describe('TextPopBuilder (direct src import)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/popups/core/_models/TextPopBuilder.js').default} */
  let TextPopBuilder;
  /** @type {typeof import('../../../../../src/plugins/popups/core/_models/Map_TextPop.js').default} */
  let Map_TextPop;

  beforeAll(async () =>
  {
    installPopupsHostGlobals();

    // the builder leans on `String.empty`, which J-Base installs onto the String constructor.
    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: Map_TextPop } = await import('../../../../../src/plugins/popups/core/_models/Map_TextPop.js'));
    ({ default: TextPopBuilder } = await import('../../../../../src/plugins/popups/core/_models/TextPopBuilder.js'));
  });

  describe('setValue', () =>
  {
    it('rounds a positive fractional value up', () =>
    {
      // Arrange & Act- damage numbers are computed with floats, but a popup reading "12.0000001"
      // would be nonsense on screen.
      const popup = new TextPopBuilder(12.3).build();

      // Assert
      expect(popup.value).toBe('13');
    });

    it('rounds a negative fractional value away from zero', () =>
    {
      // Arrange & Act- healing arrives as a negative number, and flooring keeps the magnitude
      // growing in the same direction as the positive case.
      const popup = new TextPopBuilder(-12.3).build();

      // Assert
      expect(popup.value).toBe('13');
    });

    it('leaves a non-numeric value untouched', () =>
    {
      // Arrange & Act- item names and skill names come through this same builder.
      const popup = new TextPopBuilder('Potion').build();

      // Assert
      expect(popup.value).toBe('Potion');
    });

    it('treats a numeric string as text rather than as a number', () =>
    {
      // Arrange- the numeric check is a strict identity comparison, so '5' is not 5.
      // Act
      const popup = new TextPopBuilder('5').build();

      // Assert
      expect(popup.value).toBe('5');
    });

    it('flags a negative value as healing automatically', () =>
    {
      // Arrange & Act- RMMZ expresses healing as negative damage, so the sign alone determines this.
      const popup = new TextPopBuilder(-50).build();

      // Assert
      expect(popup.healing).toBe(true);
    });

    it('does not flag a positive value as healing', () =>
    {
      // Arrange & Act
      const popup = new TextPopBuilder(50).build();

      // Assert
      expect(popup.healing).toBe(false);
    });

    it('strips the minus sign from the displayed text', () =>
    {
      // Arrange & Act- the sign is conveyed by colour and prefix, not by a leading dash.
      const popup = new TextPopBuilder(-50).isHpDamage()
        .build();

      // Assert
      expect(popup.value).toBe('+50');
    });
  });

  describe('build', () =>
  {
    it('resets the builder so the next popup starts clean', () =>
    {
      // Arrange- the builder is reused across popups, so leftover state would bleed a critical flag
      // or an icon from one popup into the next.
      const builder = new TextPopBuilder(10).setCritical(true)
        .setIconIndex(99)
        .setPrefix('>>')
        .setSuffix('<<');

      // Act
      builder.build();
      const second = builder.setValue(20)
        .build();

      // Assert
      expect(second.critical).toBe(false);
      expect(second.iconIndex).toBe(0);
      expect(second.value).toBe('20');
    });

    it('assembles the display text as prefix, value, then suffix', () =>
    {
      // Arrange & Act
      const popup = new TextPopBuilder(42).setPrefix('[')
        .setSuffix(']')
        .build();

      // Assert
      expect(popup.value).toBe('[42]');
    });

    it('carries the coordinate variance through as a pair', () =>
    {
      // Arrange & Act
      const popup = new TextPopBuilder(1).setCoordinateVariance(5, -7)
        .build();

      // Assert
      expect(popup.coordinateVariance).toEqual([ 5, -7 ]);
    });
  });

  describe('fluent setters', () =>
  {
    it('returns the builder from every setter so calls can be chained', () =>
    {
      // Arrange
      const builder = new TextPopBuilder(1);

      // Act & Assert- a setter that forgot its return would break the whole authoring style.
      expect(builder.setValue(1)).toBe(builder);
      expect(builder.setCritical()).toBe(builder);
      expect(builder.setHealing()).toBe(builder);
      expect(builder.setTextAccent('x')).toBe(builder);
      expect(builder.setIconIndex(1)).toBe(builder);
      expect(builder.setTextColorIndex(1)).toBe(builder);
      expect(builder.setPopupType(Map_TextPop.Types.HpDamage)).toBe(builder);
      expect(builder.setPrefix('a')).toBe(builder);
      expect(builder.setSuffix('b')).toBe(builder);
      expect(builder.setXVariance(1)).toBe(builder);
      expect(builder.setYVariance(1)).toBe(builder);
      expect(builder.setCoordinateVariance(1, 1)).toBe(builder);
      expect(builder.setJInstantRelease(false)).toBe(builder);
    });

    it('defaults the critical flag to true when called bare', () =>
    {
      // Arrange & Act- the parameter default is what makes `.setCritical()` read naturally.
      const popup = new TextPopBuilder(1).setCritical()
        .build();

      // Assert
      expect(popup.critical).toBe(true);
    });

    it('defaults the healing flag to true when called bare', () =>
    {
      // Arrange & Act
      const popup = new TextPopBuilder(1).setHealing()
        .build();

      // Assert
      expect(popup.healing).toBe(true);
    });

    it('carries the instant-release flag onto the popup', () =>
    {
      // Arrange & Act
      const popup = new TextPopBuilder(1).setJInstantRelease(false)
        .build();

      // Assert
      expect(popup.jInstantRelease).toBe(false);
    });

    it('carries the text accent onto the popup', () =>
    {
      // Arrange & Act
      const popup = new TextPopBuilder(1).setTextAccent('outline')
        .build();

      // Assert
      expect(popup.textAccent).toBe('outline');
    });
  });

  describe('layout ring selectors', () =>
  {
    const ringSelectors = [
      [ 'forEnemyDamageRing', 'EnemyDamage' ],
      [ 'forIncomingHealRing', 'IncomingHeal' ],
      [ 'forSlipDamageRing', 'SlipDamage' ],
      [ 'forRegenRing', 'Regen' ],
      [ 'forRewardUpRing', 'RewardUp' ],
      [ 'forLootDownRing', 'LootDown' ],
      [ 'forCenterFocusRing', 'CenterFocus' ],
    ];

    for (const [ methodName, ringName ] of ringSelectors)
    {
      it(`assigns the ${ringName} ring via ${methodName}`, () =>
      {
        // Arrange & Act- the ring decides where the popup stacks relative to its anchor.
        const popup = new TextPopBuilder(1)[methodName]().build();

        // Assert
        expect(popup.layoutRing).toBe(Map_TextPop.LayoutRings[ringName]);
      });
    }

    it('defaults to the enemy damage ring when none is chosen', () =>
    {
      // Arrange & Act
      const popup = new TextPopBuilder(1).build();

      // Assert
      expect(popup.layoutRing).toBe(Map_TextPop.LayoutRings.EnemyDamage);
    });
  });

  describe('isElemental', () =>
  {
    it('marks resisted damage with a trailing ellipsis', () =>
    {
      // Arrange & Act- a rate below 1 means the target shrugged part of it off.
      const popup = new TextPopBuilder(10).isElemental(0.4)
        .build();

      // Assert
      expect(popup.value).toBe('10...');
    });

    it('marks amplified damage with a triple bang', () =>
    {
      // Arrange & Act
      const popup = new TextPopBuilder(10).isElemental(1.75)
        .build();

      // Assert
      expect(popup.value).toBe('10!!!');
    });

    it('leaves neutral damage unadorned', () =>
    {
      // Arrange & Act- exactly 1 is neither resisted nor amplified, so it gets no marker at all.
      const popup = new TextPopBuilder(10).isElemental(1)
        .build();

      // Assert
      expect(popup.value).toBe('10');
    });
  });

  describe('resource damage presets', () =>
  {
    const resourcePresets = [
      [ 'isHpDamage', 'HpDamage', 0, 21 ],
      [ 'isMpDamage', 'MpDamage', 5, 23 ],
      [ 'isTpDamage', 'TpDamage', 19, 29 ],
    ];

    for (const [ methodName, typeName, damageColor, healingColor ] of resourcePresets)
    {
      it(`colours ${typeName} as damage for a positive value`, () =>
      {
        // Arrange & Act
        const popup = new TextPopBuilder(50)[methodName]().build();

        // Assert
        expect(popup.popupType).toBe(Map_TextPop.Types[typeName]);
        expect(popup.textColorIndex).toBe(damageColor);
      });

      it(`colours ${typeName} as healing and prefixes a plus for a negative value`, () =>
      {
        // Arrange & Act- the plus prefix is what tells the player at a glance that this went up.
        const popup = new TextPopBuilder(-50)[methodName]().build();

        // Assert
        expect(popup.textColorIndex).toBe(healingColor);
        expect(popup.value).toBe('+50');
      });

      it(`leaves ${typeName} colouring alone for a zero value`, () =>
      {
        // Arrange & Act- a zero has no direction, so neither damage nor healing colouring applies.
        const popup = new TextPopBuilder(0)[methodName]().build();

        // Assert
        expect(popup.popupType).toBe(Map_TextPop.Types[typeName]);
        expect(popup.textColorIndex).toBe(0);
      });

      it(`leaves ${typeName} colouring alone for a zero value that was flagged as healing`, () =>
      {
        // Arrange- a heal that restored nothing still pops, and the zero has no direction to
        // colour; the healing flag alone must not talk the preset into a heal colour and a plus.
        // Act
        const popup = new TextPopBuilder(0).setHealing()[methodName]().build();

        // Assert
        expect(popup.healing).toBe(true);
        expect(popup.textColorIndex).toBe(0);
        expect(popup.value).toBe('0');
      });

      it(`leaves ${typeName} colouring alone for a non-numeric value`, () =>
      {
        // Arrange- a text value sets the base value to zero, taking the same no-colour path.
        // Act
        const popup = new TextPopBuilder('miss')[methodName]().build();

        // Assert
        expect(popup.textColorIndex).toBe(0);
      });
    }
  });

  describe('reward presets', () =>
  {
    it('configures an experience popup', () =>
    {
      // Arrange & Act
      const popup = new TextPopBuilder(120).isExperience()
        .build();

      // Assert- rewards rise off the top of the anchor so they do not collide with damage numbers.
      expect(popup.popupType).toBe(Map_TextPop.Types.Experience);
      expect(popup.textColorIndex).toBe(6);
      expect(popup.iconIndex).toBe(125);
      expect(popup.layoutRing).toBe(Map_TextPop.LayoutRings.RewardUp);
    });

    it('configures a gold popup', () =>
    {
      // Arrange & Act
      const popup = new TextPopBuilder(500).isGold()
        .build();

      // Assert
      expect(popup.popupType).toBe(Map_TextPop.Types.Gold);
      expect(popup.textColorIndex).toBe(14);
      expect(popup.iconIndex).toBe(2048);
      expect(popup.layoutRing).toBe(Map_TextPop.LayoutRings.RewardUp);
    });

    it('configures an SDP points popup', () =>
    {
      // Arrange & Act
      const popup = new TextPopBuilder(3).isSdpPoints()
        .build();

      // Assert
      expect(popup.popupType).toBe(Map_TextPop.Types.Sdp);
      expect(popup.textColorIndex).toBe(17);
      expect(popup.iconIndex).toBe(306);
      expect(popup.layoutRing).toBe(Map_TextPop.LayoutRings.RewardUp);
    });

    it('configures a level-up popup', () =>
    {
      // Arrange & Act
      const popup = new TextPopBuilder('LEVEL UP').isLevelUp()
        .build();

      // Assert
      expect(popup.popupType).toBe(Map_TextPop.Types.Levelup);
      expect(popup.textColorIndex).toBe(24);
      expect(popup.iconIndex).toBe(86);
    });

    it('configures a loot popup that falls rather than rises', () =>
    {
      // Arrange & Act- loot uses its own downward ring so a pile of drops does not fight the reward
      // numbers for the same space.
      const popup = new TextPopBuilder('Potion').isLoot()
        .build();

      // Assert
      expect(popup.popupType).toBe(Map_TextPop.Types.Item);
      expect(popup.textColorIndex).toBe(1);
      expect(popup.layoutRing).toBe(Map_TextPop.LayoutRings.LootDown);
    });

    it('configures a skill-used popup centred on the caster', () =>
    {
      // Arrange & Act- the skill name belongs on the caster, not stacked in a damage ring.
      const popup = new TextPopBuilder('Fireball').isSkillUsed(64)
        .build();

      // Assert
      expect(popup.popupType).toBe(Map_TextPop.Types.SkillUsage);
      expect(popup.textColorIndex).toBe(7);
      expect(popup.iconIndex).toBe(64);
      expect(popup.layoutRing).toBe(Map_TextPop.LayoutRings.CenterFocus);
    });

    it('configures a skill-learned popup with its announcement suffix', () =>
    {
      // Arrange & Act
      const popup = new TextPopBuilder('Fireball').isSkillLearned(64)
        .build();

      // Assert
      expect(popup.popupType).toBe(Map_TextPop.Types.Learn);
      expect(popup.textColorIndex).toBe(27);
      expect(popup.iconIndex).toBe(64);
      expect(popup.value).toBe('Fireball LEARNED!');
    });
  });
});
//endregion plugins/popups/core/_models/text-pop-builder.test.js
