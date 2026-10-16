//region ship-meta
// single source of truth for this ship; read at build time only (not imported from initialization.js).
// PLUGIN_NAME → __PLUGIN_NAME__ in the ship via Vite define (J.PASSIVE.EXT.DIFFICULTY.Metadata).
// PLUGIN_VERSION → the header's @plugindesc and __PLUGIN_VERSION__ in the ship; the book's overview stamps it too.
// PLUGIN_DESC_TAG and PLUGIN_DESCRIPTION → the rest of the header's @plugindesc.
export const PLUGIN_NAME = 'J-Passive-Difficulty';
export const PLUGIN_VERSION = '3.0.0';
export const PLUGIN_DESC_TAG = 'PASSIVE-DIFFICULTY';
export const PLUGIN_DESCRIPTION = 'Difficulty layers as passive states for everyone.';
//endregion ship-meta