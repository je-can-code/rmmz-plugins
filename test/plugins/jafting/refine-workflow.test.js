//region plugins/jafting/refine-workflow.test.js
import vm from 'node:vm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { installJaftingVmGamePartyBootstrap } from './fixtures/engine-stubs.js';
import { loadJaftingRefinePluginVm } from './jafting-refine-vm.js';

describe('J-JAFTING-Refinement workflow & layout (built plugins)', () =>
{
  let sandbox;
  let VM;

  beforeAll(() =>
  {
    sandbox = { console };
    loadJaftingRefinePluginVm(sandbox);
    VM = sandbox.__JAFT_VM;
    installJaftingVmGamePartyBootstrap(sandbox);

    vm.runInContext(`
      const party = new Game_Party();
      party.initialize();
      party.__testItemContainer = {};
      $gameParty = party;
      JaftingSalvageManager.initPartySalvageStorage();
    `, sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  describe('RefinementWorkflowSession', () =>
  {
    it('starts in PickingBase', () =>
    {
      const session = new VM.RefinementWorkflowSession();

      expect(session.getPhase()).toBe(VM.RefinementWorkflowSession.Phase.PickingBase);
    });

    it('reset returns to PickingBase', () =>
    {
      const session = new VM.RefinementWorkflowSession();

      session.beginMaterialSelection();
      session.reset();

      expect(session.getPhase()).toBe(VM.RefinementWorkflowSession.Phase.PickingBase);
    });

    it('runs the base → material → confirm loop and snapshot()', () =>
    {
      const session = new VM.RefinementWorkflowSession();

      session.beginMaterialSelection();
      expect(session.getPhase()).toBe(VM.RefinementWorkflowSession.Phase.PickingMaterial);

      session.returnToBaseSelection();
      expect(session.getPhase()).toBe(VM.RefinementWorkflowSession.Phase.PickingBase);

      session.beginMaterialSelection();
      session.beginConfirmation();
      expect(session.getPhase()).toBe(VM.RefinementWorkflowSession.Phase.Confirming);

      session.returnToMaterialSelection();
      expect(session.getPhase()).toBe(VM.RefinementWorkflowSession.Phase.PickingMaterial);

      expect(session.snapshot().phase).toBe(VM.RefinementWorkflowSession.Phase.PickingMaterial);
    });

    it('commitRefinement rejects missing pieces without changing phase mid-flow', () =>
    {
      const session = new VM.RefinementWorkflowSession();
      const outEquip = { wtypeId: 1, name: 'Out' };

      session.beginMaterialSelection();
      session.beginConfirmation();

      expect(session.commitRefinement(null, {}, outEquip).reason).toBe('missing_base');
      expect(session.commitRefinement({}, null, outEquip).reason).toBe('missing_material');
      expect(session.commitRefinement({}, {}, null).reason).toBe('missing_output');
      expect(session.getPhase()).toBe(VM.RefinementWorkflowSession.Phase.Confirming);
    });

    it('commitRefinement removes inputs, calls JaftingManager.createRefinedOutput, and returns to PickingBase', () =>
    {
      const session = new VM.RefinementWorkflowSession();
      let createdWith = null;
      const prevCreate = VM.JaftingManager.createRefinedOutput;

      VM.JaftingManager.createRefinedOutput = function(equip)
      {
        createdWith = equip;
      };

      vm.runInContext(`
        function vitestWeaponRaw(id, name)
        {
          return {
            id,
            meta: {},
            name,
            note: '',
            animationId: 0,
            wtypeId: 1,
            etypeId: 1,
            params: [ 10, 0, 0, 0, 0, 0, 0, 0 ],
            price: 0,
            traits: [],
            iconIndex: 1,
            description: '',
          };
        }

        const base = new RPG_Weapon(vitestWeaponRaw(10, 'Base'), 10);
        const mat = new RPG_Weapon(vitestWeaponRaw(11, 'Mat'), 11);

        $dataWeapons[10] = base;
        $dataWeapons[11] = mat;

        $gameParty.gainItem(base, 1);
        $gameParty.gainItem(mat, 1);

        globalThis.__vitestRefineBase = base;
        globalThis.__vitestRefineMat = mat;
      `, sandbox);

      session.beginMaterialSelection();
      session.beginConfirmation();

      const outEquip = { wtypeId: 1, name: 'Refined' };
      const result = session.commitRefinement(sandbox.__vitestRefineBase, sandbox.__vitestRefineMat, outEquip);

      expect(result.ok).toBe(true);
      expect(result.reason).toBe(null);
      expect(createdWith).toBe(outEquip);
      expect(session.getPhase()).toBe(VM.RefinementWorkflowSession.Phase.PickingBase);

      vm.runInContext(`
        globalThis.__vitestAfterBase = $gameParty.numItems(globalThis.__vitestRefineBase);
        globalThis.__vitestAfterMat = $gameParty.numItems(globalThis.__vitestRefineMat);
      `, sandbox);

      expect(sandbox.__vitestAfterBase).toBe(0);
      expect(sandbox.__vitestAfterMat).toBe(0);

      VM.JaftingManager.createRefinedOutput = prevCreate;
    });

    it('commitRefinement merges party salvage before removing the last base copy (craft rows survive)', () =>
    {
      const session = new VM.RefinementWorkflowSession();
      let createdWith = null;
      const prevCreate = VM.JaftingManager.createRefinedOutput;

      VM.JaftingManager.createRefinedOutput = function(equip)
      {
        createdWith = equip;
      };

      vm.runInContext(`
void (() =>
{
  function vitestWeaponRaw(id, name)
  {
    return {
      id,
      meta: {},
      name,
      note: '',
      animationId: 0,
      wtypeId: 1,
      etypeId: 1,
      params: [ 10, 0, 0, 0, 0, 0, 0, 0 ],
      price: 0,
      traits: [],
      iconIndex: 1,
      description: '',
    };
  }

  const base = new RPG_Weapon(vitestWeaponRaw(10, 'LedgerBase'), 10);
  const mat = new RPG_Weapon(vitestWeaponRaw(11, 'LedgerMat'), 11);

  $dataWeapons[10] = base;
  $dataWeapons[11] = mat;

  $gameParty.gainItem(base, 1);
  $gameParty.gainItem(mat, 1);

  JaftingSalvageManager.initPartySalvageStorage();
  const bag = new JaftingSalvagePartyLedgerBag();
  bag.unitLedgers[0] = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 99, 5) ]);
  JaftingSalvageManager.recomputeMergedRowsFromPartyLedgerBag(bag);
  $gameParty._j._jafting._salvageLedgers['w:10'] = bag;

  globalThis.__ledgerRefineBase = base;
  globalThis.__ledgerRefineMat = mat;
})();
`, sandbox);

      session.beginMaterialSelection();
      session.beginConfirmation();

      const outEquip = { wtypeId: 1, name: 'LedgerRefined' };
      const result = session.commitRefinement(sandbox.__ledgerRefineBase, sandbox.__ledgerRefineMat, outEquip);

      expect(result.ok).toBe(true);
      expect(createdWith._jaftingSalvageLedger).toBeDefined();
      expect(createdWith._jaftingSalvageLedger.rows.some(r => r.t === 'i' && r.id === 99 && r.n === 5)).toBe(true);

      VM.JaftingManager.createRefinedOutput = prevCreate;
    });

    it('markCommittedReturnToBase forces PickingBase without touching inventory', () =>
    {
      const session = new VM.RefinementWorkflowSession();

      session.beginMaterialSelection();
      session.beginConfirmation();
      session.markCommittedReturnToBase();

      expect(session.getPhase()).toBe(VM.RefinementWorkflowSession.Phase.PickingBase);
    });
  });

  describe('JaftingManager.parseTraits', () =>
  {
    it('returns Array.empty when there is no divider trait (code 63)', () =>
    {
      const equip = { traits: [ { code: 21, dataId: 0, value: 1 } ] };
      const parsed = VM.JaftingManager.parseTraits(equip);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(0);
    });

    it('returns Array.empty when the divider has no following traits', () =>
    {
      const equip = { traits: [ { code: 63, dataId: 0, value: 0 } ] };
      const parsed = VM.JaftingManager.parseTraits(equip);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(0);
    });

    it('maps jafting traits after the divider into JAFTING_Trait wrappers', () =>
    {
      const equip = {
        traits: [
          { code: 63, dataId: 0, value: 0 },
          { code: 44, dataId: 2, value: 10 },
        ],
      };
      const parsed = VM.JaftingManager.parseTraits(equip);

      expect(parsed.length).toBe(1);
      expect(parsed[0]).toBeInstanceOf(VM.JAFTING_Trait);
    });
  });

  describe('J.JAFTING + Refinement metadata', () =>
  {
    it('keeps core metadata while Refinement parameters are mapped', () =>
    {
      expect(sandbox.J.JAFTING.Metadata.name).toBe('J-JAFTING');
      expect(sandbox.J.JAFTING.EXT.REFINE.Metadata.name).toBe('J-JAFTING-Refinement');
    });
  });

  describe('Window_RefinementDetails layout', () =>
  {
    it('refinementColumnWidth is floor(innerWidth/3) with a 96px floor', () =>
    {
      const win = new VM.Window_RefinementDetails(new sandbox.Rectangle(0, 0, 400, 200));

      win.innerWidth = 300;

      expect(win.refinementColumnWidth()).toBe(100);
    });

    it('refinementColumnTextWidth stays inside the column', () =>
    {
      const win = new VM.Window_RefinementDetails(new sandbox.Rectangle(0, 0, 400, 200));

      win.innerWidth = 300;
      const cw = win.refinementColumnWidth();
      const tw = win.refinementColumnTextWidth();

      expect(tw).toBeLessThanOrEqual(cw);
      expect(tw).toBeGreaterThanOrEqual(64);
    });
  });
});
//endregion plugins/jafting/refine-workflow.test.js
