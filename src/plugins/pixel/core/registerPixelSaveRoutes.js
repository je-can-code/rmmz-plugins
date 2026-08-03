//region registerPixelSaveRoutes
/**
 * Lifts this plugin's slice out of whatever host carries it and into its own section file.
 *
 * Without this the namespace still saves correctly - it simply rides inline on the host it was
 * assigned to, which is where every plugin's state lived before the router existed. Registering
 * is what gives J-Pixelistics a file of its own to read.
 *
 * The namespace check is the one this codebase allows: J-Base-Save is genuinely optional, and
 * without it the engine's own save path carries this state inline just as it always did.
 */
if (J.BASE.EXT.SAVE)
{
  SaveSectionRouter.registerNamespace('_pixel', 'pixel');
}
//endregion registerPixelSaveRoutes