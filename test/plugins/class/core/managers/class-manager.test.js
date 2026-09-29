//region plugins/class/core/managers/class-manager.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  BRAWLER_ICON_INDEX,
  installClassCoreRealm,
  SWORD_ATTACK,
} from '../_component/fixtures/install-class-core-realm.js';

/**
 * Every decision the class scene makes, against real actors under J-Base.
 *
 * The actors are the engine's own, rebuilt after J-Base rewrote the database and J-Classes aliased
 * `initMembers`, so what these tests read is exactly what the scene will read in a running game.
 */
describe('ClassManager', () =>
{
  let ClassManager;

  beforeAll(async () =>
  {
    await installClassCoreRealm();

    ({ default: ClassManager } = await import('../../../../../src/plugins/class/core/managers/ClassManager.js'));
  });

  beforeEach(() =>
  {
    // every test starts from the database's own classes at level one, wearing nothing, with nothing unlocked
    // and every switch off.
    const firstActor = globalThis.$gameActors.actor(1);
    firstActor.initClassMembers();
    firstActor.changeClass(1, true);
    firstActor.changeLevel(1, false);
    firstActor.forceChangeEquip(0, null);
    globalThis.$gameActors.actor(2)
      .initClassMembers();
    globalThis.$gameSwitches.clear();
    globalThis.J.CLASS.Metadata.menuSwitchId = 0;
    globalThis.J.CLASS.Metadata.menuChangeSwitchId = 0;
    globalThis.J.CLASS.Metadata.classIconIndex = 2694;
  });

  it('refuses to be constructed, since everything it knows is static', () =>
  {
    // Arrange
    // Act
    const construct = () => new ClassManager();

    // Assert
    expect(construct)
      .toThrow('This is a static class.');
  });

  //region listing
  describe('selectableClasses()', () =>
  {
    it('lists the worn class, every unlocked class and every class set aside for the actor, in database order', () =>
    {
      // Arrange- unlocked out of order. Hermit and Void stay locked and are open to anyone, and Warden is set
      // aside for actor 2, so none of those three may appear.
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(3);
      actor.unlockClass(2);

      // Act
      const classIds = ClassManager.selectableClasses(actor)
        .map(dataClass => dataClass.id);

      // Assert- Pathfinder is set aside for actor 1, and still to unlock.
      expect(classIds)
        .toEqual([ 1, 2, 3, 6 ]);
    });
  });

  describe('isSelectableClass()', () =>
  {
    it('skips the empty row the engine leaves at index zero', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const isSelectable = ClassManager.isSelectableClass(actor, null, 1);

      // Assert
      expect(isSelectable)
        .toBe(false);
    });

    it('always lists the class being worn, even though it was never unlocked', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const isSelectable = ClassManager.isSelectableClass(actor, globalThis.$dataClasses[1], 1);

      // Assert
      expect(isSelectable)
        .toBe(true);
    });

    it('lists a class the actor has unlocked', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(2);

      // Act
      const isSelectable = ClassManager.isSelectableClass(actor, globalThis.$dataClasses[2], 1);

      // Assert
      expect(isSelectable)
        .toBe(true);
    });

    it('leaves out a class the actor has not unlocked', () =>
    {
      // Arrange- a sibling is unlocked, so "lists everything" cannot pass this.
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(2);

      // Act
      const isSelectable = ClassManager.isSelectableClass(actor, globalThis.$dataClasses[3], 1);

      // Assert
      expect(isSelectable)
        .toBe(false);
    });

    it('lists a class set aside for the actor before they unlock it, to tease it', () =>
    {
      // Arrange- Pathfinder is set aside for actor 1, and nothing has been unlocked.
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const isSelectable = ClassManager.isSelectableClass(actor, globalThis.$dataClasses[6], 1);

      // Assert
      expect(isSelectable)
        .toBe(true);
    });
  });

  describe('isClassRevealed()', () =>
  {
    it('reveals the class being worn, even though it was never unlocked', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const isRevealed = ClassManager.isClassRevealed(actor, 1);

      // Assert
      expect(isRevealed)
        .toBe(true);
    });

    it('reveals a class the actor has unlocked', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(2);

      // Act
      const isRevealed = ClassManager.isClassRevealed(actor, 2);

      // Assert
      expect(isRevealed)
        .toBe(true);
    });

    it('keeps a class still to unlock hidden, even one set aside for the actor', () =>
    {
      // Arrange- a sibling is unlocked, so "reveals everything" cannot pass this.
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(2);

      // Act
      const isRevealed = ClassManager.isClassRevealed(actor, 6);

      // Assert
      expect(isRevealed)
        .toBe(false);
    });
  });

  describe('listedClassName()', () =>
  {
    it('names a revealed class', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(6);

      // Act
      const name = ClassManager.listedClassName(actor, globalThis.$dataClasses[6]);

      // Assert
      expect(name)
        .toBe('Pathfinder');
    });

    it('names a class still to unlock only as "???"', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const name = ClassManager.listedClassName(actor, globalThis.$dataClasses[6]);

      // Assert
      expect(name)
        .toBe('???');
    });
  });

  describe('listedClassIconIndex()', () =>
  {
    it('draws a revealed class with its own icon', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(2);

      // Act
      const iconIndex = ClassManager.listedClassIconIndex(actor, globalThis.$dataClasses[2]);

      // Assert
      expect(iconIndex)
        .toBe(BRAWLER_ICON_INDEX);
    });

    it('draws a class still to unlock with the shared class icon, even when it has one of its own', () =>
    {
      // Arrange- Brawler has an icon of its own, which a locked row must not give away.
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const iconIndex = ClassManager.listedClassIconIndex(actor, globalThis.$dataClasses[2]);

      // Assert
      expect(iconIndex)
        .toBe(2694);
    });
  });

  describe('classIconIndex()', () =>
  {
    it('draws a class with the icon it was given', () =>
    {
      // Arrange
      // Act
      const iconIndex = ClassManager.classIconIndex(globalThis.$dataClasses[2]);

      // Assert
      expect(iconIndex)
        .toBe(BRAWLER_ICON_INDEX);
    });

    it('draws a class never given an icon with the shared class icon', () =>
    {
      // Arrange
      // Act
      const iconIndex = ClassManager.classIconIndex(globalThis.$dataClasses[3]);

      // Assert
      expect(iconIndex)
        .toBe(2694);
    });
  });
  //endregion listing

  //region unlocking
  describe('unlockableActorIds()', () =>
  {
    it('reads the actors a class is set aside for', () =>
    {
      // Arrange
      // Act
      const actorIds = ClassManager.unlockableActorIds(6);

      // Assert
      expect(actorIds)
        .toEqual([ 1 ]);
    });

    it('reads nobody for a class without the tag', () =>
    {
      // Arrange
      // Act
      const actorIds = ClassManager.unlockableActorIds(3);

      // Assert
      expect(actorIds)
        .toEqual([]);
    });
  });

  describe('isRestrictedClass()', () =>
  {
    it('answers for a class set aside for particular actors, and for no other', () =>
    {
      // Arrange
      // Act
      const pathfinder = ClassManager.isRestrictedClass(6);
      const scholar = ClassManager.isRestrictedClass(3);

      // Assert
      expect(pathfinder)
        .toBe(true);
      expect(scholar)
        .toBe(false);
    });
  });

  describe('canUnlockClass()', () =>
  {
    it('unlocks a class without the tag for anyone', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(2);

      // Act
      const canUnlock = ClassManager.canUnlockClass(actor, 3);

      // Assert
      expect(canUnlock)
        .toBe(true);
    });

    it('unlocks a class set aside for the actor', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const canUnlock = ClassManager.canUnlockClass(actor, 6);

      // Assert
      expect(canUnlock)
        .toBe(true);
    });

    it('refuses a class set aside for somebody else', () =>
    {
      // Arrange- Warden is set aside for actor 2, beside Pathfinder, which actor 1 may unlock.
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const canUnlock = ClassManager.canUnlockClass(actor, 7);

      // Assert
      expect(canUnlock)
        .toBe(false);
    });
  });

  describe('isTeasedClass()', () =>
  {
    it('stops teasing a class once the actor has unlocked it', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(6);

      // Act
      const isTeased = ClassManager.isTeasedClass(actor, 6);

      // Assert
      expect(isTeased)
        .toBe(false);
    });

    it('never teases a class open to anyone', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const isTeased = ClassManager.isTeasedClass(actor, 3);

      // Assert
      expect(isTeased)
        .toBe(false);
    });

    it('teases a class set aside for the actor that they have yet to unlock', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const isTeased = ClassManager.isTeasedClass(actor, 6);

      // Assert
      expect(isTeased)
        .toBe(true);
    });

    it('never teases a class set aside for somebody else', () =>
    {
      // Arrange- Warden is still locked and set aside, so only whose it is can refuse it.
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const isTeased = ClassManager.isTeasedClass(actor, 7);

      // Assert
      expect(isTeased)
        .toBe(false);
    });
  });
  //endregion unlocking

  //region changing
  describe('isCurrentClass()', () =>
  {
    it('answers for the class being worn and for no other', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const isWorn = ClassManager.isCurrentClass(actor, 1);
      const isOther = ClassManager.isCurrentClass(actor, 2);

      // Assert
      expect(isWorn)
        .toBe(true);
      expect(isOther)
        .toBe(false);
    });
  });

  describe('canChangeClass()', () =>
  {
    it('never changes a class in a scene opened only to look', () =>
    {
      // Arrange- an unlocked class that is not being worn, which every other guard would allow.
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(2);

      // Act
      const canChange = ClassManager.canChangeClass(actor, 2, false);

      // Assert
      expect(canChange)
        .toBe(false);
    });

    it('refuses to change into the class already being worn', () =>
    {
      // Arrange- the worn class is unlocked too, so only the "already worn" guard can refuse it.
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(1);

      // Act
      const canChange = ClassManager.canChangeClass(actor, 1, true);

      // Assert
      expect(canChange)
        .toBe(false);
    });

    it('changes into an unlocked class when changing is allowed', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(2);

      // Act
      const canChange = ClassManager.canChangeClass(actor, 2, true);

      // Assert
      expect(canChange)
        .toBe(true);
    });

    it('refuses a class that has not been unlocked', () =>
    {
      // Arrange- a sibling is unlocked, so a guard answering yes to everything cannot pass this.
      const actor = globalThis.$gameActors.actor(1);
      actor.unlockClass(2);

      // Act
      const canChange = ClassManager.canChangeClass(actor, 3, true);

      // Assert
      expect(canChange)
        .toBe(false);
    });
  });

  describe('changeClass()', () =>
  {
    it('changes the actor into the class and keeps their level', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      actor.changeLevel(10, false);

      // Act
      ClassManager.changeClass(actor, 2);

      // Assert
      expect(actor.currentClass().id)
        .toBe(2);
      expect(actor.level)
        .toBe(10);
    });
  });
  //endregion changing

  //region menu
  describe('isMenuCommandVisible()', () =>
  {
    it('always shows the command when no switch governs it', () =>
    {
      // Arrange
      globalThis.J.CLASS.Metadata.menuSwitchId = 0;

      // Act
      const isVisible = ClassManager.isMenuCommandVisible();

      // Assert
      expect(isVisible)
        .toBe(true);
    });

    it('shows the command while its switch is on', () =>
    {
      // Arrange
      globalThis.J.CLASS.Metadata.menuSwitchId = 7;
      globalThis.$gameSwitches.setValue(7, true);

      // Act
      const isVisible = ClassManager.isMenuCommandVisible();

      // Assert
      expect(isVisible)
        .toBe(true);
    });

    it('hides the command while its switch is off', () =>
    {
      // Arrange
      globalThis.J.CLASS.Metadata.menuSwitchId = 7;
      globalThis.$gameSwitches.setValue(7, false);

      // Act
      const isVisible = ClassManager.isMenuCommandVisible();

      // Assert
      expect(isVisible)
        .toBe(false);
    });
  });

  describe('canMenuChangeClasses()', () =>
  {
    it('only views from the menu when no switch governs it', () =>
    {
      // Arrange
      globalThis.J.CLASS.Metadata.menuChangeSwitchId = 0;

      // Act
      const canChange = ClassManager.canMenuChangeClasses();

      // Assert
      expect(canChange)
        .toBe(false);
    });

    it('changes classes from the menu while its switch is on', () =>
    {
      // Arrange
      globalThis.J.CLASS.Metadata.menuChangeSwitchId = 8;
      globalThis.$gameSwitches.setValue(8, true);

      // Act
      const canChange = ClassManager.canMenuChangeClasses();

      // Assert
      expect(canChange)
        .toBe(true);
    });

    it('only views from the menu while its switch is off', () =>
    {
      // Arrange
      globalThis.J.CLASS.Metadata.menuChangeSwitchId = 8;
      globalThis.$gameSwitches.setValue(8, false);

      // Act
      const canChange = ClassManager.canMenuChangeClasses();

      // Assert
      expect(canChange)
        .toBe(false);
    });
  });
  //endregion menu

  //region parameters
  describe('startingClassId()', () =>
  {
    it('reads the class the actor starts the game in, not the one being worn', () =>
    {
      // Arrange- actor 2 starts in Void and is moved away from it.
      const actor = globalThis.$gameActors.actor(2);
      actor.changeClass(3, true);

      // Act
      const startingClassId = ClassManager.startingClassId(actor);

      // Assert
      expect(startingClassId)
        .toBe(5);

      // put the actor back for the tests that follow.
      actor.changeClass(5, true);
    });
  });

  describe('referenceValue()', () =>
  {
    it('reads a class curve at level 99', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const value = ClassManager.referenceValue(actor, 2, 'atk');

      // Assert- the harness curve is 1090 at 99, and Brawler's attack is that times 1.15.
      expect(value)
        .toBe(1254);
    });

    it('measures nothing for a parameter no class has a curve for', () =>
    {
      // Arrange- accuracy grows by other means entirely, which only an extension knows how to measure.
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const value = ClassManager.referenceValue(actor, 2, 'hit');

      // Assert
      expect(value)
        .toBe(0);
    });
  });

  describe('maxTpCurveValue()', () =>
  {
    it('measures nothing without J-LevelMaster, even for a class with a curve', () =>
    {
      // Arrange- Brawler carries a Max Tech curve, but this realm has no J-LevelMaster to read it, nor the
      // reader it would read it through.
      // Act
      const value = ClassManager.maxTpCurveValue(2);

      // Assert
      expect(value)
        .toBe(0);
    });
  });

  describe('hasParameterMultiplier()', () =>
  {
    it('measures a parameter the starting class holds some of', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const hasMultiplier = ClassManager.hasParameterMultiplier(actor, 'mmp');

      // Assert
      expect(hasMultiplier)
        .toBe(true);
    });

    it('declines a parameter the starting class holds none of, since nothing divides by zero', () =>
    {
      // Arrange- Void, actor 2's starting class, has no Max Magi at all.
      const actor = globalThis.$gameActors.actor(2);

      // Act
      const hasMultiplier = ClassManager.hasParameterMultiplier(actor, 'mmp');

      // Assert
      expect(hasMultiplier)
        .toBe(false);
    });
  });

  describe('parameterMultiplier()', () =>
  {
    it('divides the class curve by the starting class curve at level 99', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const multiplier = ClassManager.parameterMultiplier(actor, 2, 'atk');

      // Assert- 1254 over 1090.
      expect(multiplier)
        .toBeCloseTo(1.150459, 6);
    });
  });

  describe('multiplierText()', () =>
  {
    it('shows ×1.00 for a parameter the class leaves alone', () =>
    {
      // Arrange- Brawler leaves agility at its starting class's curve.
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const text = ClassManager.multiplierText(actor, 2, 'agi');

      // Assert
      expect(text)
        .toBe('×1.00');
    });

    it('shows the multiplier the class was authored with, to two decimals', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const attack = ClassManager.multiplierText(actor, 2, 'atk');
      const magicAttack = ClassManager.multiplierText(actor, 2, 'mat');

      // Assert- two parameters of the same class, so one multiplier for every row cannot pass.
      expect(attack)
        .toBe('×1.15');
      expect(magicAttack)
        .toBe('×0.90');
    });

    it('shows nothing for a parameter the starting class leaves nothing to compare against', () =>
    {
      // Arrange- Brawler has plenty of Max Magi, but actor 2 started in Void, which has none.
      const actor = globalThis.$gameActors.actor(2);

      // Act
      const text = ClassManager.multiplierText(actor, 2, 'mmp');

      // Assert
      expect(text)
        .toBe('');
    });
  });

  describe('parameterChange()', () =>
  {
    it('reads a parameter where more is better as it moves: what it becomes, padded, and by how much', () =>
    {
      // Arrange- Brawler raises attack and lowers magic attack, both of which are better higher.
      const actor = globalThis.$gameActors.actor(1);
      const preview = ClassManager.previewActor(actor, 2);

      // Act
      const attack = ClassManager.parameterChange(actor, preview, 'atk');
      const magicAttack = ClassManager.parameterChange(actor, preview, 'mat');

      // Assert- attack rises from 110 to 126, in the power-up color, and magic attack falls to 99, in the
      // power-down color.
      expect(attack)
        .toEqual({
          valueText: '0126',
          changeText: '(+16)',
          colorIndex: 24,
        });
      expect(magicAttack)
        .toEqual({
          valueText: '0099',
          changeText: '(-11)',
          colorIndex: 25,
        });
    });

    it('reads a drop in a parameter where less is better as good for the actor', () =>
    {
      // Arrange- no class in this realm moves a damage rate, so two battlers stand in, a tenth apart.
      const actor = { parameter: () => 1 };
      const preview = { parameter: () => 0.9 };

      // Act
      const { valueText, changeText, colorIndex } = ClassManager.parameterChange(actor, preview, 'pdr');

      // Assert- the rate falls by a tenth, which is good news, so it reads in the power-up color.
      expect(valueText)
        .toBe('-010%');
      expect(changeText)
        .toBe('(-10%)');
      expect(colorIndex)
        .toBe(24);
    });
  });

  describe('changeColorIndex()', () =>
  {
    it('reads a change that is good for the actor in the power-up color', () =>
    {
      // Arrange
      // Act
      const colorIndex = ClassManager.changeColorIndex(0.1);

      // Assert
      expect(colorIndex)
        .toBe(24);
    });

    it('reads a change that is bad for the actor in the power-down color', () =>
    {
      // Arrange
      // Act
      const colorIndex = ClassManager.changeColorIndex(-0.1);

      // Assert
      expect(colorIndex)
        .toBe(25);
    });

    it('reads no change at all as normal text', () =>
    {
      // Arrange
      // Act
      const colorIndex = ClassManager.changeColorIndex(0);

      // Assert
      expect(colorIndex)
        .toBe(0);
    });
  });

  describe('listedParameterKeys()', () =>
  {
    it('lists the resources, then the six core stats, then the six every class buffs', () =>
    {
      // Arrange
      // Act
      const parameterKeys = ClassManager.listedParameterKeys();

      // Assert
      expect(parameterKeys)
        .toEqual([
          'mhp', 'mmp', 'mtp',
          'atk', 'mat', 'def', 'mdf', 'agi', 'luk',
          'hit', 'grd', 'cri', 'cev', 'eva', 'mev',
        ]);
    });
  });

  describe('inListingOrder()', () =>
  {
    it('orders parameters as the class scene lists them', () =>
    {
      // Arrange- listed parameters from all three groups, out of order.
      const parameterKeys = [ 'mev', 'hit', 'luk', 'cri', 'mtp', 'atk' ];

      // Act
      const ordered = ClassManager.inListingOrder(parameterKeys);

      // Assert
      expect(ordered)
        .toEqual([ 'mtp', 'atk', 'luk', 'hit', 'cri', 'mev' ]);
    });

    it('puts parameters the listing never shows last, in the order they arrived', () =>
    {
      // Arrange- two parameters the catalog never shows, around one it does.
      const parameterKeys = [ 'sar', 'hit', 'lst' ];

      // Act
      const ordered = ClassManager.inListingOrder(parameterKeys);

      // Assert
      expect(ordered)
        .toEqual([ 'hit', 'sar', 'lst' ]);
    });
  });

  describe('isParameterChanging()', () =>
  {
    it('reads every parameter of the class already worn as standing, with no preview to compare against', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const isChanging = ClassManager.isParameterChanging(actor, null, 'atk');

      // Assert
      expect(isChanging)
        .toBe(false);
    });

    it('reads a parameter the other class would leave where it is as standing', () =>
    {
      // Arrange- Brawler leaves Max Magi alone.
      const actor = globalThis.$gameActors.actor(1);
      const preview = ClassManager.previewActor(actor, 2);

      // Act
      const isChanging = ClassManager.isParameterChanging(actor, preview, 'mmp');

      // Assert
      expect(isChanging)
        .toBe(false);
    });

    it('reads a parameter the other class would move as changing', () =>
    {
      // Arrange- Brawler raises attack, against the same preview that leaves Max Magi alone.
      const actor = globalThis.$gameActors.actor(1);
      const preview = ClassManager.previewActor(actor, 2);

      // Act
      const isChanging = ClassManager.isParameterChanging(actor, preview, 'atk');

      // Assert
      expect(isChanging)
        .toBe(true);
    });
  });

  describe('comparisonActor()', () =>
  {
    it('compares the class already worn against nothing', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const comparison = ClassManager.comparisonActor(actor, 1);

      // Assert
      expect(comparison)
        .toBeNull();
    });

    it('compares any other class against a copy of the actor standing in it', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const comparison = ClassManager.comparisonActor(actor, 2);

      // Assert
      expect(comparison)
        .not.toBe(actor);
      expect(comparison.currentClass().id)
        .toBe(2);
    });
  });

  describe('previewActor()', () =>
  {
    it('stands a copy in the class, leaving the actor in their own', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const preview = ClassManager.previewActor(actor, 2);

      // Assert
      expect(preview)
        .not.toBe(actor);
      expect(preview.currentClass().id)
        .toBe(2);
      expect(actor.currentClass().id)
        .toBe(1);
    });

    it('reads the parameters of the class it stands in', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);

      // Act
      const preview = ClassManager.previewActor(actor, 2);

      // Assert- level 1 attack is 110 in the starting class, and 110 times 1.15 bakes to 126 in Brawler.
      expect(actor.param(2))
        .toBe(110);
      expect(preview.param(2))
        .toBe(126);
    });

    it('takes the gear off the copy, and leaves it on the actor', () =>
    {
      // Arrange- the sword adds 20 attack to whoever wears it.
      const actor = globalThis.$gameActors.actor(1);
      const [ , sword ] = globalThis.$dataWeapons;
      actor.forceChangeEquip(0, sword);

      // Act
      const preview = ClassManager.previewActor(actor, 2);

      // Assert- Brawler's raw 126, while the actor keeps both the sword and its attack.
      expect(preview.param(2))
        .toBe(126);
      expect(actor.param(2))
        .toBe(110 + SWORD_ATTACK);
      expect(actor.equips()[0])
        .toBe(sword);
    });
  });

  describe('baselineActor()', () =>
  {
    it('stands a copy in the class the actor wears, with nothing equipped', () =>
    {
      // Arrange
      const actor = globalThis.$gameActors.actor(1);
      actor.forceChangeEquip(0, globalThis.$dataWeapons[1]);

      // Act
      const baseline = ClassManager.baselineActor(actor);

      // Assert- the starting class's raw 110, without the sword's 20.
      expect(baseline)
        .not.toBe(actor);
      expect(baseline.currentClass().id)
        .toBe(1);
      expect(baseline.param(2))
        .toBe(110);
    });
  });
  //endregion parameters
});
//endregion plugins/class/core/managers/class-manager.test.js