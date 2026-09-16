//region plugin commands
import ChatterManager from '../managers/ChatterManager.js';

/**
 * Makes a character say a specific line right now, regardless of the ambient rules.
 *
 * This is how a scene has somebody mutter in the background without stopping to do it. A real
 * message would block the interpreter and take the player's input; a forced chatter line does
 * neither, which is exactly what makes it usable while something else is going on.
 *
 * **Not an arrow function, deliberately.** `PluginManager.callCommand` invokes a handler as
 * `func.bind(self)(args)` with the running interpreter as `self`, and `self.eventId()` is the only
 * way a target of `self` can mean anything. An arrow discards that binding.
 */
PluginManager.registerCommand(
  J.MESSAGE.EXT.CHATTER.Metadata.name,
  'chatter-now',
  function(args)
  {
    const {
      target,
      text,
      duration,
      position,
      background,
      persist,
    } = args;

    // zero in a common event or a troop page, neither of which has a "this event" to speak of. A
    // `self` target there names nothing and produces no chatter, which is the honest answer rather
    // than a bug - but it is worth knowing, because the failure looks exactly like it working.
    const hostEventId = this.eventId();
    const token = ChatterManager.normalizeToken(target, hostEventId);
    const overrides = ChatterManager.overridesFrom(duration, position, background);

    // every plugin command argument arrives as a string, an unticked checkbox included.
    const persistent = persist === 'true';

    ChatterManager.force(token, text, overrides, persistent);
  });
//endregion plugin commands