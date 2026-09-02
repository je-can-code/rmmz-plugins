//region plugins/escribe/core/objects/game-character.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installEscribeHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJEscribe,
} from '../../_component/fixtures/install-escribe-host-globals.js';
import PluginMetadata from '../../../../../src/plugins/_base/core/models/PluginMetadata.js';

/**
 * The abstract escription surface every character carries.
 *
 * Only events describe themselves, but the sprite layer draws players, followers and vehicles
 * through the same code path- so the base answers have to be the honest "nothing here" rather than
 * missing methods that would throw the moment a non-event walked past.
 */
describe('J-Escriptions Game_Character', () =>
{
  let Game_Character;

  beforeAll(async () =>
  {
    vi.resetModules();

    installEscribeHostGlobals();
    globalThis.PluginMetadata = PluginMetadata;

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJEscribe();
    await import('../../../../../src/plugins/escribe/core/_metadata/initialization.js');

    await import('../../../../../src/plugins/escribe/core/objects/Game_Character.js');

    ({ Game_Character } = globalThis);
  });

  describe('escriptions()', () =>
  {
    it('describes nothing, because a non-event has no comments to read', () =>
    {
      // Arrange
      const character = new Game_Character();

      // Act
      const result = character.escriptions();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('hasEscriptions()', () =>
  {
    it('has none, matching the empty list above', () =>
    {
      // Arrange
      const character = new Game_Character();

      // Act
      const result = character.hasEscriptions();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('parseEscriptionComments()', () =>
  {
    it('does nothing at all, since there is no page to read', () =>
    {
      // Arrange
      const character = new Game_Character();

      // Act
      character.parseEscriptionComments();

      // Assert- the stub leaves the character exactly as unable to describe itself as before.
      expect(character.escriptions()).toEqual([]);
    });
  });
});
//endregion plugins/escribe/core/objects/game-character.test.js