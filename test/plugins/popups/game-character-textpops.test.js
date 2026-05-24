//region plugins/popups/game-character-textpops.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadPopupsPluginVm } from './popups-vm.js';

describe('J-Popups Game_Character integration (out/popups/J-Popups.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPopupsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('request/add/acknowledge flow tracks pops when not disabled', () =>
  {
    sandbox.J.POPUPS.Metadata.disablePopups = false;

    const ch = new sandbox.Game_Character();
    ch.initMembers();

    expect(ch.hasTextPops()).toBe(false);
    ch.requestTextPop();
    expect(ch.hasTextPops()).toBe(true);

    const popup = new sandbox.TextPopBuilder('x').build();
    ch.addTextPop(popup);
    expect(ch.getTextPops().length).toBe(1);

    ch.acknowledgeTextPops();
    expect(ch.hasTextPops()).toBe(false);

    ch.emptyDamagePops();
    expect(ch.getTextPops().length).toBe(0);
  });

  it('does not track pops when disablePopups is true', () =>
  {
    sandbox.J.POPUPS.Metadata.disablePopups = true;

    const ch = new sandbox.Game_Character();
    ch.initMembers();

    ch.requestTextPop();
    expect(ch.hasTextPops()).toBe(false);

    const popup = new sandbox.TextPopBuilder('x').build();
    ch.addTextPop(popup);
    expect(ch.getTextPops().length).toBe(0);
  });
});
//endregion plugins/popups/game-character-textpops.test.js
