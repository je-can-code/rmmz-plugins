//region plugins/message/ext/chatter/_component/chatter-tag-parsing.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installMessageHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJMessageChatter,
} from '../../../_component/fixtures/install-message-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

/**
 * The tags are the authored surface of this plugin, so these run against the real patterns out of
 * the ship's own `initialization.js` rather than against stand-ins. A pattern is the one thing here
 * a test written with a fake would agree with itself about and still be wrong in the editor.
 *
 * Every case feeds the parser a page rather than a single comment, and every page holds at least one
 * comment belonging to somebody else. A page in this project genuinely does - lighting, JABS and
 * this plugin all read the same block - so a parser that answered the first comment it was given, or
 * that choked on one it did not recognise, has to fail here rather than in a playtest.
 */
describe('J-Message-Chatter tag parsing (direct src import)', () =>
{
  /** @type {object} the J umbrella as J-Base built it; J-Base's bootstrap is once-per-realm. */
  let realJ;

  /** @type {typeof import('../../../../../../src/plugins/message/ext/chatter/services/ChatterTagParser.js').default} */
  let ChatterTagParser;

  beforeAll(async () =>
  {
    installMessageHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    realJ = globalThis.J;
  });

  beforeEach(async () =>
  {
    vi.resetModules();

    globalThis.J = realJ;
    globalThis.J.BASE.Metadata.Version = '3.2.0';
    globalThis.J.MESSAGE = {
      Metadata: { version: { version: () => '1.3.1' } },
      EXT: {
        BUBBLES: { Metadata: { version: { version: () => '1.0.0' } } },
      },
    };

    const { default: FreshPluginMetadata } = await import(
      '../../../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = FreshPluginMetadata;

    installPluginManagerWithParams(globalThis, 'J-Message-Chatter', {});
    setPluginContextToJMessageChatter();

    // the project has configured no chatter defaults, so the class defaults are what a page merges
    // over. The section is asked for by name, and answering an empty one is the supported state of a
    // project that has never written the config at all.
    globalThis.MessageConfig = { section: () => ({}) };

    await import('../../../../../../src/plugins/message/ext/chatter/_metadata/initialization.js');

    const parserModule = await import(
      '../../../../../../src/plugins/message/ext/chatter/services/ChatterTagParser.js');
    ChatterTagParser = parserModule.default;
  });

  /**
   * A page carrying somebody else's comments alongside whatever is being tested.
   * @param {...string} comments The chatter comments to include.
   * @returns {string[]}
   */
  function page(...comments)
  {
    return [ '<light:[5, #ffbb73]>', ...comments, '<someOtherPluginTag:12>' ];
  }

  it('reads a line off a page', () =>
  {
    // Arrange
    const comments = page('<chatter:Lovely weather, isn\'t it.>');

    // Act
    const profile = ChatterTagParser.parseComments(comments);

    // Assert
    expect(profile.lines()).toEqual([ 'Lovely weather, isn\'t it.' ]);
  });

  it('keeps a question mark in a line', () =>
  {
    // Arrange- the tag this whole grammar was widened for. Shopkeeper patter is mostly questions,
    // and before the widening a comment carrying one was dropped before any plugin saw it.
    const comments = page('<chatter:Anything I can get you?>');

    // Act
    const profile = ChatterTagParser.parseComments(comments);

    // Assert
    expect(profile.lines()).toEqual([ 'Anything I can get you?' ]);
  });

  it('collects every line on the page into one pool', () =>
  {
    // Arrange
    const comments = page(
      '<chatter:Half price today.>',
      '<chatter:Mind the step.>',
      '<chatter:Anything I can get you?>');

    // Act
    const profile = ChatterTagParser.parseComments(comments);

    // Assert- in the order they were written, which is the order an author reads them in the editor.
    expect(profile.lines()).toEqual([ 'Half price today.', 'Mind the step.', 'Anything I can get you?' ]);
  });

  it('leaves a page with no chatter tags with nothing to say', () =>
  {
    // Arrange- the overwhelming majority of events in a project.
    const comments = page();

    // Act
    const profile = ChatterTagParser.parseComments(comments);

    // Assert
    expect(profile.hasLines()).toBe(false);
  });

  it('reads how far a character can be heard from', () =>
  {
    // Arrange
    const comments = page('<chatter:Mind the step.>', '<chatterRadius:2>');

    // Act
    const profile = ChatterTagParser.parseComments(comments);

    // Assert
    expect(profile.radius()).toBe(2);
  });

  it('reads how long a character rests between lines', () =>
  {
    // Arrange
    const comments = page('<chatter:Mind the step.>', '<chatterCooldown:900>');

    // Act
    const profile = ChatterTagParser.parseComments(comments);

    // Assert
    expect(profile.cooldown()).toBe(900);
  });

  it('reads how long a character may wait before speaking', () =>
  {
    // Arrange
    const comments = page('<chatter:Mind the step.>', '<chatterDelay:60>');

    // Act
    const profile = ChatterTagParser.parseComments(comments);

    // Assert
    expect(profile.delay()).toBe(60);
  });

  it('reads how long a line stays up', () =>
  {
    // Arrange
    const comments = page('<chatter:Mind the step.>', '<chatterDuration:240>');

    // Act
    const profile = ChatterTagParser.parseComments(comments);

    // Assert
    expect(profile.duration()).toBe(240);
  });

  it('reads how fast a line types itself out', () =>
  {
    // Arrange
    const comments = page('<chatter:Mind the step.>', '<chatterSpeed:4>');

    // Act
    const profile = ChatterTagParser.parseComments(comments);

    // Assert
    expect(profile.speed()).toBe(4);
  });

  it('reads which side of a character their chatter sits on', () =>
  {
    // Arrange
    const comments = page('<chatter:Mind the step.>', '<chatterPosition:bottom>');

    // Act
    const profile = ChatterTagParser.parseComments(comments);

    // Assert
    expect(profile.position()).toBe('bottom');
  });

  it('takes a position an author capitalised', () =>
  {
    // Arrange
    const comments = page('<chatter:Mind the step.>', '<chatterPosition:Middle>');

    // Act
    const profile = ChatterTagParser.parseComments(comments);

    // Assert- everything downstream compares against the lowercase word.
    expect(profile.position()).toBe('middle');
  });

  it('leaves every knob a page did not touch at its default', () =>
  {
    // Arrange- one knob written, which is what Jeremy expects most chattering events to look like.
    const comments = page('<chatter:Mind the step.>', '<chatterRadius:2>');

    // Act
    const profile = ChatterTagParser.parseComments(comments);

    // Assert
    expect(profile.radius()).toBe(2);
    expect(profile.cooldown()).toBe(600);
    expect(profile.delay()).toBe(300);
    expect(profile.duration()).toBe(180);
    expect(profile.speed()).toBe(2);
    expect(profile.position()).toBe('top');
  });

  it('does not read the tuning tags as lines', () =>
  {
    // Arrange- every one of these starts with the word the line tag is spelled with, so a pattern
    // missing its colon would sweep all six of them into the pool as things to say out loud.
    const comments = page(
      '<chatterRadius:2>',
      '<chatterCooldown:900>',
      '<chatterDelay:60>',
      '<chatterDuration:240>',
      '<chatterSpeed:4>',
      '<chatterPosition:bottom>');

    // Act
    const profile = ChatterTagParser.parseComments(comments);

    // Assert
    expect(profile.lines()).toEqual([]);
  });

  it('lays a page over the project defaults rather than over the class defaults', () =>
  {
    // Arrange- a project that has configured a quieter, slower town than the plugin ships with.
    globalThis.MessageConfig = {
      section: () => ({
        radius: 3,
        cooldown: 900,
      }),
    };
    const comments = page('<chatter:Mind the step.>', '<chatterRadius:8>');

    // Act
    const profile = ChatterTagParser.parseComments(comments);

    // Assert- the page wins where it spoke, the config wins where the page was silent, and the class
    // default holds where neither said anything.
    expect(profile.radius()).toBe(8);
    expect(profile.cooldown()).toBe(900);
    expect(profile.duration()).toBe(180);
  });

  it('asks the config for its own section rather than for the whole file', () =>
  {
    // Arrange- the config also holds the speaker profiles, and reading those as chatter settings
    // would put a `framesPerCharacter` where a radius belongs.
    const asked = [];
    globalThis.MessageConfig = {
      section: name =>
      {
        asked.push(name);

        return {};
      },
    };

    // Act
    ChatterTagParser.parseComments(page('<chatter:Mind the step.>'));

    // Assert
    expect(asked).toEqual([ 'chatter' ]);
  });
});
//endregion plugins/message/ext/chatter/_component/chatter-tag-parsing.test.js