//region plugins/cms/core/_models/currency-definition.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * A currency definition describes something spendable without ever holding its value. Both halves are
 * deferred on purpose: an amount changes constantly, and a label can come out of the database, which
 * does not exist at the moment a plugin registers itself. A definition that read either eagerly would
 * either show a stale number or throw before the title screen.
 */
describe('CurrencyDefinition', () =>
{
  let CurrencyDefinition;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.String.empty ??= '';

    ({ default: CurrencyDefinition } =
      await import('../../../../../src/plugins/cms/core/_models/CurrencyDefinition.js'));
  });

  it('asks for the amount every time rather than remembering one', () =>
  {
    // Arrange- a balance that moves between reads, as a real one does.
    let held = 10;
    const definition = new CurrencyDefinition('vitest', -1, () => 'pts', () => held);

    // Act
    const before = definition.amount();
    held = 42;
    const after = definition.amount();

    // Assert
    expect(before).toBe(10);
    expect(after).toBe(42);
  });

  it('asks for the label every time rather than reading one at construction', () =>
  {
    // Arrange- gold's unit comes from the database, which loads long after this is built.
    let unit = undefined;
    const definition = new CurrencyDefinition('vitest', -1, () => unit, () => 0);
    unit = 'G';

    // Act
    const label = definition.unit();

    // Assert
    expect(label).toBe('G');
  });

  it('reports having an icon when it was given one', () =>
  {
    // Arrange
    const definition = new CurrencyDefinition('vitest', 17, () => 'pts', () => 0);

    // Act
    const hasIcon = definition.hasIcon();

    // Assert
    expect(hasIcon).toBe(true);
    expect(definition.iconIndex).toBe(17);
  });

  it('reports having no icon when it was given the sentinel', () =>
  {
    // Arrange- gold draws no icon, which is what -1 says.
    const definition = new CurrencyDefinition('vitest', -1, () => 'pts', () => 0);

    // Act
    const hasIcon = definition.hasIcon();

    // Assert
    expect(hasIcon).toBe(false);
  });

  it('treats icon zero as an icon, since zero is a real index', () =>
  {
    // Arrange- the boundary either side of the sentinel; a truthiness check would get this wrong.
    const definition = new CurrencyDefinition('vitest', 0, () => 'pts', () => 0);

    // Act
    const hasIcon = definition.hasIcon();

    // Assert
    expect(hasIcon).toBe(true);
  });
});
//endregion plugins/cms/core/_models/currency-definition.test.js