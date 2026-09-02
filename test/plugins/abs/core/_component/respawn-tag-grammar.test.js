//region plugins/abs/core/_component/respawn-tag-grammar.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';
import JsonMapper from '../../../../../src/plugins/_base/core/_utilities/JsonMapper.js';

/**
 * The unit tests around the respawn tags run against simplified fixture regexes and a mocked
 * JsonMapper, so nothing there proves the actual authoring surface works: the literal regexes in
 * J-ABS's initialization.js, fed through the real JsonMapper, against the exact strings an author
 * types into an event comment. This file is that proof.
 */
describe('respawn tag grammar (real regexes, real JsonMapper)', () =>
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

  describe('<respawn:[METHOD, PARAM]>', () =>
  {
    it('captures and parses a seconds declaration into its method-and-number pair', () =>
    {
      // Arrange
      const comment = '<respawn:[seconds, 90]>';

      // Act
      const match = globalThis.J.ABS.RegExp.Respawn.exec(comment);
      const parsed = JsonMapper.parseObject(match[1]);

      // Assert
      expect(parsed).toEqual([ 'seconds', 90 ]);
    });

    it('captures and parses a calendar declaration with a hyphenated method and word param', () =>
    {
      // Arrange
      const comment = '<respawn:[next-day-of-week, monday]>';

      // Act
      const match = globalThis.J.ABS.RegExp.Respawn.exec(comment);
      const parsed = JsonMapper.parseObject(match[1]);

      // Assert
      expect(parsed).toEqual([ 'next-day-of-week', 'monday' ]);
    });

    it('does not match its respawn-animation sibling tag', () =>
    {
      // Arrange- the tag family shares a prefix, so the near-miss has to stay a miss.
      const comment = '<respawnAnimation:12>';

      // Act
      const match = globalThis.J.ABS.RegExp.Respawn.exec(comment);

      // Assert
      expect(match).toBeNull();
    });
  });

  describe('<noRespawn>', () =>
  {
    it('matches the bare permanence declaration', () =>
    {
      // Arrange
      const comment = '<noRespawn>';

      // Act
      const result = globalThis.J.ABS.RegExp.NoRespawn.test(comment);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('<respawnAnimation:ID>', () =>
  {
    it('captures the animation id', () =>
    {
      // Arrange
      const comment = '<respawnAnimation:12>';

      // Act
      const match = globalThis.J.ABS.RegExp.RespawnAnimation.exec(comment);

      // Assert
      expect(parseInt(match[1])).toBe(12);
    });
  });
});
//endregion plugins/abs/core/_component/respawn-tag-grammar.test.js