import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  aBattler,
  aState,
  clearMapBattlers,
  installMotionPassiveGlobals,
  registerMapBattler,
} from '../fixtures/install-motion-passive-globals.js';

installMotionPassiveGlobals();

const PassiveMotionCoordinator = (
  await import('../../../../../../src/plugins/motion/ext/passive/managers/PassiveMotionCoordinator.js')
).default;
const CharacterMotionComposer = (
  await import('../../../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js')
).default;

/**
 * A stand-in for a map character, which the composer only ever uses as a `WeakMap` key.
 * @returns {Object}
 */
const aCharacter = () => ({ name: 'character' });

/**
 * Registers a battler on the map and hands back both halves of it.
 * @param {string} uuid The battler's uuid.
 * @param {number[]} passiveStateIds The passive state ids it carries, stacks included.
 * @param {Object<number, Object>} statesById The state rows those ids resolve to.
 * @returns {{battler: Object, character: Object}}
 */
const aMapBattler = (uuid, passiveStateIds, statesById) =>
{
  const battler = aBattler(uuid, passiveStateIds, statesById);
  const character = aCharacter();

  registerMapBattler(uuid, { getCharacter: () => character });

  return {
    battler,
    character,
  };
};

describe('PassiveMotionCoordinator', () =>
{
  afterEach(() =>
  {
    clearMapBattlers();
    vi.restoreAllMocks();
  });

  describe('sourceKeyForState', () =>
  {
    it('names a passive source by its state id', () =>
    {
      // Arrange & Act
      const sourceKey = PassiveMotionCoordinator.sourceKeyForState(301);

      // Assert
      expect(sourceKey).toBe('passive:301');
    });

    it('does not collide with the applied-state key for the same id', () =>
    {
      // Arrange
      const passiveKey = PassiveMotionCoordinator.sourceKeyForState(301);

      // Act
      const appliedKey = BattlerMotionCoordinator.sourceKeyForState(301);

      // Assert
      expect(passiveKey).not.toBe(appliedKey);
    });
  });

  describe('declarationsByStateId', () =>
  {
    it('includes a passive that declares a motion', () =>
    {
      // Arrange
      const statesById = { 301: aState(301, '<motion:[scale,150]>') };
      const battler = aBattler('uuid-a', [ 301 ], statesById);

      // Act
      const declarations = PassiveMotionCoordinator.declarationsByStateId(battler);

      // Assert
      expect(declarations.get(301)
        .at(0)
        .type()).toBe('scale');
    });

    it('excludes a passive that declares no motion', () =>
    {
      // Arrange — 302 is the near miss: a real passive, on the same battler, carrying an unrelated
      // tag. It has to survive being read and still be left out.
      const statesById = {
        301: aState(301, '<motion:[scale,150]>'),
        302: aState(302, '<affix-weight:500>'),
      };
      const battler = aBattler('uuid-b', [ 301, 302 ], statesById);

      // Act
      const declarations = PassiveMotionCoordinator.declarationsByStateId(battler);

      // Assert
      expect(declarations.has(302)).toBe(false);
      expect(declarations.has(301)).toBe(true);
    });

    it('collapses a stacked passive to a single entry', () =>
    {
      // Arrange
      const statesById = { 301: aState(301, '<motion:[scale,150]>') };
      const battler = aBattler('uuid-c', [ 301, 301, 301 ], statesById);

      // Act
      const declarations = PassiveMotionCoordinator.declarationsByStateId(battler);

      // Assert
      expect(declarations.get(301)).toHaveLength(1);
    });

    it('stamps each declaration with its own passive source key', () =>
    {
      // Arrange
      const statesById = {
        301: aState(301, '<motion:[scale,150]>'),
        302: aState(302, '<motion:[breathe]>'),
      };
      const battler = aBattler('uuid-d', [ 301, 302 ], statesById);

      // Act
      const declarations = PassiveMotionCoordinator.declarationsByStateId(battler);

      // Assert
      expect(declarations.get(301)
        .at(0)
        .sourceKey()).toBe('passive:301');
      expect(declarations.get(302)
        .at(0)
        .sourceKey()).toBe('passive:302');
    });
  });

  describe('reconcile', () =>
  {
    it('declares the motions of a battler that is on the map', () =>
    {
      // Arrange
      const statesById = { 301: aState(301, '<motion:[scale,150]>') };
      const { battler, character } = aMapBattler('uuid-e', [ 301 ], statesById);
      const declare = vi.spyOn(CharacterMotionComposer, 'declare');

      // Act
      PassiveMotionCoordinator.reconcile(battler);

      // Assert
      expect(declare).toHaveBeenCalledTimes(1);
      const [ declaredCharacter, declaredKey ] = declare.mock.calls.at(0);
      expect(declaredCharacter).toBe(character);
      expect(declaredKey).toBe('passive:301');
    });

    it('declares nothing for a battler that is not on the map', () =>
    {
      // Arrange — the battler is real and carries a real motion passive; the only thing wrong with
      // it is that nothing registered it, which is what a reserve party member looks like.
      const statesById = { 301: aState(301, '<motion:[scale,150]>') };
      const battler = aBattler('uuid-unregistered', [ 301 ], statesById);
      const declare = vi.spyOn(CharacterMotionComposer, 'declare');

      // Act
      PassiveMotionCoordinator.reconcile(battler);

      // Assert
      expect(declare).not.toHaveBeenCalled();
    });

    it('withdraws nothing on a character it has never declared on', () =>
    {
      // Arrange — a battler with nothing to declare, so the composer never runs its own internal
      // withdrawal and anything reaching the spy could only have come from the departure diff.
      const statesById = { 302: aState(302, '<affix-weight:500>') };
      const { battler } = aMapBattler('uuid-f', [ 302 ], statesById);
      const removeDeclarations = vi.spyOn(CharacterMotionComposer, 'removeDeclarations');
      const declare = vi.spyOn(CharacterMotionComposer, 'declare');

      // Act
      PassiveMotionCoordinator.reconcile(battler);

      // Assert
      expect(removeDeclarations).not.toHaveBeenCalled();
      expect(declare).not.toHaveBeenCalled();
    });

    it('withdraws a passive that has departed', () =>
    {
      // Arrange — 301 departs and 302 stays, so a coordinator that withdrew the whole kind rather
      // than the difference would be caught by the survivor rather than by the casualty.
      const statesById = {
        301: aState(301, '<motion:[scale,150]>'),
        302: aState(302, '<motion:[breathe]>'),
      };
      const battler = aBattler('uuid-g', [ 301, 302 ], statesById);
      const character = aCharacter();
      registerMapBattler('uuid-g', { getCharacter: () => character });
      PassiveMotionCoordinator.reconcile(battler);

      const remaining = aBattler('uuid-g', [ 302 ], statesById);
      const removeDeclarations = vi.spyOn(CharacterMotionComposer, 'removeDeclarations');

      // Act
      PassiveMotionCoordinator.reconcile(remaining);

      // Assert
      expect(removeDeclarations).toHaveBeenCalledTimes(1);
      const [ , withdrawnKey ] = removeDeclarations.mock.calls.at(0);
      expect(withdrawnKey).toBe('passive:301');
    });

    it('leaves a passive that is still carried alone', () =>
    {
      // Arrange
      const statesById = { 301: aState(301, '<motion:[scale,150]>') };
      const { battler } = aMapBattler('uuid-h', [ 301 ], statesById);
      PassiveMotionCoordinator.reconcile(battler);
      const removeDeclarations = vi.spyOn(CharacterMotionComposer, 'removeDeclarations');

      // Act
      PassiveMotionCoordinator.reconcile(battler);

      // Assert
      expect(removeDeclarations).not.toHaveBeenCalled();
    });

    it('moves declarations to the new occupant of a reused character', () =>
    {
      // Arrange — this is party cycling: one character, a different battler behind it. The outgoing
      // leader's passive has to leave and the incoming one's has to arrive, in one pass.
      const statesById = {
        301: aState(301, '<motion:[scale,150]>'),
        302: aState(302, '<motion:[breathe]>'),
      };
      const character = aCharacter();
      const outgoing = aBattler('uuid-outgoing', [ 301 ], statesById);
      const incoming = aBattler('uuid-incoming', [ 302 ], statesById);
      registerMapBattler('uuid-outgoing', { getCharacter: () => character });
      registerMapBattler('uuid-incoming', { getCharacter: () => character });
      PassiveMotionCoordinator.reconcile(outgoing);

      const removeDeclarations = vi.spyOn(CharacterMotionComposer, 'removeDeclarations');
      const declare = vi.spyOn(CharacterMotionComposer, 'declare');

      // Act
      PassiveMotionCoordinator.reconcile(incoming);

      // Assert
      const [ , withdrawnKey ] = removeDeclarations.mock.calls.at(0);
      expect(withdrawnKey).toBe('passive:301');
      const [ , declaredKey ] = declare.mock.calls.at(0);
      expect(declaredKey).toBe('passive:302');
    });

    it('scales the sprite of a battler carrying a scale passive', () =>
    {
      // Arrange — the real composer, so this proves the declaration actually animates rather than
      // proving the coordinator called a method.
      const statesById = { 301: aState(301, '<motion:[scale,150,1]>') };
      const { battler, character } = aMapBattler('uuid-i', [ 301 ], statesById);

      // Act
      PassiveMotionCoordinator.reconcile(battler);
      const composition = CharacterMotionComposer.compose(character);

      // Assert
      expect(composition.valueFor('scaleX')).toBe(1.5);
      expect(composition.valueFor('scaleY')).toBe(1.5);
    });
  });
});
