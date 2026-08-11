//region plugins/prof/ext/knowledge/register-knowledge-currencies.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Knowledge shows up on the menu's currency strip without the menu knowing knowledge exists. The menu
 * publishes a strip, and anything with something to show registers itself against it.
 *
 * The menu is genuinely optional- knowledge accrues and is spent perfectly well without one- so this
 * module carries the single namespace check that arrangement allows. Both halves of that check need
 * covering, because the one that matters is the one that runs in a game with no J-CMS installed, and
 * that is exactly the configuration nobody testplays.
 *
 * The registration runs at module scope, so each test imports it into a realm of its own.
 */
describe('registerKnowledgeCurrencies', () =>
{
  let registered;

  beforeEach(() =>
  {
    vi.resetModules();

    registered = [];

    globalThis.CurrencyDefinition = class
    {
      constructor(key, iconIndex, unitProvider, amountProvider)
      {
        this.key = key;
        this.iconIndex = iconIndex;
        this.unitProvider = unitProvider;
        this.amountProvider = amountProvider;
      }
    };

    globalThis.Window_Currencies = {
      register(definition)
      {
        registered.push(definition);
      },
    };

    globalThis.$gameParty = { knowledgePoints: tagKey => (tagKey === 'vitest_offense' ? 40 : 7) };

    globalThis.J = {
      PROF: {
        EXT: {
          KNOWLEDGE: {
            Metadata: {
              tags: [
                {
                  key: 'vitest_offense',
                  name: 'Vitest Offense',
                  iconIndex: 11,
                },
                {
                  key: 'vitest_defense',
                  name: 'Vitest Defense',
                  iconIndex: 22,
                },
              ],
            },
          },
        },
      },
    };
  });

  it('registers every configured tag when the menu is installed', async () =>
  {
    // Arrange
    globalThis.J.CMS = {};

    // Act
    await import('../../../../../src/plugins/prof/ext/knowledge/registerKnowledgeCurrencies.js');

    // Assert- both tags, so the loop cannot pass by registering only the first.
    expect(registered.length).toBe(2);
    expect(registered[0].key).toBe('knowledge-vitest_offense');
    expect(registered[1].key).toBe('knowledge-vitest_defense');
  });

  it('registers nothing at all when the menu is absent', async () =>
  {
    // Arrange- J.CMS is deliberately not defined.

    // Act
    await import('../../../../../src/plugins/prof/ext/knowledge/registerKnowledgeCurrencies.js');

    // Assert
    expect(registered.length).toBe(0);
  });

  it('carries each tag its own icon and name', async () =>
  {
    // Arrange
    globalThis.J.CMS = {};

    // Act
    await import('../../../../../src/plugins/prof/ext/knowledge/registerKnowledgeCurrencies.js');

    // Assert- the second tag, so a definition built from the wrong loop variable is caught.
    const [ , defense ] = registered;
    expect(defense.iconIndex).toBe(22);
    expect(defense.unitProvider()).toBe('Vitest Defense');
  });

  it('reads each balance from the party at the moment it is asked', async () =>
  {
    // Arrange
    globalThis.J.CMS = {};

    // Act
    await import('../../../../../src/plugins/prof/ext/knowledge/registerKnowledgeCurrencies.js');

    // Assert- each definition asks for its own tag rather than sharing one closure.
    const [ offense, defense ] = registered;
    expect(offense.amountProvider()).toBe(40);
    expect(defense.amountProvider()).toBe(7);
  });
});
//endregion plugins/prof/ext/knowledge/register-knowledge-currencies.test.js