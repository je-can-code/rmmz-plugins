import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * Build-time identifiers substituted by {@link prependMzHeaderPlugin} via Vite `define`.
 * Do not import this module from plugin source; use the literal names in initialization.js.
 */
export const RMMZ_SHIP_DEFINE_PLUGIN_NAME = '__PLUGIN_NAME__';
export const RMMZ_SHIP_DEFINE_PLUGIN_VERSION = '__PLUGIN_VERSION__';

/**
 * Loads `_metadata/meta.js` for the ship described by the active Vite config file.
 * @param {import('vite').ResolvedConfig | import('vite').UserConfig} config The config driving this step.
 * @returns {Promise<{ shipRoot: string, meta: Record<string, string> }>}
 */
async function resolveShipMeta(config)
{
  const entry = config.configFile;
  if (entry === undefined || entry === null || entry === '')
  {
    throw new Error('prepend-mz-header: config.configFile is required (use vite build --config …).');
  }

  // capture ship root for downstream policy in this routine.
  const shipRoot = path.dirname(entry);
  const metaPath = path.join(shipRoot, '_metadata', 'meta.js');
  const metaUrl = pathToFileURL(metaPath).href;
  const meta = await import(metaUrl);

  // policy step inside resolve ship meta.
  const { PLUGIN_NAME, PLUGIN_VERSION, PLUGIN_DESC_TAG } = meta;
  if (typeof PLUGIN_NAME !== 'string' || PLUGIN_NAME.length === 0)
  {
    throw new Error(`prepend-mz-header: PLUGIN_NAME missing or invalid in ${metaPath}`);
  }
  if (typeof PLUGIN_VERSION !== 'string' || PLUGIN_VERSION.length === 0)
  {
    throw new Error(`prepend-mz-header: PLUGIN_VERSION missing or invalid in ${metaPath}`);
  }
  if (typeof PLUGIN_DESC_TAG !== 'string' || PLUGIN_DESC_TAG.length === 0)
  {
    throw new Error(`prepend-mz-header: PLUGIN_DESC_TAG missing or invalid in ${metaPath}`);
  }

  // hand back { shipRoot, meta: { PLUGIN_NAME, PLUGIN_VERSION, PLUG... to the caller.
  return { shipRoot, meta: { PLUGIN_NAME, PLUGIN_VERSION, PLUGIN_DESC_TAG } };
}

/**
 * Vite plugin that prepends MZ annotations and injects ship metadata without bundling meta.js at runtime.
 *
 * Contract:
 * - `_metadata/meta.js` exports PLUGIN_NAME (runtime Metadata), PLUGIN_VERSION (shared), PLUGIN_DESC_TAG (header only).
 * - `_metadata/_annotations.js` may use @@PLUGIN_VERSION@@ and @@PLUGIN_DESC_TAG@@ in the header block.
 * - `_metadata/initialization.js` must use __PLUGIN_NAME__ and __PLUGIN_VERSION__ for Metadata construction (not import meta.js).
 */
export function prependMzHeaderPlugin()
{
  let header = '';
  return {
    name: 'prepend-mz-header',
    // policy step inside prepend mz header plugin.
    enforce: 'post',
    /**
     * Injects compile-time constants from meta.js so initialization.js never imports meta into the ship bundle.
     // policy step inside prepend mz header plugin.
     * @param {import('vite').UserConfig} config The config driving this step.
     * @returns {Promise<import('vite').UserConfig>}
     */
    // policy step inside prepend mz header plugin.
    async config(config)
    {
      const { meta } = await resolveShipMeta(config);

      // hand back { to the caller.
      return {
        define: {
          [RMMZ_SHIP_DEFINE_PLUGIN_NAME]: JSON.stringify(meta.PLUGIN_NAME),
          // Serialize the model back into json-safe text.
          [RMMZ_SHIP_DEFINE_PLUGIN_VERSION]: JSON.stringify(meta.PLUGIN_VERSION),
        },
      };
    // policy step inside prepend mz header plugin.
    },
    /**
     * Reads annotations and meta.js, substitutes version/tag placeholders, and guards against meta.js in the ship graph.
     // policy step inside prepend mz header plugin.
     * @param {import('vite').ResolvedConfig} config The config driving this step.
     */
    async configResolved(config)
    {
      // policy step inside prepend mz header plugin.
      const { shipRoot, meta } = await resolveShipMeta(config);
      const initializationPath = path.join(shipRoot, '_metadata', 'initialization.js');
      const initializationSource = fs.readFileSync(initializationPath, 'utf8');
      // capture imports meta at runtime for downstream policy in this routine.
      const importsMetaAtRuntime = /from\s+['"]\.\/meta\.js['"]/.test(initializationSource);
      if (importsMetaAtRuntime === true)
      {
        throw new Error(
          // policy step inside prepend mz header plugin.
          `prepend-mz-header: ${initializationPath} must not import meta.js; use ${RMMZ_SHIP_DEFINE_PLUGIN_NAME} and ${RMMZ_SHIP_DEFINE_PLUGIN_VERSION} instead.`
        );
      }

      // capture annotations path for downstream policy in this routine.
      const annotationsPath = path.join(shipRoot, '_metadata', '_annotations.js');
      header = fs.readFileSync(annotationsPath, 'utf8');
      if (/^import\s/m.test(header))
      {
        // abort this pass so the operator sees a hard failure.
        throw new Error(
          `prepend-mz-header: ${annotationsPath} must not contain ESM import statements (RMMZ ships are a single script).`,
        );
      }
      header = header.replaceAll('@@PLUGIN_VERSION@@', meta.PLUGIN_VERSION);
      header = header.replaceAll('@@PLUGIN_DESC_TAG@@', meta.PLUGIN_DESC_TAG);
    },
    /**
     * After the bundle is processed, prepend the annotations block onto the plugin itself.
     */
    generateBundle(_outputOptions, bundle)
    {
      for (const item of Object.values(bundle))
      {
        if (item.type === 'chunk')
        {
          item.code = `${header}\n\n${item.code}`.replace(/\n+$/, '');
        }
      }
    },
  };
}
