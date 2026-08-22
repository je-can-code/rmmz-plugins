//region plugins/resources/_component/heal-event-manager.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import HealEventManager from '../../../../src/plugins/resources/ext/abs/managers/HealEventManager.js';

const TRIGGERS = [ 'Hp', 'Mp', 'Tp' ];
const OUTPUTS = [ 'Hp', 'Mp', 'Tp' ];

/**
 * Builds the full J.RESOURCES.EXT.ABS.RegExp namespace with a unique placeholder object per key,
 * so a mocked RPGManager can distinguish which tag lookup is in flight by object identity.
 * @returns {Record<string, object>}
 */
function buildRegexNamespace()
{
  const namespace = {};

  for (const family of [ 'Self', 'Ally' ])
  {
    for (const output of OUTPUTS)
    {
      // one "Any" trigger variant per output, matching On${family}AnyHeal${output}.
      namespace[`On${family}AnyHeal${output}`] = {};

      for (const trigger of TRIGGERS)
      {
        // one specific-trigger variant per trigger/output pair.
        namespace[`On${family}${trigger}Heal${output}`] = {};
      }
    }
  }

  return namespace;
}

/**
 * Builds a minimal fake battler with just enough surface for HealEventManager.
 * @param {string} uuid
 * @param {object[]} notes
 * @returns {object}
 */
function buildBattler(uuid, notes = [])
{
  return {
    getUuid: () => uuid,
    getAllNotes: () => notes,
    gainHpFromResource: vi.fn(),
    gainMpFromResource: vi.fn(),
    gainTpFromResource: vi.fn(),
  };
}

describe('HealEventManager (resources ext/abs)', () =>
{
  let regexNamespace;
  let getArraysFromNotesByRegexMock;

  beforeEach(() =>
  {
    HealEventManager._currentDepth = 0;
    HealEventManager._selfBlockedTags.clear();

    regexNamespace = buildRegexNamespace();

    globalThis.J = {
      BASE: { Resource: { HP: 'hp', MP: 'mp', TP: 'tp' } },
      RESOURCES: {
        EXT: {
          ABS: {
            Metadata: { healChainDepth: 2 },
            RegExp: regexNamespace,
          },
        },
      },
    };

    getArraysFromNotesByRegexMock = vi.fn(() => []);
    globalThis.RPGManager = { getArraysFromNotesByRegex: getArraysFromNotesByRegexMock };
    globalThis.JABS_AiManager = {
      getBattlerByUuid: vi.fn(() => undefined),
      getAlliedBattlersWithinRange: vi.fn(() => []),
      getAlliedBattlers: vi.fn(() => []),
    };
  });

  afterEach(() =>
  {
    delete globalThis.J;
    delete globalThis.RPGManager;
    delete globalThis.JABS_AiManager;
  });

  it('does nothing when the recipient has no matching tags', () =>
  {
    const recipient = buildBattler('recipient');

    HealEventManager.dispatch(recipient, 'hp', 100);

    expect(recipient.gainHpFromResource).not.toHaveBeenCalled();
    expect(recipient.gainMpFromResource).not.toHaveBeenCalled();
    expect(recipient.gainTpFromResource).not.toHaveBeenCalled();
  });

  it('applies a proportional self-heal from a matching onSelf tag', () =>
  {
    const note = {};
    const recipient = buildBattler('recipient', [ note ]);

    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfHpHealMp) return [ [ 50, 0 ] ];
      return [];
    });

    HealEventManager.dispatch(recipient, 'hp', 100);

    // floor(100 * 50 / 100) = 50.
    expect(recipient.gainMpFromResource).toHaveBeenCalledWith(50);
  });

  it('does not apply a secondary heal when the computed amount rounds down to zero', () =>
  {
    const note = {};
    const recipient = buildBattler('recipient', [ note ]);

    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfHpHealMp) return [ [ 1, 0 ] ];
      return [];
    });

    // floor(10 * 1 / 100) = 0.
    HealEventManager.dispatch(recipient, 'hp', 10);

    expect(recipient.gainMpFromResource).not.toHaveBeenCalled();
  });

  it('respects a tag-level maxDepth override tighter than the global cap', () =>
  {
    const note = {};
    const recipient = buildBattler('recipient', [ note ]);

    // tag-authored maxDepth of 0 means it should never fire, even at the top-level dispatch
    // where _currentDepth is 1 during the cascade (dispatch increments before dispatching tags).
    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfHpHealMp) return [ [ 50, 0, 0 ] ];
      return [];
    });

    HealEventManager.dispatch(recipient, 'hp', 100);

    expect(recipient.gainMpFromResource).not.toHaveBeenCalled();
  });

  it('splashes the secondary heal to nearby allies when the tag range is positive', () =>
  {
    const note = {};
    const recipient = buildBattler('recipient', [ note ]);
    const ally = buildBattler('ally');

    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfHpHealHp) return [ [ 20, 3 ] ];
      return [];
    });

    const jabsRecipient = { getBattler: () => recipient };
    const jabsAlly = { getBattler: () => ally };

    globalThis.JABS_AiManager.getBattlerByUuid.mockImplementation(uuid =>
      (uuid === 'recipient' ? jabsRecipient : undefined));
    globalThis.JABS_AiManager.getAlliedBattlersWithinRange.mockReturnValue([ jabsRecipient, jabsAlly ]);

    HealEventManager.dispatch(recipient, 'hp', 100);

    // floor(100 * 20 / 100) = 20, applied to both the recipient (self) and the nearby ally,
    // but not double-applied to the recipient via the splash loop (it's filtered out there).
    expect(recipient.gainHpFromResource).toHaveBeenCalledWith(20);
    expect(recipient.gainHpFromResource).toHaveBeenCalledTimes(1);
    expect(ally.gainHpFromResource).toHaveBeenCalledWith(20);
  });

  it('applies onAlly tags to nearby observers within range when someone else is healed', () =>
  {
    const healTarget = buildBattler('healed');
    const observerNote = {};
    const observer = buildBattler('observer', [ observerNote ]);

    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnAllyHpHealTp) return [ [ 10, 5 ] ];
      return [];
    });

    const jabsHealTarget = { getBattler: () => healTarget, distanceToDesignatedTarget: () => 3 };
    const jabsObserver = { getBattler: () => observer };

    globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(jabsHealTarget);
    globalThis.JABS_AiManager.getAlliedBattlers.mockReturnValue([ jabsObserver ]);

    HealEventManager.dispatch(healTarget, 'hp', 100);

    // floor(100 * 10 / 100) = 10, applied to the observer's Tp since they're within range 5.
    expect(observer.gainTpFromResource).toHaveBeenCalledWith(10);
  });

  it('does not apply onAlly tags to observers outside the tag range', () =>
  {
    const healTarget = buildBattler('healed');
    const observerNote = {};
    const observer = buildBattler('observer', [ observerNote ]);

    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnAllyHpHealTp) return [ [ 10, 5 ] ];
      return [];
    });

    const jabsHealTarget = { getBattler: () => healTarget, distanceToDesignatedTarget: () => 6 };
    const jabsObserver = { getBattler: () => observer };

    globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(jabsHealTarget);
    globalThis.JABS_AiManager.getAlliedBattlers.mockReturnValue([ jabsObserver ]);

    HealEventManager.dispatch(healTarget, 'hp', 100);

    expect(observer.gainTpFromResource).not.toHaveBeenCalled();
  });

  it('never dispatches beyond the configured healChainDepth', () =>
  {
    const note = {};
    const recipient = buildBattler('recipient', [ note ]);

    // the third value is a per-tag cap of its own, deliberately far above anything reachable. Left to
    // default, it would equal the global cap and stop this tag on its own, so the game-wide gate would
    // never be the reason nothing happened.
    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfHpHealMp) return [ [ 50, 0, 99 ] ];
      return [];
    });

    // force _currentDepth to already be at the configured cap before dispatching.
    HealEventManager._currentDepth = globalThis.J.RESOURCES.EXT.ABS.Metadata.healChainDepth;

    HealEventManager.dispatch(recipient, 'hp', 100);

    expect(recipient.gainMpFromResource).not.toHaveBeenCalled();
    // depth must be restored, not left incremented, since dispatch bailed before entering the try block.
    expect(HealEventManager._currentDepth).toBe(globalThis.J.RESOURCES.EXT.ABS.Metadata.healChainDepth);
  });

  it('still dispatches on the last round below the configured healChainDepth', () =>
  {
    // Arrange- the far side of that boundary. One rung lower is the deepest cascade the game allows,
    // and a cap that stopped here would quietly shorten every chain by a round.
    const note = {};
    const recipient = buildBattler('recipient', [ note ]);

    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfHpHealMp) return [ [ 50, 0, 99 ] ];
      return [];
    });

    HealEventManager._currentDepth = globalThis.J.RESOURCES.EXT.ABS.Metadata.healChainDepth - 1;

    // Act
    HealEventManager.dispatch(recipient, 'hp', 100);

    // Assert
    expect(recipient.gainMpFromResource).toHaveBeenCalledWith(50);
  });

  //region which resource a trigger names
  it('routes an mp trigger through the mp tag family', () =>
  {
    // Arrange- the three resources share one dispatch, and the trigger only reaches the right tags
    // by way of the string-to-key conversion. A wrong mapping silently fires hp tags on mana heals.
    const note = {};
    const recipient = buildBattler('recipient', [ note ]);
    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfMpHealTp) return [ [ 50, 0 ] ];
      return [];
    });

    // Act
    HealEventManager.dispatch(recipient, 'mp', 100);

    // Assert
    expect(recipient.gainTpFromResource).toHaveBeenCalledWith(50);
  });

  it('routes a tp trigger through the tp tag family', () =>
  {
    // Arrange
    const note = {};
    const recipient = buildBattler('recipient', [ note ]);
    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfTpHealHp) return [ [ 50, 0 ] ];
      return [];
    });

    // Act
    HealEventManager.dispatch(recipient, 'tp', 100);

    // Assert
    expect(recipient.gainHpFromResource).toHaveBeenCalledWith(50);
  });
  //endregion which resource a trigger names

  //region the tag shape itself
  it('honors a per-tag depth override written as the tag\'s third value', () =>
  {
    // Arrange- a tag may cap its own chain shorter than the global setting, which is how a designer
    // stops one particular echo from participating in long chains without lowering the whole game's.
    const note = {};
    const recipient = buildBattler('recipient', [ note ]);
    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfHpHealMp) return [ [ 50, 0, 0 ] ];
      return [];
    });
    HealEventManager._currentDepth = 1;

    // Act
    HealEventManager.dispatch(recipient, 'hp', 100);

    // Assert
    expect(recipient.gainMpFromResource).not.toHaveBeenCalled();
  });

  it('ignores a malformed tag rather than reading undefined values out of it', () =>
  {
    // Arrange- a tag needs at least a percent and a range; one that parsed to a single value would
    // otherwise produce a range of `undefined` and compare every distance against it.
    const note = {};
    const recipient = buildBattler('recipient', [ note ]);
    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfHpHealMp) return [ [ 50 ] ];
      return [];
    });

    // Act
    HealEventManager.dispatch(recipient, 'hp', 100);

    // Assert
    expect(recipient.gainMpFromResource).not.toHaveBeenCalled();
  });

  it('also fires the any-trigger variant of a tag', () =>
  {
    // Arrange- the Any family exists so a designer can write one tag instead of three, and it is
    // collected alongside the specific one rather than instead of it.
    const note = {};
    const recipient = buildBattler('recipient', [ note ]);
    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfAnyHealMp) return [ [ 50, 0 ] ];
      return [];
    });

    // Act
    HealEventManager.dispatch(recipient, 'tp', 100);

    // Assert
    expect(recipient.gainMpFromResource).toHaveBeenCalledWith(50);
  });

  it('applies nothing when the proportion rounds down to zero', () =>
  {
    // Arrange- a 1% echo off a 10-point heal is zero, and popping a "0" over the player would be
    // worse than staying silent.
    const note = {};
    const recipient = buildBattler('recipient', [ note ]);
    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfHpHealMp) return [ [ 1, 0 ] ];
      return [];
    });

    // Act
    HealEventManager.dispatch(recipient, 'hp', 10);

    // Assert
    expect(recipient.gainMpFromResource).not.toHaveBeenCalled();
  });

  it('does not echo a tag back into itself within one chain', () =>
  {
    // Arrange- an hp tag that heals hp would otherwise re-enter its own dispatch forever; the block
    // is keyed per tag and per battler so only the self-echo is stopped.
    const note = {};
    const recipient = buildBattler('recipient', [ note ]);
    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfHpHealHp) return [ [ 50, 0 ] ];
      return [];
    });

    // Act
    HealEventManager.dispatch(recipient, 'hp', 100);

    // Assert: exactly one echo, not an unbounded cascade.
    expect(recipient.gainHpFromResource).toHaveBeenCalledTimes(1);
  });
  //endregion the tag shape itself

  //region the ally splash
  it('skips the ally splash entirely for a battler that is not on the JABS map', () =>
  {
    // Arrange- an actor in a menu or an enemy already despawned has no JABS battler to measure
    // range from, and asking for allies around nothing would throw.
    const note = {};
    const recipient = buildBattler('recipient', [ note ]);
    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfHpHealMp) return [ [ 50, 5 ] ];
      return [];
    });
    globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(undefined);

    // Act
    HealEventManager.dispatch(recipient, 'hp', 100);

    // Assert: the self-heal still lands; only the splash is skipped.
    expect(recipient.gainMpFromResource).toHaveBeenCalledWith(50);
    expect(globalThis.JABS_AiManager.getAlliedBattlersWithinRange).not.toHaveBeenCalled();
  });

  it('does not go looking for allies at all when the tag names a range of zero', () =>
  {
    // Arrange- a range of zero is how a designer writes "me only", and it is the cheap case: asking
    // JABS for everyone standing nearby is a map-wide walk that a self-only tag has no use for. The
    // recipient is deliberately on the map with an ally right beside them, so the range is the only
    // thing left that can keep the splash from happening.
    const note = {};
    const recipient = buildBattler('recipient', [ note ]);
    const ally = buildBattler('ally');
    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfHpHealMp) return [ [ 50, 0 ] ];
      return [];
    });
    const jabsRecipient = { getBattler: () => recipient };
    const jabsAlly = { getBattler: () => ally };
    globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(jabsRecipient);
    globalThis.JABS_AiManager.getAlliedBattlersWithinRange.mockReturnValue([ jabsAlly ]);

    // Act
    HealEventManager.dispatch(recipient, 'hp', 100);

    // Assert- the self-heal still lands, which is what proves the tag was processed at all.
    expect(recipient.gainMpFromResource).toHaveBeenCalledWith(50);
    expect(globalThis.JABS_AiManager.getAlliedBattlersWithinRange).not.toHaveBeenCalled();
    expect(ally.gainMpFromResource).not.toHaveBeenCalled();
  });

  it('never asks for the allies of a battler that is not on the JABS map', () =>
  {
    // Arrange- an actor healed from a menu has no JABS battler, and handing that nothing to the
    // proximity lookup is what the early return exists to prevent. The tag's range is zero so the
    // onSelf half never consults JABS, leaving the onAlly half as the only possible caller.
    const note = {};
    const recipient = buildBattler('recipient', [ note ]);
    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfHpHealMp) return [ [ 50, 0 ] ];
      return [];
    });
    globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(undefined);

    // Act
    HealEventManager.dispatch(recipient, 'hp', 100);

    // Assert- the heal itself still happened, so the silence below is the guard and not an early exit.
    expect(recipient.gainMpFromResource).toHaveBeenCalledWith(50);
    expect(globalThis.JABS_AiManager.getAlliedBattlers).not.toHaveBeenCalled();
  });

  it('stops a self-echo from re-entering the same tag when the heal really does re-dispatch', () =>
  {
    // Arrange- in-game the resource gain itself dispatches again, which is the whole reason the
    // block exists. The mocks elsewhere in this file stop short of that, so this one closes the loop
    // on purpose and checks that the second pass finds its own key already blocked.
    const note = {};
    const recipient = buildBattler('recipient', [ note ]);
    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfHpHealHp) return [ [ 50, 0 ] ];
      return [];
    });
    recipient.gainHpFromResource = vi.fn(amount => HealEventManager.dispatch(recipient, 'hp', amount));

    // Act
    HealEventManager.dispatch(recipient, 'hp', 100);

    // Assert: one echo, and the re-entry it triggers finds the block rather than cascading.
    expect(recipient.gainHpFromResource).toHaveBeenCalledTimes(1);
  });
  //endregion the ally splash

  //region what an onlooking ally reacts to
  /**
   * Builds the pair of JABS battlers the observer path walks, at a chosen distance apart.
   * @param {object} healTarget The battler that was healed.
   * @param {object} observer The ally watching it happen.
   * @param {number} distance How far apart they stand.
   */
  function stageObserver(healTarget, observer, distance)
  {
    const jabsHealTarget = {
      getBattler: () => healTarget,
      distanceToDesignatedTarget: () => distance,
    };
    const jabsObserver = { getBattler: () => observer };

    globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(jabsHealTarget);
    globalThis.JABS_AiManager.getAlliedBattlers.mockReturnValue([ jabsHealTarget, jabsObserver ]);
  }

  it('never treats the healed battler as its own observer', () =>
  {
    // Arrange- the healed battler is in its own allied list, and reacting to itself here would
    // double every onSelf tag it already processed.
    const note = {};
    const healTarget = buildBattler('healed', [ note ]);
    const observer = buildBattler('observer', []);
    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnAllyHpHealMp) return [ [ 50, 5 ] ];
      return [];
    });
    stageObserver(healTarget, observer, 1);

    // Act
    HealEventManager.dispatch(healTarget, 'hp', 100);

    // Assert
    expect(healTarget.gainMpFromResource).not.toHaveBeenCalled();
  });

  it('lets an observer react when the healed ally is inside its tag range', () =>
  {
    // Arrange
    const note = {};
    const healTarget = buildBattler('healed', []);
    const observer = buildBattler('observer', [ note ]);
    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnAllyHpHealMp) return [ [ 50, 5 ] ];
      return [];
    });
    stageObserver(healTarget, observer, 3);

    // Act
    HealEventManager.dispatch(healTarget, 'hp', 100);

    // Assert
    expect(observer.gainMpFromResource).toHaveBeenCalledWith(50);
  });

  it('holds an observer to its own per-tag depth cap', () =>
  {
    // Arrange
    const note = {};
    const healTarget = buildBattler('healed', []);
    const observer = buildBattler('observer', [ note ]);
    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnAllyHpHealMp) return [ [ 50, 5, 0 ] ];
      return [];
    });
    stageObserver(healTarget, observer, 1);
    HealEventManager._currentDepth = 1;

    // Act
    HealEventManager.dispatch(healTarget, 'hp', 100);

    // Assert
    expect(observer.gainMpFromResource).not.toHaveBeenCalled();
  });

  it('applies nothing to an observer when its proportion rounds down to zero', () =>
  {
    // Arrange
    const note = {};
    const healTarget = buildBattler('healed', []);
    const observer = buildBattler('observer', [ note ]);
    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnAllyHpHealMp) return [ [ 1, 5 ] ];
      return [];
    });
    stageObserver(healTarget, observer, 1);

    // Act
    HealEventManager.dispatch(healTarget, 'hp', 10);

    // Assert
    expect(observer.gainMpFromResource).not.toHaveBeenCalled();
  });
  //endregion what an onlooking ally reacts to
});
//endregion plugins/resources/_component/heal-event-manager.test.js
