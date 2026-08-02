//region plugins/jafting/_component/refinement-workflow-session.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import JaftingManager from '../../../../src/plugins/jafting/ext/refine/managers/JaftingManager.js';
import RefinementWorkflowSession from '../../../../src/plugins/jafting/ext/refine/__models/RefinementWorkflowSession.js';

// RefinementWorkflowSession imports JaftingManager as a real ES module binding, so a plain
// globalThis.JaftingManager reassignment never reaches it- vi.mock intercepts the import itself,
// vitest's equivalent of moq/FakeItEasy for ESM dependencies.
vi.mock('../../../../src/plugins/jafting/ext/refine/managers/JaftingManager.js', () => ({
  default: {
    createRefinedOutput: vi.fn(),
    lineageForDatum: vi.fn(datum => ({ leafFor: datum.id })),
  },
}));

describe('RefinementWorkflowSession phase state machine', () =>
{
  let session;

  beforeEach(() =>
  {
    session = new RefinementWorkflowSession();
  });

  it('starts in the PickingBase phase', () =>
  {
    expect(session.getPhase()).toBe(RefinementWorkflowSession.Phase.PickingBase);
  });

  it('advances base -> material -> confirm along the happy path', () =>
  {
    session.beginMaterialSelection();
    expect(session.getPhase()).toBe(RefinementWorkflowSession.Phase.PickingMaterial);

    session.beginConfirmation();
    expect(session.getPhase()).toBe(RefinementWorkflowSession.Phase.Confirming);
  });

  it('returnToBaseSelection backs out of material selection', () =>
  {
    session.beginMaterialSelection();
    session.returnToBaseSelection();

    expect(session.getPhase()).toBe(RefinementWorkflowSession.Phase.PickingBase);
  });

  it('returnToMaterialSelection backs out of confirmation', () =>
  {
    session.beginMaterialSelection();
    session.beginConfirmation();
    session.returnToMaterialSelection();

    expect(session.getPhase()).toBe(RefinementWorkflowSession.Phase.PickingMaterial);
  });

  it('markCommittedReturnToBase resets to PickingBase from any phase', () =>
  {
    session.beginMaterialSelection();
    session.beginConfirmation();
    session.markCommittedReturnToBase();

    expect(session.getPhase()).toBe(RefinementWorkflowSession.Phase.PickingBase);
  });

  it('reset() returns to PickingBase from any phase', () =>
  {
    session.beginMaterialSelection();
    session.beginConfirmation();
    session.reset();

    expect(session.getPhase()).toBe(RefinementWorkflowSession.Phase.PickingBase);
  });

  it('snapshot() reflects the current phase', () =>
  {
    expect(session.snapshot()).toEqual({ phase: RefinementWorkflowSession.Phase.PickingBase });

    session.beginMaterialSelection();

    expect(session.snapshot()).toEqual({ phase: RefinementWorkflowSession.Phase.PickingMaterial });
  });

  describe('commitRefinement', () =>
  {
    /** @type {any} */
    let previousGameParty;
    /** @type {any} */
    let previousSalvageManager;

    beforeEach(() =>
    {
      previousGameParty = globalThis.$gameParty;
      previousSalvageManager = globalThis.JaftingSalvageManager;
      JaftingManager.createRefinedOutput.mockClear();
    });

    afterEach(() =>
    {
      globalThis.$gameParty = previousGameParty;
      globalThis.JaftingSalvageManager = previousSalvageManager;
    });

    it('captures provenance before removing party items, so a consumed refined input is still on file', () =>
    {
      // Arrange
      const callOrder = [];

      // JaftingSalvageManager is referenced as a bare global in the source (not imported), so a
      // plain globalThis stub is enough to intercept it- unlike JaftingManager above.
      globalThis.JaftingSalvageManager = {
        buildRefinementOutputLedger: () =>
        {
          callOrder.push('buildLedger');
          return { merged: true };
        },
      };

      globalThis.$gameParty = {
        gainItem: () => callOrder.push('gainItem'),
      };

      JaftingManager.createRefinedOutput.mockImplementation(() => callOrder.push('createRefinedOutput'));
      JaftingManager.lineageForDatum.mockImplementation(datum =>
      {
        callOrder.push('lineageForDatum');

        return { leafFor: datum.id };
      });

      const baseItem = { object: () => ({ id: 1 }) };
      const materialItem = { object: () => ({ id: 2 }) };
      const outputEquip = {};

      // Act
      const result = session.commitRefinement(baseItem, materialItem, outputEquip);

      // Assert
      expect(callOrder).toEqual([
        'buildLedger', 'lineageForDatum', 'lineageForDatum', 'gainItem', 'gainItem', 'createRefinedOutput',
      ]);
      expect(outputEquip._jaftingSalvageLedger).toEqual({ merged: true });
      expect(result).toEqual({ ok: true, reason: null });
      expect(session.getPhase()).toBe(RefinementWorkflowSession.Phase.PickingBase);
    });

    it('hands the captured provenance of both inputs down to the output creator', () =>
    {
      // Arrange
      globalThis.JaftingSalvageManager = { buildRefinementOutputLedger: () => ({ merged: true }) };
      globalThis.$gameParty = { gainItem: () => {} };
      JaftingManager.createRefinedOutput.mockImplementation(() => {});
      JaftingManager.lineageForDatum.mockImplementation(datum => ({ leafFor: datum.id }));

      // Act
      session.commitRefinement({ object: () => ({ id: 1 }) }, { object: () => ({ id: 2 }) }, {});

      // Assert
      const [ , baseLineage, materialLineage ] = JaftingManager.createRefinedOutput.mock.calls.at(-1);
      expect(baseLineage).toEqual({ leafFor: 1 });
      expect(materialLineage).toEqual({ leafFor: 2 });
    });
  });
});
//endregion plugins/jafting/_component/refinement-workflow-session.test.js
