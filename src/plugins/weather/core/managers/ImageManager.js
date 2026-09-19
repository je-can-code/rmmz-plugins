//region ImageManager
/**
 * Loads a weather particle's picture.
 *
 * `img/weather/` is where RPG Maker's own rain and snow have always lived, so an ambient particle
 * goes in beside them rather than inventing a folder. It also means the sixty-odd pictures that ship
 * with a weather plugin are already in the right place for this one.
 * @param {string} filename The name of the picture, without its extension.
 * @returns {Bitmap}
 */
ImageManager.loadWeather = function(filename)
{
  return this.loadBitmap('img/weather/', filename);
};
//endregion ImageManager