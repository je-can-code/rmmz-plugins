//region plugins/abs/ext/targeting/_models/jabs-targeting-session.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('JABS_TargetingSession (direct src import)', () =>
{
  let JABS_TargetingSession;

  beforeAll(async () =>
  {
    ({ default: JABS_TargetingSession } = await import(
      '../../../../../../src/plugins/abs/ext/targeting/_models/JABS_TargetingSession.js'
    ));
  });

  describe('constructor / getters', () =>
  {
    it('every getter reflects the value provided at construction', () =>
    {
      // Arrange
      const battler = { tag: 'battler' };
      const actions = [ { tag: 'action-1' }, { tag: 'action-2' } ];
      const onCommit = () => {};

      // Act
      const session = new JABS_TargetingSession(battler, actions, onCommit);

      // Assert
      expect(session.getBattler()).toBe(battler);
      expect(session.getActions()).toBe(actions);
      expect(session.getOnCommit()).toBe(onCommit);
    });
  });
});
//endregion plugins/abs/ext/targeting/_models/jabs-targeting-session.test.js
