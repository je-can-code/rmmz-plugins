//region plugins/_base/managers/input-legend-resolver.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-Base InputLegendResolver (unit, no dependencies)', () =>
{
  /** @type {typeof import('../../../../src/plugins/_base/managers/InputLegendResolver.js').default} */
  let InputLegendResolver;

  beforeAll(async () =>
  {
    vi.resetModules();

    // `String.empty` is a J-Base runtime augmentation rather than a language feature, and resolve()
    // compares against it directly. A direct-import test never boots J-Base, so without this stub the
    // comparison on line 58 reads `undefined` and the "resolver cannot describe this" branch silently
    // stops being reachable- the test would pass while proving nothing.
    String.empty = '';

    InputLegendResolver = (await import('../../../../src/plugins/_base/managers/InputLegendResolver.js')).default;
  });

  afterAll(() =>
  {
    // leave the realm as we found it for any other file sharing this worker.
    delete String.empty;
  });

  beforeEach(() =>
  {
    // the registry is a single static slot shared by the whole realm, so a resolver registered by one
    // test would otherwise still be answering during the next one.
    InputLegendResolver.clearResolver();
  });

  describe('hasResolver', () =>
  {
    it('reports false before anyone has registered', () =>
    {
      // Act & Assert: J-Base ships without a resolver and only gains one if some plugin supplies it.
      expect(InputLegendResolver.hasResolver())
        .toBe(false);
    });

    it('reports true once a resolver is registered', () =>
    {
      // Arrange: stand in for whichever plugin owns the input mapping.
      InputLegendResolver.registerResolver(() => 'Triangle');

      // Act & Assert.
      expect(InputLegendResolver.hasResolver())
        .toBe(true);
    });
  });

  describe('registerResolver', () =>
  {
    it('replaces a previously registered resolver rather than stacking', () =>
    {
      // Arrange: register twice, as a reloading plugin would.
      InputLegendResolver.registerResolver(() => 'Triangle');
      InputLegendResolver.registerResolver(() => 'Circle');

      // Act & Assert: the most recent registration is the one that answers.
      expect(InputLegendResolver.resolve('context', 'Context'))
        .toBe('Circle');
    });
  });

  describe('resolve', () =>
  {
    it('returns the fallback when no resolver is registered', () =>
    {
      // Act: nothing has registered, so the caller's own wording is the best answer available.
      const result = InputLegendResolver.resolve('context', 'Context');

      // Assert.
      expect(result)
        .toBe('Context');
    });

    it('returns the fallback when the resolver cannot describe the semantic', () =>
    {
      // Arrange: resolvers report "I do not know this one" with an empty string rather than throwing.
      InputLegendResolver.registerResolver(() => String.empty);

      // Act.
      const result = InputLegendResolver.resolve('unmapped-thing', 'Unmapped');

      // Assert: the fallback specifically- a blank legend entry would read as a rendering bug.
      expect(result)
        .toBe('Unmapped');
    });

    it('returns the resolved text when the resolver knows the semantic', () =>
    {
      // Arrange: the live-glyph case, where the player sees their actual binding.
      InputLegendResolver.registerResolver(() => 'Triangle');

      // Act.
      const result = InputLegendResolver.resolve('context', 'Context');

      // Assert: the resolver's answer wins over the caller's plain-text fallback.
      expect(result)
        .toBe('Triangle');
    });

    it('passes the semantic through to the resolver', () =>
    {
      // Arrange: capture what the registry actually hands the resolver.
      const seen = [];
      InputLegendResolver.registerResolver(semantic =>
      {
        seen.push(semantic);

        return 'X';
      });

      // Act.
      InputLegendResolver.resolve('actor-next', 'Next');

      // Assert: the semantic name, not the fallback, is what identifies a binding.
      expect(seen)
        .toEqual([ 'actor-next' ]);
    });
  });

  describe('clearResolver', () =>
  {
    it('restores plain-text fallback behavior', () =>
    {
      // Arrange: get a resolver answering first so the clear is observable.
      InputLegendResolver.registerResolver(() => 'Triangle');

      // Act.
      InputLegendResolver.clearResolver();

      // Assert: both the flag and the behavior revert, not just the flag.
      expect(InputLegendResolver.hasResolver())
        .toBe(false);
      expect(InputLegendResolver.resolve('context', 'Context'))
        .toBe('Context');
    });
  });
});
//endregion plugins/_base/managers/input-legend-resolver.test.js
