//region registerClassSaveRoutes
/**
 * Lifts this plugin's slice out of the actors that carry it and into its own section file.
 *
 * Without this the unlocked classes still save correctly- they simply ride inline on each actor, which is
 * where every plugin's state lived before the router existed. Registering is what gives J-Classes a file
 * of its own to read.
 *
 * The namespace check is the one this codebase allows: J-Base-Save is genuinely optional, and without it
 * the engine's own save path carries this state inline just as it always did.
 */
if (J.BASE.EXT.SAVE)
{
  SaveSectionRouter.registerNamespace('_class', 'class');
}
//endregion registerClassSaveRoutes