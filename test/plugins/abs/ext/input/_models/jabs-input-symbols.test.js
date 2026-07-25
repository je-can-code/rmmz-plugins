//region plugins/abs/ext/input/_models/jabs-input-symbols.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-Input JabsInputSymbols (unit, pure class, no downstream dependencies)', () =>
{
  let JabsInputSymbols;

  beforeAll(async () =>
  {
    ({ default: JabsInputSymbols } = await import('../../../../../../src/plugins/abs/ext/input/_models/JabsInputSymbols.js'));
  });

  it('aligns core movement/action symbols with RMMZ internal mapping conventions', () =>
  {
    expect(JabsInputSymbols.DirUp).toBe('up');
    expect(JabsInputSymbols.Mainhand).toBe('ok');
    expect(JabsInputSymbols.Offhand).toBe('cancel');
    expect(JabsInputSymbols.Dash).toBe('shift');
  });

  it('defines the newly-implemented JABS-specific symbols', () =>
  {
    expect(JabsInputSymbols.MobilitySkill).toBe('r2');
    expect(JabsInputSymbols.Quickmenu).toBe('start');
    expect(JabsInputSymbols.PartyCycle).toBe('select');
  });

  it('defines dedicated combat-skill keyboard symbols', () =>
  {
    expect(JabsInputSymbols.CombatSkill1).toBe('combat-skill-1');
    expect(JabsInputSymbols.CombatSkill4).toBe('combat-skill-4');
  });
});
//endregion plugins/abs/ext/input/_models/jabs-input-symbols.test.js
