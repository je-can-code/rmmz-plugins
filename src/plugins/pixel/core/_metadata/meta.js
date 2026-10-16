//region ship-meta
// single source of truth for this ship; read at build time only (not imported from initialization.js).
// PLUGIN_NAME → __PLUGIN_NAME__ in the ship via Vite define (J.PIXEL.Metadata).
// PLUGIN_VERSION → the header's @plugindesc and __PLUGIN_VERSION__ in the ship; the book's overview stamps it too.
// PLUGIN_DESC_TAG and PLUGIN_DESCRIPTION → the rest of the header's @plugindesc.
export const PLUGIN_NAME = 'J-Pixelistics';
export const PLUGIN_VERSION = '1.5.0';
export const PLUGIN_DESC_TAG = 'PIXEL';
export const PLUGIN_DESCRIPTION = 'Enables sub-tile (pixel-accurate) movement on the map.';
//endregion ship-meta