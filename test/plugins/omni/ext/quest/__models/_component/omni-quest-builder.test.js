//region plugins/omni/ext/quest/__models/_component/omni-quest-builder.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import OmniQuest from '../../../../../../../src/plugins/omni/ext/quest/__models/OmniQuest.js';
import OmniQuestBuilder from '../../../../../../../src/plugins/omni/ext/quest/__models/OmniQuestBuilder.js';

describe('OmniQuestBuilder (omni ext/quest, direct src import)', () =>
{
  beforeAll(() =>
  {
    // OmniQuestBuilder's private fields default to String.empty/Array.empty, the J-Base sentinel
    // polyfills normally installed by _base/_metadata/initialization.js. Define them directly here
    // rather than pulling in the whole of J-Base's boot sequence for two sentinel constants.
    if (Object.getOwnPropertyDescriptor(String, 'empty') === undefined)
    {
      Object.defineProperty(String, 'empty', { value: '', writable: false });
    }

    if (Object.getOwnPropertyDescriptor(Array, 'empty') === undefined)
    {
      Object.defineProperty(Array, 'empty', { enumerable: true, configurable: false, get: () => Array.of() });
    }
  });

  it('each fluent setter returns the builder instance for chaining', () =>
  {
    const builder = new OmniQuestBuilder();

    expect(builder.name('n')).toBe(builder);
    expect(builder.key('k')).toBe(builder);
    expect(builder.categoryKey('c')).toBe(builder);
    expect(builder.tagKeys([])).toBe(builder);
    expect(builder.unknownHint('h')).toBe(builder);
    expect(builder.overview('o')).toBe(builder);
    expect(builder.recommendedLevel(1)).toBe(builder);
    expect(builder.objectives([])).toBe(builder);
  });

  it('builds with default field values when nothing was set', () =>
  {
    const quest = new OmniQuestBuilder().build();

    expect(quest).toBeInstanceOf(OmniQuest);
    expect(quest.name).toBe(String.empty);
    expect(quest.key).toBe(String.empty);
    // categoryKey defaults to String.empty until .categoryKey() is called.
    expect(quest.categoryKey).toBe(String.empty);
    expect(quest.tagKeys).toEqual(Array.empty);
    expect(quest.recommendedLevel).toBe(0);
    expect(quest.objectives).toEqual(Array.empty);
  });

  it('resets all fields back to their defaults after build() so the builder can be reused', () =>
  {
    const builder = new OmniQuestBuilder()
      .name('n')
      .key('k')
      .categoryKey('c')
      .tagKeys([ 't' ])
      .unknownHint('h')
      .overview('o')
      .recommendedLevel(5)
      .objectives([ {} ]);

    builder.build();

    // a second build() from the same builder instance should reflect the post-clear defaults, not
    // the previous quest's values, proving clear() actually ran.
    const second = builder.build();

    expect(second.name).toBe(String.empty);
    expect(second.key).toBe(String.empty);
    expect(second.recommendedLevel).toBe(0);
    expect(second.objectives).toEqual(Array.empty);
  });
});
//endregion plugins/omni/ext/quest/__models/_component/omni-quest-builder.test.js
