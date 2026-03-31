//region plugins/log/plugin-commands.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadLogPluginVm } from './log-vm.js';

describe('J-Log plugin commands mutate managers (out/J-Log.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadLogPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('show/hide commands toggle visibility, add/clear mutate logs', () =>
  {
    // create managers.
    sandbox.DataManager.createGameObjects();

    const show = sandbox.__logPluginCommands.get('J-Log:showActionLog');
    const hide = sandbox.__logPluginCommands.get('J-Log:hideActionLog');
    const add = sandbox.__logPluginCommands.get('J-Log:addActionLog');
    const clear = sandbox.__logPluginCommands.get('J-Log:clearActionLog');

    expect(typeof show).toBe('function');
    expect(typeof hide).toBe('function');
    expect(typeof add).toBe('function');
    expect(typeof clear).toBe('function');

    show();
    expect(sandbox.$actionLogManager.isVisible()).toBe(true);
    hide();
    expect(sandbox.$actionLogManager.isHidden()).toBe(true);

    add({ text: 'hello' });
    expect(sandbox.$actionLogManager.getLogs().length).toBe(1);

    clear();
    expect(sandbox.$actionLogManager.getLogs().length).toBe(0);
  });
});
//endregion plugins/log/plugin-commands.test.js
