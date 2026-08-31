//region plugins/abs/core/managers/jabs-respawn-manager.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_RespawnManager's only same-ship import is JABS_RespawnRecord, which is a data bag with no
 * behavior of its own- so the real class rides along here (the FakeAabb rationale: mirroring a
 * trivial sibling is less work and less lie than mocking it), and its own branches are covered in
 * its own file.
 */
describe('JABS_RespawnManager (unit)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/managers/JABS_RespawnManager.js').default} */
  let JABS_RespawnManager;
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_RespawnRecord.js').default} */
  let JABS_RespawnRecord;
  let warnSpy;

  beforeAll(async () =>
  {
    vi.resetModules();

    // the record registers its save codec at import time, against the registry J-Base hoists as a
    // global. nothing here exercises the registry, so a stub is the whole of what it needs.
    globalThis.SerializableRegistry = { register: vi.fn() };

    // the permanent-record path leans on J-Base's String.empty extension.
    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    ({ default: JABS_RespawnManager } = await import(
      '../../../../../src/plugins/abs/core/managers/JABS_RespawnManager.js'));
    ({ default: JABS_RespawnRecord } = await import(
      '../../../../../src/plugins/abs/core/models/JABS_RespawnRecord.js'));
  });

  beforeEach(() =>
  {
    globalThis.Graphics = { frameCount: 1000 };

    // Diagnostics is installed globally by test setup; per-repo convention the spy is restored
    // manually per test rather than via restoreAllMocks.
    warnSpy = vi.spyOn(globalThis.Diagnostics, 'warn')
      .mockImplementation(() =>
      {
      });
  });

  // per the repo's spyOn gotcha, the global's spy is restored manually after every test.
  afterEach(() =>
  {
    warnSpy.mockRestore();
  });

  /**
   * Builds an event stub whose comment overrides resolve to the given values.
   */
  const buildEvent = ({
    noRespawn = null,
    respawn = null,
  } = {}) => ({
    getNoRespawnOverrides: () => noRespawn,
    getRespawnOverrides: () => respawn,
  });

  /**
   * Builds an enemy stub whose note resolutions resolve to the given values.
   */
  const buildEnemy = ({
    noRespawn = false,
    respawn = null,
  } = {}) => ({
    isNoRespawn: () => noRespawn,
    respawnData: () => respawn,
  });

  describe('registerMethod / method', () =>
  {
    it('returns null for a method nobody registered', () =>
    {
      // Arrange
      const name = 'unregistered-method';

      // Act
      const result = JABS_RespawnManager.method(name);

      // Assert
      expect(result).toBeNull();
    });

    it('returns the handler registered under the given name', () =>
    {
      // Arrange- a sibling registration ensures the lookup is by name, not "whatever is there".
      const wanted = {
        schedule: () => 1,
        isDue: () => true,
      };
      const decoy = {
        schedule: () => 2,
        isDue: () => false,
      };
      JABS_RespawnManager.registerMethod('lookup-target', wanted);
      JABS_RespawnManager.registerMethod('lookup-decoy', decoy);

      // Act
      const result = JABS_RespawnManager.method('lookup-target');

      // Assert
      expect(result).toBe(wanted);
    });

    it('announces a collision when a name is registered twice, and the newest wins', () =>
    {
      // Arrange
      const first = {
        schedule: () => 1,
        isDue: () => true,
      };
      const second = {
        schedule: () => 2,
        isDue: () => false,
      };
      JABS_RespawnManager.registerMethod('collision-target', first);

      // Act
      JABS_RespawnManager.registerMethod('collision-target', second);

      // Assert
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(JABS_RespawnManager.method('collision-target')).toBe(second);
    });

    it('does not announce anything for a first-time registration', () =>
    {
      // Arrange
      const handler = {
        schedule: () => 1,
        isDue: () => true,
      };

      // Act
      JABS_RespawnManager.registerMethod('collision-free', handler);

      // Assert
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('createRecord', () =>
  {
    it('builds a permanent record when the event comment declares permanence', () =>
    {
      // Arrange- the enemy explicitly does NOT declare permanence, so the comment is the source.
      const event = buildEvent({ noRespawn: true });
      const enemy = buildEnemy({
        noRespawn: false,
        respawn: [ 'seconds', 90 ],
      });

      // Act
      const record = JABS_RespawnManager.createRecord(event, enemy);

      // Assert
      expect(record.method).toBe('never');
      expect(record.param).toBe('');
      expect(record.isPermanent()).toBe(true);
    });

    it('builds a permanent record when the enemy note declares permanence', () =>
    {
      // Arrange
      const event = buildEvent();
      const enemy = buildEnemy({ noRespawn: true });

      // Act
      const record = JABS_RespawnManager.createRecord(event, enemy);

      // Assert
      expect(record.method).toBe('never');
    });

    it('returns null when nothing anywhere declares a respawn', () =>
    {
      // Arrange
      const event = buildEvent();
      const enemy = buildEnemy();

      // Act
      const record = JABS_RespawnManager.createRecord(event, enemy);

      // Assert
      expect(record).toBeNull();
    });

    it('warns and returns null for an unknown method', () =>
    {
      // Arrange
      const event = buildEvent({ respawn: [ 'no-such-method', 5 ] });
      const enemy = buildEnemy();

      // Act
      const record = JABS_RespawnManager.createRecord(event, enemy);

      // Assert
      expect(record).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('warns and returns null when the method rejects the parameter', () =>
    {
      // Arrange
      JABS_RespawnManager.registerMethod('rejects-param', {
        schedule: () => null,
        isDue: () => false,
      });
      const event = buildEvent({ respawn: [ 'rejects-param', 'garbage' ] });
      const enemy = buildEnemy();

      // Act
      const record = JABS_RespawnManager.createRecord(event, enemy);

      // Assert
      expect(record).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('builds a scheduled record from the event comment declaration', () =>
    {
      // Arrange- the enemy carries a decoy declaration that must lose to the comment.
      JABS_RespawnManager.registerMethod('records-param', {
        schedule: param => Number(param) * 10,
        isDue: () => false,
      });
      const event = buildEvent({ respawn: [ 'records-param', 7 ] });
      const enemy = buildEnemy({ respawn: [ 'records-param', 999 ] });

      // Act
      const record = JABS_RespawnManager.createRecord(event, enemy);

      // Assert- the numeric tag parameter is normalized to a string on the record.
      expect(record).toBeInstanceOf(JABS_RespawnRecord);
      expect(record.method).toBe('records-param');
      expect(record.param).toBe('7');
      expect(record.due).toBe(70);
    });

    it('falls back to the enemy note declaration when the event declares nothing', () =>
    {
      // Arrange
      JABS_RespawnManager.registerMethod('enemy-fallback', {
        schedule: param => Number(param) * 10,
        isDue: () => false,
      });
      const event = buildEvent();
      const enemy = buildEnemy({ respawn: [ 'enemy-fallback', 3 ] });

      // Act
      const record = JABS_RespawnManager.createRecord(event, enemy);

      // Assert
      expect(record.due).toBe(30);
    });
  });

  describe('isDue', () =>
  {
    it('never comes due for a permanent record', () =>
    {
      // Arrange
      const record = new JABS_RespawnRecord('never', '', 0);

      // Act
      const result = JABS_RespawnManager.isDue(record);

      // Assert- and silently: permanence is not an anomaly, so no missing-method warning may
      // fire for the reserved method name.
      expect(result).toBe(false);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('warns and stays down when the record\'s method is not registered', () =>
    {
      // Arrange
      const record = new JABS_RespawnRecord('uninstalled-method', '5', 100);

      // Act
      const result = JABS_RespawnManager.isDue(record);

      // Assert
      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('warns only once per missing method across repeated sweeps', () =>
    {
      // Arrange
      const record = new JABS_RespawnRecord('uninstalled-method-two', '5', 100);
      JABS_RespawnManager.isDue(record);
      warnSpy.mockClear();

      // Act
      const result = JABS_RespawnManager.isDue(record);

      // Assert
      expect(result).toBe(false);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('answers true when the owning method says the moment has passed', () =>
    {
      // Arrange
      JABS_RespawnManager.registerMethod('due-check-true', {
        schedule: () => 1,
        isDue: due => due === 42,
      });
      const record = new JABS_RespawnRecord('due-check-true', '', 42);

      // Act
      const result = JABS_RespawnManager.isDue(record);

      // Assert
      expect(result).toBe(true);
    });

    it('answers false when the owning method says the moment has not passed', () =>
    {
      // Arrange
      JABS_RespawnManager.registerMethod('due-check-false', {
        schedule: () => 1,
        isDue: () => false,
      });
      const record = new JABS_RespawnRecord('due-check-false', '', 42);

      // Act
      const result = JABS_RespawnManager.isDue(record);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('the seconds method', () =>
  {
    it('schedules the due frame from the current playtime frame', () =>
    {
      // Arrange
      globalThis.Graphics = { frameCount: 1000 };
      const handler = JABS_RespawnManager.method('seconds');

      // Act
      const due = handler.schedule('90');

      // Assert- 1000 frames now, plus 90 seconds at 60 frames each.
      expect(due).toBe(6400);
    });

    it('rejects a non-numeric parameter', () =>
    {
      // Arrange
      const handler = JABS_RespawnManager.method('seconds');

      // Act
      const due = handler.schedule('garbage');

      // Assert
      expect(due).toBeNull();
    });

    it('rejects a zero-second parameter', () =>
    {
      // Arrange
      const handler = JABS_RespawnManager.method('seconds');

      // Act
      const due = handler.schedule('0');

      // Assert
      expect(due).toBeNull();
    });

    it('comes due the moment the scheduled frame is reached', () =>
    {
      // Arrange
      globalThis.Graphics = { frameCount: 6400 };
      const handler = JABS_RespawnManager.method('seconds');

      // Act
      const result = handler.isDue(6400);

      // Assert
      expect(result).toBe(true);
    });

    it('stays down while the scheduled frame is still ahead', () =>
    {
      // Arrange
      globalThis.Graphics = { frameCount: 6399 };
      const handler = JABS_RespawnManager.method('seconds');

      // Act
      const result = handler.isDue(6400);

      // Assert
      expect(result).toBe(false);
    });
  });
});
//endregion plugins/abs/core/managers/jabs-respawn-manager.test.js