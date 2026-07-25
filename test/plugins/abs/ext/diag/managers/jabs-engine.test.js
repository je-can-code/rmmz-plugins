//region plugins/abs/ext/diag/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Diagonal JABS_Engine (unit, all downstream dependencies mocked)', () =>
{
  /** @type {import('vitest').Mock} the "original" (aliased) applyActionToActionEventSprite- kept as a
   *  stable variable and mutated in place, never reassigned, since the Aliased map captures a fixed
   *  reference to whichever function object sat on the prototype at import time. */
  let originalApplyActionToActionEventSprite;

  beforeAll(async () =>
  {
    vi.resetModules();

    // minimal J.ABS.EXT.DIAG namespace- only the shape this one file reads/writes.
    globalThis.J = {
      ABS: {
        EXT: {
          DIAG: {
            Aliased: { JABS_Engine: new Map() },
          },
        },
      },
    };

    // JABS_Engine.prototype.applyActionToActionEventSprite is aliased ("original") before this file
    // overwrites it; a bare mock is all the "original" needs to be for this file's own logic to be
    // exercised.
    function JABS_Engine()
    {
    }

    originalApplyActionToActionEventSprite = vi.fn();
    JABS_Engine.prototype.applyActionToActionEventSprite = originalApplyActionToActionEventSprite;
    globalThis.JABS_Engine = JABS_Engine;

    // the file under test- patches globalThis.JABS_Engine.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/abs/ext/diag/managers/JABS_Engine.js');
  });

  beforeEach(() =>
  {
    // reset the SAME mock instance the Aliased map already holds a reference to.
    originalApplyActionToActionEventSprite.mockReset();
  });

  describe('applyActionToActionEventSprite', () =>
  {
    it('calls the original logic then sets the custom direction from the action', () =>
    {
      // Arrange
      const engine = Object.create(globalThis.JABS_Engine.prototype);
      const actionEventSprite = { setCustomDirection: vi.fn() };
      const action = { direction: vi.fn(() => 6) };

      // Act
      engine.applyActionToActionEventSprite(actionEventSprite, action);

      // Assert
      expect(originalApplyActionToActionEventSprite).toHaveBeenCalledWith(actionEventSprite, action);
      expect(actionEventSprite.setCustomDirection).toHaveBeenCalledWith(6);
    });
  });
});
//endregion plugins/abs/ext/diag/managers/jabs-engine.test.js
