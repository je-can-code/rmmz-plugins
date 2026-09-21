//region MapWeatherResolver
import ClimateCurves from './ClimateCurves.js';

/**
 * Extends {@link MapWeatherResolver.declarationFor}.<br/>
 * Also reads which climate, if any, the map answers the sky through.
 *
 * `MapWeatherResolver` belongs to J-Weather and is a hoisted global by the time this runs, so this
 * needs no import - and the tag is read here rather than in core because core must not know its
 * extensions exist.
 */
J.WEATHER.EXT.TIME.Aliased.MapWeatherResolver.set('declarationFor', MapWeatherResolver.declarationFor);
MapWeatherResolver.declarationFor = function(dataMap)
{
  // perform original logic.
  const declaration = J.WEATHER.EXT.TIME.Aliased.MapWeatherResolver.get('declarationFor')
    .call(this, dataMap);

  // null when the map named none, which is the overwhelming majority of them.
  declaration.climate = RPGManager.getStringFromNoteByRegex(dataMap, J.WEATHER.EXT.TIME.RegExp.Climate, true);

  return declaration;
};

/**
 * Extends {@link MapWeatherResolver.intensityFor}.<br/>
 * Also bends the sky's strength through whatever climate the place has.
 *
 * Aliasing the static rather than reaching into `resolve` keeps the whole of this extension's
 * opinion in one place: core decides what strength the sky implies, and this decides what one
 * particular place makes of that.
 */
J.WEATHER.EXT.TIME.Aliased.MapWeatherResolver.set('intensityFor', MapWeatherResolver.intensityFor);
MapWeatherResolver.intensityFor = function(declaration, sky)
{
  // perform original logic.
  const skyIntensity = J.WEATHER.EXT.TIME.Aliased.MapWeatherResolver.get('intensityFor')
    .call(this, declaration, sky);

  return ClimateCurves.apply(declaration, sky, skyIntensity);
};
//endregion MapWeatherResolver