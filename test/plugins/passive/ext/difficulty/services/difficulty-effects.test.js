//region plugins/passive/ext/difficulty/services/difficulty-effects.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * What the difficulty scene lists for each side of a fight, decided away from any window.
 *
 * Three things are decided here, and each fails quietly: which states a layer hands a side (the applied layer
 * answers with everything in force), how their traits merge (the way J-Base stacks them in battle), and how
 * each effect reads from the player's chair (the same boost is easier on the party's side and harder on the
 * enemies'). So every fixture carries a near-miss that a looser rule would let through. The states' tags join
 * after the traits, in the words J-Base's describer answers with, which is stood in for here.
 */
describe('DifficultyEffects (direct src import)', () =>
{
  let DifficultyEffects;
  let RPG_Trait;
  let NotetagLine;

  /**
   * The lines J-Base's describer answers for each state, keyed by state id; reset before every test.
   * @type {Object<number, NotetagLine[]>}
   */
  let linesByStateId;

  /**
   * A tag line, built the way a plugin's describer builds one.
   * @param {number} iconIndex The icon beside the words.
   * @param {string} text The words.
   * @param {string} value The value the words describe.
   * @param {number} holderImpact Whether it helps its holder (1), hurts it (-1), or neither (0).
   * @returns {NotetagLine}
   */
  const tagLine = (iconIndex, text, value, holderImpact) => new NotetagLine({
    iconIndex,
    text,
    value,
    holderImpact,
  });

  /**
   * A layer stand-in naming its two states.
   * @param {number} actorStateId The actor state, or 0.
   * @param {number} enemyStateId The enemy state, or 0.
   * @returns {object}
   */
  const layer = (actorStateId, enemyStateId) => ({
    isAppliedLayer: () => false,
    actorStateId,
    enemyStateId,
  });

  /**
   * The applied layer stand-in, which names no states of its own.
   * @returns {object}
   */
  const appliedLayer = () => ({
    isAppliedLayer: () => true,
    actorStateId: 0,
    enemyStateId: 0,
  });

  /**
   * A trait, built the way J-Base builds the ones hydrated states carry.
   * @param {number} code The trait code.
   * @param {number} dataId The trait data id.
   * @param {number} value The trait value.
   * @returns {RPG_Trait}
   */
  const trait = (code, dataId, value) => RPG_Trait.fromValues(code, dataId, value);

  /**
   * Seeds the state table with the given traits, one state per entry.
   * @param {Object<number, RPG_Trait[]>} traitsByStateId The traits each state carries.
   */
  const seedStates = traitsByStateId =>
  {
    globalThis.$dataStates = [ null ];
    Object.entries(traitsByStateId)
      .forEach(([ stateId, traits ]) =>
      {
        globalThis.$dataStates[Number(stateId)] = {
          id: Number(stateId),
          traits,
        };
      });
  };

  /**
   * Reads a trait list back as plain code, data id and value triples.
   * @param {RPG_Trait[]} traits The traits.
   * @returns {number[][]}
   */
  const triplesOf = traits => traits.map(({ code, dataId, value }) => [ code, dataId, value ]);

  beforeAll(async () =>
  {
    // the vanilla registrations read these for their labels, and the trait text reads the names.
    globalThis.J = {};
    globalThis.TextManager = {
      param: paramId => [
        'Max HP', 'Max MP', 'Attack', 'Defense', 'M.Attack', 'M.Defense', 'Agility', 'Luck',
      ][paramId],
      bparamDescription: () => '',
      xparam: () => '',
      xparamDescription: () => '',
      sparam: sparamId => [
        'Aggro', 'Parry', 'Recovery Rate', 'Item Effects', 'Magi Cost',
        'Tech Cost', 'Phys Dmg Rate', 'Magi Dmg Rate', 'Env Dmg Rate', 'Experience UP',
      ][sparamId],
      sparamDescription: () => '',
      maxTp: () => '',
      har: () => '',
      harDescription: () => '',
    };

    // J-Base's globals, read the way a shipped plugin reads another ship's classes.
    ({ default: RPG_Trait } = await import(
      '../../../../../../src/plugins/_base/core/database/_data/RPG_Trait.js'));
    globalThis.RPG_Trait = RPG_Trait;
    ({ default: globalThis.TraitResolver } = await import(
      '../../../../../../src/plugins/_base/core/managers/TraitResolver.js'));
    ({ default: globalThis.ParameterTraitMap } = await import(
      '../../../../../../src/plugins/_base/core/core/ParameterTraitMap.js'));
    ({ default: globalThis.ParameterRegistry } = await import(
      '../../../../../../src/plugins/_base/core/core/ParameterRegistry.js'));
    const { default: VanillaParameterRegistration } = await import(
      '../../../../../../src/plugins/_base/core/core/registerVanillaParameters.js');
    VanillaParameterRegistration.registerAll();

    // J-Base's describer is its own service with its own tests; here it only answers what each state was given.
    globalThis.NotetagDescriber = {
      linesFor: dataRow => linesByStateId[dataRow.id] ?? [],
    };

    // the lines themselves are J-Base's real model, which reads the String.empty sentinel for its defaults.
    String.empty = '';
    ({ default: NotetagLine } = await import(
      '../../../../../../src/plugins/_base/core/models/NotetagLine.js'));

    ({ default: DifficultyEffects } = await import(
      '../../../../../../src/plugins/passive/ext/difficulty/services/DifficultyEffects.js'));
  });

  beforeEach(() =>
  {
    // the layers in force hand each side different states, so a side read from the other cannot pass.
    globalThis.$gameTemp = {
      actorDifficultyStateIds: () => [ 1, 3 ],
      enemyDifficultyStateIds: () => [ 2 ],
    };

    // no state carries a described tag unless a test says so.
    linesByStateId = {};
  });

  it('refuses to be constructed, being a static class', () =>
  {
    // Arrange & Act & Assert
    expect(() => new DifficultyEffects())
      .toThrow('This is a static class.');
  });

  //region states
  describe('stateIdsFor', () =>
  {
    it('answers every party state in force for the applied layer', () =>
    {
      // Arrange
      const applied = appliedLayer();

      // Act
      const stateIds = DifficultyEffects.stateIdsFor(applied, DifficultyEffects.Sides.ACTOR);

      // Assert
      expect(stateIds)
        .toEqual([ 1, 3 ]);
    });

    it('answers every enemy state in force for the applied layer', () =>
    {
      // Arrange
      const applied = appliedLayer();

      // Act
      const stateIds = DifficultyEffects.stateIdsFor(applied, DifficultyEffects.Sides.ENEMY);

      // Assert
      expect(stateIds)
        .toEqual([ 2 ]);
    });

    it('answers a layer\'s own party state', () =>
    {
      // Arrange- the two sides name different states, so reading the wrong field cannot pass.
      const drive = layer(501, 502);

      // Act
      const stateIds = DifficultyEffects.stateIdsFor(drive, DifficultyEffects.Sides.ACTOR);

      // Assert
      expect(stateIds)
        .toEqual([ 501 ]);
    });

    it('answers a layer\'s own enemy state', () =>
    {
      // Arrange
      const drive = layer(501, 502);

      // Act
      const stateIds = DifficultyEffects.stateIdsFor(drive, DifficultyEffects.Sides.ENEMY);

      // Assert
      expect(stateIds)
        .toEqual([ 502 ]);
    });

    it('answers nothing for a side the layer grants nothing', () =>
    {
      // Arrange- the enemy side still names a state, so "nothing at all" and "nothing here" differ.
      const drive = layer(0, 502);

      // Act
      const stateIds = DifficultyEffects.stateIdsFor(drive, DifficultyEffects.Sides.ACTOR);

      // Assert
      expect(stateIds)
        .toEqual([]);
    });
  });
  //endregion states

  //region traits
  describe('effectTraits', () =>
  {
    it('merges two traits on the same stat by adding their changes, and keeps another stat apart', () =>
    {
      // Arrange- ATK x2 and ATK x0.5 across two states net to x1.5; DEF x2 sits beside them untouched.
      seedStates({
        1: [ trait(21, 2, 2), trait(21, 3, 2) ],
        3: [ trait(21, 2, 0.5) ],
      });

      // Act
      const traits = DifficultyEffects.effectTraits([ 1, 3 ]);

      // Assert
      expect(triplesOf(traits))
        .toEqual([ [ 21, 2, 1.5 ], [ 21, 3, 2 ] ]);
    });

    it('drops a stat whose changes cancel out', () =>
    {
      // Arrange- ATK x2 and ATK x0 cancel exactly; DEF must survive to prove the rest stays.
      seedStates({
        1: [ trait(21, 2, 2), trait(21, 3, 2) ],
        3: [ trait(21, 2, 0) ],
      });

      // Act
      const traits = DifficultyEffects.effectTraits([ 1, 3 ]);

      // Assert
      expect(triplesOf(traits))
        .toEqual([ [ 21, 3, 2 ] ]);
    });

    it('leaves out the transferable-traits marker', () =>
    {
      // Arrange- the marker sits beside a party ability, which must still come through.
      seedStates({
        1: [ trait(63, 0, 1), trait(64, 0, 1) ],
      });

      // Act
      const traits = DifficultyEffects.effectTraits([ 1 ]);

      // Assert
      expect(triplesOf(traits))
        .toEqual([ [ 64, 0, 1 ] ]);
    });

    it('orders traits by code, then by stat within a code', () =>
    {
      // Arrange- authored out of order on both counts. The two party abilities never merge, so only the
      // comparator can put them in order.
      seedStates({
        1: [ trait(64, 3, 1), trait(64, 1, 1), trait(23, 4, 0.5), trait(21, 3, 2), trait(21, 2, 2) ],
      });

      // Act
      const traits = DifficultyEffects.effectTraits([ 1 ]);

      // Assert
      expect(triplesOf(traits))
        .toEqual([ [ 21, 2, 2 ], [ 21, 3, 2 ], [ 23, 4, 0.5 ], [ 64, 1, 1 ], [ 64, 3, 1 ] ]);
    });
  });
  //endregion traits

  //region tags
  describe('effectLines', () =>
  {
    it('lists every line the given states\' tags are described with, state by state', () =>
    {
      // Arrange- state 2 carries a line too, and is not asked for.
      seedStates({
        1: [],
        2: [],
        3: [],
      });
      linesByStateId = {
        1: [ tagLine(0, 'first', '', 0) ],
        2: [ tagLine(0, 'elsewhere', '', 0) ],
        3: [ tagLine(0, 'second', '', 0), tagLine(0, 'third', '', 0) ],
      };

      // Act
      const lines = DifficultyEffects.effectLines([ 1, 3 ]);

      // Assert
      expect(lines.map(line => line.text))
        .toEqual([ 'first', 'second', 'third' ]);
    });
  });
  //endregion tags

  //region rows
  describe('rowFor', () =>
  {
    it('builds a row from the trait\'s own icon, name and value', () =>
    {
      // Arrange
      const attackUp = trait(21, 2, 2);

      // Act
      const row = DifficultyEffects.rowFor(attackUp, DifficultyEffects.Sides.ACTOR);

      // Assert
      expect(row)
        .toEqual({
          iconIndex: 931,
          name: 'Attack',
          value: '+100%',
          tone: 'easier',
        });
    });
  });

  describe('rowForLine', () =>
  {
    it('builds a row from the line\'s icon, words and value, toned by which way it cuts on that side', () =>
    {
      // Arrange- a line helping its holder, held by the enemies: harder for the player.
      const line = tagLine(12, 'Some effect', '+3', 1);

      // Act
      const row = DifficultyEffects.rowForLine(line, DifficultyEffects.Sides.ENEMY);

      // Assert- its words leave the value out, so the list keeps the value apart from them.
      expect(row)
        .toEqual({
          iconIndex: 12,
          name: 'Some effect',
          value: '+3',
          tone: 'harder',
          isProse: false,
        });
    });

    it('marks the row of a sentence, whose value sits inside its words', () =>
    {
      // Arrange- hurting its holder, held by the enemies: easier for the player.
      const line = tagLine(87, 'Enemies yield {value} EXP.', '2x', -1);

      // Act
      const row = DifficultyEffects.rowForLine(line, DifficultyEffects.Sides.ENEMY);

      // Assert
      expect(row)
        .toEqual({
          iconIndex: 87,
          name: 'Enemies yield {value} EXP.',
          value: '2x',
          tone: 'easier',
          isProse: true,
        });
    });
  });

  describe('toneFor', () =>
  {
    it('reads a stat boost as easier on the party\'s side', () =>
    {
      // Arrange
      const attackUp = trait(21, 2, 2);

      // Act
      const tone = DifficultyEffects.toneFor(attackUp, DifficultyEffects.Sides.ACTOR);

      // Assert
      expect(tone)
        .toBe('easier');
    });

    it('reads the same boost as harder on the enemies\' side', () =>
    {
      // Arrange
      const attackUp = trait(21, 2, 2);

      // Act
      const tone = DifficultyEffects.toneFor(attackUp, DifficultyEffects.Sides.ENEMY);

      // Assert
      expect(tone)
        .toBe('harder');
    });

    it('reads a stat cut as harder on the party\'s side', () =>
    {
      // Arrange- the near-miss of the boost: same stat, the other direction.
      const attackDown = trait(21, 2, 0.5);

      // Act
      const tone = DifficultyEffects.toneFor(attackDown, DifficultyEffects.Sides.ACTOR);

      // Assert
      expect(tone)
        .toBe('harder');
    });

    it('reads a stat cut as easier on the enemies\' side', () =>
    {
      // Arrange
      const attackDown = trait(21, 2, 0.5);

      // Act
      const tone = DifficultyEffects.toneFor(attackDown, DifficultyEffects.Sides.ENEMY);

      // Assert
      expect(tone)
        .toBe('easier');
    });

    it('reads a cost rise as harder on the party\'s side, since less is better for a cost', () =>
    {
      // Arrange- MCR up: an increase, on a stat where increases hurt.
      const magiCostUp = trait(23, 4, 2);

      // Act
      const tone = DifficultyEffects.toneFor(magiCostUp, DifficultyEffects.Sides.ACTOR);

      // Assert
      expect(tone)
        .toBe('harder');
    });

    it('reads less damage taken as easier on the party\'s side', () =>
    {
      // Arrange- PDR down: a decrease, on a stat where decreases help.
      const physicalDamageDown = trait(23, 6, 0.5);

      // Act
      const tone = DifficultyEffects.toneFor(physicalDamageDown, DifficultyEffects.Sides.ACTOR);

      // Assert
      expect(tone)
        .toBe('easier');
    });

    it('reads an ex-parameter by its own value rather than around 1', () =>
    {
      // Arrange- CRI +50%. Read as a multiplier around 1, 0.5 would look like a cut.
      const critUp = trait(22, 2, 0.5);

      // Act
      const tone = DifficultyEffects.toneFor(critUp, DifficultyEffects.Sides.ACTOR);

      // Assert
      expect(tone)
        .toBe('easier');
    });

    it('reads a negative ex-parameter as a cut', () =>
    {
      // Arrange- CRI -10%, the near-miss of the boost above.
      const critDown = trait(22, 2, -0.1);

      // Act
      const tone = DifficultyEffects.toneFor(critDown, DifficultyEffects.Sides.ACTOR);

      // Assert
      expect(tone)
        .toBe('harder');
    });

    it('reads less element damage taken as easier on the party\'s side', () =>
    {
      // Arrange- element 2 damage taken x0.5.
      const elementResist = trait(11, 2, 0.5);

      // Act
      const tone = DifficultyEffects.toneFor(elementResist, DifficultyEffects.Sides.ACTOR);

      // Assert
      expect(tone)
        .toBe('easier');
    });

    it('reads more element damage taken as harder on the party\'s side', () =>
    {
      // Arrange- element 2 damage taken x1.5.
      const elementWeakness = trait(11, 2, 1.5);

      // Act
      const tone = DifficultyEffects.toneFor(elementWeakness, DifficultyEffects.Sides.ACTOR);

      // Assert
      expect(tone)
        .toBe('harder');
    });

    it('reads every stat a parameter trait can carry in one direction or the other', () =>
    {
      // Arrange- every key the three parameter families map to, so a stat missing from the catalog shows up here
      // rather than as a crash the first time a drive naming it is highlighted.
      const families = [
        [ 21, globalThis.ParameterTraitMap.BaseParameterKeys ],
        [ 22, globalThis.ParameterTraitMap.ExParameterKeys ],
        [ 23, globalThis.ParameterTraitMap.SpParameterKeys ],
      ];
      const boosts = families.flatMap(([ code, keys ]) => keys.map((unused, dataId) => trait(code, dataId, 1.5)));

      // Act
      const tones = boosts.map(boost => DifficultyEffects.toneFor(boost, DifficultyEffects.Sides.ACTOR));

      // Assert
      expect(tones)
        .toHaveLength(28);
      expect(tones.every(tone => tone === 'easier' || tone === 'harder'))
        .toBe(true);
    });

    it('reads an effect that is neither better nor worse as neutral', () =>
    {
      // Arrange- a party ability changes what the party does, not how well.
      const encounterHalf = trait(64, 0, 1);

      // Act
      const tone = DifficultyEffects.toneFor(encounterHalf, DifficultyEffects.Sides.ACTOR);

      // Assert
      expect(tone)
        .toBe('neutral');
    });
  });
  //endregion rows

  describe('rowsFor', () =>
  {
    it('lists one row per merged effect for a side of the applied layer', () =>
    {
      // Arrange- the party states in force (1 and 3) share ATK and add MCR; enemy state 2 must not appear.
      seedStates({
        1: [ trait(21, 2, 2) ],
        2: [ trait(21, 7, 3) ],
        3: [ trait(21, 2, 0.5), trait(23, 4, 0.5) ],
      });
      const applied = appliedLayer();

      // Act
      const rows = DifficultyEffects.rowsFor(applied, DifficultyEffects.Sides.ACTOR);

      // Assert
      expect(rows)
        .toEqual([
          {
            iconIndex: 931,
            name: 'Attack',
            value: '+50%',
            tone: 'easier',
          },
          {
            iconIndex: 964,
            name: 'Magi Cost',
            value: '-50%',
            tone: 'easier',
          },
        ]);
    });

    it('lists the rows of described tags after the rows of traits', () =>
    {
      // Arrange- state 3's tag is described as hurting its holder, which on the party's side reads harder.
      seedStates({
        1: [ trait(21, 2, 2) ],
        2: [],
        3: [],
      });
      linesByStateId = {
        3: [ tagLine(0, 'Some effect', '-3', -1) ],
      };
      const applied = appliedLayer();

      // Act
      const rows = DifficultyEffects.rowsFor(applied, DifficultyEffects.Sides.ACTOR);

      // Assert
      expect(rows)
        .toEqual([
          {
            iconIndex: 931,
            name: 'Attack',
            value: '+100%',
            tone: 'easier',
          },
          {
            iconIndex: 0,
            name: 'Some effect',
            value: '-3',
            tone: 'harder',
            isProse: false,
          },
        ]);
    });
  });
});
//endregion plugins/passive/ext/difficulty/services/difficulty-effects.test.js
