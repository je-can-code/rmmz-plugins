//region plugins/elem/core/objects/action-element-math.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  enemyData,
  installElemHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJElem,
  skillData,
} from '../../_component/fixtures/install-elem-host-globals.js';

/**
 * Elemental rates arrive as a "factor" - a direct multiplier applied to damage - and several
 * elements on one action combine multiplicatively. The order the special cases are resolved in is
 * the whole design: anti-null beats null, absorption beats everything, and pierce only ever nudges
 * a resistance toward neutral without tipping it into bonus damage. Each of those has a different
 * sign or magnitude consequence, so the tests below assert concrete factors.
 */
describe('J-Elementalistics Game_Action element math (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installElemHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Action.js');

    setPluginContextToJElem();
    await import('../../../../../src/plugins/elem/core/_metadata/initialization.js');

    // load order mirrors the plugin entry point: actor before enemy.
    await import('../../../../../src/plugins/elem/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/elem/core/objects/Game_Actor.js');
    await import('../../../../../src/plugins/elem/core/objects/Game_Enemy.js');
    await import('../../../../../src/plugins/elem/core/objects/Game_Action.js');
  });

  /**
   * Builds an enemy target whose element rates and notes are pinned.
   * @param {object} rates Element id to rate, e.g. `{ 1: 0.5 }`.
   * @param {string} [note] The note text the target carries.
   * @returns {Game_Enemy}
   */
  function makeTarget(rates = {}, note = '')
  {
    const target = new globalThis.Game_Enemy();
    target.getAllNotes = () => [ enemyData({ id: 1, name: 'Target', note }) ];
    target.elementRate = function(elementId)
    {
      const raw = rates[elementId] ?? 1;

      return this.isElementAbsorbed(elementId)
        ? raw * -1
        : raw;
    };

    return target;
  }

  /**
   * Builds an action wielding the given skill, cast by an attacker with the given notes.
   * @param {object} skillProps The skill row properties.
   * @param {string} [attackerNote] The attacker's note text.
   * @param {number[]} [attackerElements] The attacker's own attack elements.
   * @returns {Game_Action}
   */
  function makeAction(skillProps, attackerNote = '', attackerElements = [])
  {
    const skill = skillData({
      id: 10,
      name: 'Testy',
      note: '',
      damage: { elementId: 1 },
      ...skillProps,
    });

    const attacker = new globalThis.Game_Enemy();
    attacker.getAllNotes = () => [ enemyData({ id: 2, name: 'Caster', note: attackerNote }) ];
    attacker.attackElements = () => attackerElements;

    const action = new globalThis.Game_Action();
    action.item = () => skill;
    action.subject = () => attacker;

    return action;
  }

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  //region applicable elements
  describe('getApplicableElements', () =>
  {
    it('uses the skill\'s own base element, leaving the caster\'s out of it', () =>
    {
      // Arrange: a skill that names its own element is fully specified, so the elements the caster
      // strikes with must not quietly join in - only a normal attack inherits those.
      const action = makeAction({ damage: { elementId: 1 } }, '', [ 2 ]);

      // Act
      const elements = action.getApplicableElements(makeTarget());

      // Assert
      expect(elements).toEqual([ 1 ]);
    });

    it('adds extra elements declared on the skill', () =>
    {
      // Arrange: a skill can be both fire and ice typed.
      const action = makeAction({ damage: { elementId: 1 }, note: '<attackElements:[2]>' });

      // Act
      const elements = action.getApplicableElements(makeTarget());

      // Assert
      expect(elements).toEqual([ 1, 2 ]);
    });

    it('folds in the attacker\'s own elements for a normal-attack skill', () =>
    {
      // Arrange: element -1 means "normal attack", which inherits whatever the caster strikes with.
      const action = makeAction({ damage: { elementId: -1 } }, '', [ 2 ]);

      // Act
      const elements = action.getApplicableElements(makeTarget());

      // Assert
      expect(elements).toContain(2);
    });

    it('collapses to none-element the moment it is present', () =>
    {
      // Arrange: a non-elemental component makes the whole action non-elemental, so nothing
      // else can matter.
      const action = makeAction({ damage: { elementId: 0 }, note: '<attackElements:[2]>' });

      // Act
      const elements = action.getApplicableElements(makeTarget());

      // Assert
      expect(elements).toEqual([ 0 ]);
    });

    it('narrows to what the target permits under strict elements', () =>
    {
      // Arrange
      const action = makeAction({ damage: { elementId: 1 }, note: '<attackElements:[2]>' });
      const target = makeTarget({}, '<strictElements:[2]>');

      // Act
      const elements = action.getApplicableElements(target);

      // Assert
      expect(elements).toEqual([ 2 ]);
    });
  });
  //endregion applicable elements

  //region rate resolution
  describe('calcElementRate', () =>
  {
    it('leaves a non-elemental action at neutral damage, even against a strict target', () =>
    {
      // Arrange: a none-element action performs no elemental calculation at all, so a strict list
      // that refuses every element the action carries never gets to zero it out.
      const action = makeAction({ damage: { elementId: 0 } });
      const target = makeTarget({ 1: 0.5 }, '<strictElements:[9]>');

      // Act
      const factor = action.calcElementRate(target);

      // Assert
      expect(factor).toBe(1.0);
    });

    it('nullifies an action whose elements the target refuses entirely', () =>
    {
      // Arrange: strict elements that exclude everything the action carries leave nothing to
      // calculate, which is a complete miss rather than neutral damage.
      const action = makeAction({ damage: { elementId: 1 } });
      const target = makeTarget({}, '<strictElements:[9]>');

      // Act
      const factor = action.calcElementRate(target);

      // Assert
      expect(factor).toBe(0);
    });

    it('uses the single element rate when only one applies', () =>
    {
      // Arrange
      const action = makeAction({ damage: { elementId: 1 } });

      // Act
      const factor = action.calcElementRate(makeTarget({ 1: 0.5 }));

      // Assert
      expect(factor).toBeCloseTo(0.5, 10);
    });

    it('multiplies several element rates together', () =>
    {
      // Arrange: combining elements is multiplicative, so two halves make a quarter.
      const action = makeAction({ damage: { elementId: 1 }, note: '<attackElements:[2]>' });

      // Act
      const factor = action.calcElementRate(makeTarget({ 1: 0.5, 2: 0.5 }));

      // Assert
      expect(factor).toBeCloseTo(0.25, 10);
    });
  });

  describe('calculateRawElementRate', () =>
  {
    it('reports the target rates without the attacker\'s boosts applied', () =>
    {
      // Arrange: the raw rate is what the target's own affiliations say, ignoring who is casting.
      const action = makeAction({ damage: { elementId: 1 } }, '<boostElement:[1,100]>');

      // Act
      const raw = action.calculateRawElementRate(makeTarget({ 1: 0.5 }));

      // Assert
      expect(raw).toBeCloseTo(0.5, 10);
    });

    it('multiplies raw rates across several elements', () =>
    {
      // Arrange
      const action = makeAction({ damage: { elementId: 1 }, note: '<attackElements:[2]>' });

      // Act
      const raw = action.calculateRawElementRate(makeTarget({ 1: 0.5, 2: 2 }));

      // Assert
      expect(raw).toBeCloseTo(1, 10);
    });
  });
  //endregion rate resolution

  //region null and anti-null
  describe('anti-null handling', () =>
  {
    it('ignores a nullified element when the action carries an anti-null one', () =>
    {
      // Arrange: anti-null strips the nulled elements out rather than letting a single immunity
      // zero the whole multi-element attack.
      const action = makeAction({ damage: { elementId: 1 }, note: '<attackElements:[2]>' });
      action.getAntiNullElementIds = () => [ 2 ];

      // Act: element 1 is nullified, element 2 lands at double.
      const factor = action.calcElementRate(makeTarget({ 1: 0, 2: 2 }));

      // Assert
      expect(factor).toBeCloseTo(2, 10);
    });

    it('resolves a lone element by its own rate without ever reaching anti-null handling', () =>
    {
      // Arrange: anti-null is multi-element machinery, and a single surviving element short-
      // circuits ahead of it - so a lone nullified element stays nullified rather than being
      // purged into true damage the way a second element would let it be.
      const action = makeAction({ damage: { elementId: 1 } });
      action.getAntiNullElementIds = () => [ 1 ];

      // Act
      const factor = action.calcElementRate(makeTarget({ 1: 0 }));

      // Assert
      expect(factor).toBe(0);
    });

    it('deals true damage when anti-null leaves nothing but nullified elements', () =>
    {
      // Arrange: with every element purged, there is no elemental verdict left to apply, so the
      // attack lands unmodified rather than being cancelled.
      const action = makeAction({ damage: { elementId: 1 }, note: '<attackElements:[2]>' });
      action.getAntiNullElementIds = () => [ 2 ];

      // Act
      const factor = action.calcElementRate(makeTarget({ 1: 0, 2: 0 }));

      // Assert
      expect(factor).toBe(1);
    });
  });
  //endregion null and anti-null

  //region pierce
  describe('applyElementPierce', () =>
  {
    it('leaves a weakness alone, since there is no resistance to pierce', () =>
    {
      // Arrange: pierce only ever moves a rate up toward neutral.
      const action = makeAction({}, '<pierceElement:[1,30]>');

      // Act
      const pierced = action.applyElementPierce(1, makeTarget({ 1: 2 }), 2);

      // Assert
      expect(pierced).toBe(2);
    });

    it('leaves an absorbed element alone, which absorption already governs', () =>
    {
      // Arrange
      const action = makeAction({}, '<pierceElement:[1,30]>');
      const target = makeTarget({ 1: 0.5 }, '<absorbElements:[1]>');

      // Act
      const pierced = action.applyElementPierce(1, target, 0.5);

      // Assert
      expect(pierced).toBe(0.5);
    });

    it('leaves a resistance alone when the attacker carries no pierce', () =>
    {
      // Arrange
      const action = makeAction({});

      // Act
      const pierced = action.applyElementPierce(1, makeTarget({ 1: 0.5 }), 0.5);

      // Assert
      expect(pierced).toBe(0.5);
    });

    it('nudges a resistance toward neutral by the pierced amount', () =>
    {
      // Arrange: thirty pierce moves a half-resistance up to eight tenths.
      const action = makeAction({}, '<pierceElement:[1,30]>');

      // Act
      const pierced = action.applyElementPierce(1, makeTarget({ 1: 0.5 }), 0.5);

      // Assert
      expect(pierced).toBeCloseTo(0.8, 10);
    });

    it('never pierces past neutral into bonus damage', () =>
    {
      // Arrange: an enormous pierce should erase a resistance, not invert it into a weakness.
      const action = makeAction({}, '<pierceElement:[1,500]>');

      // Act
      const pierced = action.applyElementPierce(1, makeTarget({ 1: 0.5 }), 0.5);

      // Assert
      expect(pierced).toBe(1.0);
    });

    it('ignores pierce belonging to a different element', () =>
    {
      // Arrange
      const action = makeAction({}, '<pierceElement:[2,30]>');

      // Act
      const pierced = action.applyElementPierce(1, makeTarget({ 1: 0.5 }), 0.5);

      // Assert
      expect(pierced).toBe(0.5);
    });

    it('adds skill-specific pierce to the attacker\'s global pierce', () =>
    {
      // Arrange: a skill can carry its own pierce that stacks on whatever the caster already has.
      const action = makeAction({ note: '<thisPierceElement:[1,20]>' }, '<pierceElement:[1,10]>');

      // Act
      const pierced = action.applyElementPierce(1, makeTarget({ 1: 0.5 }), 0.5);

      // Assert
      expect(pierced).toBeCloseTo(0.8, 10);
    });

    it('applies skill pierce even when the attacker carries none', () =>
    {
      // Arrange
      const action = makeAction({ note: '<thisPierceElement:[1,25]>' });

      // Act
      const pierced = action.applyElementPierce(1, makeTarget({ 1: 0.5 }), 0.5);

      // Assert
      expect(pierced).toBeCloseTo(0.75, 10);
    });

    it('ignores skill pierce belonging to a different element', () =>
    {
      // Arrange: a skill piercing ice must not quietly pierce fire as well.
      const action = makeAction({ note: '<thisPierceElement:[2,40]>' });

      // Act
      const pierced = action.applyElementPierce(1, makeTarget({ 1: 0.5 }), 0.5);

      // Assert
      expect(pierced).toBe(0.5);
    });
  });
  //endregion pierce

  //region damage formula
  describe('evalDamageFormula', () =>
  {
    it('evaluates an ordinary damage formula', () =>
    {
      // Arrange
      const action = makeAction({ damage: { elementId: 1, formula: '25' } });

      // Act
      const damage = action.evalDamageFormula(makeTarget());

      // Assert
      expect(damage).toBe(25);
    });

    it('clamps a negative result to zero for an unabsorbed element', () =>
    {
      // Arrange: only absorption is allowed to produce healing; an ordinary formula going
      // negative is an authoring slip rather than an intent to heal the target.
      const action = makeAction({ damage: { elementId: 1, formula: '-50' } });

      // Act
      const damage = action.evalDamageFormula(makeTarget());

      // Assert
      expect(damage).toBe(0);
    });

    it('reports zero for a formula that evaluates to nothing numeric', () =>
    {
      // Arrange: a formula yielding NaN would otherwise poison the entire damage pipeline,
      // since every later arithmetic step involving it also becomes NaN.
      const action = makeAction({ damage: { elementId: 1, formula: '0/0' } });

      // Act
      const damage = action.evalDamageFormula(makeTarget());

      // Assert
      expect(damage).toBe(0);
    });

    it('reports zero rather than throwing on a broken formula', () =>
    {
      // Arrange: damage formulas are author-written strings, so one typo must cost that single
      // hit rather than aborting the action and stranding the battle.
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});
      const error = vi.spyOn(console, 'error')
        .mockImplementation(() => {});
      const action = makeAction({ damage: { elementId: 1, formula: 'this.is.not.valid(' } });

      // Act
      const damage = action.evalDamageFormula(makeTarget());

      // Assert
      expect(damage).toBe(0);

      // restore manually so the spies cannot leak into whichever test runs next in this file.
      warn.mockRestore();
      error.mockRestore();
    });

    it('names the offending skill when a formula breaks', () =>
    {
      // Arrange
      const error = vi.spyOn(console, 'error')
        .mockImplementation(() => {});
      const action = makeAction({ damage: { elementId: 1, formula: 'this.is.not.valid(' } });

      // Act
      action.evalDamageFormula(makeTarget());

      // Assert- the skill id is the whole point; a bare "formula broke" cannot be acted on.
      expect(error).toHaveBeenCalledWith(
        '[J-Elementalistics] error with the damage formula for item/skill id: 10.',
        expect.objectContaining({ error: expect.any(Error) }));

      error.mockRestore();
    });
  });
  //endregion pierce
});
//endregion plugins/elem/core/objects/action-element-math.test.js