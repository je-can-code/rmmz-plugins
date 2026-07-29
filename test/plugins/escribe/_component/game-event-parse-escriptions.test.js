//region plugins/escribe/_component/game-event-parse-escriptions.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installEscribeHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJEscribe,
} from './fixtures/install-escribe-host-globals.js';
import PluginMetadata from '../../../../src/plugins/_base/models/PluginMetadata.js';

describe('J-Escriptions Game_Event escription parsing (direct src import)', () =>
{
  let Game_Event;

  beforeAll(async () =>
  {
    vi.resetModules();

    installEscribeHostGlobals();
    globalThis.PluginMetadata = PluginMetadata;

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJEscribe();
    await import('../../../../src/plugins/escribe/core/_metadata/initialization.js');

    // patches globalThis.Game_Event.prototype/Game_Character.prototype directly, no vm involved.
    await import('../../../../src/plugins/escribe/core/objects/Game_Character.js');
    await import('../../../../src/plugins/escribe/core/objects/Game_Event.js');

    // J-Base accessors the production code now reads through.
    globalThis.Game_Event.prototype.pageIndex = function() { return this._pageIndex; };

    ({ Game_Event } = globalThis);
  });

  it('builds Escription from comment tags and flags for addition', () =>
  {
    // Arrange
    const ev = new Game_Event();
    ev.initMembers();
    ev.getValidCommentCommands = function()
    {
      return [
        { parameters: [ '<text:Hello>' ] },
        { parameters: [ '<icon: 12>' ] },
        { parameters: [ '<proximityText: 2.5>' ] },
        { parameters: [ '<proximityIcon: 1>' ] },
      ];
    };

    // Act
    ev.parseEscriptionComments();

    // Assert
    expect(ev.hasEscribeData()).toBe(true);
    expect(ev.needsEscribeAdding()).toBe(true);

    const d = ev.escribeData();
    expect(d.text()).toBe('Hello');
    expect(d.iconIndex()).toBe(12);
    expect(d.proximityTextRange()).toBe(2.5);
    expect(d.proximityIconRange()).toBe(1);
  });

  it('clears Escription when no tags present and flags for removal', () =>
  {
    // Arrange
    const ev = new Game_Event();
    ev.initMembers();
    ev.getValidCommentCommands = function()
    {
      return [];
    };

    // Act
    ev.parseEscriptionComments();

    // Assert
    expect(ev.hasEscribeData()).toBe(false);
    expect(ev.needsEscribeRemoval()).toBe(true);
  });
});
//endregion plugins/escribe/_component/game-event-parse-escriptions.test.js
