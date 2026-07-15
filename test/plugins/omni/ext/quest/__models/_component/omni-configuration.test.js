//region plugins/omni/ext/quest/__models/_component/omni-configuration.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('OmniConfiguration (direct src import)', () =>
{
  let OmniConfiguration;

  beforeAll(async () =>
  {
    vi.resetModules();

    // OmniTag/OmniQuest/OmniCategory are real imports inside OmniConfiguration.js; they're pure
    // data shapes with no host-global dependencies of their own besides String.empty/Array.empty.
    String.empty = '';
    Array.empty = Object.freeze([]);

    ({ default: OmniConfiguration } = await import('../../../../../../../src/plugins/omni/ext/quest/__models/OmniConfiguration.js'));
  });

  describe('constructor', () =>
  {
    it('assigns the provided quests/tags/categories', () =>
    {
      // Arrange
      const quests = [ {} ];
      const tags = [ {} ];
      const categories = [ {} ];

      // Act
      const config = new OmniConfiguration(quests, tags, categories);

      // Assert
      expect(config.quests).toBe(quests);
      expect(config.tags).toBe(tags);
      expect(config.categories).toBe(categories);
    });
  });
});
//endregion plugins/omni/ext/quest/__models/_component/omni-configuration.test.js
