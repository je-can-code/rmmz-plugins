//region ship-meta
// single source of truth for this ship; read at build time only (not imported from initialization.js).
// PLUGIN_NAME → __PLUGIN_NAME__ in the ship via Vite define (J.REGIONS.EXT.SKILLS.Metadata).
// PLUGIN_VERSION → the header's @plugindesc and __PLUGIN_VERSION__ in the ship; the book's overview stamps it too.
// PLUGIN_DESC_TAG and PLUGIN_DESCRIPTION → the rest of the header's @plugindesc.
export const PLUGIN_NAME = 'J-Regions-Skills';
export const PLUGIN_VERSION = '1.1.3';
export const PLUGIN_DESC_TAG = 'REGIONS-SKILLS';
export const PLUGIN_DESCRIPTION = 'Enables execution of skills via region ids.';
//endregion ship-meta