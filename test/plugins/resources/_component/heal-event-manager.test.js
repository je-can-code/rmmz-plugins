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

    getArraysFromNotesByRegexMock.mockImplementation((_data, regexp) =>
    {
      if (regexp === regexNamespace.OnSelfHpHealMp) return [ [ 50, 0 ] ];
      return [];
    });

    // force _currentDepth to already be at the configured cap before dispatching.
    HealEventManager._currentDepth = globalThis.J.RESOURCES.EXT.ABS.Metadata.healChainDepth;

    HealEventManager.dispatch(recipient, 'hp', 100);

    expect(recipient.gainMpFromResource).not.toHaveBeenCalled();
    // depth must be restored, not left incremented, since dispatch bailed before entering the try block.
    expect(HealEventManager._currentDepth).toBe(globalThis.J.RESOURCES.EXT.ABS.Metadata.healChainDepth);
  });
});
//endregion plugins/resources/_component/heal-event-manager.test.js
