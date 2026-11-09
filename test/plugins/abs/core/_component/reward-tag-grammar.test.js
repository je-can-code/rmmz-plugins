//region plugins/abs/core/_component/reward-tag-grammar.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * The unit tests around the reward opt-outs run against stand-in regexes, so nothing there proves the
 * authoring surface: the literal regexes in J-ABS's initialization.js against the exact strings an
 * author types into an enemy's note. This file is that proof, including that each tag leaves its
 * siblings alone, since one reward's opt-out quietly matching another's would refuse the wrong reward.
 */
describe('reward opt-out tag grammar (real regexes)', () =>
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

  describe('<noRewardPoints>', () =>
  {
    it('matches the tag in any casing', () =>
    {
      // Arrange
      const { NoRewardPoints } = globalThis.J.ABS.RegExp;

      // Act
      const matches = [ '<noRewardPoints>', '<norewardpoints>' ].map(note => NoRewardPoints.test(note));

      // Assert
      expect(matches).toEqual([ true, true ]);
    });

    it('does not match a single-reward opt-out', () =>
    {
      // Arrange
      const { NoRewardPoints } = globalThis.J.ABS.RegExp;

      // Act
      const matches = [ '<no:exp>', '<no:gold>' ].map(note => NoRewardPoints.test(note));

      // Assert
      expect(matches).toEqual([ false, false ]);
    });
  });

  describe('<no:exp> and <no:gold>', () =>
  {
    it('match their own tag with or without the optional space', () =>
    {
      // Arrange
      const { NoExp, NoGold } = globalThis.J.ABS.RegExp;

      // Act
      const matches = [
        NoExp.test('<no:exp>'),
        NoExp.test('<no: exp>'),
        NoGold.test('<no:gold>'),
        NoGold.test('<no: gold>'),
      ];

      // Assert
      expect(matches).toEqual([ true, true, true, true ]);
    });

    it('do not match each other, the catch-all, or the extensions\' opt-outs', () =>
    {
      // Arrange
      const { NoExp, NoGold } = globalThis.J.ABS.RegExp;
      const siblings = '<noRewardPoints>\n<no:sdp>\n<no:ap>\n<no:expert>';

      // Act
      const matches = [
        NoExp.test(`${siblings}\n<no:gold>`),
        NoGold.test(`${siblings}\n<no:exp>`),
      ];

      // Assert
      expect(matches).toEqual([ false, false ]);
    });
  });
});
//endregion plugins/abs/core/_component/reward-tag-grammar.test.js
