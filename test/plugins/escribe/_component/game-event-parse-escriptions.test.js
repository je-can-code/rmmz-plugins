//region plugins/escribe/_component/game-event-parse-escriptions.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installEscribeHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJEscribe,
} from './fixtures/install-escribe-host-globals.js';
import PluginMetadata from '../../../../src/plugins/_base/core/models/PluginMetadata.js';

/**
 * Real comment tags in, real Escriptions out, through the real regex table.
 *
 * The list an event produces is the contract the sprite layer pairs against by index, so both what
 * lands in it and the order it lands in are load-bearing.
 */
describe('J-Escriptions Game_Event escription parsing (direct src import)', () =>
{
  let Game_Event;
  let Escription;

  /**
   * Builds an event whose page carries the given comment lines.
   * @param {string[]} comments The raw comment lines on this event's active page.
   * @returns {Game_Event} The event under test.
   */
  const buildCommentedEvent = comments =>
  {
    const event = new Game_Event();
    event.initMembers();
    event._pageIndex = 0;
    event.getValidCommentCommands = () => comments.map(comment => ({ parameters: [ comment ] }));

    return event;
  };

  beforeAll(async () =>
  {
    vi.resetModules();

    installEscribeHostGlobals();
    globalThis.PluginMetadata = PluginMetadata;

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    // the real note parser- these tests exercise escribe's tags through it rather than around it.
    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJEscribe();
    await import('../../../../src/plugins/escribe/core/_metadata/initialization.js');

    ({ default: Escription } = await import('../../../../src/plugins/escribe/core/_models/Escription.js'));

    // patches globalThis.Game_Event.prototype/Game_Character.prototype directly, no vm involved.
    await import('../../../../src/plugins/escribe/core/objects/Game_Character.js');
    await import('../../../../src/plugins/escribe/core/objects/Game_Event.js');

    // J-Base accessors the production code now reads through.
    globalThis.Game_Event.prototype.pageIndex = function() { return this._pageIndex; };

    ({ Game_Event } = globalThis);
  });

  it('builds a text and an icon, in that order, each with its own proximity', () =>
  {
    // Arrange
    const event = buildCommentedEvent([
      '<text:Hello>',
      '<icon: 12>',
      '<proximityText: 2.5>',
      '<proximityIcon: 1>',
    ]);

    // Act
    event.parseEscriptionComments();

    // Assert
    const escriptions = event.escriptions();
    expect(escriptions).toHaveLength(2);
    expect(escriptions.map(escription => escription.key())).toEqual([ 'text:Hello:2.5', 'icon:12:1' ]);
  });

  it('turns every text tag into its own line, in the order they were written', () =>
  {
    // Arrange- three lines in one comment box is how RMMZ already stores a multi-line comment.
    const event = buildCommentedEvent([
      '<text:Here lies Viktor.>',
      '<text:He asked for a bigger sword.>',
      '<text:He received one.>',
    ]);

    // Act
    event.parseEscriptionComments();

    // Assert
    const contents = event.escriptions()
      .map(escription => escription.content());
    expect(contents).toEqual([ 'Here lies Viktor.', 'He asked for a bigger sword.', 'He received one.' ]);
  });

  it('gives every line of a block the one declared proximity', () =>
  {
    // Arrange
    const event = buildCommentedEvent([ '<text:one>', '<text:two>', '<proximityText: 3>' ]);

    // Act
    event.parseEscriptionComments();

    // Assert
    const ranges = event.escriptions()
      .map(escription => escription.proximityRange());
    expect(ranges).toEqual([ 3, 3 ]);
  });

  it('keeps the icon last, after however many lines of text precede it', () =>
  {
    // Arrange- the sprite layer pairs by index, so this order is a contract rather than a detail.
    const event = buildCommentedEvent([ '<text:one>', '<icon: 12>', '<text:two>' ]);

    // Act
    event.parseEscriptionComments();

    // Assert
    const kinds = event.escriptions()
      .map(escription => escription.kind());
    expect(kinds).toEqual([ Escription.Kinds.Text, Escription.Kinds.Text, Escription.Kinds.Icon ]);
  });

  it('reads icon zero as a real icon rather than as an absent one', () =>
  {
    // Arrange- zero is a legitimate index, which is why the parse asks for null-if-empty instead
    // of accepting a numeric sentinel it could not tell apart from a declaration.
    const event = buildCommentedEvent([ '<icon: 0>' ]);

    // Act
    event.parseEscriptionComments();

    // Assert
    expect(event.escriptions()).toHaveLength(1);
    expect(event.escriptions().at(0).content()).toBe(0);
  });

  it('builds a text alone when no icon is declared', () =>
  {
    // Arrange- an icon proximity is present with no icon behind it, so "declared an icon" and
    // "mentioned icons at all" cannot be the same program.
    const event = buildCommentedEvent([ '<text:Hello>', '<proximityIcon: 1>' ]);

    // Act
    event.parseEscriptionComments();

    // Assert
    const escriptions = event.escriptions();
    expect(escriptions).toHaveLength(1);
    expect(escriptions.at(0).kind()).toBe(Escription.Kinds.Text);
  });

  it('builds an icon alone, with no text beneath it', () =>
  {
    // Arrange
    const event = buildCommentedEvent([ '<icon: 12>' ]);

    // Act
    event.parseEscriptionComments();

    // Assert
    const escriptions = event.escriptions();
    expect(escriptions).toHaveLength(1);
    expect(escriptions.at(0).key()).toBe('icon:12:-1');
  });

  it('leaves both always-visible when neither proximity is declared', () =>
  {
    // Arrange
    const event = buildCommentedEvent([ '<text:Hello>', '<icon: 12>' ]);

    // Act
    event.parseEscriptionComments();

    // Assert
    const ranges = event.escriptions()
      .map(escription => escription.proximityRange());
    expect(ranges).toEqual([ Escription.ALWAYS_VISIBLE, Escription.ALWAYS_VISIBLE ]);
  });

  it('empties the list when the page declares nothing, which is how a removal is discovered', () =>
  {
    // Arrange- this event was describing something a page ago.
    const event = buildCommentedEvent([]);
    event.setEscriptions([ new Escription(Escription.Kinds.Text, 'stale', -1) ]);

    // Act
    event.parseEscriptionComments();

    // Assert
    expect(event.escriptions()).toEqual([]);
  });

  it('does nothing at all to an event it is not allowed to read', () =>
  {
    // Arrange- a page-less event keeps whatever it was already saying rather than being blanked.
    const event = buildCommentedEvent([ '<text:Hello>' ]);
    event._pageIndex = -1;
    const existing = new Escription(Escription.Kinds.Text, 'kept', -1);
    event.setEscriptions([ existing ]);

    // Act
    event.parseEscriptionComments();

    // Assert
    expect(event.escriptions()).toEqual([ existing ]);
  });
});
//endregion plugins/escribe/_component/game-event-parse-escriptions.test.js