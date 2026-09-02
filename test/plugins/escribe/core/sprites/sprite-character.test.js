//region plugins/escribe/core/sprites/sprite-character.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installEscribeHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJEscribe,
} from '../../_component/fixtures/install-escribe-host-globals.js';
import PluginMetadata from '../../../../../src/plugins/_base/core/models/PluginMetadata.js';

/**
 * Where each escription parks above its character.
 *
 * This is arithmetic with no visible failure mode: a wrong offset does not throw, it just puts a
 * label somewhere slightly wrong, and nobody notices until a line is buried in a sprite or floating
 * in the sky. The single-line numbers are pinned deliberately, because a block of lines must not
 * change where a lone label has always sat.
 */
describe('J-Escriptions Sprite_Character placement', () =>
{
  let Sprite_Character;
  let Escription;

  /**
   * Builds a bare sprite that can answer placement questions.
   * @returns {Sprite_Character}
   */
  const buildSprite = () => Object.create(Sprite_Character.prototype);

  /**
   * Builds a text escription.
   * @param {string} content The line to draw.
   * @returns {Escription}
   */
  const text = content => new Escription(Escription.Kinds.Text, content, Escription.ALWAYS_VISIBLE);

  /**
   * Builds an icon escription.
   * @returns {Escription}
   */
  const icon = () => new Escription(Escription.Kinds.Icon, 208, Escription.ALWAYS_VISIBLE);

  beforeAll(async () =>
  {
    vi.resetModules();

    installEscribeHostGlobals();
    globalThis.PluginMetadata = PluginMetadata;

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJEscribe();
    await import('../../../../../src/plugins/escribe/core/_metadata/initialization.js');

    ({ default: Escription } = await import('../../../../../src/plugins/escribe/core/_models/Escription.js'));

    await import('../../../../../src/plugins/escribe/core/sprites/Sprite_Character.js');

    ({ Sprite_Character } = globalThis);
  });

  describe('escriptionLineCount()', () =>
  {
    it('counts only the text, not the icon standing beside it', () =>
    {
      // Arrange
      const sprite = buildSprite();
      const escriptions = [ text('one'), text('two'), icon() ];

      // Act
      const result = sprite.escriptionLineCount(escriptions);

      // Assert
      expect(result).toBe(2);
    });

    it('counts nothing for an event declaring an icon alone', () =>
    {
      // Arrange
      const sprite = buildSprite();

      // Act
      const result = sprite.escriptionLineCount([ icon() ]);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('escriptionOffsetY()', () =>
  {
    it('parks a lone line of text on the base, exactly where it always sat', () =>
    {
      // Arrange
      const sprite = buildSprite();
      const escriptions = [ text('only') ];

      // Act
      const result = sprite.escriptionOffsetY(escriptions.at(0), 0, 1);

      // Assert
      expect(result).toBe(0);
    });

    it('stacks a block upward, with the first line highest and the last on the base', () =>
    {
      // Arrange
      const sprite = buildSprite();
      const escriptions = [ text('first'), text('second'), text('third') ];

      // Act
      const results = escriptions.map((escription, index) => sprite.escriptionOffsetY(escription, index, 3));

      // Assert
      expect(results).toEqual([ -32, -16, 0 ]);
    });

    it('parks an icon above a lone line, exactly where it always sat', () =>
    {
      // Arrange
      const sprite = buildSprite();
      const escriptions = [ text('one'), icon() ];

      // Act
      const result = sprite.escriptionOffsetY(escriptions.at(1), 1, 1);

      // Assert
      expect(result).toBe(-32);
    });

    it('lifts the icon clear of a whole block rather than burying it mid-paragraph', () =>
    {
      // Arrange- three lines top out at -32, so the icon belongs a further gap above that.
      const sprite = buildSprite();
      const escriptions = [ text('first'), text('second'), text('third'), icon() ];

      // Act
      const result = sprite.escriptionOffsetY(escriptions.at(3), 3, 3);

      // Assert
      expect(result).toBe(-64);
    });

    it('parks an icon declared alone where a lone icon always sat', () =>
    {
      // Arrange- with no text at all the block has no height, and the gap is measured from the
      // character rather than from a line that does not exist.
      const sprite = buildSprite();

      // Act
      const result = sprite.escriptionOffsetY(icon(), 0, 0);

      // Assert
      expect(result).toBe(-32);
    });
  });
});
//endregion plugins/escribe/core/sprites/sprite-character.test.js