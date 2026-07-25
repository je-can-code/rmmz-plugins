//region plugins/abs/core/models/jabs-menu-focus.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * JABS_MenuFocus.js has zero imports and exports the static-only `JABS_MenuType` class- so this
 * file dynamically imports it directly with no mocking required.
 */
describe('JABS_MenuType (unit, pure/no dependencies)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_MenuFocus.js').default} */
  let JABS_MenuType;

  beforeAll(async () =>
  {
    ({ default: JABS_MenuType } = await import('../../../../../src/plugins/abs/core/models/JABS_MenuFocus.js'));
  });

  describe('constructor', () =>
  {
    it('throws because this is a static-only class', () =>
    {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'trace').mockImplementation(() => {});

      expect(() => new JABS_MenuType()).toThrow();

      vi.restoreAllMocks();
    });
  });

  describe('static menu focus keys', () =>
  {
    it('exposes the expected set of static string keys', () =>
    {
      expect(JABS_MenuType.Main).toEqual('main');
      expect(JABS_MenuType.Skill).toEqual('skill');
      expect(JABS_MenuType.Tool).toEqual('tool');
      expect(JABS_MenuType.Dodge).toEqual('dodge');
      expect(JABS_MenuType.Offhand).toEqual('offhand');
      expect(JABS_MenuType.UsableItem).toEqual('usable-item');
      expect(JABS_MenuType.Assign).toEqual('assign');
    });
  });
});
//endregion plugins/abs/core/models/jabs-menu-focus.test.js
