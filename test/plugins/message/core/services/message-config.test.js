//region plugins/message/core/services/message-config.test.js
import { beforeEach, describe, expect, it } from 'vitest';

import MessageConfig from '../../../../../src/plugins/message/core/services/MessageConfig.js';

/**
 * This is the seam every future consumer of the config reaches through, so the fixtures below always
 * hold more than one section: a lookup that handed back the whole config, or the first section it
 * found, would be indistinguishable from a correct one against a config with a single entry.
 *
 * The state is static and therefore shared across cases, which is exactly the situation a project
 * reloading its config during development is in - so each case loads its own rather than inheriting
 * whatever the last one left behind.
 */
describe('J-Message MessageConfig (direct src import)', () =>
{
  beforeEach(() =>
  {
    MessageConfig.load({});
  });

  it('hands back the section that was asked for', () =>
  {
    // Arrange
    MessageConfig.load({
      chatter: { radius: 5 },
      bySpeakerName: { '\\N[1]': { framesPerCharacter: 3 } },
    });

    // Act
    const section = MessageConfig.section('chatter');

    // Assert
    expect(section).toEqual({ radius: 5 });
  });

  it('hands back a section other than the first one in the file', () =>
  {
    // Arrange- the sibling sits first on purpose; answering position instead of name would pass
    // every test written against a config whose wanted section happened to lead.
    MessageConfig.load({
      bySpeakerName: { '\\N[1]': { framesPerCharacter: 3 } },
      chatter: { radius: 5 },
    });

    // Act
    const section = MessageConfig.section('chatter');

    // Assert
    expect(section).toEqual({ radius: 5 });
  });

  it('hands back an empty section for a name the config never mentioned', () =>
  {
    // Arrange
    MessageConfig.load({ bySpeakerName: { '\\N[1]': { framesPerCharacter: 3 } } });

    // Act
    const section = MessageConfig.section('chatter');

    // Assert- a consumer merges this over its own defaults, so nothing configured has to arrive as
    // nothing overridden rather than as an absence it has to test for.
    expect(section).toEqual({});
  });

  it('hands back an empty section when the project has written no config at all', () =>
  {
    // Arrange- the supported state of a project that has never made a config file.
    MessageConfig.load({});

    // Act
    const section = MessageConfig.section('chatter');

    // Assert
    expect(section).toEqual({});
  });

  it('gives each caller an empty section of its own', () =>
  {
    // Arrange
    MessageConfig.load({});
    const section = MessageConfig.section('chatter');

    // Act
    section.radius = 99;

    // Assert- a consumer writing its defaults into what it was handed must not be writing them into
    // the next consumer's answer.
    expect(MessageConfig.section('chatter')).toEqual({});
  });

  it('forgets a section that the config it was reloaded with no longer has', () =>
  {
    // Arrange
    MessageConfig.load({ chatter: { radius: 5 } });

    // Act
    MessageConfig.load({ bySpeakerName: { '\\N[1]': { framesPerCharacter: 3 } } });

    // Assert- a section deleted from the file has to stop being answered, or a developer editing
    // their config would be reading a merge of every version of it they had ever loaded.
    expect(MessageConfig.section('chatter')).toEqual({});
  });
});
//endregion plugins/message/core/services/message-config.test.js