//region ship-meta
// single source of truth for this ship; read at build time only (not imported from initialization.js).
// PLUGIN_NAME → __PLUGIN_NAME__ in the ship via Vite define (J.PASSIVE.EXT.OTIB.Metadata).
// PLUGIN_VERSION → @@PLUGIN_VERSION@@ in annotations and __PLUGIN_VERSION__ in the ship.
// PLUGIN_DESC_TAG → @@PLUGIN_DESC_TAG@@ in annotations only.
export const PLUGIN_NAME = 'J-Passive-OTIB';
export const PLUGIN_VERSION = '1.1.0';
export const PLUGIN_DESC_TAG = 'PASSIVE-OTIB';
//endregion ship-meta