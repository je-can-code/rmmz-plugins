import MonsterpediaDropSummary from '../managers/MonsterpediaDropSummary.js';
import MonsterpediaRoster from '../managers/MonsterpediaRoster.js';
import MonsterpediaTypes from '../managers/MonsterpediaTypes.js';

class Window_MonsterpediaDetail
  extends Window_Base
{
  //region properties
  /**
   * The player's observations of the currently highlighted enemy.
   * @type {MonsterpediaObservations|null}
   */
  _currentObservations = null;

  /**
   * A cache of all sprites associated with base parameters.
   * @type {Map<number, Sprite_Icon>}
   */
  _baseParameterIconCache = new Map();

  /**
   * A cache of all sprites associated with sp parameters.
   * @type {Map<number, Sprite_Icon>}
   */
  _spParameterIconCache = new Map();

  /**
   * A cache of all sprites associated with ex parameters.
   * @type {Map<number, Sprite_Icon>}
   */
  _exParameterIconCache = new Map();

  //endregion properties

  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Gets the current enemy observations for this window.
   * @returns {MonsterpediaObservations|null}
   */
  getObservations()
  {
    return this._currentObservations;
  }

  /**
   * Sets the current enemy observations for this window.
   * @param {MonsterpediaObservations} observations The observations driving this step.
   */
  setObservations(observations)
  {
    this._currentObservations = observations;
  }

  //region image caching
  /**
   * Gets the b-parameter icon image cache.
   * @returns {Map<number, Sprite_Icon>}
   */
  getBaseParameterIconCache()
  {
    return this._baseParameterIconCache;
  }

  /**
   * Gets the s-parameter icon image cache.
   * @returns {Map<number, Sprite_Icon>}
   */
  getSpParameterIconCache()
  {
    return this._spParameterIconCache;
  }

  /**
   * Gets the x-parameter icon image cache.
   * @returns {Map<number, Sprite_Icon>}
   */
  getExParameterIconCache()
  {
    return this._exParameterIconCache;
  }

  /**
   * Populates the sprite cache ahead of rendering.
   */
  populateImageCache()
  {
    // populate all icon sprites into the cache.
    this.populateParameterIconSpriteCache();
  }

  /**
   * Caches all sprites associated with parameters icons.
   */
  populateParameterIconSpriteCache()
  {
    // cache the b-param icon sprites.
    this.populateBaseParameterIconSpriteCache();

    // cache the s-param icon sprites.
    this.populateSpParameterIconSpriteCache();

    // cache the x-param icon sprites.
    this.populateExParameterIconSpriteCache();
  }

  /**
   * Caches all base parameter icon sprites.
   */
  populateBaseParameterIconSpriteCache()
  {
    // define the parameter ids that qualify as b-params.
    const bparamIds = Game_BattlerBase.knownBaseParameterIds()
      .concat(30);

    // an iterator function for creating base parameter icon sprites.
    const forEacher = (_, bParamId) => this.getOrCreateBaseParameterIconSprite(bParamId);

    // cache all sprites.
    bparamIds.forEach(forEacher, this);
  }

  /**
   * Caches all sp parameter icon sprites.
   */
  populateSpParameterIconSpriteCache()
  {
    // define the parameter ids that qualify as s-params.
    const sparamIds = Game_BattlerBase.knownSpParameterIds();

    // an iterator function for creating sp parameter icon sprites.
    const forEacher = (_, sParamId) => this.getOrCreateSpParameterIconSprite(sParamId);

    // cache all sprites.
    sparamIds.forEach(forEacher, this);
  }

  /**
   * Caches all ex parameter icon sprites.
   */
  populateExParameterIconSpriteCache()
  {
    // define the parameter ids that qualify as x-params.
    const xparamIds = Game_BattlerBase.knownExParameterIds();

    // an iterator function for creating ex parameter icon sprites.
    const forEacher = (_, xParamId) => this.getOrCreateExParameterIconSprite(xParamId);

    // cache all sprites.
    xparamIds.forEach(forEacher, this);
  }

  /**
   * Gets the base parameter icon sprite. If it is already cached, the cached one will be
   * returned, otherwise it'll be created and then cached.
   * @param {number} bParamId The id of the parameter to retrieve the sprite for.
   * @returns {Sprite_Icon}
   */
  getOrCreateBaseParameterIconSprite(bParamId)
  {
    // grab the cache.
    const cache = this.getBaseParameterIconCache();

    // check if the key already maps to a cached sprite.
    if (cache.has(bParamId))
    {
      // if it does, just return that.
      return cache.get(bParamId);
    }

    // determine the icon index for this b-parameter.
    // for the sake of the monsterpedia, we are categorizing "maxTp"(30) as a base param.
    const iconIndex = bParamId === 30
      ? IconManager.maxTp()
      : IconManager.param(bParamId);

    // create a new sprite.
    const sprite = new Sprite_Icon(iconIndex);

    // cache the sprite.
    cache.set(bParamId, sprite);

    // hide the sprite for now.
    sprite.hide();

    // add the sprite to tracking.
    this.addChild(sprite);

    // return the created sprite.
    return sprite;
  }

  /**
   * Gets the sp parameter icon sprite. If it is already cached, the cached one will be
   * returned, otherwise it'll be created and then cached.
   * @param {number} sParamId The id of the parameter to retrieve the sprite for.
   * @returns {Sprite_Icon}
   */
  getOrCreateSpParameterIconSprite(sParamId)
  {
    // grab the cache.
    const cache = this.getSpParameterIconCache();

    // check if the key already maps to a cached sprite.
    if (cache.has(sParamId))
    {
      // if it does, just return that.
      return cache.get(sParamId);
    }

    // determine the icon index for this s-parameter.
    const iconIndex = IconManager.sparam(sParamId);

    // create a new sprite.
    const sprite = new Sprite_Icon(iconIndex);

    // cache the sprite.
    cache.set(sParamId, sprite);

    // hide the sprite for now.
    sprite.hide();

    // add the sprite to tracking.
    this.addChild(sprite);

    // return the created sprite.
    return sprite;
  }

  /**
   * Gets the ex parameter icon sprite. If it is already cached, the cached one will be
   * returned, otherwise it'll be created and then cached.
   * @param {number} xParamId The id of the parameter to retrieve the sprite for.
   * @returns {Sprite_Icon}
   */
  getOrCreateExParameterIconSprite(xParamId)
  {
    // grab the cache.
    const cache = this.getExParameterIconCache();

    // check if the key already maps to a cached sprite.
    if (cache.has(xParamId))
    {
      // if it does, just return that.
      return cache.get(xParamId);
    }

    // determine the icon index for this x-parameter.
    const iconIndex = IconManager.xparam(xParamId);

    // create a new sprite.
    const sprite = new Sprite_Icon(iconIndex);

    // cache the sprite.
    cache.set(xParamId, sprite);

    // hide the sprite for now.
    sprite.hide();

    // add the sprite to tracking.
    this.addChild(sprite);

    // return the created sprite.
    return sprite;
  }

  //endregion image caching

  /**
   * Implements {@link Window_Base.drawContent}.<br/>
   * Draws a header and some detail for the omnipedia list header.
   */
  drawContent()
  {
    // grab the currently-highlighted observation.
    const observations = this.getObservations();

    // if we have no observations, do not draw.
    if (!observations) return;

    // define the origin x,y coordinates.
    const [ x, y ] = [ 0, 0 ];

    // shorthand the lineHeight.
    const lh = this.lineHeight();

    // draw the enemy defeat information.
    const defeatedY = y + 4;
    this.drawEnemyDefeat(x, defeatedY);

    // draw the enemy name.
    const enemyNameX = x + 100;
    this.drawEnemyName(enemyNameX, y);

    // draw the enemy as it looks on the map.
    const enemySpriteY = y + (lh * 3);
    this.drawEnemySprite(x, enemySpriteY);

    // draw the parameters for the enemy, unless the page listing it leaves them out.
    const databaseEnemy = $dataEnemies.at(observations.id);
    if (MonsterpediaTypes.showsStatsFor(databaseEnemy) === true)
    {
      this.drawEnemyParameters(this.parametersColumnX(), y);
    }

    // draw the drops for the enemy.
    this.drawEnemyDrops(this.dropsColumnX(), y);

    // draw the description of the enemy.
    this.drawDescription(x, this.descriptionY());

    // draw the enemy's elementalistics beneath its portrait: damage types on the left, family/traits/tools beside them.
    this.drawElementalistics();
  }

  /**
   * Draws the enemy defeat information at the location.
   * @param {number} x The x coordinate of the point.
   * @param {number} y The y coordinate of the point.
   */
  drawEnemyDefeat(x, y)
  {
    // clear residual font modifications.
    const valueX = x + 12;
    this.drawEnemyDefeatCountValue(valueX, y);

    // reduce font size for a tiny "DEFEATED".
    const keyY = y - 14;
    this.drawEnemyDefeatCountKey(x, keyY);
  }

  /**
   * Draws the enemy's defeated count value at the given point.
   * @param {number} x The x coordinate of the point.
   * @param {number} y The y coordinate of the point.
   */
  drawEnemyDefeatCountValue(x, y)
  {
    // clear residual font modifications.
    this.resetFontSettings();

    // boost the font size, headers are big!
    this.modFontSize(6);

    // grab the id out of the current observations.
    const { numberDefeated } = this.getObservations();

    // pad the id with zeroes to ensure we always have at least 3 digits.
    const paddedNumberDefeated = numberDefeated.padZero(4);

    // calculate the text width.
    const textWidth = this.textWidth(paddedNumberDefeated);

    // render the "ID" text.
    this.drawText(`${paddedNumberDefeated}`, x, y, textWidth, Window_Base.TextAlignments.Left);
  }

  /**
   * Draws the enemy's defeated count key at the given point.
   * @param {number} x The x coordinate of the point.
   * @param {number} y The y coordinate of the point.
   */
  drawEnemyDefeatCountKey(x, y)
  {
    // clear residual font modifications.
    this.resetFontSettings();

    // reduce font size for a tiny "ID".
    this.modFontSize(-10);

    // force bold for the key.
    this.toggleItalics(true);

    // capture the text to render.
    const defeatCounterText = 'DEFEATED';

    // determine the text width for the key.
    const textWidth = this.textWidth(defeatCounterText);

    // render the text.
    this.drawText(defeatCounterText, x, y, textWidth, Window_Base.TextAlignments.Left);
  }

  /**
   * Draws the enemy's name at the given point.
   * @param {number} x The x coordinate of the point.
   * @param {number} y The y coordinate of the point.
   */
  drawEnemyName(x, y)
  {
    // clear residual font modifications.
    this.resetFontSettings();

    // boost the font size, headers are big!
    this.modFontSize(14);

    // bold the header.
    this.toggleBold(true);

    // grab the id out of the current observations.
    const {
      id,
      knowsName
    } = this.getObservations();

    // pull the enemy's database data out.
    const databaseEnemy = $dataEnemies.at(id);

    // define the name.
    const { name } = databaseEnemy;

    // potentially mask the name depending on whether or not the player knows it.
    const possiblyMaskedName = knowsName
      ? name
      : J.BASE.Helpers.maskString(name);

    // determine the width of the enemy's name.
    const textWidth = this.textWidth(name);

    // draw the header.
    this.drawText(possiblyMaskedName, x, y, textWidth, Window_Base.TextAlignments.Left);
  }

  /**
   * Draws the enemy the way it looks on the map, standing in the space between the header and the
   * elementalistics beneath it.<br/>
   * An enemy is only pictured once it has been defeated at least once, and one the roster cannot
   * picture leaves the space empty. Its sheet may still be loading the first time its page opens, in
   * which case the page draws itself again the moment the sheet arrives.
   * @param {number} x The x coordinate of the space's top-left corner.
   * @param {number} y The y coordinate of the space's top-left corner.
   */
  drawEnemySprite(x, y)
  {
    // grab the id out of the current observations.
    const {
      id,
      numberDefeated
    } = this.getObservations();

    // don't render the sprite if we have never defeated it.
    if (numberDefeated < 1) return;

    // the sheet and character the enemy wears on the map.
    const {
      characterName,
      characterIndex
    } = MonsterpediaRoster.characterOf(id);

    // an enemy the roster cannot picture leaves the space empty.
    if (characterName === String.empty) return;

    // a sheet still loading would draw nothing, so draw this page again once it arrives.
    const bitmap = ImageManager.loadCharacter(characterName);
    if (bitmap.isReady() === false)
    {
      bitmap.addLoadListener(this.refresh.bind(this));
      return;
    }

    // the space the enemy stands in, and how large it can be drawn there.
    const box = this.enemySpriteBox(x, y);
    const frame = CharacterFrame.standing(characterName, characterIndex, bitmap.width, bitmap.height);
    const scale = CharacterFrame.fitScale(frame.width, frame.height, box.width, box.height, this.enemySpriteScale());

    // stand it in the middle of the space, both ways.
    const centerX = box.x + Math.floor(box.width / 2);
    const baselineY = box.y + Math.floor((box.height + (frame.height * scale)) / 2);

    // draw it.
    this.drawCharacterStanding(characterName, characterIndex, centerX, baselineY, scale);
  }

  /**
   * The space an enemy's portrait stands in: from the given corner across to the drops column, and
   * down to where the elementalistics begin.
   * @param {number} x The x coordinate of the space's top-left corner.
   * @param {number} y The y coordinate of the space's top-left corner.
   * @returns {Rectangle}
   */
  enemySpriteBox(x, y)
  {
    // the edges the portrait keeps clear of: the drops column beside it, the elementalistics beneath it.
    const right = this.dropsColumnX() - this.enemySpriteGutter();
    const bottom = this.elementalisticsTop() - this.enemySpriteGutter();

    return new Rectangle(x, y, right - x, bottom - y);
  }

  /**
   * The breathing room kept between an enemy's portrait and the columns around it.
   * @returns {number}
   */
  enemySpriteGutter()
  {
    return 24;
  }

  /**
   * How many times larger than native an enemy's portrait is drawn whenever its space allows.<br/>
   * Every enemy is drawn at the same scale, so a slime still reads as small beside a dragon; only a
   * portrait too large for its space is shrunk to fit.
   * @returns {number}
   */
  enemySpriteScale()
  {
    return 3;
  }

  /**
   * Where the drops column begins, measured from the left of this window's contents.<br/>
   * The column is wide because item names are long, and every line of it is an item's name beside its
   * chance.
   * @returns {number}
   */
  dropsColumnX()
  {
    return this.innerWidth - 700;
  }

  /**
   * The extra room every row of the drops column puts between its name and its value, carrying each
   * value to the column's right edge so the values line up and the names get the column's width.
   * @returns {number}
   */
  dropsColumnSpacePlus()
  {
    return 100;
  }

  /**
   * Where the parameters column begins, measured from the left of this window's contents.<br/>
   * Measured from the contents rather than the whole window, since the contents end a padding short of
   * the window's edge and a value drawn past them is cut off.
   * @returns {number}
   */
  parametersColumnX()
  {
    return this.innerWidth - 300;
  }

  /**
   * Where the description begins, measured from this window's top edge.
   * @returns {number}
   */
  descriptionY()
  {
    return this.height - (this.lineHeight() * 6);
  }

  /**
   * Draws the primary parameters of the enemy.
   * @param {number} x The x coordinate of the point.
   * @param {number} y The y coordinate of the point.
   */
  drawEnemyParameters(x, y)
  {
    // shorthand the lineHeight.
    const lh = this.lineHeight() - 10;

    // draw the level of the enemy.
    this.drawLevelParameter(x, y);

    // draw the resources of the enemy.
    const resourcesY = lh * 2;
    this.drawResourceParameters(x, resourcesY);

    // draw the parameters of the enemy.
    const parametersY = lh * 6;
    this.drawCoreParameters(x, parametersY);
  }

  /**
   * Draws the level of the enemy.
   * @param {number} x The x coordinate of the point.
   * @param {number} y The y coordinate of the point.
   */
  drawLevelParameter(x, y)
  {
    // clear residual font modifications.
    this.resetFontSettings();

    // reduce the font size a bit for these params.
    this.modFontSize(-4);

    // grab the id out of the current observations.
    const {
      id,
      knowsParameters
    } = this.getObservations();

    // grab a reference to the enemy for database analysis.
    const gameEnemy = $gameEnemies.enemy(id);

    // extract the parameters to draw from this enemy.
    const { level, } = gameEnemy;

    // draw the level parameter.
    this.drawEnemyParameter(x, y, IconManager.level(), TextManager.level, level, !knowsParameters, 4);
  }

  /**
   * Draws the resource parameters of the enemy, such as HP/MP/TP.
   * @param {number} x The x coordinate of the point.
   * @param {number} y The y coordinate of the point.
   */
  drawResourceParameters(x, y)
  {
    // clear residual font modifications.
    this.resetFontSettings();

    // shorthand the lineHeight.
    const lh = this.lineHeight() - 10;

    // nudge smaller than core params so the stair-stepped life/magi/tp trio still fits after global font bumps.
    this.modFontSize(-6);

    // grab the id out of the current observations.
    const {
      id,
      knowsParameters
    } = this.getObservations();

    // grab a reference to the enemy for database analysis.
    const gameEnemy = $gameEnemies.enemy(id);

    // extract the parameters to draw from this enemy.
    const {
      mhp,
      mmp,
      mtp,
    } = gameEnemy;

    const maxRemover = parameterName =>
    {
      return parameterName.replace('Max ', String.empty);
    };

    // tight name-to-value gap keeps the stepped tp row inside the window when fonts run large.
    const resourceNameValueTighten = -14;

    // draw the max hp parameter.
    const maxHpName = maxRemover(TextManager.param(0));
    this.drawEnemyParameter(x, y, IconManager.param(0), maxHpName, mhp, !knowsParameters, 6, resourceNameValueTighten);

    // draw the max mp parameter.
    const maxMpName = maxRemover(TextManager.param(1));
    const maxMpXPlus = 12;
    const maxMpYPlus = lh * 1;
    this.drawEnemyParameter(
      x + maxMpXPlus,
      y + maxMpYPlus,
      IconManager.param(1),
      maxMpName,
      mmp,
      !knowsParameters,
      6,
      resourceNameValueTighten);

    // draw the max tp parameter.
    const maxTpName = maxRemover(TextManager.maxTp());
    const maxTpXPlus = 24;
    const maxTpYPlus = lh * 2;
    this.drawEnemyParameter(
      x + maxTpXPlus,
      y + maxTpYPlus,
      IconManager.maxTp(),
      maxTpName,
      mtp,
      !knowsParameters,
      6,
      resourceNameValueTighten);
  }

  /**
   * Draws the core parameters of the enemy, such as atk/def/mat/mdf/agi/luk.
   * @param {number} x The x coordinate of the point.
   * @param {number} y The y coordinate of the point.
   */
  drawCoreParameters(x, y)
  {
    // clear residual font modifications.
    this.resetFontSettings();

    // shorthand the lineHeight.
    const lh = this.lineHeight() - 10;

    // reduce the font size a bit for these params.
    this.modFontSize(-4);

    // grab the id out of the current observations.
    const {
      id,
      knowsParameters
    } = this.getObservations();

    // grab a reference to the enemy for database analysis.
    const gameEnemy = $gameEnemies.enemy(id);

    // extract the parameters to draw from this enemy.
    const {
      atk,
      def,
      pdr,
      mat,
      mdf,
      mdr,
      agi,
      hit,
      cnt,
      luk,
      cri,
      cev,
    } = gameEnemy;

    // the modifier for where the left column begins.
    const leftColumnX = 8;

    // draw the attack parameter.
    const atkXPlus = leftColumnX;
    this.drawEnemyParameter(
      x + atkXPlus,
      y,
      IconManager.param(2),
      TextManager.param(2),
      atk,
      !knowsParameters,
      4);

    // draw the endurance parameter.
    const defXPlus = leftColumnX + 8;
    const defYPlus = lh * 1;
    this.drawEnemyParameter(
      x + defXPlus,
      y + defYPlus,
      IconManager.param(3),
      TextManager.param(3),
      def,
      !knowsParameters,
      4
    );

    // draw the phys dmg down parameter.
    const pdrXPlus = leftColumnX + 8;
    const pdrYPlus = lh * 2;
    const pdrValue = Math.round((pdr * 100) - 100);
    this.drawEnemyParameter(
      x + pdrXPlus,
      y + pdrYPlus,
      IconManager.sparam(6),
      TextManager.sparam(6),
      pdrValue,
      !knowsParameters,
      3
    );

    // draw the force parameter.
    const matXPlus = leftColumnX;
    const matYPlus = lh * 3;
    this.drawEnemyParameter(
      x + matXPlus,
      y + matYPlus,
      IconManager.param(4),
      TextManager.param(4),
      mat,
      !knowsParameters,
      4
    );

    // draw the resist parameter.
    const mdfXPlus = leftColumnX + 8;
    const mdfYPlus = lh * 4;
    this.drawEnemyParameter(
      x + mdfXPlus,
      y + mdfYPlus,
      IconManager.param(5),
      TextManager.param(5),
      mdf,
      !knowsParameters,
      4
    );

    // draw the magi def down parameter.
    const mdrXPlus = leftColumnX + 8;
    const mdrYPlus = lh * 5;
    const mdrValue = Math.round((mdr * 100) - 100);
    this.drawEnemyParameter(
      x + mdrXPlus,
      y + mdrYPlus,
      IconManager.sparam(7),
      TextManager.sparam(7),
      mdrValue,
      !knowsParameters,
      3
    );

    // draw the speed parameter.
    const agiXPlus = leftColumnX;
    const agiYPlus = lh * 6;
    this.drawEnemyParameter(
      x + agiXPlus,
      y + agiYPlus,
      IconManager.param(6),
      TextManager.param(6),
      agi,
      !knowsParameters,
      4
    );

    // draw the hit rate parameter.
    const hitXPlus = leftColumnX + 8;
    const hitYPlus = lh * 7;
    const hitValue = Math.round(hit * 100);
    this.drawEnemyParameter(
      x + hitXPlus,
      y + hitYPlus,
      IconManager.xparam(0),
      TextManager.xparam(0),
      hitValue,
      !knowsParameters,
      4
    );

    // draw the autocounter parameter.
    const cntXPlus = leftColumnX + 8;
    const cntYPlus = lh * 8;
    const cntValue = Math.round(cnt * 100);
    this.drawEnemyParameter(
      x + cntXPlus,
      y + cntYPlus,
      IconManager.xparam(6),
      TextManager.xparam(6),
      cntValue,
      !knowsParameters,
      3
    );

    // draw the b-param parameter.
    const lukXPlus = leftColumnX;
    const lukYPlus = lh * 9;
    this.drawEnemyParameter(
      x + lukXPlus,
      y + lukYPlus,
      IconManager.param(7),
      TextManager.param(7),
      luk,
      !knowsParameters,
      4
    );

    // draw the crit chance parameter.
    const criXPlus = leftColumnX + 8;
    const criYPlus = lh * 10;
    const criValue = Math.round(cri * 100);
    this.drawEnemyParameter(
      x + criXPlus,
      y + criYPlus,
      IconManager.xparam(2),
      TextManager.xparam(2),
      criValue,
      !knowsParameters,
      4
    );

    // draw the cev parameter.
    const cevXPlus = leftColumnX + 8;
    const cevYPlus = lh * 11;
    const cevValue = Math.round(cev * 100);
    this.drawEnemyParameter(
      x + cevXPlus,
      y + cevYPlus,
      IconManager.xparam(3),
      TextManager.xparam(3),
      cevValue,
      !knowsParameters,
      4
    );
  }

  /**
   * Draws the enemy parameter with the given data at the designated point's coordinates.
   *
   * If the parameter name is {@link String.empty}, the name will be omitted entirely from drawing.
   * @param {number} x The x coordinate of the point.
   * @param {number} y The y coordinate of the point.
   * @param {number} iconIndex The icon index of the parameter.
   * @param {string} parameterName The name of the parameter.
   * @param {number|string} parameterValue The numeric or preformatted value of the parameter.
   * @param {boolean=} maskValue Whether or not to mask the parameter value; defaults to false.
   * @param {number=} padZeroCount The digits to pad to when {@link parameterValue} is numeric; defaults to 8.
   * @param {number=} spacePlus Additional space to add between the name and value of this parameter.
   * @param {number=} valueColorIndex Palette index for significant digits; defaults to 0.
   */
  drawEnemyParameter(
    x,
    y,
    iconIndex,
    parameterName,
    parameterValue,
    maskValue = false,
    padZeroCount = 8,
    spacePlus = 0,
    valueColorIndex = 0)
  {
    // draw the icon for the parameter.
    this.drawIcon(iconIndex, x, y);

    // determine the padding for prefixing with an icon.
    const iconWidthPadding = iconIndex === 0
      ? 0   // no padding for no icon.
      : 40; // padding if we have an icon.

    // a small space between parameter name and value.
    const nameValueSpace = 48 + spacePlus;

    // calculate the x coordinate for the parameter name.
    const parameterNameX = x + iconWidthPadding;

    // whether this parameter has a name to draw at all.
    const hasName = parameterName !== String.empty;

    // the value starts where the name would, or past the name when there is one.
    const parameterValueX = hasName
      ? parameterNameX + 48 + nameValueSpace
      : parameterNameX + 48;

    // mask the value when the player hasn't yet learned this enemy's stats; otherwise pad to alignment width.
    const displayValue = maskValue
      ? J.BASE.Helpers.maskString(parameterValue.padZero(padZeroCount))
      : parameterValue.padZero(padZeroCount);

    // determine the width of the value.
    const parameterValueWidth = hasName
      ? 128
      : this.textWidth(displayValue);

    // check if we're adding the name.
    if (hasName)
    {
      // the name may use the room up to its value; a longer one is narrowed rather than running under it.
      const parameterNameWidth = this.parameterNameRoom(
        parameterNameX,
        parameterValueX,
        parameterValueWidth,
        displayValue);

      // names are bold!
      this.toggleBold(true);

      // draw the parameter name.
      this.drawText(`${parameterName}`, parameterNameX, y, parameterNameWidth, Window_Base.TextAlignments.Left);

      // disable bold when done writing.
      this.toggleBold(false);
    }

    // draw the parameter value.
    this.drawEnemyParameterValue(parameterValueX, y, displayValue, parameterValueWidth, valueColorIndex);
  }

  /**
   * How wide a parameter's name may be drawn: from where it starts up to a small gap before its value.<br/>
   * The value is right-aligned in its box at one digit's width per character, so it begins as far left as
   * its characters reach, and a name wider than the room that leaves is narrowed to fit rather than
   * running under it.
   * @param {number} nameX The x coordinate the name starts at.
   * @param {number} valueX The x coordinate of the value's box.
   * @param {number} valueWidth The width of the value's box.
   * @param {string} displayValue The value exactly as it will be drawn.
   * @returns {number}
   */
  parameterNameRoom(nameX, valueX, valueWidth, displayValue)
  {
    // where the value's first character lands, given it is drawn one digit's width per character.
    const valueStartX = valueX + valueWidth - (displayValue.length * this.textWidth('0'));

    // the name keeps a small gap before it.
    return valueStartX - nameX - 8;
  }

  /**
   * Draws an enemy's parameter value.
   * @param {number} x The x coordinate of the point.
   * @param {number} y The y coordinate of the point.
   * @param {string} value The stringified parameter value, possibly masked.
   * @param {number} width The width to work with.
   * @param {number=} valueColorIndex Palette index for significant digits; defaults to 0.
   */
  drawEnemyParameterValue(x, y, value, width, valueColorIndex = 0)
  {
    // delegate to J-Base for styled zero padding (grey zeros + bold significant digits).
    this.drawStyledPaddedValue(x, y, value, width, 8, valueColorIndex);
  }

  /**
   * Draws the list of an enemy's potential loot drops.
   * @param {number} x The x coordinate of the point.
   * @param {number} y The y coordinate of the point.
   */
  drawEnemyDrops(x, y)
  {
    // shorthand the lineHeight.
    const lh = this.lineHeight() - 10;

    // draw the core rewards, like experience/gold/sdp earned.
    this.drawBasicRewards(x, y);

    // draw the sdp drop data.
    const sdpYPlus = lh * 4;
    this.drawSdpDrop(x, sdpYPlus);

    // draw the standard drops information.
    const dropsYPlus = lh * 6;
    this.drawStandardDrops(x, dropsYPlus);
  }

  /**
   * Draws the basic rewards such as exp/gold/sdp.
   * @param {number} x The x coordinate of the point.
   * @param {number} y The y coordinate of the point.
   */
  drawBasicRewards(x, y)
  {
    // clear residual font modifications.
    this.resetFontSettings();

    // reduce the font size just a hair.
    this.modFontSize(0);

    // shorthand the lineHeight.
    const lh = this.lineHeight() - 10;

    // we'll need the entire observations object for drops.
    const observations = this.getObservations();

    // grab the id out of the current observations.
    const {
      id,
      knowsParameters
    } = observations;

    // grab a reference to the enemy for database analysis.
    const gameEnemy = $gameEnemies.enemy(id);

    // every value in the drops column lines up at its right edge.
    const spacePlus = this.dropsColumnSpacePlus();

    // draw the experience data.
    const expIcon = IconManager.rewardParam(0);
    const expName = TextManager.rewardParam(0);
    const expValue = gameEnemy.exp();
    this.drawEnemyParameter(x, y, expIcon, expName, expValue, !knowsParameters, 0, spacePlus);

    // draw the gold data.
    const goldIcon = IconManager.rewardParam(1);
    const goldName = TextManager.rewardParam(1);
    const goldValue = gameEnemy.gold();
    const goldYPlus = lh * 1;
    this.drawEnemyParameter(x, y + goldYPlus, goldIcon, goldName, goldValue, !knowsParameters, 0, spacePlus);

    // draw the SDP data.
    const sdpIcon = IconManager.rewardParam(4);
    const sdpName = TextManager.sdpPoints();
    const sdpValue = gameEnemy.sdpPoints();
    const sdpYPlus = lh * 2;
    this.drawEnemyParameter(x, y + sdpYPlus, sdpIcon, sdpName, sdpValue, !knowsParameters, 0, spacePlus);
  }

  /**
   * Draws the sdp drop.
   * @param {number} x The x coordinate of the point.
   * @param {number} y The y coordinate of the point.
   */
  drawSdpDrop(x, y)
  {
    // clear residual font modifications.
    this.resetFontSettings();

    // reduce the font size just a hair.
    this.modFontSize(-6);

    // we'll need the entire observations object for drops.
    const observations = this.getObservations();

    // grab the id out of the current observations.
    const {
      id,
      knowsParameters
    } = observations;

    // grab a reference to the enemy for database analysis.
    const gameEnemy = $gameEnemies.enemy(id);

    // grab the list of possible drops this foe has.
    const sdpDropData = gameEnemy.getSdpDropData();

    if (sdpDropData === null || sdpDropData.at(0) === String.empty)
    {
      // draw the blurb about no SDP drop.
      const noSdpDropsText = `No SDP to unlock.`;
      const noSdpDropsTextWidth = this.textWidth(noSdpDropsText);
      this.drawText(noSdpDropsText, x, y, noSdpDropsTextWidth);

      // stop processing.
      return;
    }

    // extract the data from the sdp drop.
    const [ sdpKey, sdpDropChance ] = sdpDropData;

    // grab the corresponding panel with this key.
    const panel = J.SDP.Metadata.panelsMap.get(sdpKey);

    // if there is no panel, then don't try to render it.
    if (!panel) return;

    // translate the drop chance to a percent.
    let dropText = `${sdpDropChance}%`;

    // check if the panel is also already unlocked.
    if (panel.isUnlocked())
    {
      // flip the text to a checkbox to indicate no need to seek it out.
      dropText = `✅`;
    }

    // mask the name if applicable.
    const panelName = knowsParameters
      ? panel.name
      : J.BASE.Helpers.maskString(panel.name);

    // render the parameter, its value lined up with the rest of the drops column.
    const spacePlus = this.dropsColumnSpacePlus();
    this.drawEnemyParameter(x, y, panel.iconIndex, panelName, dropText, false, 0, spacePlus);
  }

  /**
   * Draws the standard list of all loot that this enemy can drop, one line per item.<br/>
   * An item rolled several times shows once, with the best chance among its rolls and how many times it
   * can drop; {@link MonsterpediaDropSummary} does the folding.
   * @param {number} x The x coordinate of the point.
   * @param {number} y The y coordinate of the point.
   */
  drawStandardDrops(x, y)
  {
    // clear residual font modifications.
    this.resetFontSettings();

    // shorthand the lineHeight.
    const lh = this.lineHeight() - 10;

    // reduce the font size just a hair.
    this.modFontSize(-6);

    // we'll need the entire observations object for drops.
    const observations = this.getObservations();

    // grab the id out of the current observations.
    const {
      id,
      numberDefeated
    } = observations;

    // grab a reference to the enemy for database analysis.
    const gameEnemy = $gameEnemies.enemy(id);

    // grab the list of possible drops this foe has.
    const drops = gameEnemy.getDropItems();

    // if we have no drops, do not render them.
    if (!drops.length)
    {
      // render a "no drops" text blob.
      const noDropsText = `No standard drops to acquire.`;
      const noDropsTextWidth = this.textWidth(noDropsText);
      this.drawText(noDropsText, x, y, noDropsTextWidth);

      // stop processing.
      return;
    }

    // healing drops like berries are skipped, and every item rolled more than once folds into one line.
    const shownDrops = drops.filter(drop => this.isSkippableDrop(drop) === false);
    const dropLines = MonsterpediaDropSummary.summarize(shownDrops);

    // every value in the drops column lines up at its right edge, giving the names the column's width.
    const spacePlus = this.dropsColumnSpacePlus();

    // an iterator function for drawing each item's line.
    const forEacher = (dropLine, index) =>
    {
      // the item this line is for, its best chance, and how many times it can drop.
      const {
        drop,
        bestChance,
        rolls
      } = dropLine;

      // grab the implementation.
      const implementation = drop.toImplementation();

      // extract the data out of the drop with more accurate naming.
      const {
        dataId: dropId,
        kind: dropType
      } = drop;

      // determine if we know this drop.
      const isDropKnown = observations.isDropKnown(dropType, dropId) || numberDefeated > 100;

      // the icon is determined by whether or not we know of this drop.
      const dropIcon = isDropKnown
        ? implementation.iconIndex
        : 93; // the question mark icon.

      // the name is masked if we haven't observed this drop.
      const dropName = isDropKnown
        ? implementation.name
        : J.BASE.Helpers.maskString(implementation.name);

      // draw the item's line.
      const dropYPlus = index * lh;
      const dropText = MonsterpediaDropSummary.lineText(bestChance, rolls);
      this.drawEnemyParameter(x, y + dropYPlus, dropIcon, dropName, dropText, false, 4, spacePlus);
    };

    // draw every item's line.
    dropLines.forEach(forEacher, this);
  }

  /**
   * Determines whether or not the drop should be drawn in the monsterpedia.
   * @param {RPG_DropItem} drop The drop to inspect.
   * @returns {boolean} True if this drop should be skipped, false otherwise.
   */
  isSkippableDrop(drop)
  {
    // SDP drops don't show up in this list.
    if (drop.isSdpDrop()) return true;

    // skippable items don't show up in this list.
    if (drop.kind === RPG_DropItem.Types.Item)
    {
      return this.skippableItemIds()
        .includes(drop.dataId);
    }

    // skippable weapons don't show up in this list.
    if (drop.kind === RPG_DropItem.Types.Weapon)
    {
      return this.skippableWeaponIds()
        .includes(drop.dataId);
    }

    // skippable armors don't show up in this list.
    if (drop.kind === RPG_DropItem.Types.Armor)
    {
      return this.skippableArmorIds()
        .includes(drop.dataId);
    }

    return true;
  }

  /**
   * A list of item ids that shouldn't be drawn in the list of loot.
   * @returns {number[]}
   */
  skippableItemIds()
  {
    return [ 2, 3, 4, 8, 9 ];
  }

  /**
   * A list of weapon ids that shouldn't be drawn in the list of loot.
   * @returns {number[]}
   */
  skippableWeaponIds()
  {
    return [];
  }

  /**
   * A list of armor ids that shouldn't be drawn in the list of loot.
   * @returns {number[]}
   */
  skippableArmorIds()
  {
    return [];
  }

  /**
   * Draws the description text of an enemy.
   * @param {number} x The x coordinate of the point.
   * @param {number} y The y coordinate of the point.
   */
  drawDescription(x, y)
  {
    // clear residual font modifications.
    this.resetFontSettings();

    // shorthand the lineHeight.
    const lh = this.lineHeight() - 10;

    // we'll need the entire observations object for drops.
    const observations = this.getObservations();

    // grab the id out of the current observations.
    const {
      id,
      knowsDescription
    } = observations;

    // grab a reference to the enemy for database analysis.
    const { monsterpediaDescription } = $dataEnemies.at(id);

    // reduce the font size for the description text.
    this.modFontSize(-4);

    // check to make sure we have a description.
    if (!monsterpediaDescription.length)
    {
      // render the missing description text if there is no description.
      const missingDescriptionText = 'There is no description for this enemy.';
      const missingDescriptionTextWidth = this.textWidth(missingDescriptionText);
      this.drawText(missingDescriptionText, x, y, missingDescriptionTextWidth);

      // stop processing.
      return;
    }

    // iterate over each of the description lines and draw them.
    monsterpediaDescription.forEach((line, index) =>
    {
      const lineText = knowsDescription
        ? line
        : J.BASE.Helpers.maskString(line);
      const lineY = y + (lh * index);
      const lineWidth = this.textWidth(lineText);
      this.drawText(lineText, x, lineY, lineWidth);
    });
  }

  /**
   * Draws damage-type elementalistics plus prefixed taxonomy rows (`vs ` / `x ` / `tool-`), as a block of
   * two columns beneath the portrait: the damage types on the left, and family/traits/tools reading
   * downward beside them from the same top row.<br/>
   * Taxonomy rows only appear when the effective rate differs from 100% (same signal as the Aptitude typed extension).
   */
  drawElementalistics()
  {
    // clear residual font modifications.
    this.resetFontSettings();

    // shorthand the lineHeight (kept consistent with drawDescription spacing).
    const lh = this.lineHeight() - 10;

    // we'll need the entire observations object for every row.
    const observations = this.getObservations();

    // reduce the font size for the block.
    this.modFontSize(-4);

    // the block's top-left corner, beneath the portrait.
    const blockX = this.elementalisticsX();
    const blockY = this.elementalisticsTop();

    // the damage types fill the left column, and the taxonomy reads downward beside them.
    const damageColumnX = blockX;
    const taxonomyColumnX = blockX + this.elementalisticsColumnPitch();

    // draw the family, traits and tools that differ from neutral.
    const taxonomy = this.elementalisticsTaxonomy();
    this.drawMonsterpediaTaxonomySections(taxonomyColumnX, blockY, lh, 0, observations, taxonomy);

    // draw every damage type, one to a row.
    const damageElementIds = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
    damageElementIds.forEach((elementId, row) =>
    {
      this.drawMonsterpediaDamageElementRow(damageColumnX, blockY, lh, row, observations, elementId);
    });
  }

  /**
   * The highlighted enemy's family, traits and tools, keeping only the rows that differ from neutral.
   * @returns {{ vs: object[], x: object[], tool: object[] }}
   */
  elementalisticsTaxonomy()
  {
    // grab the id out of the current observations.
    const { id } = this.getObservations();

    // grab a reference to the enemy for database analysis.
    const gameEnemy = $gameEnemies.enemy(id);

    // sort its elements into family, traits and tools.
    return this.collectMonsterpediaTaxonomyRows(gameEnemy);
  }

  /**
   * Where the elementalistics block begins, measured from the top of this window's contents.<br/>
   * The block ends a line above the description and climbs from there, so its top moves with how many
   * rows it holds: the ten damage types, or more when the taxonomy beside them runs longer. The
   * portrait's space ends where the block begins, so the two never overlap.
   * @returns {number}
   */
  elementalisticsTop()
  {
    // shorthand the lineHeight (kept consistent with drawDescription spacing).
    const lh = this.lineHeight() - 10;

    // the block is as tall as its taller column: the ten damage types, or the taxonomy beside them.
    const damageTypeCount = 10;
    const taxonomy = this.elementalisticsTaxonomy();
    const rowCount = Math.max(damageTypeCount, this.countMonsterpediaTaxonomyDrawLines(taxonomy));

    // the block ends a line above the description, and climbs a line for every row it holds.
    const top = this.descriptionY() - lh - (lh * rowCount);

    // a block too tall for the window stops short of the header rather than running into it.
    return Math.max(top, 48);
  }

  /**
   * Where the elementalistics block begins, measured from the left of this window's contents: centered
   * beneath the portrait, in the same space the portrait stands in.
   * @returns {number}
   */
  elementalisticsX()
  {
    // the space beneath the portrait spans the same width the portrait's does.
    const spaceWidth = this.dropsColumnX() - this.enemySpriteGutter();

    // the block is two columns wide.
    const blockWidth = this.elementalisticsColumnPitch() * 2;

    // center the block in that space.
    return Math.floor((spaceWidth - blockWidth) / 2);
  }

  /**
   * How far apart the elementalistics block's two columns begin: enough for a row's icon, name and
   * value, plus a little room before the next column.
   * @returns {number}
   */
  elementalisticsColumnPitch()
  {
    return 280;
  }

  /**
   * Collects non-neutral prefixed element rows for monsterpedia display.
   * @param {Game_Enemy} gameEnemy The enemy instance to inspect.
   * @returns {{
   *   vs: {elementId: number, label: string, rate: number}[],
   *   x: {elementId: number, label: string, rate: number}[],
   *   tool: {elementId: number, label: string, rate: number}[]
   * }}
   */
  collectMonsterpediaTaxonomyRows(gameEnemy)
  {
    const names = $dataSystem.elements;
    const vs = [];
    const xList = [];
    const tool = [];

    for (let elementId = 1; elementId < names.length; elementId++)
    {
      const rawName = names[elementId];
      if (!rawName) continue;

      const trimmed = String(rawName).trim();
      const low = trimmed.toLowerCase();

      let bucket = null;
      if (low.startsWith('vs '))
      {
        bucket = vs;
      }
      else if (low.startsWith('x '))
      {
        bucket = xList;
      }
      else if (low.startsWith('tool-'))
      {
        bucket = tool;
      }

      if (bucket === null) continue;

      const rate = Math.round(gameEnemy.elementRate(elementId) * 100);
      if (rate === 100) continue;

      let label = trimmed;
      if (low.startsWith('vs '))
      {
        label = trimmed.slice(3).trim();
      }
      else if (low.startsWith('x '))
      {
        label = trimmed.slice(2).trim();
      }
      else if (low.startsWith('tool-'))
      {
        label = trimmed.slice('tool-'.length).trim();
      }

      // Append the row to the working collection.
      bucket.push({ elementId, label, rate });
    }

    const byElementId = (a, b) => a.elementId - b.elementId;
    vs.sort(byElementId);
    xList.sort(byElementId);
    tool.sort(byElementId);

    return { vs, x: xList, tool };
  }

  /**
   * Counts drawable lines for taxonomy sections, including one header line per non-empty bucket.
   * @param {{ vs: object[], x: object[], tool: object[] }} taxonomy The grouped taxonomy rows.
   * @returns {number}
   */
  countMonsterpediaTaxonomyDrawLines(taxonomy)
  {
    let lines = 0;

    if (taxonomy.vs.length > 0)
    {
      lines += 1 + taxonomy.vs.length;
    }

    if (taxonomy.x.length > 0)
    {
      lines += 1 + taxonomy.x.length;
    }

    if (taxonomy.tool.length > 0)
    {
      lines += 1 + taxonomy.tool.length;
    }

    return lines;
  }

  /**
   * Draws taxonomy headers and rows, advancing the shared row cursor.
   * @param {number} x The x coordinate of the column.
   * @param {number} y The top y of the whole elementalistics block.
   * @param {number} lh The line height to use.
   * @param {number} row The starting row index within the block.
   * @param {MonsterpediaObservations} observations The active observations.
   * @param {{ vs: object[], x: object[], tool: object[] }} taxonomy The grouped taxonomy rows.
   * @returns {number} The next row index after drawing taxonomy content.
   */
  drawMonsterpediaTaxonomySections(x, y, lh, row, observations, taxonomy)
  {
    let r = row;

    // continue the routine with the next policy step.
    r = this.drawMonsterpediaTaxonomyBucket(
      x, y, lh, r, observations, taxonomy.vs, 'Family');

    // continue the routine with the next policy step.
    r = this.drawMonsterpediaTaxonomyBucket(
      x, y, lh, r, observations, taxonomy.x, 'Traits');

    // continue the routine with the next policy step.
    r = this.drawMonsterpediaTaxonomyBucket(
      x, y, lh, r, observations, taxonomy.tool, 'Tools');

    return r;
  }

  /**
   * Draws one taxonomy bucket (header + rows) when it has content.
   * @param {number} x The x coordinate of the column.
   * @param {number} y The top y of the whole elementalistics block.
   * @param {number} lh The line height to use.
   * @param {number} row The starting row index within the block.
   * @param {MonsterpediaObservations} observations The active observations.
   * @param {{ elementId: number, label: string, rate: number }[]} rows The rows to render.
   * @param {string} headerText The section title.
   * @returns {number} The next row index after this bucket.
   */
  drawMonsterpediaTaxonomyBucket(x, y, lh, row, observations, rows, headerText)
  {
    if (rows.length === 0) return row;

    let cursor = row;

    // section headers stay subtle so the data rows remain the hero.
    this.resetFontSettings();
    this.modFontSize(-8);
    this.toggleItalics(true);
    const headerWidth = this.textWidth(headerText);
    this.drawText(headerText, x, y + lh * cursor, headerWidth, Window_Base.TextAlignments.Left);
    this.toggleItalics(false);
    cursor += 1;

    // continue the routine with the next policy step.
    rows.forEach(entry =>
    {
      const { elementId, label, rate } = entry;
      this.drawMonsterpediaTaxonomyElementRow(x, y, lh, cursor, observations, elementId, label, rate);
      cursor += 1;
    });

    return cursor;
  }

  /**
   * Draws a single taxonomy row with icon, shortened label, and resist text.
   * @param {number} x The x coordinate of the column.
   * @param {number} y The top y of the whole elementalistics block.
   * @param {number} lh The line height to use.
   * @param {number} row The row index within the block.
   * @param {MonsterpediaObservations} observations The active observations.
   * @param {number} elementId The database element id.
   * @param {string} label The display label (prefix stripped).
   * @param {number} rate The rounded percent rate.
   */
  drawMonsterpediaTaxonomyElementRow(x, y, lh, row, observations, elementId, label, rate)
  {
    this.resetFontSettings();
    this.modFontSize(-4);

    const elementIcon = IconManager.element(elementId);
    const gameEnemy = $gameEnemies.enemy(observations.id);
    const absorbed = J.ELEM && gameEnemy.isElementAbsorbed(elementId);
    const affiliationFlags = {
      absorbed,
      immune: absorbed === false && rate <= 0,
    // continue the routine with the next policy step.
    };
    const { knowsParameters } = observations;
    const resolved = AffiliationDisplay.resolveDisplay(rate, affiliationFlags);
    let displayRate = resolved.value;
    let valueColorIndex = resolved.colorIndex;

    if (knowsParameters === false)
    {
      displayRate = J.BASE.Helpers.maskString(AffiliationDisplay.maskTemplate);
      valueColorIndex = 0;
    }

    // continue the routine with the next policy step.
    this.drawEnemyParameter(
      x,
      y + lh * row,
      elementIcon,
      label,
      displayRate,
      false,
      4,
      0,
      valueColorIndex);

    // continue the routine with the next policy step.
    this.changeTextColor(ColorManager.normalColor());
  }

  /**
   * Draws one standard damage-type row (observed via combat hits).
   * @param {number} x The x coordinate of the column.
   * @param {number} y The top y of the whole elementalistics block.
   * @param {number} lh The line height to use.
   * @param {number} row The row index within the block.
   * @param {MonsterpediaObservations} observations The active observations.
   * @param {number} elementId The database element id.
   */
  drawMonsterpediaDamageElementRow(x, y, lh, row, observations, elementId)
  {
    this.resetFontSettings();
    this.modFontSize(-4);

    // continue the routine with the next policy step.
    this.changeTextColor(ColorManager.normalColor());

    const gameEnemy = $gameEnemies.enemy(observations.id);
    const elementIcon = IconManager.element(elementId);
    const elementName = TextManager.element(elementId);
    const magnitudePercent = Math.round(Math.abs(gameEnemy.elementRate(elementId)) * 100);
    const absorbed = J.ELEM && gameEnemy.isElementAbsorbed(elementId);
    const affiliationFlags = {
      // continue the routine with the next policy step.
      absorbed,
      immune: absorbed === false && magnitudePercent <= 0,
    };
    const knowsElementalistic = observations.isElementalisticKnown(elementId);
    const resolved = AffiliationDisplay.resolveDisplay(magnitudePercent, affiliationFlags);
    let displayRate = resolved.value;
    let valueColorIndex = resolved.colorIndex;

    if (knowsElementalistic === false)
    {
      displayRate = J.BASE.Helpers.maskString(AffiliationDisplay.maskTemplate);
      valueColorIndex = 0;
    }

    // continue the routine with the next policy step.
    this.drawEnemyParameter(
      x,
      y + lh * row,
      elementIcon,
      elementName,
      displayRate,
      false,
      4,
      0,
      valueColorIndex);

    // continue the routine with the next policy step.
    this.changeTextColor(ColorManager.normalColor());
  }

  /*
  TODO:
  sections include
  - ailmentalistics
   */
}

export default Window_MonsterpediaDetail;