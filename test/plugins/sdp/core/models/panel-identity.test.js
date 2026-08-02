//region plugins/sdp/core/models/panel-identity.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Panel identity is hydrated straight from config.sdp.json, which the data editor writes in a
 * nested shape but which older files still carry flat at the panel root. Both shapes have to
 * load, and every field has to survive being absent, blank, or unparseable- a panel with a
 * missing icon should draw with no icon, not break the whole panel list.
 */
describe('PanelIdentity (direct src import)', () =>
{
  let PanelIdentity;

  beforeAll(async () =>
  {
    // J-Base installs this at boot and these models read it; stand it up when testing alone.
    if (String.empty === undefined)
    {
      Object.defineProperty(String, 'empty', {
        value: '',
        configurable: true,
      });
    }

    ({ default: PanelIdentity } = await import('../../../../../src/plugins/sdp/core/models/PanelIdentity.js'));
  });

  //region nested shape
  describe('fromConfigPanel with the canonical nested shape', () =>
  {
    it('reads every field off the nested identity object', () =>
    {
      // Arrange
      const parsed = {
        identity: {
          name: 'Ironhide',
          iconIndex: 12,
          unlockedByDefault: true,
          description: 'Tough as nails.',
          topFlavorText: 'A panel of resilience.',
        },
      };

      // Act
      const identity = PanelIdentity.fromConfigPanel(parsed);

      // Assert
      expect([ identity.name, identity.iconIndex, identity.unlockedByDefault ])
        .toEqual([ 'Ironhide', 12, true ]);
    });

    it('reads the prose fields off the nested identity object', () =>
    {
      // Arrange
      const parsed = {
        identity: {
          description: 'Tough as nails.',
          topFlavorText: 'A panel of resilience.',
        },
      };

      // Act
      const identity = PanelIdentity.fromConfigPanel(parsed);

      // Assert
      expect([ identity.description, identity.topFlavorText ])
        .toEqual([ 'Tough as nails.', 'A panel of resilience.' ]);
    });

    it('falls back to blank prose when the nested fields are absent', () =>
    {
      // Arrange: a panel authored without flavour text is legitimate, not malformed.
      const parsed = { identity: { name: 'Ironhide' } };

      // Act
      const identity = PanelIdentity.fromConfigPanel(parsed);

      // Assert
      expect([ identity.name, identity.description, identity.topFlavorText ])
        .toEqual([ 'Ironhide', String.empty, String.empty ]);
    });

    it('treats an absent name as blank rather than undefined', () =>
    {
      // Arrange
      const parsed = { identity: { iconIndex: 3 } };

      // Act
      const identity = PanelIdentity.fromConfigPanel(parsed);

      // Assert
      expect(identity.name).toBe(String.empty);
    });

    it('only unlocks by default on an explicit true', () =>
    {
      // Arrange: anything short of the literal boolean leaves the panel locked, so a stray
      // string in the config cannot silently hand the player a panel.
      const parsed = { identity: { unlockedByDefault: 'true' } };

      // Act
      const identity = PanelIdentity.fromConfigPanel(parsed);

      // Assert
      expect(identity.unlockedByDefault).toBe(false);
    });
  });
  //endregion nested shape

  //region legacy shape
  describe('fromConfigPanel with the legacy flat shape', () =>
  {
    it('reads fields off the panel root when no nested identity exists', () =>
    {
      // Arrange: config files predating the panel-shape migration store these at the root.
      const parsed = {
        name: 'Ironhide',
        iconIndex: 12,
        unlockedByDefault: true,
        description: 'Tough as nails.',
        topFlavorText: 'A panel of resilience.',
      };

      // Act
      const identity = PanelIdentity.fromConfigPanel(parsed);

      // Assert
      expect([ identity.name, identity.iconIndex, identity.unlockedByDefault ])
        .toEqual([ 'Ironhide', 12, true ]);
    });

    it('falls back to blank prose on a legacy row missing it', () =>
    {
      // Arrange
      const parsed = { name: 'Ironhide' };

      // Act
      const identity = PanelIdentity.fromConfigPanel(parsed);

      // Assert
      expect([ identity.description, identity.topFlavorText ])
        .toEqual([ String.empty, String.empty ]);
    });

    it('treats an absent legacy name as blank', () =>
    {
      // Arrange
      const parsed = { iconIndex: 3 };

      // Act
      const identity = PanelIdentity.fromConfigPanel(parsed);

      // Assert
      expect(identity.name).toBe(String.empty);
    });

    it('only unlocks a legacy row by default on an explicit true', () =>
    {
      // Arrange
      const parsed = { name: 'Ironhide', unlockedByDefault: 1 };

      // Act
      const identity = PanelIdentity.fromConfigPanel(parsed);

      // Assert
      expect(identity.unlockedByDefault).toBe(false);
    });
  });
  //endregion legacy shape

  //region icon coercion
  describe('icon index coercion', () =>
  {
    it.each([
      [ 'undefined', undefined ],
      [ 'null', null ],
      [ 'an empty string', '' ],
    ])('defaults the icon to zero when the field is %s', (_label, raw) =>
    {
      // Arrange: the editor omits or blanks the field for panels that draw no icon.
      const parsed = { identity: { iconIndex: raw } };

      // Act
      const identity = PanelIdentity.fromConfigPanel(parsed);

      // Assert
      expect(identity.iconIndex).toBe(0);
    });

    it('defaults the icon to zero when the field cannot be parsed', () =>
    {
      // Arrange
      const parsed = { identity: { iconIndex: 'not-a-number' } };

      // Act
      const identity = PanelIdentity.fromConfigPanel(parsed);

      // Assert
      expect(identity.iconIndex).toBe(0);
    });

    it('accepts a numeric icon written as a string', () =>
    {
      // Arrange: JSON tooling round-trips some numerics as strings.
      const parsed = { identity: { iconIndex: '42' } };

      // Act
      const identity = PanelIdentity.fromConfigPanel(parsed);

      // Assert
      expect(identity.iconIndex).toBe(42);
    });
  });
  //endregion icon coercion

  //region empty
  describe('empty', () =>
  {
    it('builds a blank identity for panels with nothing authored yet', () =>
    {
      // Arrange & Act
      const identity = PanelIdentity.empty();

      // Assert
      expect([ identity.name, identity.iconIndex, identity.unlockedByDefault ])
        .toEqual([ String.empty, 0, false ]);
    });
  });
  //endregion empty
});
//endregion plugins/sdp/core/models/panel-identity.test.js