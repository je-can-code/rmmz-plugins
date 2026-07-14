//region plugins/message/window-base-textcodes.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installMessageHostGlobals, setPluginContextToJBase, setPluginContextToJMessage } from './fixtures/install-message-host-globals.js';

describe('J-MessageTextCodes Window_Base text codes (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installMessageHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    // italics/bold/font-size helpers exercised by this test live in _base now.
    await import('../../../src/plugins/_base/windows/Window_Base.js');

    setPluginContextToJMessage();
    await import('../../../src/plugins/message/core/_metadata/initialization.js');

    // patches globalThis.Window_Base.prototype directly, no vm involved.
    await import('../../../src/plugins/message/core/windows/Window_Base.js');
  });

  beforeEach(() =>
  {
    globalThis.$dataWeapons[4] = { id: 4, name: 'Dagger', iconIndex: 42 };
    globalThis.$dataArmors[1] = { id: 1, name: 'Cap', iconIndex: 5 };
    globalThis.$dataItems[2] = { id: 2, name: 'Potion', iconIndex: 64 };
    globalThis.$dataSkills[3] = { id: 3, name: 'Fire', iconIndex: 12 };
    globalThis.$dataEnemies[9] = { id: 9, name: 'Slime' };
    globalThis.$dataStates[0] = { id: 0, name: '(Basic Attack)', iconIndex: 0 };
    globalThis.$dataStates[6] = { id: 6, name: 'Poison', iconIndex: 7 };
  });

  it('translates weapon/armor/item/skill/enemy/state codes', () =>
  {
    // Arrange
    const win = new globalThis.Window_Base();
    const text = [
      '\\Weapon[4]', '\\Armor[1]', '\\Item[2]', '\\Skill[3]', '\\Enemy[9]', '\\State[6]', '\\State[0]',
    ].join(' ');

    // Act
    const result = win.convertEscapeCharacters(text);

    // Assert
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
    // Arrange
    const win = new globalThis.Window_Base();
    const text = [
      '\\element[1]', '\\equipType[1]', '\\weaponType[1]', '\\armorType[1]', '\\skillType[1]',
    ].join(' ');

    // Act
    const result = win.convertEscapeCharacters(text);

    // Assert
    expect(result.split('\\I[').length - 1).toBe(5);
    expect(result).toContain('Fire');
    expect(result).toContain('Weapon');
    expect(result).toContain('Sword');
    expect(result).toContain('Light');
    expect(result).toContain('Magic');
  });

  it('supports italics/bold wrapping helpers and toggles font flags', () =>
  {
    // Arrange
    const win = new globalThis.Window_Base();

    // Act & Assert
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
