//region plugins/abs/core/models/jabs-cooldown.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('JABS_Cooldown (direct src import)', () =>
{
  let JABS_Cooldown;

  beforeAll(async () =>
  {
    vi.resetModules();

    // SerializableRegistry is a downstream dependency (a _base file); it's only touched at
    // module load time to register this class, so a bare stub is sufficient here.
    globalThis.SerializableRegistry = { register: vi.fn() };

    ({ default: JABS_Cooldown } = await import('../../../../../src/plugins/abs/core/models/JABS_Cooldown.js'));
  });

  it('registers itself with the serializable registry on module load', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.SerializableRegistry.register).toHaveBeenCalledWith(JABS_Cooldown);
  });

  describe('constructor / initialize', () =>
  {
    it('stores the given key', () =>
    {
      // Arrange & Act
      const cooldown = new JABS_Cooldown('mainhand');

      // Assert
      expect(cooldown.key).toBe('mainhand');
    });

    it('initializes with clean cooldown data', () =>
    {
      // Arrange & Act
      const cooldown = new JABS_Cooldown('mainhand');

      // Assert
      expect(cooldown.frames).toBe(0);
      expect(cooldown.maxFrames).toBe(0);
      expect(cooldown.ready).toBe(false);
      expect(cooldown.comboFrames).toBe(0);
      expect(cooldown.comboReady).toBe(false);
      expect(cooldown.comboExpireFrames).toBe(0);
      expect(cooldown.comboExpireFramesMax).toBe(0);
      expect(cooldown.comboMode).toBe('none');
      expect(cooldown.locked).toBe(false);
      expect(cooldown.mustComboClear).toBe(false);
    });
  });

  describe('needsComboClear / acknowledgeComboClear / requestComboClear', () =>
  {
    it('reports no combo-clear request by default', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      expect(cooldown.needsComboClear()).toBe(false);
    });

    it('flags a combo-clear request', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.requestComboClear();
      expect(cooldown.needsComboClear()).toBe(true);
    });

    it('clears the combo-clear request once acknowledged', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.requestComboClear();
      cooldown.acknowledgeComboClear();
      expect(cooldown.needsComboClear()).toBe(false);
    });
  });

  describe('locking: isLocked / lock / unlock', () =>
  {
    it('is unlocked by default', () =>
    {
      expect(new JABS_Cooldown('key').isLocked()).toBe(false);
    });

    it('locks the cooldown', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.lock();
      expect(cooldown.isLocked()).toBe(true);
    });

    it('unlocks a locked cooldown', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.lock();
      cooldown.unlock();
      expect(cooldown.isLocked()).toBe(false);
    });
  });

  describe('update / canUpdate', () =>
  {
    it('does not update the cooldown data while locked', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setFrames(10);
      cooldown.lock();

      cooldown.update();

      expect(cooldown.frames).toBe(10);
    });

    it('updates the base cooldown while unlocked', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setFrames(10);

      cooldown.update();

      expect(cooldown.frames).toBe(9);
    });
  });

  describe('base cooldown: setFrames / modBaseFrames / handleIfBaseReady / handleIfBaseUnready', () =>
  {
    it('marks the base cooldown ready immediately when set to 0', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setFrames(0);
      expect(cooldown.isBaseReady()).toBe(true);
    });

    it('marks the base cooldown not ready when set to a positive value', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setFrames(30);
      expect(cooldown.isBaseReady()).toBe(false);
    });

    it('clears any active combo expiry window when a new positive cooldown is set', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.enableCombo();
      cooldown.setComboExpireFrames(60);

      cooldown.setFrames(30);

      expect(cooldown.comboExpireFrames).toBe(0);
    });

    it('also clears the combo expiry window when set to 0, via the ready-reset path instead', () =>
    {
      // unlike the positive-frames branch (which clears expiry explicitly), a 0 value skips that
      // branch but still clears it indirectly: handleIfBaseReady() fires resetCombo() below.
      const cooldown = new JABS_Cooldown('key');
      cooldown.enableCombo();
      cooldown.setComboExpireFrames(60);

      cooldown.setFrames(0);

      expect(cooldown.comboExpireFrames).toBe(0);
    });

    it('resets combo data once the base cooldown becomes ready', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.enableCombo();

      cooldown.setFrames(0);

      expect(cooldown.comboReady).toBe(false);
      expect(cooldown.mustComboClear).toBe(true);
    });

    it('extends the base cooldown via modBaseFrames', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setFrames(5);

      cooldown.modBaseFrames(5);

      expect(cooldown.frames).toBe(10);
      expect(cooldown.isBaseReady()).toBe(false);
    });

    it('becomes ready via modBaseFrames when the modification reaches 0 or below', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setFrames(5);

      cooldown.modBaseFrames(-5);

      expect(cooldown.isBaseReady()).toBe(true);
    });

    it('resets the overlay mode to none once the base cooldown becomes ready', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setComboMode('expiring');

      cooldown.setFrames(0);

      expect(cooldown.comboMode).toBe('none');
    });

    it('stashes the full duration as maxFrames when set to a positive value', () =>
    {
      const cooldown = new JABS_Cooldown('key');

      cooldown.setFrames(300);

      expect(cooldown.maxFrames).toBe(300);
    });

    it('does not overwrite maxFrames when set to 0', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setFrames(300);

      cooldown.setFrames(0);

      expect(cooldown.maxFrames).toBe(300);
    });

    it('updates maxFrames again on a subsequent positive setFrames call', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setFrames(300);

      cooldown.setFrames(150);

      expect(cooldown.maxFrames).toBe(150);
    });

    it('leaves maxFrames untouched when only modBaseFrames is used, not setFrames', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setFrames(300);

      cooldown.modBaseFrames(-30);

      expect(cooldown.maxFrames).toBe(300);
      expect(cooldown.frames).toBe(270);
    });
  });

  describe('updateBaseCooldown', () =>
  {
    it('does nothing further once already ready', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setFrames(0);

      cooldown.updateBaseCooldown();

      expect(cooldown.frames).toBe(0);
    });

    it('leaves the combo data and overlay mode untouched once already ready', () =>
    {
      // Arrange
      // becoming ready already requested a combo clear, so acknowledge it first- otherwise the flag
      // reads as pending on both paths and cannot distinguish an early return from a second reset.
      const cooldown = new JABS_Cooldown('key');
      cooldown.setFrames(0);
      cooldown.acknowledgeComboClear();
      cooldown.setComboMode('infinite');

      // Act
      cooldown.updateBaseCooldown();

      // Assert
      expect(cooldown.comboMode).toBe('infinite');
      expect(cooldown.needsComboClear()).toBe(false);
    });

    it('decrements a positive cooldown by one frame', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setFrames(3);

      cooldown.updateBaseCooldown();

      expect(cooldown.frames).toBe(2);
    });

    it('becomes ready once the cooldown counts down to 0', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setFrames(1);

      cooldown.updateBaseCooldown();

      expect(cooldown.isBaseReady()).toBe(true);
    });
  });

  describe('combo cooldown: setComboFrames / modComboFrames / enableCombo', () =>
  {
    it('marks the combo ready immediately when set to 0', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setComboFrames(0);
      expect(cooldown.isComboReady()).toBe(true);
    });

    it('marks the combo not ready when set to a positive value', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setComboFrames(15);
      expect(cooldown.isComboReady()).toBe(false);
    });

    it('extends the combo cooldown via modComboFrames', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setComboFrames(5);

      cooldown.modComboFrames(5);

      expect(cooldown.comboFrames).toBe(10);
      expect(cooldown.isComboReady()).toBe(false);
    });

    it('becomes ready via modComboFrames when the modification reaches 0 or below', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setComboFrames(5);

      cooldown.modComboFrames(-5);

      expect(cooldown.isComboReady()).toBe(true);
    });

    it('zeroes the combo delay when enabling the combo directly', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setComboFrames(20);

      cooldown.enableCombo();

      expect(cooldown.comboFrames).toBe(0);
      expect(cooldown.isComboReady()).toBe(true);
    });

    it('revokes an already-open combo when a new delay is set', () =>
    {
      // Arrange
      // starting from an open combo is the whole point: a fresh cooldown is already not-ready, so
      // the unready handler would look correct even if it never ran.
      const cooldown = new JABS_Cooldown('key');
      cooldown.enableCombo();

      // Act
      cooldown.setComboFrames(15);

      // Assert
      expect(cooldown.isComboReady()).toBe(false);
      expect(cooldown.comboFrames).toBe(15);
    });
  });

  describe('updateComboCooldown / updateComboExpire', () =>
  {
    it('decrements the combo delay while not yet ready', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setComboFrames(3);

      cooldown.updateComboCooldown();

      expect(cooldown.comboFrames).toBe(2);
    });

    it('does not tick the expiry window until the combo delay opens', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setComboFrames(3);
      cooldown.setComboExpireFrames(10);

      cooldown.updateComboCooldown();

      expect(cooldown.comboExpireFrames).toBe(10);
    });

    it('ticks the expiry window once the combo is ready and not casting', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setComboFrames(0);
      cooldown.setComboExpireFrames(10);

      cooldown.updateComboCooldown(false);

      expect(cooldown.comboExpireFrames).toBe(9);
    });

    it('pauses the expiry window while casting', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setComboFrames(0);
      cooldown.setComboExpireFrames(10);

      cooldown.updateComboCooldown(true);

      expect(cooldown.comboExpireFrames).toBe(10);
    });

    it('does nothing when there is no active expiry window', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setComboFrames(0);

      cooldown.updateComboExpire();

      expect(cooldown.comboExpireFrames).toBe(0);
      // a deadline-less combo stays open forever, so the window must not close and no clear may be
      // requested- counting down past zero would land on the same 0 while quietly killing the combo.
      expect(cooldown.isComboReady()).toBe(true);
      expect(cooldown.needsComboClear()).toBe(false);
    });

    it('resets the combo once the expiry window closes', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setComboFrames(0);
      cooldown.setComboExpireFrames(1);

      cooldown.updateComboExpire();

      expect(cooldown.comboExpireFrames).toBe(0);
      expect(cooldown.isComboReady()).toBe(false);
      expect(cooldown.mustComboClear).toBe(true);
    });
  });

  describe('setComboExpireFrames', () =>
  {
    it('sets both the countdown and the recorded max window size', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setComboExpireFrames(45);
      expect(cooldown.comboExpireFrames).toBe(45);
      expect(cooldown.comboExpireFramesMax).toBe(45);
    });
  });

  describe('resetCombo', () =>
  {
    it('clears every combo-related field and requests a combo clear', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.enableCombo();
      cooldown.setComboExpireFrames(30);

      cooldown.resetCombo();

      expect(cooldown.comboFrames).toBe(0);
      expect(cooldown.comboReady).toBe(false);
      expect(cooldown.comboExpireFrames).toBe(0);
      expect(cooldown.comboExpireFramesMax).toBe(0);
      expect(cooldown.mustComboClear).toBe(true);
    });
  });

  describe('setComboMode', () =>
  {
    it('records the overlay mode', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setComboMode('infinite');
      expect(cooldown.comboMode).toBe('infinite');
    });
  });

  describe('enableBase', () =>
  {
    it('zeroes frames, marks ready, and resets the overlay mode', () =>
    {
      const cooldown = new JABS_Cooldown('key');
      cooldown.setFrames(30);
      cooldown.setComboMode('expiring');

      cooldown.enableBase();

      expect(cooldown.frames).toBe(0);
      expect(cooldown.isBaseReady()).toBe(true);
      expect(cooldown.comboMode).toBe('none');
    });
  });
});
//endregion plugins/abs/core/models/jabs-cooldown.test.js
