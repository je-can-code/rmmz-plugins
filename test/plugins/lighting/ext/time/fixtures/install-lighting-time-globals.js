//region install-lighting-time-globals
import TimePhases from '../../../../../../src/plugins/time/core/managers/TimePhases.js';

/**
 * Installs what J-Lighting-Time's source expects to already be in the realm.
 *
 * `TimePhases` belongs to J-TIME, a different ship entirely, so in a shipped game it is a global by
 * the time this plugin evaluates. The real one goes in rather than a stub because the resolver's
 * whole job is turning a phase and a position within it into a value- a stub would let these tests
 * agree with an implementation of the phase maths that does not exist.
 */
export const installLightingTimeGlobals = () =>
{
  globalThis.TimePhases ??= TimePhases;
};