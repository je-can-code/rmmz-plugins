//region ship-meta
// single source of truth for this ship; read at build time only (not imported from initialization.js).
// PLUGIN_NAME → __PLUGIN_NAME__ in the ship via Vite define (J.BASE.EXT.SAVE.Metadata).
// PLUGIN_VERSION → the header's @plugindesc and __PLUGIN_VERSION__ in the ship; the book's overview stamps it too.
// PLUGIN_DESC_TAG and PLUGIN_DESCRIPTION → the rest of the header's @plugindesc.
export const PLUGIN_NAME = 'J-Base-Save';
export const PLUGIN_VERSION = '1.0.3';
export const PLUGIN_DESC_TAG = 'BASE-SAVE';
export const PLUGIN_DESCRIPTION = 'Saves as readable JSON instead of a compressed heap dump.';
//endregion ship-meta