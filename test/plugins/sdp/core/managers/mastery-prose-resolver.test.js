//region plugins/sdp/core/managers/mastery-prose-resolver.test.js
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

/**
 * The resolver's contract is that it fails closed: a template renders only when every token in it
 * resolves, because a half-filled sentence would show a player a number that is not the number, at
 * the exact moment they are deciding whether to spend twenty rank-ups. Tests pinning the empty string
 * are therefore paired with a positive case proving the render path actually runs.
 */
describe('MasteryProseResolver (direct src import)', () =>
{
  let MasteryProseResolver;

  const state = (id, note, traits = []) =>
    ({ id, note, traits, isState: () => true, isSkill: () => false });
  const skill = (id, note, extra = {}) =>
    ({ id, note, isState: () => false, isSkill: () => true, ...extra });

  const install = (masteryState, wrapperSkill) =>
  {
    globalThis.$dataStates = [];
    globalThis.$dataSkills = [];
    globalThis.$dataStates[masteryState.id] = masteryState;
    globalThis.$dataSkills[wrapperSkill.id] = wrapperSkill;
  };

  beforeAll(async () =>
  {
    Object.defineProperty(String, 'empty', { value: '', configurable: true });

    globalThis.$dataStates = [];
    globalThis.$dataSkills = [];
    globalThis.TextManager = { param: id => [ 'Max Life', 'Max Magi', 'Power', 'Endurance' ][id] };
    globalThis.RPG_Trait = (await import(
      '../../../../../src/plugins/_base/core/database/_data/RPG_Trait.js')).default;
    globalThis.ParameterTraitMap = (await import(
      '../../../../../src/plugins/_base/core/core/ParameterTraitMap.js')).default;

    ({ default: MasteryProseResolver } = await import(
      '../../../../../src/plugins/sdp/core/managers/MasteryProseResolver.js'));
  });

  afterEach(() =>
  {
    globalThis.$dataStates = [];
    globalThis.$dataSkills = [];
  });

  //region guards
  describe('guards', () =>
  {
    it('renders a template carrying no tokens at all', () =>
    {
      // Arrange
      install(state(1470, '<cdr:[30]>'), skill(1470, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('A warchief does not wait.', 1470);

      // Assert
      expect(result).toBe('A warchief does not wait.');
    });

    it('yields nothing for a blank template', () =>
    {
      // Arrange
      install(state(1470, '<cdr:[30]>'), skill(1470, String.empty));

      // Act
      const result = MasteryProseResolver.resolve(String.empty, 1470);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing when the mastery state does not exist', () =>
    {
      // Arrange
      install(state(1470, '<cdr:[30]>'), skill(1470, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('runs {v.cdr} shorter', 9999);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing when the wrapper skill does not exist', () =>
    {
      // Arrange: the state is present, so only the missing skill can be refusing it.
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataStates[1470] = state(1470, '<cdr:[30]>');

      // Act
      const result = MasteryProseResolver.resolve('runs {v.cdr} shorter', 1470);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing when one token of several cannot resolve', () =>
    {
      // Arrange: the first token is satisfiable, so only the second can be failing the render.
      install(state(1470, '<cdr:[30]>'), skill(1470, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('{v.cdr} shorter and {v.zzz} stolen.', 1470);

      // Assert
      expect(result).toBe(String.empty);
    });
  });
  //endregion guards

  //region tag namespace
  describe('tag namespace', () =>
  {
    it('renders a single-tag token into the sentence', () =>
    {
      // Arrange
      install(state(1470, '<cdr:[30]>'), skill(1470, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('Every cooldown runs {v.cdr} shorter.', 1470);

      // Assert
      expect(result).toBe('Every cooldown runs +30% shorter.');
    });

    it('reads the declared magnitude rather than the last argument', () =>
    {
      // Arrange: the final argument is a mode word, and quoting it would be nonsense.
      install(state(1101, '<skillHistoryBonus:[0, 6, 4, unique]>'), skill(1101, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('gain {v.skillHistoryBonus} damage', 1101);

      // Assert
      expect(result).toBe('gain +4% damage');
    });

    it('reads the magnitude of a tag that carries it first', () =>
    {
      // Arrange: the near-miss sibling of the case above, with the opposite shape.
      install(state(1271, '<onSelfHpHealMp:[10, 0]>'), skill(1271, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('returns {v.onSelfHpHealMp} as Magi', 1271);

      // Assert
      expect(result).toBe('returns +10% as Magi');
    });

    it('reads a bare tag written without brackets', () =>
    {
      // Arrange
      install(state(1571, '<sdpMultiplier:3>'), skill(1571, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('{v.sdpMultiplier} more points', 1571);

      // Assert
      expect(result).toBe('+3% more points');
    });

    it('reads a hyphenated tag through its camel spelling', () =>
    {
      // Arrange
      install(state(1320, '<bonus-hits-basic:2>'), skill(1320, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('lands {v.bonusHitsBasic} more times', 1320);

      // Assert
      expect(result).toBe('lands +2% more times');
    });

    it('renders a negative magnitude without inventing a plus sign', () =>
    {
      // Arrange
      install(state(1061, '<speedBoost:[-5]>'), skill(1061, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('slows by {v.speedBoost}', 1061);

      // Assert
      expect(result).toBe('slows by -5%');
    });

    it('phrases a tag holding a formula rather than a number', () =>
    {
      // Arrange
      install(state(1210, '<evaBuffPlus:[a.level]>'), skill(1210, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('climbs by {v.evaBuffPlus}', 1210);

      // Assert
      expect(result).toBe('climbs by your level');
    });

    it('refuses a bare token when occurrences disagree on their magnitude', () =>
    {
      // Arrange
      install(state(1191, '<boostElement:[8, 11]>\n<boostElement:[9, 22]>'), skill(1191, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('strikes {v.boostElement} harder', 1191);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('accepts a bare token when every occurrence agrees', () =>
    {
      // Arrange: six elements weakened by one third is one number, said once.
      install(state(1554, '<pierceElement:[4, 25]>\n<pierceElement:[5, 25]>'), skill(1554, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('pierces {v.pierceElement}', 1554);

      // Assert
      expect(result).toBe('pierces +25%');
    });

    it('picks the occurrence a selector names, leaving its sibling alone', () =>
    {
      // Arrange
      install(state(1191, '<boostElement:[8, 11]>\n<boostElement:[9, 22]>'), skill(1191, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('Void strikes {v.boostElement[9]} harder', 1191);

      // Assert
      expect(result).toBe('Void strikes +22% harder');
    });

    it('reads a selector as an argument index when it names no occurrence', () =>
    {
      // Arrange
      install(state(1421, '<spread:[33, 2]>'), skill(1421, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('within {v.spread[1]} tiles', 1421);

      // Assert
      expect(result).toBe('within +2% tiles');
    });

    it('yields nothing when a selector matches neither an occurrence nor an index', () =>
    {
      // Arrange
      install(state(1421, '<spread:[33, 2]>'), skill(1421, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('within {v.spread[7]}', 1421);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing for a selector on a tag with several occurrences and no match', () =>
    {
      // Arrange
      install(state(1191, '<boostElement:[8, 11]>\n<boostElement:[9, 22]>'), skill(1191, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('strikes {v.boostElement[4]}', 1191);

      // Assert
      expect(result).toBe(String.empty);
    });
  });
  //endregion tag namespace

  //region shaped argument edges
  describe('shaped argument edges', () =>
  {
    it('yields nothing when a shaped tag is missing the argument it declares', () =>
    {
      // Arrange: boostElement declares its magnitude second, and this occurrence has only one.
      install(state(1191, '<boostElement:[8]>'), skill(1191, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('strikes {v.boostElement} harder', 1191);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('phrases a shaped argument holding a formula rather than a number', () =>
    {
      // Arrange
      install(state(1441, '<onSelfHpHealHp:[a.level, 3]>'), skill(1441, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('splashes {v.onSelfHpHealHp}', 1441);

      // Assert
      expect(result).toBe('splashes your level');
    });

    it('ignores a declared reach that is not a number', () =>
    {
      // Arrange: the payload carries a real reach, proving the non-numeric one was skipped rather
      // than simply absent.
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[1001] = skill(1001, '<radius:7>', { damage: { formula: 'a.mat*3' } });
      globalThis.$dataStates[1121] = state(1121, '<autoExecuteSkill:[1001, enemiesNearby, 1, 180, near]>');
      globalThis.$dataSkills[1121] = skill(1121, String.empty);

      // Act
      const result = MasteryProseResolver.resolve('within {s.radius} tiles', 1121);

      // Assert
      expect(result).toBe('within 7 tiles');
    });

    it('yields nothing for a tag carrying no arguments at all', () =>
    {
      // Arrange
      install(state(1470, '<cdr:[]>'), skill(1470, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('runs {v.cdr} shorter', 1470);

      // Assert
      expect(result).toBe(String.empty);
    });
  });
  //endregion shaped argument edges

  //region parameter namespace
  describe('parameter namespace', () =>
  {
    it('reads a parameter from the trait encoding it', () =>
    {
      // Arrange: the second trait is a near-miss sibling that must not be chosen.
      const traits = [ { code: 21, dataId: 3, value: 1.06 }, { code: 21, dataId: 0, value: 0.98 } ];
      install(state(1141, String.empty, traits), skill(1141, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('Endurance {p.def}', 1141);

      // Assert
      expect(result).toBe('Endurance +6%');
    });

    it('reads the other trait of the same pair', () =>
    {
      // Arrange
      const traits = [ { code: 21, dataId: 3, value: 1.06 }, { code: 21, dataId: 0, value: 0.98 } ];
      install(state(1141, String.empty, traits), skill(1141, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('Max Life {p.mhp}', 1141);

      // Assert
      expect(result).toBe('Max Life -2%');
    });

    it('reads a parameter from its buff-rate tag when no trait carries it', () =>
    {
      // Arrange
      install(state(1144, '<grdBuffRate:[10]>'), skill(1144, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('Parry {p.grd}', 1144);

      // Assert
      expect(result).toBe('Parry +10%');
    });

    it('renders a flat buff without a percent sign', () =>
    {
      // Arrange: the near-miss sibling of the case above, differing only in the tag suffix.
      install(state(1180, '<grdBuffPlus:[1000]>'), skill(1180, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('Parry {p.grd}', 1180);

      // Assert
      expect(result).toBe('Parry +1000');
    });

    it('keeps the percentages inside a flat buff holding a formula', () =>
    {
      // Arrange
      install(state(1090, '<mdfBuffPlus:[a.def * 0.5]>'), skill(1090, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('Resist rises by {p.mdf}', 1090);

      // Assert
      expect(result).toBe('Resist rises by 50% of your Endurance');
    });

    it('reads a whole family of resistances as their shared magnitude', () =>
    {
      // Arrange
      const traits = [ { code: 11, dataId: 4, value: 0.67 }, { code: 11, dataId: 5, value: 0.67 } ];
      install(state(1164, String.empty, traits), skill(1164, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('elements lose {p.elementRate}', 1164);

      // Assert
      // the trait formatter flips the sign on purpose, so a resistance reads as damage taken.
      expect(result).toBe('elements lose -33%');
    });

    it('refuses a family whose members disagree', () =>
    {
      // Arrange
      const traits = [ { code: 11, dataId: 4, value: 0.67 }, { code: 11, dataId: 5, value: 0.34 } ];
      install(state(1164, String.empty, traits), skill(1164, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('elements lose {p.elementRate}', 1164);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing for a parameter the row does not carry', () =>
    {
      // Arrange
      install(state(1141, String.empty, [ { code: 21, dataId: 3, value: 1.06 } ]), skill(1141, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('Force {p.mat}', 1141);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing for a parameter no trait encodes and no tag carries', () =>
    {
      // Arrange
      install(state(1141, String.empty, []), skill(1141, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('Crit Block {p.ctr}', 1141);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('reads a parameter off the payload rather than the mastery', () =>
    {
      // Arrange: the mastery itself carries a decoy trait that must not be read.
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataStates[1011] = state(1011, String.empty, [ { code: 21, dataId: 2, value: 1.05 } ]);
      globalThis.$dataStates[1131] = state(1131, '<autoApplyState:[1011, time, 60]>', [ { code: 21, dataId: 2, value: 9 } ]);
      globalThis.$dataSkills[1131] = skill(1131, String.empty);

      // Act
      const result = MasteryProseResolver.resolve('Power {d.atk}', 1131);

      // Assert
      expect(result).toBe('Power +5%');
    });

    it('yields nothing when the payload is a skill, which carries no traits', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[1001] = skill(1001, '<radius:3>', { damage: { formula: 'a.mat*3' } });
      globalThis.$dataStates[1121] = state(1121, '<autoExecuteSkill:[1001, time, 180]>');
      globalThis.$dataSkills[1121] = skill(1121, String.empty);

      // Act
      const result = MasteryProseResolver.resolve('Power {d.atk}', 1121);

      // Assert
      expect(result).toBe(String.empty);
    });
  });
  //endregion parameter namespace

  //region remaining resolution paths
  describe('remaining resolution paths', () =>
  {
    it('reads a parameter from a plain tag bearing its own name', () =>
    {
      // Arrange: lifesteal is stored as its own tag rather than a buff tag or a trait.
      install(state(1420, '<lst:15>'), skill(1420, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('{p.lst} Lifesteal', 1420);

      // Assert
      expect(result).toBe('+15% Lifesteal');
    });

    it('yields nothing for a trait family read off a skill payload', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[1001] = skill(1001, '<radius:3>', { damage: { formula: 'a.mat*3' } });
      globalThis.$dataStates[1121] = state(1121, '<autoExecuteSkill:[1001, time, 180]>');
      globalThis.$dataSkills[1121] = skill(1121, String.empty);

      // Act
      const result = MasteryProseResolver.resolve('elements lose {d.elementRate}', 1121);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing for a trait family the row carries none of', () =>
    {
      // Arrange: the row has traits, just not of this family, so an empty filter is what refuses it.
      install(state(1164, String.empty, [ { code: 21, dataId: 3, value: 1.1 } ]), skill(1164, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('elements lose {p.elementRate}', 1164);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing for a chance read off a skill payload', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[1121] = skill(1121, String.empty);
      globalThis.$dataStates[1121] = skill(1121, String.empty);

      // Act
      const result = MasteryProseResolver.resolve('{s.chance} of hits', 1121);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('ignores a stack cap that is not a number', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataStates[1035] = state(1035, '<stackMax:many>');
      globalThis.$dataStates[1215] = state(1215, '<autoApplyState:[1035, stand, 120]>');
      globalThis.$dataSkills[1215] = skill(1215, String.empty);

      // Act
      const result = MasteryProseResolver.resolve('{s.stacks} layers', 1215);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('renders a negative shaped magnitude without a plus sign', () =>
    {
      // Arrange: the near-miss sibling of the positive shaped-magnitude cases above.
      install(state(1421, '<spread:[-5, 2]>'), skill(1421, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('spreads {v.spread}', 1421);

      // Assert
      expect(result).toBe('spreads -5%');
    });
  });
  //endregion remaining resolution paths

  //region structural namespace
  describe('structural namespace', () =>
  {
    it('phrases the gate off the wrapper skill', () =>
    {
      // Arrange
      install(state(1161, String.empty), skill(1161, '<passiveSourceRule:[hpBelow, 20]>'));

      // Act
      const result = MasteryProseResolver.resolve('While {s.gate}', 1161);

      // Assert
      expect(result).toBe('While below 20% Life');
    });

    it('reads the cadence from its declared argument', () =>
    {
      // Arrange
      install(state(1121, '<autoExecuteSkill:[1001, enemiesNearby, 1, 180, 3]>'), skill(1121, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('Every {s.interval}', 1121);

      // Assert
      expect(result).toBe('Every 3 seconds');
    });

    it('finds the cadence in a shorter form of the same tag', () =>
    {
      // Arrange: the near-miss sibling, three arguments instead of five.
      install(state(1281, '<autoExecuteSkill:[1021, time, 480]>'), skill(1281, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('Every {s.interval}', 1281);

      // Assert
      expect(result).toBe('Every 8 seconds');
    });

    it('reads a reach declared on the tag itself', () =>
    {
      // Arrange
      install(state(1121, '<autoExecuteSkill:[1001, enemiesNearby, 1, 180, 3]>'), skill(1121, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('within {s.radius} tiles', 1121);

      // Assert
      expect(result).toBe('within 3 tiles');
    });

    it('falls back to the payload for a reach the tag does not declare', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[1021] = skill(1021, '<proximity:2.5>', { damage: { formula: 'a.mdf' } });
      globalThis.$dataStates[1281] = state(1281, '<autoExecuteSkill:[1021, time, 480]>');
      globalThis.$dataSkills[1281] = skill(1281, String.empty);

      // Act
      const result = MasteryProseResolver.resolve('within {s.radius} tiles', 1281);

      // Assert
      expect(result).toBe('within 2.5 tiles');
    });

    it('never reads a cadence as a reach', () =>
    {
      // Arrange: the short form has no reach at all, and 480 is frames.
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[1021] = skill(1021, '<direct>', { damage: { formula: 'a.mdf' } });
      globalThis.$dataStates[1281] = state(1281, '<autoExecuteSkill:[1021, time, 480]>');
      globalThis.$dataSkills[1281] = skill(1281, String.empty);

      // Act
      const result = MasteryProseResolver.resolve('within {s.radius} tiles', 1281);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('reads the payload duration in seconds', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataStates[1041] = state(1041, '<stateDuration:90>');
      globalThis.$dataStates[1241] = state(1241, '<autoApplyState:[1041, hpDmg, 480]>');
      globalThis.$dataSkills[1241] = skill(1241, String.empty);

      // Act
      const result = MasteryProseResolver.resolve('for {s.duration}', 1241);

      // Assert
      expect(result).toBe('for 1.5 seconds');
    });

    it('reads the payload stack cap', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataStates[1035] = state(1035, '<stackMax:4>');
      globalThis.$dataStates[1215] = state(1215, '<autoApplyState:[1035, stand, 120]>');
      globalThis.$dataSkills[1215] = skill(1215, String.empty);

      // Act
      const result = MasteryProseResolver.resolve('{s.stacks} layers', 1215);

      // Assert
      expect(result).toBe('4 layers');
    });

    it('reads the history window from the tag that declares one', () =>
    {
      // Arrange
      install(state(1101, '<skillHistoryBonus:[0, 6, 4, unique]>'), skill(1101, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('in the last {s.window}', 1101);

      // Assert
      expect(result).toBe('in the last 6 seconds');
    });

    it('falls back to the gate for a window no tag declares', () =>
    {
      // Arrange
      install(state(1231, '<speedBoost:5>'), skill(1231, '<passiveSourceRule:[attackedWithin, 60]>'));

      // Act
      const result = MasteryProseResolver.resolve('For {s.window}', 1231);

      // Assert
      expect(result).toBe('For 1 seconds');
    });

    it('reads a chance declared by a tag', () =>
    {
      // Arrange
      install(state(1151, '<onCritApply:[1021, 50]>'), skill(1151, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('{s.chance} to sink venom', 1151);

      // Assert
      expect(result).toBe('50% to sink venom');
    });

    it('reads a chance from an on-hit trait when no tag declares one', () =>
    {
      // Arrange
      install(state(1471, String.empty, [ { code: 32, dataId: 18, value: 0.1 } ]), skill(1471, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('{s.chance} of your hits', 1471);

      // Assert
      expect(result).toBe('10% of your hits');
    });

    it('yields nothing for a chance nothing declares', () =>
    {
      // Arrange
      install(state(1471, String.empty, []), skill(1471, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('{s.chance} of your hits', 1471);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('reads a count declared on the wrapper skill', () =>
    {
      // Arrange
      install(state(1345, String.empty), skill(1345, '<purgeStates:[negative, false, 2]>'));

      // Act
      const result = MasteryProseResolver.resolve('stripping {s.count} afflictions', 1345);

      // Assert
      expect(result).toBe('stripping 2 afflictions');
    });

    it('prefers a count declared on the mastery state over the wrapper', () =>
    {
      // Arrange: both rows declare one, and the state's must win.
      install(
        state(1345, '<purgeStates:[negative, false, 4]>'),
        skill(1345, '<purgeStates:[negative, false, 2]>'));

      // Act
      const result = MasteryProseResolver.resolve('stripping {s.count} afflictions', 1345);

      // Assert
      expect(result).toBe('stripping 4 afflictions');
    });

    it('reads a count declared on the mastery state', () =>
    {
      // Arrange
      install(state(1425, '<spreadPerTick:3>'), skill(1425, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('taking {s.count} more', 1425);

      // Assert
      expect(result).toBe('taking 3 more');
    });

    it('reads a per-stack divisor from the state that declares it', () =>
    {
      // Arrange
      install(state(1131, '<passiveStateCount:[1011, lessIsMoreHp, 4]>'), skill(1131, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('every {s.perStack} missing', 1131);

      // Assert
      expect(result).toBe('every 4% missing');
    });

    it('reads a per-stack divisor from the wrapper skill instead', () =>
    {
      // Arrange: the near-miss sibling, same tag on the other row.
      install(state(1411, String.empty), skill(1411, '<passiveStateCount:[1411, enemiesNearby, 1]>'));

      // Act
      const result = MasteryProseResolver.resolve('every {s.perStack}', 1411);

      // Assert
      expect(result).toBe('every 1%');
    });

    it('yields nothing for a per-stack divisor nothing declares', () =>
    {
      // Arrange
      install(state(1131, String.empty), skill(1131, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('every {s.perStack}', 1131);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('phrases a payload damage formula', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[1001] = skill(1001, '<radius:3>', { damage: { formula: 'a.mat*3' } });
      globalThis.$dataStates[1121] = state(1121, '<autoExecuteSkill:[1001, time, 180]>');
      globalThis.$dataSkills[1121] = skill(1121, String.empty);

      // Act
      const result = MasteryProseResolver.resolve('bites for {s.payload}', 1121);

      // Assert
      expect(result).toBe('bites for 3x your Force');
    });

    it('prefers a shield formula tag over a damage formula', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataStates[1001] = state(1001, '<shield:[a.mhp*0.05]>');
      globalThis.$dataStates[1111] = state(1111, '<autoApplyState:[1001, time, 3600]>');
      globalThis.$dataSkills[1111] = skill(1111, String.empty);

      // Act
      const result = MasteryProseResolver.resolve('a ward worth {s.payload}', 1111);

      // Assert
      expect(result).toBe('a ward worth 5% of your Max Life');
    });

    it('phrases an hp formula tag when no shield is present', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataStates[1021] = state(1021, '<hpFormula:[b.mhp*0.015]>');
      globalThis.$dataStates[1151] = state(1151, '<onCritApply:[1021, 50]>');
      globalThis.$dataSkills[1151] = skill(1151, String.empty);

      // Act
      const result = MasteryProseResolver.resolve('draining {s.payload}', 1151);

      // Assert
      expect(result).toBe('draining 1.5% of their Max Life');
    });

    it('yields nothing for a payload carrying no formula at all', () =>
    {
      // Arrange
      install(state(1470, '<cdr:[30]>'), skill(1470, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('worth {s.payload}', 1470);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing for a payload whose damage block has no formula', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[1001] = skill(1001, '<radius:3>', { damage: { formula: '' } });
      globalThis.$dataStates[1121] = state(1121, '<autoExecuteSkill:[1001, time, 180]>');
      globalThis.$dataSkills[1121] = skill(1121, String.empty);

      // Act
      const result = MasteryProseResolver.resolve('bites for {s.payload}', 1121);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('lists the food groups a tier extends', () =>
    {
      // Arrange
      install(state(1496, '<extendType:food-protein>\n<extendType:food-veggie>\n<extendType:food-fruit>'), skill(1496, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('{s.foodTypes} last longer', 1496);

      // Assert
      expect(result).toBe('protein, veggie and fruit last longer');
    });

    it('lists a single food group without an and', () =>
    {
      // Arrange
      install(state(1494, '<extendType:food-protein>'), skill(1494, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('{s.foodTypes} last longer', 1494);

      // Assert
      expect(result).toBe('protein last longer');
    });

    it('yields nothing for food groups when none are declared', () =>
    {
      // Arrange
      install(state(1491, String.empty), skill(1491, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('{s.foodTypes} last longer', 1491);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('lists the parameters a tier raises, ignoring those it lowers', () =>
    {
      // Arrange: the lowered trait is the near-miss sibling that must not be listed.
      const traits = [
        { code: 21, dataId: 2, value: 1.25 },
        { code: 21, dataId: 3, value: 1.25 },
        { code: 21, dataId: 0, value: 0.8 },
      ];
      install(state(1497, String.empty, traits), skill(1497, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('{s.statList} across the board', 1497);

      // Assert
      expect(result).toBe('Power and Endurance across the board');
    });

    it('yields nothing for a stat list when nothing is raised', () =>
    {
      // Arrange
      install(state(1497, String.empty, [ { code: 21, dataId: 0, value: 0.8 } ]), skill(1497, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('{s.statList} across the board', 1497);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing for a stat list when the payload is a skill', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[1497] = skill(1497, String.empty);
      globalThis.$dataStates[1497] = skill(1497, String.empty);

      // Act
      const result = MasteryProseResolver.resolve('{s.statList} across', 1497);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing for a structural field it does not know', () =>
    {
      // Arrange
      install(state(1470, '<cdr:[30]>'), skill(1470, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('{s.nonsense}', 1470);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing for a cadence nothing declares', () =>
    {
      // Arrange
      install(state(1470, '<cdr:[30]>'), skill(1470, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('Every {s.interval}', 1470);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing for a window nothing declares', () =>
    {
      // Arrange
      install(state(1470, '<cdr:[30]>'), skill(1470, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('in {s.window}', 1470);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing for a duration nothing declares', () =>
    {
      // Arrange
      install(state(1470, '<cdr:[30]>'), skill(1470, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('for {s.duration}', 1470);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing for a stack cap nothing declares', () =>
    {
      // Arrange
      install(state(1470, '<cdr:[30]>'), skill(1470, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('{s.stacks} deep', 1470);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('yields nothing for a count nothing declares', () =>
    {
      // Arrange
      install(state(1470, '<cdr:[30]>'), skill(1470, String.empty));

      // Act
      const result = MasteryProseResolver.resolve('{s.count} more', 1470);

      // Assert
      expect(result).toBe(String.empty);
    });
  });
  //endregion structural namespace

  //region canResolve
  describe('canResolve', () =>
  {
    it('reports true for a template whose tokens all resolve', () =>
    {
      // Arrange
      install(state(1470, '<cdr:[30]>'), skill(1470, String.empty));

      // Act
      const result = MasteryProseResolver.canResolve('runs {v.cdr} shorter', 1470);

      // Assert
      expect(result).toBe(true);
    });

    it('reports false for a template carrying an unresolvable token', () =>
    {
      // Arrange
      install(state(1470, '<cdr:[30]>'), skill(1470, String.empty));

      // Act
      const result = MasteryProseResolver.canResolve('Endurance {p.def}.', 1470);

      // Assert
      expect(result).toBe(false);
    });
  });
  //endregion canResolve

  //region construction
  describe('construction', () =>
  {
    it('refuses to be instantiated, being a static class', () =>
    {
      // Arrange & Act & Assert
      expect(() => new MasteryProseResolver()).toThrow('This is a static class.');
    });
  });
  //endregion construction
});
//endregion plugins/sdp/core/managers/mastery-prose-resolver.test.js