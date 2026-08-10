//region InputLegendResolver
import JabsInputSymbols from './../_models/JabsInputSymbols.js';

/**
 * Teaches J-Base how to describe a semantic input to the player.
 *
 * Windows bind semantic handler names rather than physical buttons, which is what lets one input
 * mapping serve every scene. The cost is that a legend saying "context: clear slot" is telling the
 * player the name of an implementation detail- nobody has ever pressed a button called context.
 *
 * The semantics happen to resolve cleanly, because the vanilla input symbols they check for are the
 * very same strings this plugin uses as its own symbol identities: `context` polls `tab`, which is
 * this plugin's Tool symbol, and so on for all eight. So describing a semantic is just a matter of
 * naming which vanilla symbol it polls and handing that to the icon registry, which already carries
 * a gamepad and keyboard glyph for each.
 *
 * J-Base holds only the hook; this registration is what fills it in. Without this plugin present,
 * legends fall back to plain readable text rather than breaking.
 */

/**
 * The vanilla input symbol each semantic handler polls for.
 *
 * These mirror {@link Window_Selectable}'s own checks. Keeping them here rather than in J-Base is
 * deliberate: J-Base defines what a semantic *means*, and this plugin owns what it is *bound to*.
 * @type {Object<string, string>}
 */
const SEMANTIC_TO_SYMBOL = {
  'ok': JabsInputSymbols.Mainhand,
  'cancel': JabsInputSymbols.Offhand,
  'context': JabsInputSymbols.Tool,
  'more': JabsInputSymbols.Dash,
  'content-prev': JabsInputSymbols.StrafeTrigger,
  'content-next': JabsInputSymbols.MobilitySkill,
  'actor-prev': JabsInputSymbols.SkillTrigger,
  'actor-next': JabsInputSymbols.GuardTrigger,

  // moving focus is directional, and answers to the directional pad rather than a face or shoulder
  // button. These are deliberately distinct from content cycling above- one moves where the player
  // is, the other changes what they are looking at, and each gets its own input.
  'focus-prev': JabsInputSymbols.DirLeft,
  'focus-next': JabsInputSymbols.DirRight,

  // adjusting a quantity is directional too, and answers to the same pair of inputs. It gets its own
  // semantic rather than borrowing `focus-prev`/`focus-next` because a semantic names what the player
  // is *doing*, not which key they pressed- and nudging a number up and down is not moving focus. One
  // input serving two meanings in two different scenes is the arrangement working, not a collision.
  'cart-dec': JabsInputSymbols.DirLeft,
  'cart-inc': JabsInputSymbols.DirRight,

  // the same adjustment taken in strides rather than steps, for quantities large enough that nudging one at a time
  // is a chore. Distinct semantics rather than `actor-prev`/`actor-next`, which happen to be bound to these same
  // two shoulders: cycling actors and changing a number by ten are not the same thing, and a legend that borrowed
  // the actor semantic would go silently wrong the day either binding moves.
  'cart-dec-bulk': JabsInputSymbols.SkillTrigger,
  'cart-inc-bulk': JabsInputSymbols.GuardTrigger,
};

/**
 * Describes a semantic handler as the inputs currently bound to it.
 * @param {string} semantic The semantic handler name, such as `context` or `actor-next`.
 * @returns {string} Renderable text, or {@link String.empty} when this semantic is not describable.
 */
function resolveSemantic(semantic)
{
  // work out which vanilla symbol this semantic polls for.
  const symbol = SEMANTIC_TO_SYMBOL[semantic];

  // semantics with no known binding are left for the caller to describe in its own words.
  if (!symbol) return String.empty;

  // hand back whatever glyphs the icon registry carries for that symbol.
  return IconManager.jabsInputTextForSymbol(symbol);
}

// register with J-Base so every control legend in the game renders glyphs instead of handler names.
InputLegendResolver.registerResolver(resolveSemantic);
//endregion InputLegendResolver
