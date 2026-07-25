//region plugins/apt/ext/typed/managers/ap-manager.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('ApManager ext/typed augments (direct src import)', () =>
{
  let ApManager;
  let ApTypeKey;
  let ApTypeDisplayInfo;

  beforeAll(async () =>
  {
    vi.resetModules();

    // apply the ext/typed patch atop the real core ApManager, mirroring the real boot order.
    ({ default: ApManager } = await import('../../../../../../src/plugins/apt/core/managers/ApManager.js'));
    globalThis.ApManager = ApManager;

    ({ default: ApTypeKey } = await import('../../../../../../src/plugins/apt/ext/typed/_models/ApTypeKey.js'));
    ({ default: ApTypeDisplayInfo } = await import('../../../../../../src/plugins/apt/ext/typed/_models/ApTypeDisplayInfo.js'));

    String.empty = '';

    await import('../../../../../../src/plugins/apt/ext/typed/managers/ApManager.js');
  });

  afterEach(() =>
  {
    vi.restoreAllMocks();
  });

  function buildActor(overrides = {})
  {
    return {
      isDead: () => false,
      getAptitudeSources: () => [],
      hasLearnedAptitudeSkill: () => false,
      hasAptitudeProgress: () => false,
      initializeAptitudeProgress: vi.fn(),
      getAptitudeProgress: () => ({ hasLearning: () => false, initializeLearning: vi.fn(), learningBySkillId: () => ({ currentAp: 0, isLearned: () => false, setRequiredAp: vi.fn() }) }),
      setAptitudeProgress: vi.fn(),
      learnAptitudeSkill: vi.fn(),
      isLearnedSkill: () => false,
      learnSkill: vi.fn(),
      ...overrides,
    };
  }

  function makeTeachable({ skillId = 1, requiredAp = 5, typed = false, domain = 'element', id = 0 } = {})
  {
    return {
      skillId,
      requiredAp,
      isTyped: () => typed,
      apTypeKey: () => ({ domain, id }),
    };
  }

  describe('gainAp', () =>
  {
    it('routes through gainApUntypedOnly with the same arguments', () =>
    {
      // Arrange
      const spy = vi.spyOn(ApManager, 'gainApUntypedOnly')
        .mockImplementation(() => {});
      const actor = buildActor();

      // Act
      ApManager.gainAp(actor, 10, 'victory');

      // Assert
      expect(spy).toHaveBeenCalledWith(actor, 10, 'victory');
    });
  });

  describe('gainApUntypedOnly', () =>
  {
    it('does nothing when canGainAp rejects the actor/amount', () =>
    {
      // Arrange
      const actor = buildActor({ isDead: () => true });
      const source = { implementationType: () => 'skill', id: 1, isSkill: () => false, aptitudeTeachings: [ makeTeachable() ] };
      actor.getAptitudeSources = () => [ source ];

      // Act
      ApManager.gainApUntypedOnly(actor, 5, 'test');

      // Assert
      expect(actor.setAptitudeProgress).not.toHaveBeenCalled();
    });

    it('applies AP only to untyped teachables, skipping typed ones', () =>
    {
      // Arrange
      const untyped = makeTeachable({ skillId: 1, typed: false });
      const typed = makeTeachable({ skillId: 2, typed: true });
      const source = { implementationType: () => 'skill', id: 1, isSkill: () => false, aptitudeTeachings: [ untyped, typed ] };
      const actor = buildActor({ getAptitudeSources: () => [ source ] });
      const applySpy = vi.spyOn(ApManager, 'applyApToSource');

      // Act
      ApManager.gainApUntypedOnly(actor, 5, 'test');

      // Assert
      expect(applySpy).toHaveBeenCalledWith(actor, 'skill:1', [ untyped ], 5, 'test');
    });

    it('skips a source entirely when it has no untyped teachables', () =>
    {
      // Arrange
      const typed = makeTeachable({ skillId: 2, typed: true });
      const source = { implementationType: () => 'skill', id: 1, isSkill: () => false, aptitudeTeachings: [ typed ] };
      const actor = buildActor({ getAptitudeSources: () => [ source ] });
      const applySpy = vi.spyOn(ApManager, 'applyApToSource');

      // Act
      ApManager.gainApUntypedOnly(actor, 5, 'test');

      // Assert
      expect(applySpy).not.toHaveBeenCalled();
    });
  });

  describe('gainTypedAp', () =>
  {
    it('does nothing when canGainAp rejects the actor/amount', () =>
    {
      // Arrange
      const actor = buildActor({ isDead: () => true });
      const applySpy = vi.spyOn(ApManager, 'applyApToSource');

      // Act
      ApManager.gainTypedAp(actor, 5, 'element', 3, 'test');

      // Assert
      expect(applySpy).not.toHaveBeenCalled();
    });

    it('normalizes domain case/whitespace and matches only teachables with the exact domain+id', () =>
    {
      // Arrange
      const matching = makeTeachable({ skillId: 1, typed: true, domain: 'element', id: 3 });
      const wrongId = makeTeachable({ skillId: 2, typed: true, domain: 'element', id: 4 });
      const wrongDomain = makeTeachable({ skillId: 3, typed: true, domain: 'weapontype', id: 3 });
      const untypedTeachable = makeTeachable({ skillId: 4, typed: false });
      const source = {
        implementationType: () => 'skill',
        id: 1,
        isSkill: () => false,
        aptitudeTeachings: [ matching, wrongId, wrongDomain, untypedTeachable ],
      };
      const actor = buildActor({ getAptitudeSources: () => [ source ] });
      const applySpy = vi.spyOn(ApManager, 'applyApToSource');

      // Act
      ApManager.gainTypedAp(actor, 7, '  Element  ', 3, 'typed');

      // Assert
      expect(applySpy).toHaveBeenCalledWith(actor, 'skill:1', [ matching ], 7, 'typed');
    });

    it('skips a source entirely when it has no matching typed teachables', () =>
    {
      // Arrange
      const wrongDomain = makeTeachable({ skillId: 3, typed: true, domain: 'weapontype', id: 3 });
      const source = { implementationType: () => 'skill', id: 1, isSkill: () => false, aptitudeTeachings: [ wrongDomain ] };
      const actor = buildActor({ getAptitudeSources: () => [ source ] });
      const applySpy = vi.spyOn(ApManager, 'applyApToSource');

      // Act
      ApManager.gainTypedAp(actor, 7, 'element', 3, 'typed');

      // Assert
      expect(applySpy).not.toHaveBeenCalled();
    });
  });

  describe('resolveDomainId', () =>
  {
    beforeEach(() =>
    {
      globalThis.$dataSystem = {
        elements: [ null, 'Fire', 'Ice' ],
        weaponTypes: [ null, 'Sword', 'Axe' ],
        skillTypes: [ null, 'Magic', 'Special' ],
      };
    });

    it('takes the numeric fast-path when idOrName is already numeric', () =>
    {
      // Arrange/Act
      const result = ApManager.resolveDomainId('element', '2');

      // Assert
      expect(result).toEqual(2);
    });

    it('resolves an element name case-insensitively', () =>
    {
      // Arrange/Act
      const result = ApManager.resolveDomainId('element', 'fire');

      // Assert
      expect(result).toEqual(1);
    });

    it('resolves a weapon type name case-insensitively', () =>
    {
      // Arrange/Act
      const result = ApManager.resolveDomainId('weapontype', 'AXE');

      // Assert
      expect(result).toEqual(2);
    });

    it('resolves a skill type name case-insensitively', () =>
    {
      // Arrange/Act
      const result = ApManager.resolveDomainId('skilltype', 'magic');

      // Assert
      expect(result).toEqual(1);
    });

    it('returns NaN for an unrecognized domain', () =>
    {
      // Arrange/Act
      const result = ApManager.resolveDomainId('bogus', 'fire');

      // Assert
      expect(Number.isNaN(result)).toEqual(true);
    });

    it('returns NaN when the name is not found in the resolved list', () =>
    {
      // Arrange/Act
      const result = ApManager.resolveDomainId('element', 'nonexistent');

      // Assert
      expect(Number.isNaN(result)).toEqual(true);
    });
  });

  describe('apTypeDisplay', () =>
  {
    beforeEach(() =>
    {
      globalThis.$dataSystem = {
        elements: [ null, 'Fire', 'Ice' ],
        weaponTypes: [ null, 'Sword', 'Axe' ],
        skillTypes: [ null, 'Magic', 'Special' ],
      };
      globalThis.IconManager = {
        element: vi.fn().mockReturnValue(64),
        weaponType: vi.fn().mockReturnValue(97),
        skillType: vi.fn().mockReturnValue(79),
      };
    });

    it('resolves an element key to its name and icon', () =>
    {
      // Arrange/Act
      const result = ApManager.apTypeDisplay({ domain: ApTypeKey.DomainType.Element, id: 1 });

      // Assert
      expect(result).toBeInstanceOf(ApTypeDisplayInfo);
      expect(result.name).toEqual('Fire');
      expect(result.icon).toEqual(64);
    });

    it('resolves a weapon type key to its name and icon', () =>
    {
      // Arrange/Act
      const result = ApManager.apTypeDisplay({ domain: ApTypeKey.DomainType.Weapon, id: 2 });

      // Assert
      expect(result.name).toEqual('Axe');
      expect(result.icon).toEqual(97);
    });

    it('resolves a skill type key to its name and icon', () =>
    {
      // Arrange/Act
      const result = ApManager.apTypeDisplay({ domain: ApTypeKey.DomainType.Skill, id: 1 });

      // Assert
      expect(result.name).toEqual('Magic');
      expect(result.icon).toEqual(79);
    });

    it('falls back to a domain:id label with icon 0 for an unrecognized domain', () =>
    {
      // Arrange/Act
      const result = ApManager.apTypeDisplay({ domain: 'bogus', id: 5 });

      // Assert
      expect(result.name).toEqual('bogus:5');
      expect(result.icon).toEqual(0);
    });
  });
});
//endregion plugins/apt/ext/typed/managers/ap-manager.test.js
