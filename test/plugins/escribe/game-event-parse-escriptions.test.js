//region plugins/escribe/game-event-parse-escriptions.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadEscribePluginVm } from './escribe-vm.js';

describe('J-Escriptions Game_Event escription parsing (out/J-Escriptions.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadEscribePluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('builds Escription from comment tags and flags for addition', () =>
  {
    const ev = new sandbox.Game_Event();
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

    ev.parseEscriptionComments();

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
    const ev = new sandbox.Game_Event();
    ev.initMembers();

    ev.getValidCommentCommands = function()
    {
      return [];
    };

    ev.parseEscriptionComments();
    expect(ev.hasEscribeData()).toBe(false);
    expect(ev.needsEscribeRemoval()).toBe(true);
  });
});
//endregion plugins/escribe/game-event-parse-escriptions.test.js
