//region plugins/prof/core/_metadata/plugin-commands.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-Proficiency plugin commands (direct src import)', () =>
{
  let handlers;
  let actorsById;

  /**
   * Builds a stand-in actor that records every proficiency increase asked of it.
   * @param {number} id The actor id this stand-in answers to.
   */
  const buildActor = id => ({
    id,
    increases: [],
    increaseSkillProficiency(skillId, amount)
    {
      this.increases.push([ skillId, amount ]);
    },
  });

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { PROF: { Metadata: { name: 'J-Proficiency' } } };

    handlers = {};
    globalThis.PluginManager = {
      registerCommand: vi.fn((pluginName, commandName, handler) =>
      {
        handlers[commandName] = handler;
      }),
    };

    await import('../../../../../src/plugins/prof/core/_metadata/pluginCommands.js');
  });

  beforeEach(() =>
  {
    actorsById = new Map([ [ 1, buildActor(1) ], [ 2, buildActor(2) ] ]);
    globalThis.$gameActors = { actor: id => actorsById.get(id) };
    globalThis.$gameParty = { members: () => [ ...actorsById.values() ] };
  });

  it('registers both proficiency commands under the plugin name', () =>
  {
    // Arrange & Act (registration happened in beforeAll)

    // Assert
    expect(Object.keys(handlers))
      .toEqual([ 'modifyActorSkillProficiency', 'modifyPartySkillProficiency' ]);
  });

  describe('modifyActorSkillProficiency', () =>
  {
    it('applies the amount to a single named actor and skill', () =>
    {
      // Arrange & Act- the editor serializes every list argument as a JSON string of strings.
      handlers['modifyActorSkillProficiency']({ actorIds: '["1"]', skillIds: '["10"]', amount: '5' });

      // Assert
      expect(actorsById.get(1).increases).toEqual([ [ 10, 5 ] ]);
    });

    it('applies the amount across the cross product of every actor and skill named', () =>
    {
      // Arrange & Act
      handlers['modifyActorSkillProficiency']({ actorIds: '["1","2"]', skillIds: '["10","11"]', amount: '3' });

      // Assert
      expect(actorsById.get(1).increases).toEqual([ [ 10, 3 ], [ 11, 3 ] ]);
      expect(actorsById.get(2).increases).toEqual([ [ 10, 3 ], [ 11, 3 ] ]);
    });

    it('passes a negative amount through so proficiency can be taken away', () =>
    {
      // Arrange & Act
      handlers['modifyActorSkillProficiency']({ actorIds: '["1"]', skillIds: '["10"]', amount: '-4' });

      // Assert
      expect(actorsById.get(1).increases).toEqual([ [ 10, -4 ] ]);
    });

    it('touches nobody when the actor list is empty', () =>
    {
      // Arrange & Act
      handlers['modifyActorSkillProficiency']({ actorIds: '[]', skillIds: '["10"]', amount: '5' });

      // Assert
      expect(actorsById.get(1).increases).toEqual([]);
    });
  });

  describe('modifyPartySkillProficiency', () =>
  {
    it('applies the amount to every member currently in the party', () =>
    {
      // Arrange & Act
      handlers['modifyPartySkillProficiency']({ skillIds: '["10"]', amount: '7' });

      // Assert
      expect(actorsById.get(1).increases).toEqual([ [ 10, 7 ] ]);
      expect(actorsById.get(2).increases).toEqual([ [ 10, 7 ] ]);
    });

    it('applies every named skill to every party member', () =>
    {
      // Arrange & Act
      handlers['modifyPartySkillProficiency']({ skillIds: '["10","11"]', amount: '2' });

      // Assert
      expect(actorsById.get(2).increases).toEqual([ [ 10, 2 ], [ 11, 2 ] ]);
    });

    it('touches nobody when the skill list is empty', () =>
    {
      // Arrange & Act
      handlers['modifyPartySkillProficiency']({ skillIds: '[]', amount: '7' });

      // Assert
      expect(actorsById.get(1).increases).toEqual([]);
    });
  });
});
//endregion plugins/prof/core/_metadata/plugin-commands.test.js
