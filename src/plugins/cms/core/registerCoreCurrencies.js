//region registerCoreCurrencies
import CurrencyDefinition from './_models/CurrencyDefinition.js';
import Window_Currencies from './windows/Window_Currencies.js';

/**
 * Registers gold with the currency strip.
 *
 * Gold goes through the same door everything else does. It could have been drawn directly by the strip
 * and saved a few lines, but then gold would be the one currency the strip knew about by name- and the
 * next thing added would have had to argue for a seam that ought to have existed already.
 *
 * It registers first, and therefore draws leftmost, because it is the currency every game has.
 */
const goldDefinition = new CurrencyDefinition(
  'gold',
  -1,
  () => TextManager.currencyUnit,
  () => $gameParty.gold());

Window_Currencies.register(goldDefinition);
//endregion registerCoreCurrencies