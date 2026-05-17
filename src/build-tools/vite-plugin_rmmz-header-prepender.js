import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * A vite plugin that owns grabbing the annotations file from the plugin directory, and prepending it onto the actual
 * plugin itself. This expects that there is a "meta.js" file in the _metadata directory that describes the plugin
 * verison and description tag, as well as an "_annotations.js" file exists carrying the RMMZ metadata that is desired
 * to be listed as the @help and such in the plugin in RMMZ's plugin viewer.
 */
export function prependMzHeaderPlugin()
{
  let header = '';
  return {
    name: 'prepend-mz-header',
    enforce: 'post',
    /**
     * Once the config is resolved, also grab the relevant plugin annotations and dynamically inject the version into
     * the annotations.
     */
    async configResolved(config)
    {
      // grab the annotations header itself.
      const entry = config.configFile;
      const shipRoot = path.dirname(entry);
      const annotationsPath = path.join(shipRoot, '_metadata', '_annotations.js');
      header = fs.readFileSync(annotationsPath, 'utf8');

      // grab the plugin version information.
      const metaPath = path.join(shipRoot, '_metadata', 'meta.js');
      const metaUrl = pathToFileURL(metaPath).href;
      const {
        PLUGIN_VERSION,
        PLUGIN_DESC_TAG
      } = await import(metaUrl);

      // dynamically inject the plugin version information into the plugin.
      header = header.replaceAll('@@PLUGIN_VERSION@@', PLUGIN_VERSION);
      header = header.replaceAll('@@PLUGIN_DESC_TAG@@', PLUGIN_DESC_TAG);
    },
    /**
     * After the bundle is processed, prepend the annotations block onto the plugin itself.
     */
    generateBundle(outputOptions, bundle)
    {
      for (const item of Object.values(bundle))
      {
        // the chunk is the plugin itself in this case.
        if (item.type === 'chunk')
        {
          // prepend the header onto the plugin body.
          item.code = `${header}\n\n${item.code}`.replace(/\n+$/, '');
        }
      }
    },
  };
}