//region plugins/abs/ext/input/windows/window-jabs-remap-actions.test.js
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * Window_JabsRemapActions.js is a view, and views sit outside coverage- but whether the remap list offers
 * the ally commands at all is routed on {@link JABS_Button.isAllyCommandAvailable}, and the label and help
 * text the player reads come from the file's own lookup tables. Neither the section specs nor the lookups
 * touch `this`, so they are called straight off the prototype against a bare `Window_Command` stand-in,
 * rather than booting the view harness to draw rows nothing here looks at.
 */
describe('J-ABS-Input Window_JabsRemapActions (unit, section routing and lookups only)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/input/windows/Window_JabsRemapActions.js').default} */
  let Window_JabsRemapActions;

  /** @type {typeof import('../../../../../../src/plugins/abs/ext/input/_models/JABS_Button.js').default} */
  let JABS_Button;

  /**
   * The spy standing in for whether J-ABS-AllyAI is installed, restored by hand after each test.
   * @type {import('vitest').MockInstance|null}
   */
  let availabilitySpy = null;

  beforeAll(async () =>
  {
    vi.resetModules();

    // the empty sentinels are defined by J-Base at runtime; this file loads the window alone.
    Array.empty ||= Object.freeze([]);
    String.empty ||= '';

    // the window only needs something to extend while its module loads.
    globalThis.Window_Command = class {};

    ({ default: JABS_Button } = await import('../../../../../../src/plugins/abs/ext/input/_models/JABS_Button.js'));
    ({ default: Window_JabsRemapActions } =
      await import('../../../../../../src/plugins/abs/ext/input/windows/Window_JabsRemapActions.js'));
  });

  afterEach(() =>
  {
    // the spy sits on a class every test shares, so it is put back by hand rather than left to leak.
    if (availabilitySpy !== null)
    {
      availabilitySpy.mockRestore();
      availabilitySpy = null;
    }
  });

  /**
   * Decides whether ally commands read as available for the window being asked.
   * @param {boolean} available Whether J-ABS-AllyAI should appear installed.
   */
  function setAllyCommandAvailable(available)
  {
    // the window routes on this one answer, so it is the only thing that needs standing in for.
    availabilitySpy = vi.spyOn(JABS_Button, 'isAllyCommandAvailable')
      .mockReturnValue(available);
  }

  describe('_builtinSectionSpecs()', () =>
  {
    it('offers an Ally Commands section holding all four orders when allies can be commanded', () =>
    {
      // Arrange
      setAllyCommandAvailable(true);

      // Act
      const specs = Window_JabsRemapActions.prototype._builtinSectionSpecs.call({});

      // Assert
      const allySection = specs.find(spec => spec.title === 'Ally Commands');
      expect(allySection.buttons).toEqual([ 'AllyCharge', 'AllyPullBack', 'AllyStanceSafer', 'AllyStanceBolder' ]);
    });

    it('lists the ally section after every section the plugin always has', () =>
    {
      // Arrange
      setAllyCommandAvailable(true);

      // Act
      const specs = Window_JabsRemapActions.prototype._builtinSectionSpecs.call({});

      // Assert
      expect(specs.map(spec => spec.title))
        .toEqual([ 'Primary Actions', 'Secondary Actions', 'Functional Actions', 'Ally Commands' ]);
    });

    it('leaves the Ally Commands section out when there are no allies to command', () =>
    {
      // Arrange
      setAllyCommandAvailable(false);

      // Act
      const specs = Window_JabsRemapActions.prototype._builtinSectionSpecs.call({});

      // Assert- the sections every installation has are still all there.
      expect(specs.map(spec => spec.title))
        .toEqual([ 'Primary Actions', 'Secondary Actions', 'Functional Actions' ]);
    });
  });

  describe('humanizeButton()/describeButton()', () =>
  {
    it.each([
      [ 'AllyCharge', 'Ally Charge' ],
      [ 'AllyPullBack', 'Ally Pull Back' ],
      [ 'AllyStanceSafer', 'Stance: Safer' ],
      [ 'AllyStanceBolder', 'Stance: Bolder' ],
    ])('labels %s for the remap list', (button, expected) =>
    {
      // Arrange/Act
      const label = Window_JabsRemapActions.prototype.humanizeButton.call({}, button);

      // Assert
      expect(label).toEqual(expected);
    });

    it.each([
      [ 'AllyCharge', 'Send your allies charging in.\nThey go after whatever you are fighting.' ],
      [ 'AllyPullBack', 'Call your allies back out of the fight.\nThey stay out of it for a few seconds.' ],
      [ 'AllyStanceSafer', 'Step your allies\' stance one rung safer.\nToward hanging back behind you.' ],
      [ 'AllyStanceBolder', 'Step your allies\' stance one rung bolder.\nToward leading the charge ahead of you.' ],
    ])('explains what %s orders', (button, expected) =>
    {
      // Arrange/Act
      const help = Window_JabsRemapActions.prototype.describeButton.call({}, button);

      // Assert
      expect(help).toEqual(expected);
    });

    it('explains the Ally Commands section when its header is highlighted', () =>
    {
      // Arrange/Act
      const help = Window_JabsRemapActions.prototype.describeButton.call({}, 'Ally Commands');

      // Assert
      expect(help).toEqual('Orders for your allies, given mid-fight: send them charging in, call them back,\n'
        + 'or step their stance safer or bolder without opening a menu.');
    });
  });
});
//endregion plugins/abs/ext/input/windows/window-jabs-remap-actions.test.js
