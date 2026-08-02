//region plugins/drops/core/models/drops-party-strategy.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * The strategy list is a named set of constants, not a thing with instances. Constructing one
 * would produce an object with no behavior whatsoever, which then silently fails to match any of
 * the string comparisons it exists to serve - so it refuses loudly instead.
 */
describe('DropsPartyStrategy (direct src import)', () =>
{
  let DropsPartyStrategy;

  beforeAll(async () =>
  {
    ({ default: DropsPartyStrategy } = await import('../../../../../src/plugins/drops/core/models/DropsPartyStrategy.js'));
  });

  it('refuses to be instantiated', () =>
  {
    // Arrange: the warnings and trace are noise in a passing test run, but the throw is the
    // behavior under test.
    const warn = vi.spyOn(console, 'warn')
      .mockImplementation(() => {});
    const trace = vi.spyOn(console, 'trace')
      .mockImplementation(() => {});

    // Act
    const act = () => new DropsPartyStrategy();

    // Assert
    expect(act).toThrow(/static class that cannot be instantiated/);

    // restore manually so the spies cannot leak into whichever test runs next in this file.
    warn.mockRestore();
    trace.mockRestore();
  });

  it('exposes each strategy as a distinct value', () =>
  {
    // Arrange & Act
    const strategies = [
      DropsPartyStrategy.AbsStyle,
      DropsPartyStrategy.CombatPartyStyle,
      DropsPartyStrategy.FullPartyStyle,
    ];

    // Assert: duplicates would make two strategies indistinguishable in the switch that reads them.
    expect(new Set(strategies).size).toBe(3);
  });
});
//endregion plugins/drops/core/models/drops-party-strategy.test.js