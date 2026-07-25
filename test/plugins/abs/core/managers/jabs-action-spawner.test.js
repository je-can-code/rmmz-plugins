//region plugins/abs/core/managers/jabs-action-spawner.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * JABS_ActionSpawner.js is a pure static-method class. JABS_Engine and JABS_Battler are imported
 * only for JSDoc typing (never referenced as values), mocked with empty stubs. JABS_ActionOptions
 * and JABS_Action are used as real values via their static `.Builder()` factories, mocked with
 * fluent recording-stub builders that capture every setter call, per the unit-tier convention.
 */
describe('JABS_ActionSpawner (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/managers/JABS_ActionSpawner.js').default} */
  let JABS_ActionSpawner;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        Directions: {
          UP: 8, DOWN: 2, LEFT: 4, RIGHT: 6,
          UPPERLEFT: 7, UPPERRIGHT: 9, LOWERLEFT: 1, LOWERRIGHT: 3,
        },
      },
    };

    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_Engine.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/models/JABS_Battler.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({ default: class {} }));

    class FakeActionOptionsBuilder
    {
      constructor() { this.payload = {}; }
      setIsRetaliation(v) { this.payload.isRetaliation = v; return this; }
      setCooldownKey(v) { this.payload.cooldownKey = v; return this; }
      setSpawnOffset(x, y) { this.payload.spawnOffset = [ x, y ]; return this; }
      setIsTerrainDamage(v) { this.payload.isTerrainDamage = v; return this; }
      setProjectileTravelAngleDegrees(v) { this.payload.travelAngle = v; return this; }
      setLocation(v) { this.payload.location = v; return this; }
      build() { return { ...this.payload }; }
    }
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_ActionOptions.js', () => ({
      default: class { static Builder() { return new FakeActionOptionsBuilder(); } },
    }));

    class FakeActionBuilder
    {
      constructor() { this.payload = {}; }
      setCaster(v) { this.payload.caster = v; return this; }
      setGameAction(v) { this.payload.gameAction = v; return this; }
      setInitialDirection(v) { this.payload.initialDirection = v; return this; }
      setActionOptions(v) { this.payload.actionOptions = v; return this; }
      build() { return { ...this.payload }; }
    }
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Action.js', () => ({
      default: class { static Builder() { return new FakeActionBuilder(); } },
    }));

    ({ default: JABS_ActionSpawner } =
      await import('../../../../../src/plugins/abs/core/managers/JABS_ActionSpawner.js'));
  });

  function buildActionOptions(overrides = {})
  {
    return Object.assign({
      isActionRetaliation: vi.fn(() => false),
      getCooldownKey: vi.fn(() => 'gcd'),
      isTerrainDamage: vi.fn(() => false),
      getProjectileTravelAngleDegrees: vi.fn(() => 0),
      getTargetLocation: vi.fn(() => null),
    }, overrides);
  }

  //region buildProjectileCountsByDirection
  describe('buildProjectileCountsByDirection', () =>
  {
    it('tallies a count per unique direction', () =>
    {
      // Arrange/Act
      const result = JABS_ActionSpawner.buildProjectileCountsByDirection([ 2, 2, 4, 2, 6 ]);

      // Assert
      expect(result).toEqual({ 2: 3, 4: 1, 6: 1 });
    });

    it('returns an empty tally for an empty list', () =>
    {
      // Arrange/Act/Assert
      expect(JABS_ActionSpawner.buildProjectileCountsByDirection([])).toEqual({});
    });
  });
  //endregion buildProjectileCountsByDirection

  //region buildOffsetsByDirection
  describe('buildOffsetsByDirection', () =>
  {
    it('builds an offsets array per direction key using the count', () =>
    {
      // Arrange/Act
      const result = JABS_ActionSpawner.buildOffsetsByDirection({ 2: 1, 4: 2 });

      // Assert
      expect(result).toEqual({ 2: [ 0 ], 4: [ -0.5, 0.5 ] });
    });
  });
  //endregion buildOffsetsByDirection

  //region buildOffsets
  describe('buildOffsets', () =>
  {
    it('defaults to a single centered lane when no count is provided', () =>
    {
      // Arrange/Act/Assert
      expect(JABS_ActionSpawner.buildOffsets()).toEqual([ 0 ]);
    });

    it('builds a single centered lane for a count of 1', () =>
    {
      // Arrange/Act/Assert
      expect(JABS_ActionSpawner.buildOffsets(1)).toEqual([ 0 ]);
    });

    it('builds symmetric integer lanes outward from center for odd counts', () =>
    {
      // Arrange/Act/Assert
      expect(JABS_ActionSpawner.buildOffsets(3)).toEqual([ 0, 1, -1 ]);
      expect(JABS_ActionSpawner.buildOffsets(5)).toEqual([ 0, 1, -1, 2, -2 ]);
    });

    it('builds half-tile spaced symmetric pairs for even counts', () =>
    {
      // Arrange/Act/Assert
      expect(JABS_ActionSpawner.buildOffsets(2)).toEqual([ -0.5, 0.5 ]);
      expect(JABS_ActionSpawner.buildOffsets(4)).toEqual([ -0.5, 0.5, -1.5, 1.5 ]);
    });
  });
  //endregion buildOffsets

  //region offsetToDelta
  describe('offsetToDelta', () =>
  {
    it('shifts along x for a vertical (UP) facing', () =>
    {
      // Arrange/Act/Assert
      expect(JABS_ActionSpawner.offsetToDelta(J.ABS.Directions.UP, 1.5)).toEqual([ 1.5, 0 ]);
    });

    it('shifts along x for a vertical (DOWN) facing', () =>
    {
      // Arrange/Act/Assert
      expect(JABS_ActionSpawner.offsetToDelta(J.ABS.Directions.DOWN, 1.5)).toEqual([ 1.5, 0 ]);
    });

    it('shifts along y for a horizontal (LEFT) facing', () =>
    {
      // Arrange/Act/Assert
      expect(JABS_ActionSpawner.offsetToDelta(J.ABS.Directions.LEFT, 1.5)).toEqual([ 0, 1.5 ]);
    });

    it('shifts along y for a horizontal (RIGHT) facing', () =>
    {
      // Arrange/Act/Assert
      expect(JABS_ActionSpawner.offsetToDelta(J.ABS.Directions.RIGHT, 1.5)).toEqual([ 0, 1.5 ]);
    });

    it('shifts along the (1,1) perpendicular for an UPPERRIGHT facing', () =>
    {
      // Arrange/Act/Assert
      expect(JABS_ActionSpawner.offsetToDelta(J.ABS.Directions.UPPERRIGHT, 1)).toEqual([ 1, 1 ]);
    });

    it('shifts along the (1,1) perpendicular for a LOWERLEFT facing', () =>
    {
      // Arrange/Act/Assert
      expect(JABS_ActionSpawner.offsetToDelta(J.ABS.Directions.LOWERLEFT, 1)).toEqual([ 1, 1 ]);
    });

    it('shifts along the (1,-1) perpendicular for an UPPERLEFT facing', () =>
    {
      // Arrange/Act/Assert
      expect(JABS_ActionSpawner.offsetToDelta(J.ABS.Directions.UPPERLEFT, 1)).toEqual([ 1, -1 ]);
    });

    it('shifts along the (1,-1) perpendicular for a LOWERRIGHT facing', () =>
    {
      // Arrange/Act/Assert
      expect(JABS_ActionSpawner.offsetToDelta(J.ABS.Directions.LOWERRIGHT, 1)).toEqual([ 1, -1 ]);
    });

    it('returns a zero delta for an unrecognized facing', () =>
    {
      // Arrange/Act/Assert
      expect(JABS_ActionSpawner.offsetToDelta(999, 1)).toEqual([ 0, 0 ]);
    });
  });
  //endregion offsetToDelta

  //region buildActionsForDirections
  describe('buildActionsForDirections', () =>
  {
    it('builds one action per direction, consuming offsets by spoke position', () =>
    {
      // Arrange
      const caster = {};
      const action = {};
      const actionOptions = buildActionOptions();
      const offsetsByDir = { 2: [ 0, 1, -1 ] };

      // Act
      const actions = JABS_ActionSpawner.buildActionsForDirections(caster, [ 2, 2, 2 ], action, actionOptions, offsetsByDir);

      // Assert
      expect(actions).toHaveLength(3);
      expect(actions[0].actionOptions.spawnOffset).toEqual([ 0, 0 ]);
      expect(actions[1].actionOptions.spawnOffset).toEqual([ 1, 0 ]);
      expect(actions[2].actionOptions.spawnOffset).toEqual([ -1, 0 ]);
      expect(actions[0].caster).toBe(caster);
      expect(actions[0].gameAction).toBe(action);
      expect(actions[0].initialDirection).toEqual(2);
    });

    it('defaults the lateral offset to zero when this spoke has no precomputed offsets entry', () =>
    {
      // Arrange
      const actionOptions = buildActionOptions();

      // Act
      const actions = JABS_ActionSpawner.buildActionsForDirections({}, [ 4 ], {}, actionOptions, {});

      // Assert
      expect(actions[0].actionOptions.spawnOffset).toEqual([ 0, 0 ]);
    });

    it('defaults the lateral offset to zero when the spoke index exceeds the precomputed offsets array', () =>
    {
      // Arrange
      const actionOptions = buildActionOptions();
      const offsetsByDir = { 2: [ 0 ] };

      // Act (two projectiles in direction 2, but only one precomputed offset)
      const actions = JABS_ActionSpawner.buildActionsForDirections({}, [ 2, 2 ], {}, actionOptions, offsetsByDir);

      // Assert
      expect(actions[0].actionOptions.spawnOffset).toEqual([ 0, 0 ]);
      expect(actions[1].actionOptions.spawnOffset).toEqual([ 0, 0 ]);
    });

    it('carries forward the resolved options and does not set a location when there is no target location', () =>
    {
      // Arrange
      const actionOptions = buildActionOptions({
        isActionRetaliation: vi.fn(() => true),
        getCooldownKey: vi.fn(() => 'my-key'),
        isTerrainDamage: vi.fn(() => true),
        getProjectileTravelAngleDegrees: vi.fn(() => 45),
        getTargetLocation: vi.fn(() => null),
      });

      // Act
      const actions = JABS_ActionSpawner.buildActionsForDirections({}, [ 2 ], {}, actionOptions, {});

      // Assert
      expect(actions[0].actionOptions).toEqual({
        isRetaliation: true,
        cooldownKey: 'my-key',
        spawnOffset: [ 0, 0 ],
        isTerrainDamage: true,
        travelAngle: 45,
      });
    });

    it('sets the location on the per-projectile options when a target location is present', () =>
    {
      // Arrange
      const targetLocation = { x: 5, y: 5 };
      const actionOptions = buildActionOptions({ getTargetLocation: vi.fn(() => targetLocation) });

      // Act
      const actions = JABS_ActionSpawner.buildActionsForDirections({}, [ 2 ], {}, actionOptions, {});

      // Assert
      expect(actions[0].actionOptions.location).toBe(targetLocation);
    });
  });
  //endregion buildActionsForDirections

  //region buildVolley
  describe('buildVolley', () =>
  {
    it('composes the full pipeline: counts, offsets, and built actions for every direction', () =>
    {
      // Arrange
      const caster = {};
      const action = {};
      const actionOptions = buildActionOptions();

      // Act
      const actions = JABS_ActionSpawner.buildVolley(caster, [ 2, 2, 4 ], action, actionOptions);

      // Assert
      expect(actions).toHaveLength(3);
      expect(actions.every(a => a.caster === caster)).toEqual(true);
      expect(actions.map(a => a.initialDirection)).toEqual([ 2, 2, 4 ]);
      // direction 2 (DOWN, vertical) has 2 projectiles -> even offsets [-0.5, 0.5] shift along x;
      // direction 4 (LEFT, horizontal) has 1 -> [0] shift along y.
      expect(actions[0].actionOptions.spawnOffset).toEqual([ -0.5, 0 ]);
      expect(actions[1].actionOptions.spawnOffset).toEqual([ 0.5, 0 ]);
      expect(actions[2].actionOptions.spawnOffset).toEqual([ 0, 0 ]);
    });
  });
  //endregion buildVolley
});
//endregion plugins/abs/core/managers/jabs-action-spawner.test.js
