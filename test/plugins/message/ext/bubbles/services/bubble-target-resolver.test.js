//region plugins/message/ext/bubbles/services/bubble-target-resolver.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import BubbleTargetResolver
  from '../../../../../../src/plugins/message/ext/bubbles/services/BubbleTargetResolver.js';

/**
 * Resolution picks one thing out of a map full of things, so every fixture here holds more than one
 * of whatever is being picked: two events, four actors, two followers. With a single candidate
 * loaded, "found the event the author named" and "found the only event there is" are the same
 * program, and a resolver that had collapsed into the second would point every bubble in the game at
 * one character while passing a test per branch.
 *
 * The party is three deep on purpose. An actor resolves to the player when they lead and to a
 * follower when they do not, and those are different code paths returning different objects - a
 * party of two exercises the leader branch and the first follower, but never proves that the
 * follower index is derived from the marching position rather than hardcoded.
 */
describe('J-Message-Bubbles BubbleTargetResolver (direct src import)', () =>
{
  /**
   * A stand-in for an event on the current map.
   * @param {number} eventId The id this event answers to.
   * @returns {object}
   */
  function fakeEvent(eventId)
  {
    return { kind: 'event', eventId };
  }

  /**
   * A stand-in for an actor in the database.
   * @param {number} actorId The id this actor answers to.
   * @returns {object}
   */
  function fakeActor(actorId)
  {
    return { kind: 'actor', actorId };
  }

  /**
   * A stand-in for a follower sprite walking behind the player.
   * @param {number} place The place in line this follower occupies, counting from one.
   * @returns {object}
   */
  function fakeFollower(place)
  {
    return { kind: 'follower', place };
  }

  const eventFive = fakeEvent(5);
  const eventTwelve = fakeEvent(12);

  const jerald = fakeActor(1);
  const rupert = fakeActor(2);
  const treis = fakeActor(3);
  const benchedActor = fakeActor(4);

  const firstFollower = fakeFollower(1);
  const secondFollower = fakeFollower(2);

  let player;

  beforeAll(() =>
  {
    // the resolver compares against String.empty, which J-Base installs onto the String constructor.
    if (String.empty === undefined)
    {
      Object.defineProperty(String, 'empty', {
        value: '',
        writable: false,
        configurable: true,
      });
    }
  });

  beforeEach(() =>
  {
    player = { kind: 'player' };

    // a party three deep: Jerald leads, Rupert and Treis march behind him, and one actor sits on the
    // bench so there is somebody for the resolver to correctly refuse.
    const followerData = [ firstFollower, secondFollower ];
    player.followers = () => ({ follower: index => followerData[index] });

    const events = { 5: eventFive, 12: eventTwelve };
    const actors = { 1: jerald, 2: rupert, 3: treis, 4: benchedActor };

    globalThis.$gamePlayer = player;
    globalThis.$gameMap = { event: eventId => events[eventId] };
    globalThis.$gameActors = { actor: actorId => actors[actorId] ?? null };
    globalThis.$gameParty = { battleMembers: () => [ jerald, rupert, treis ] };
  });

  afterEach(() =>
  {
    delete globalThis.$gamePlayer;
    delete globalThis.$gameMap;
    delete globalThis.$gameActors;
    delete globalThis.$gameParty;
  });

  it('resolves self to the event whose page is running the message', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('self', 12);

    // Assert
    expect(target).toBe(eventTwelve);
  });

  it('resolves self against the host id rather than a fixed event', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('self', 5);

    // Assert
    expect(target).toBe(eventFive);
  });

  it('resolves player to the player', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('player', 12);

    // Assert
    expect(target).toBe(player);
  });

  it('resolves a prefixed event id to that event', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('e5', 12);

    // Assert
    expect(target).toBe(eventFive);
  });

  it('distinguishes one event id from another', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('e12', 5);

    // Assert
    expect(target).toBe(eventTwelve);
  });

  it('refuses an event id this map has nothing for', () =>
  {
    // Arrange & Act
    // a page copied in from another map, or an event deleted since the line was written.
    const target = BubbleTargetResolver.resolve('e99', 12);

    // Assert
    expect(target).toBeNull();
  });

  it('resolves the actor leading the party to the player sprite', () =>
  {
    // Arrange & Act
    // the leader is not drawn as a follower at all, so this is the one crossover in the grammar.
    const target = BubbleTargetResolver.resolve('a1', 12);

    // Assert
    expect(target).toBe(player);
  });

  it('resolves an actor walking behind the leader to their follower', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('a2', 12);

    // Assert
    expect(target).toBe(firstFollower);
  });

  it('derives the follower place from how far back the actor is marching', () =>
  {
    // Arrange & Act
    // the third marcher is the second follower, which is what proves the index is computed rather
    // than being the constant that a two-deep party would let it be.
    const target = BubbleTargetResolver.resolve('a3', 12);

    // Assert
    expect(target).toBe(secondFollower);
  });

  it('refuses an actor who is in the database but not marching', () =>
  {
    // Arrange & Act
    // on the bench: real actor, no sprite of them on this map to point at.
    const target = BubbleTargetResolver.resolve('a4', 12);

    // Assert
    expect(target).toBeNull();
  });

  it('refuses an actor id the database has nothing for', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('a99', 12);

    // Assert
    expect(target).toBeNull();
  });

  it('resolves a follower by their place in line', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('f1', 12);

    // Assert
    expect(target).toBe(firstFollower);
  });

  it('distinguishes one follower place from another', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('f2', 12);

    // Assert
    expect(target).toBe(secondFollower);
  });

  it('refuses a follower place the party is not long enough to fill', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('f3', 12);

    // Assert
    expect(target).toBeNull();
  });

  it('resolves a pair of coordinates to a fixed point', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('320,180', 12);

    // Assert
    expect(target.screenX()).toBe(320);
    expect(target.screenY()).toBe(180);
  });

  it('tolerates spacing inside a pair of coordinates', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('320, 180', 12);

    // Assert
    expect(target.screenX()).toBe(320);
    expect(target.screenY()).toBe(180);
  });

  it('refuses a coordinate pair carrying a third value', () =>
  {
    // Arrange & Act
    // the author is reaching for something this grammar does not offer; quietly taking the first two
    // would hide that from them.
    const target = BubbleTargetResolver.resolve('320,180,9', 12);

    // Assert
    expect(target).toBeNull();
  });

  it('refuses a coordinate pair missing its second half', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('320,', 12);

    // Assert
    expect(target).toBeNull();
  });

  it('refuses a coordinate pair missing its first half', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve(',180', 12);

    // Assert
    expect(target).toBeNull();
  });

  it('refuses a coordinate pair whose first half is not a number', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('over,180', 12);

    // Assert
    expect(target).toBeNull();
  });

  it('refuses a coordinate pair whose second half is not a number', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('320,there', 12);

    // Assert
    expect(target).toBeNull();
  });

  it('resolves a target typed with stray spacing and capitals', () =>
  {
    // Arrange & Act
    // these are hand-typed into an editor text box, so meeting the author halfway costs nothing.
    const target = BubbleTargetResolver.resolve('  A1 ', 12);

    // Assert
    expect(target).toBe(player);
  });

  it('refuses a message carrying no target at all', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('', 12);

    // Assert
    expect(target).toBeNull();
  });

  it('refuses a prefix letter that names no database', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('x5', 12);

    // Assert
    expect(target).toBeNull();
  });

  it('refuses a counted form with nothing to count', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('e', 12);

    // Assert
    expect(target).toBeNull();
  });

  it('refuses a counted form numbered zero', () =>
  {
    // Arrange & Act
    // every database MZ has numbers its rows from one, so zero can never name anything.
    const target = BubbleTargetResolver.resolve('e0', 12);

    // Assert
    expect(target).toBeNull();
  });

  it('refuses a counted form numbered below zero', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('e-3', 12);

    // Assert
    expect(target).toBeNull();
  });

  it('refuses a counted form numbered with a fraction', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('e1.5', 12);

    // Assert
    expect(target).toBeNull();
  });

  it('refuses a word that resembles nothing in the grammar', () =>
  {
    // Arrange & Act
    const target = BubbleTargetResolver.resolve('everyone', 12);

    // Assert
    expect(target).toBeNull();
  });

  it('builds the ordinal out of the digits following the prefix', () =>
  {
    // Arrange & Act
    const ordinal = BubbleTargetResolver.ordinalOf('e12');

    // Assert
    expect(ordinal).toBe(12);
  });

  it('reports no ordinal for a fraction', () =>
  {
    // Arrange & Act
    // read through `resolve` this is invisible, because every database is equally empty at 1.5 as
    // it is at nothing; the sentinel only has meaning at the boundary it is produced on.
    const ordinal = BubbleTargetResolver.ordinalOf('e1.5');

    // Assert
    expect(ordinal).toBe(0);
  });

  it('reports no ordinal for a negative number', () =>
  {
    // Arrange & Act
    // zero is the interesting case to *not* test alone: the sentinel is itself zero, so a rejection
    // of zero and a failure to reject it are the same returned value. A negative is the only input
    // where the boundary is observable at all.
    const ordinal = BubbleTargetResolver.ordinalOf('e-3');

    // Assert
    expect(ordinal).toBe(0);
  });

  it('reports no ordinal for a prefix with nothing after it', () =>
  {
    // Arrange & Act
    const ordinal = BubbleTargetResolver.ordinalOf('e');

    // Assert
    expect(ordinal).toBe(0);
  });

  it('reports no ordinal for digits that are not digits', () =>
  {
    // Arrange & Act
    const ordinal = BubbleTargetResolver.ordinalOf('everyone');

    // Assert
    expect(ordinal).toBe(0);
  });
});
//endregion plugins/message/ext/bubbles/services/bubble-target-resolver.test.js