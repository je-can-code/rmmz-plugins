//region plugins/message/window-base-textcodes.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadMessagePluginVm } from './message-vm.js';

describe('J-MessageTextCodes Window_Base text codes (out/J-MessageTextCodes.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadMessagePluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    sandbox.$dataWeapons[4] = { id: 4, name: 'Dagger', iconIndex: 42 };
    sandbox.$dataArmors[1] = { id: 1, name: 'Cap', iconIndex: 5 };
    sandbox.$dataItems[2] = { id: 2, name: 'Potion', iconIndex: 64 };
    sandbox.$dataSkills[3] = { id: 3, name: 'Fire', iconIndex: 12 };
    sandbox.$dataEnemies[9] = { id: 9, name: 'Slime' };
    sandbox.$dataStates[0] = { id: 0, name: '(Basic Attack)', iconIndex: 0 };
    sandbox.$dataStates[6] = { id: 6, name: 'Poison', iconIndex: 7 };
  });

  it('translates weapon/armor/item/skill/enemy/state codes', () =>
  {
    const win = new sandbox.Window_Base();
    const text = [
      '\\Weapon[4]',
      '\\Armor[1]',
      '\\Item[2]',
      '\\Skill[3]',
      '\\Enemy[9]',
      '\\State[6]',
      '\\State[0]',
    ].join(' ');

    const result = win.convertEscapeCharacters(text);
    expect(result).toContain('\\I[42]');
    expect(result).toContain('Dagger');
    expect(result).toContain('\\I[5]');
    expect(result).toContain('Cap');
    expect(result).toContain('\\I[64]');
    expect(result).toContain('Potion');
    expect(result).toContain('\\I[12]');
    expect(result).toContain('Fire');
    expect(result).toContain('Slime');
    expect(result).toContain('Poison');
    expect(result).toContain('(Basic Attack)');
  });

  it('translates element and type codes via managers', () =>
  {
    const win = new sandbox.Window_Base();
    const text = [
      '\\element[1]',
      '\\equipType[1]',
      '\\weaponType[1]',
      '\\armorType[1]',
      '\\skillType[1]',
    ].join(' ');

    const result = win.convertEscapeCharacters(text);
    // icons and colors are sourced from engine managers (stubbed by J-Base); just ensure each emitted an icon token.
    expect(result.split('\\I[').length - 1).toBe(5);
    expect(result).toContain('Fire');
    expect(result).toContain('Weapon');
    expect(result).toContain('Sword');
    expect(result).toContain('Light');
    expect(result).toContain('Magic');
  });

  it('supports italics/bold wrapping helpers and toggles font flags', () =>
  {
    const win = new sandbox.Window_Base();
    expect(win.italicizeText('x')).toBe('\\_x\\_');
    expect(win.boldenText('y')).toBe('\\*y\\*');
    expect(win.modFontSizeForText(4, 'z')).toBe('\\FS[32]z\\FS[28]');

    expect(win.contents.fontItalic).toBe(false);
    win.toggleItalics();
    expect(win.contents.fontItalic).toBe(true);
    win.toggleBold(true);
    expect(win.contents.fontBold).toBe(true);
  });
});
//endregion plugins/message/window-base-textcodes.test.js
