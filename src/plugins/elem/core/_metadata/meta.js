//region ship-meta
// single source of truth for this ship; read at build time only (not imported from initialization.js).
// PLUGIN_NAME → __PLUGIN_NAME__ in the ship via Vite define (J.ELEM.Metadata).
// PLUGIN_VERSION → the header's @plugindesc and __PLUGIN_VERSION__ in the ship; the book's overview stamps it too.
// PLUGIN_DESC_TAG and PLUGIN_DESCRIPTION → the rest of the header's @plugindesc.
export const PLUGIN_NAME = 'J-Elementalistics';
export const PLUGIN_VERSION = '1.5.0';
export const PLUGIN_DESC_TAG = 'ELEM';
export const PLUGIN_DESCRIPTION = 'Enables greater control over elements.';
//endregion ship-meta