//region ship-meta
// single source of truth for this ship; build-time only (not imported from initialization.js).
// PLUGIN_NAME → __PLUGIN_NAME__ in the ship via Vite define (J.MOTION.EXT.ABS.Metadata).
// PLUGIN_VERSION → the header's @plugindesc and __PLUGIN_VERSION__ in the ship; the book's overview stamps it too.
// PLUGIN_DESC_TAG and PLUGIN_DESCRIPTION → the rest of the header's @plugindesc.
export const PLUGIN_NAME = 'J-Motion-ABS';
export const PLUGIN_VERSION = '1.2.1';
export const PLUGIN_DESC_TAG = 'MOTION-ABS';
export const PLUGIN_DESCRIPTION = 'Combat-driven motion: state effects, deaths, arrivals and departures.';
//endregion ship-meta