//region plugins/abs/ext/dps/models/jabs-dps-hit.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('JabsDpsHit (direct src import)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/dps/models/JabsDpsHit.js').default} */
  let JabsDpsHit;

  beforeAll(async () =>
  {
    vi.resetModules();

    // String.empty is a J-Base addition the model uses for its field defaults.
    String.empty = '';

    const module = await import('../../../../../../src/plugins/abs/ext/dps/models/JabsDpsHit.js');
    JabsDpsHit = module.default;
  });

  /**
   * Builds a hit whose five values are all distinguishable from one another, so an accessor
   * returning the wrong field cannot accidentally return the right value.
   * @returns {object} The hit under test.
   */
  function buildHit()
  {
    return new JabsDpsHit(147, 'uuid-jerald', 82, 316, true);
  }

  it('reports the combat frame it was told it landed on', () =>
  {
    // Arrange
    const hit = buildHit();

    // Act
    const result = hit.combatFrame();

    // Assert
    expect(result).toBe(147);
  });

  it('reports the uuid of the battler that dealt it', () =>
  {
    // Arrange
    const hit = buildHit();

    // Act
    const result = hit.casterUuid();

    // Assert
    expect(result).toBe('uuid-jerald');
  });

  it('reports the skill it came from', () =>
  {
    // Arrange
    const hit = buildHit();

    // Act
    const result = hit.skillId();

    // Assert
    expect(result).toBe(82);
  });

  it('reports the hp damage it inflicted', () =>
  {
    // Arrange
    const hit = buildHit();

    // Act
    const result = hit.hpDamage();

    // Assert
    expect(result).toBe(316);
  });

  it('reports being a critical when it was one', () =>
  {
    // Arrange
    const hit = buildHit();

    // Act
    const result = hit.isCritical();

    // Assert
    expect(result).toBe(true);
  });

  it('reports not being a critical when it was not one', () =>
  {
    // Arrange- identical to the hit above but for the flag, so nothing else can explain the answer.
    const hit = new JabsDpsHit(147, 'uuid-jerald', 82, 316, false);

    // Act
    const result = hit.isCritical();

    // Assert
    expect(result).toBe(false);
  });
});
//endregion plugins/abs/ext/dps/models/jabs-dps-hit.test.js