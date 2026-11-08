//region plugins/abs/core/_component/enemy-pool-tag-grammar.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';
import JsonMapper from '../../../../../src/plugins/_base/core/_utilities/JsonMapper.js';

/**
 * The unit tests around enemy pools run against simplified fixture regexes and a mocked JsonMapper, so
 * nothing there proves the actual authoring surface works: the literal regexes in J-ABS's
 * initialization.js, fed through the real JsonMapper, against the exact strings an author types.
 */
describe('enemy pool tag grammar (real regexes, real JsonMapper)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');
  });

  describe('<enemyIds:[ENEMY_IDS]>', () =>
  {
    it('captures and parses a full ladder into its ids', () =>
    {
      // Arrange
      const comment = '<enemyIds:[101,102,103,104,105]>';

      // Act
      const match = globalThis.J.ABS.RegExp.EnemyIds.exec(comment);

      // Assert
      expect(JsonMapper.parseObject(match[1])).toEqual([ 101, 102, 103, 104, 105 ]);
    });

    it('tolerates a space after the colon and after each comma', () =>
    {
      // Arrange
      const comment = '<enemyIds: [101, 102]>';

      // Act
      const match = globalThis.J.ABS.RegExp.EnemyIds.exec(comment);

      // Assert
      expect(JsonMapper.parseObject(match[1])).toEqual([ 101, 102 ]);
    });

    it('does not mistake the single-enemy tag for a pool', () =>
    {
      // Act
      const match = globalThis.J.ABS.RegExp.EnemyIds.exec('<enemyId:101>');

      // Assert
      expect(match).toBeNull();
    });

    it('does not mistake a pool for the single-enemy tag', () =>
    {
      // Act
      const match = globalThis.J.ABS.RegExp.EnemyId.exec('<enemyIds:[101,102]>');

      // Assert
      expect(match).toBeNull();
    });
  });

  describe('<enemy-weight:WEIGHT>', () =>
  {
    it('captures the weight', () =>
    {
      // Act
      const match = globalThis.J.ABS.RegExp.EnemyWeight.exec('<enemy-weight:8>');

      // Assert
      expect(match[1]).toBe('8');
    });

    it('does not read a map\'s override as a row\'s weight', () =>
    {
      // Act
      const match = globalThis.J.ABS.RegExp.EnemyWeight.exec('<enemy-weight-override:[302, 30]>');

      // Assert
      expect(match).toBeNull();
    });
  });

  describe('<enemy-weight-override:[ENEMY_ID, WEIGHT]>', () =>
  {
    it('captures and parses its pair', () =>
    {
      // Arrange
      const line = '<enemy-weight-override:[302, 30]>';

      // Act
      const match = globalThis.J.ABS.RegExp.EnemyWeightOverride.exec(line);

      // Assert
      expect(JsonMapper.parseObject(match[1])).toEqual([ 302, 30 ]);
    });
  });
});
//endregion plugins/abs/core/_component/enemy-pool-tag-grammar.test.js