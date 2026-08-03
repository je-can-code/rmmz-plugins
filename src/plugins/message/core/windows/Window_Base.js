//region Window_Base
//region more database text codes
/**
 * Extends {@link #convertEscapeCharacters}.<br/>
 * Adds handling for new text codes for various database objects.
 */
J.MESSAGE.Aliased.Window_Base.set('convertEscapeCharacters', Window_Base.prototype.convertEscapeCharacters);
Window_Base.prototype.convertEscapeCharacters = function(text)
{
  // capture the text in a local variable for good practices!
  let textToModify = text;

  // handle quest key replacements.
  textToModify = this.translateQuestTextCode(textToModify);

  // handle weapon string replacements.
  textToModify = this.translateWeaponTextCode(textToModify);

  // handle armor string replacements.
  textToModify = this.translateArmorTextCode(textToModify);

  // handle item string replacements.
  textToModify = this.translateItemTextCode(textToModify);

  // handle state string replacements.
  textToModify = this.translateStateTextCode(textToModify);

  // handle skill string replacements.
  textToModify = this.translateSkillTextCode(textToModify);

  // handle enemy string replacements.
  textToModify = this.translateEnemyTextCode(textToModify);

  // handle element string replacements.
  textToModify = this.translateElementTextCode(textToModify);

  // handle equip type string replacements.
  textToModify = this.translateEquipTypeTextCode(textToModify);

  // handle weapon string replacements.
  textToModify = this.translateWeaponTypeTextCode(textToModify);

  // handle armor string replacements.
  textToModify = this.translateArmorTypeTextCode(textToModify);

  // handle skill type string replacements.
  textToModify = this.translateSkillTypeTextCode(textToModify);

  // handle sdp key replacements.
  textToModify = this.translateSdpTextCode(textToModify);

  // handle parameter registry key replacements.
  textToModify = this.translateParamTextCode(textToModify);

  // let the rest of the conversion occur with the newly modified text.
  // perform original logic.
  return J.MESSAGE.Aliased.Window_Base.get('convertEscapeCharacters')
    .call(this, textToModify);
};

/**
 * Translates the text code into the name and icon of the weapon.
 * @param {string} text The text that has a text code in it.
 * @returns {string}
 */
Window_Base.prototype.translateWeaponTextCode = function(text)
{
  return text.replace(/\\weapon\[(\d+)]/gi, (_, p1) =>
  {
    const weaponColor = 4;
    const weapon = $dataWeapons[parseInt(p1)];
    return `\\I[${weapon.iconIndex}]\\C[${weaponColor}]${weapon.name}\\C[0]`;
  });
};

/**
 * Translates the text code into the name and icon of the armor.
 * @param {string} text The text that has a text code in it.
 * @returns {string} The new text to parse.
 */
Window_Base.prototype.translateArmorTextCode = function(text)
{
  return text.replace(/\\armor\[(\d+)]/gi, (_, p1) =>
  {
    const armorColor = 5;
    const armor = $dataArmors[parseInt(p1)];
    return `\\I[${armor.iconIndex}]\\C[${armorColor}]${armor.name}\\C[0]`;
  });
};

/**
 * Translates the text code into the name and icon of the item.
 * @param {string} text The text that has a text code in it.
 * @returns {string} The new text to parse.
 */
Window_Base.prototype.translateItemTextCode = function(text)
{
  return text.replace(/\\item\[(\d+)]/gi, (_, p1) =>
  {
    const itemColor = 3;
    const item = $dataItems[parseInt(p1)];
    return `\\I[${item.iconIndex}]\\C[${itemColor}]${item.name}\\C[0]`;
  });
};

/**
 * Translates the text code into the name and icon of the state.
 * @param {string} text The text that has a text code in it.
 * @returns {string} The new text to parse.
 */
Window_Base.prototype.translateStateTextCode = function(text)
{
  return text.replace(/\\state\[(\d+)]/gi, (_, p1) =>
  {
    const stateColor = 6;
    const stateId = parseInt(p1);
    let name = '(Basic Attack)';
    let iconIndex = 0;
    if (stateId > 0)
    {
      const state = $dataStates[parseInt(p1)];
      // eslint-disable-next-line prefer-destructuring
      name = state.name;
      // eslint-disable-next-line prefer-destructuring
      iconIndex = state.iconIndex;
    }

    return `\\I[${iconIndex}]\\C[${stateColor}]${name}\\C[0]`;
  });
};

/**
 * Translates the text code into the name and icon of the skill.
 * @param {string} text The text that has a text code in it.
 * @returns {string} The new text to parse.
 */
Window_Base.prototype.translateSkillTextCode = function(text)
{
  return text.replace(/\\skill\[(\d+)]/gi, (_, p1) =>
  {
    const skillColor = 1;
    const skill = $dataSkills[parseInt(p1)];
    return `\\I[${skill.iconIndex}]\\C[${skillColor}]${skill.name}\\C[0]`;
  });
};

/**
 * Translates the text code into the name of the enemy.
 * NOTE: No icon is assigned for enemies.
 * @param {string} text The text that has a text code in it.
 * @returns {string} The new text to parse.
 */
Window_Base.prototype.translateEnemyTextCode = function(text)
{
  return text.replace(/\\enemy\[(\d+)]/gi, (_, p1) =>
  {
    const enemyColor = 2;
    const enemy = $dataEnemies[parseInt(p1)];
    return `\\C[${enemyColor}]${enemy.name}\\C[0]`;
  });
};

/**
 * Translates the text code into the name and icon of the element.
 * @param {string} text The text that has a text code in it.
 * @returns {string} The new text to parse.
 */
Window_Base.prototype.translateElementTextCode = function(text)
{
  return text.replace(/\\element\[(\d+)]/gi, (_, p1) =>
  {
    // parse the element id; default to -1.
    const elementId = parseInt(p1) ?? -1;

    // TODO: make a static "menu item" class out of this?
    // get the replacement data.
    const iconIndex = IconManager.element(elementId);
    const colorId = ColorManager.elementColorIndex(elementId);
    const name = TextManager.element(elementId);

    // return the constructed replacement string.
    return `\\I[${iconIndex}]\\C[${colorId}]${name}\\C[0]`;
  });
};

/**
 * Translates the text code into the name and icon of the skill type.
 * @param {string} text The text that has a text code in it.
 * @returns {string} The new text to parse.
 */
Window_Base.prototype.translateSkillTypeTextCode = function(text)
{
  return text.replace(/\\skillType\[(\d+)]/gi, (_, p1) =>
  {
    // parse the skill type id.
    const skillTypeId = parseInt(p1) ?? -1;

    // TODO: make a static "menu item" class out of this?
    // get the replacement data.
    const iconIndex = IconManager.skillType(skillTypeId);
    const colorId = ColorManager.skillType(skillTypeId);
    const name = TextManager.skillType(skillTypeId);

    // return the constructed replacement string.
    return `\\I[${iconIndex}]\\C[${colorId}]${name}\\C[0]`;
  });
};

/**
 * Translates the text code into the name and icon of the weapon type.
 * @param {string} text The text that has a text code in it.
 * @returns {string} The new text to parse.
 */
Window_Base.prototype.translateWeaponTypeTextCode = function(text)
{
  return text.replace(/\\weaponType\[(\d+)]/gi, (_, p1) =>
  {
    // parse the weapon type id.
    const weaponTypeId = parseInt(p1) ?? -1;

    // TODO: make a static "menu item" class out of this?
    // get the replacement data.
    const iconIndex = IconManager.weaponType(weaponTypeId);
    const colorId = ColorManager.weaponType(weaponTypeId);
    const name = TextManager.weaponType(weaponTypeId);

    // return the constructed replacement string.
    return `\\I[${iconIndex}]\\C[${colorId}]${name}\\C[0]`;
  });
};

/**
 * Translates the text code into the name and icon of the armor type.
 * @param {string} text The text that has a text code in it.
 * @returns {string} The new text to parse.
 */
Window_Base.prototype.translateArmorTypeTextCode = function(text)
{
  return text.replace(/\\armorType\[(\d+)]/gi, (_, p1) =>
  {
    // parse the armor type id.
    const armorTypeId = parseInt(p1) ?? -1;

    // TODO: make a static "menu item" class out of this?
    // get the replacement data.
    const iconIndex = IconManager.armorType(armorTypeId);
    const colorId = ColorManager.armorType(armorTypeId);
    const name = TextManager.armorType(armorTypeId);

    // return the constructed replacement string.
    return `\\I[${iconIndex}]\\C[${colorId}]${name}\\C[0]`;
  });
};

/**
 * Translates the text code into the name and icon of the equip type.
 * @param {string} text The text that has a text code in it.
 * @returns {string} The new text to parse.
 */
Window_Base.prototype.translateEquipTypeTextCode = function(text)
{
  return text.replace(/\\equipType\[(\d+)]/gi, (_, p1) =>
  {
    // parse the equip type id.
    const equipTypeId = parseInt(p1) ?? -1;

    // TODO: make a static "menu item" class out of this?
    // get the replacement data.
    const iconIndex = IconManager.equipType(equipTypeId);
    const colorId = ColorManager.equipType(equipTypeId);
    const name = TextManager.equipType(equipTypeId);

    // return the constructed replacement string.
    return `\\I[${iconIndex}]\\C[${colorId}]${name}\\C[0]`;
  });
};

/**
 * Translates the text code into the name and icon of the corresponding SDP.
 * @param {string} text The text that has a text code in it.
 * @returns {string} The new text to parse.
 */
Window_Base.prototype.translateSdpTextCode = function(text)
{
  // if not using the SDP system, then don't try to process the text.
  if (!J.SDP) return text;

  return text.replace(/\\sdp\[(.*)]/gi, (_, p1) =>
  {
    // determine the sdp key.
    const sdpKey = p1 ?? String.empty;

    // if no key was provided, then do not parse the panel.
    if (!sdpKey) return text;

    // grab the panel by its key.
    const sdp = J.SDP.Metadata.panelsMap.get(sdpKey);

    // if the panel doesn't exist, then do not parse the panel.
    if (!sdp) return text;

    // extract the necessary data from the SDP.
    const {
      name,
      rarity: colorIndex,
      iconIndex
    } = sdp;

    // return the constructed replacement string.
    return `\\I[${iconIndex}]\\C[${colorIndex}]${name}\\C[0]`;
  });
};

/**
 * Translates the text code into the name and icon of the corresponding catalog parameter.<br/>
 * Unlike the other lookups in this file, an unresolvable key is never silently swallowed- an
 * unregistered STRING_KEY is always an authoring mistake (a typo, or a plugin whose registration
 * didn't load), so it renders as an unmistakable red "!!! UNKNOWN PARAM !!!" with a question-mark
 * icon instead of passing through untouched or vanishing quietly.
 * @param {string} text The text that has a text code in it.
 * @returns {string} The new text to parse.
 */
Window_Base.prototype.translateParamTextCode = function(text)
{
  return text.replace(/\\param\[([\w-]+)]/gi, (_, p1) =>
  {
    // determine the parameter registry key.
    const parameterKey = p1 ?? String.empty;

    // an unknown key is always an authoring mistake- make it impossible to miss instead of
    // silently doing nothing or leaving the raw escape code behind. icon 93 is the question mark,
    // and color 18 is the vanilla "death" red- both chosen to be as loud as possible.
    if (!TextManager.hasParameter(parameterKey))
    {
      const unknownIconIndex = 93;
      const unknownColorIndex = 18;
      return `\\I[${unknownIconIndex}]\\C[${unknownColorIndex}]!!! UNKNOWN PARAM !!!\\C[0]`;
    }

    // extract the necessary data from the parameter's catalog entry.
    const name = TextManager.parameterLabel(parameterKey);
    const iconIndex = IconManager.parameterIcon(parameterKey);
    const colorIndex = ColorManager.parameterColor(parameterKey);

    // return the constructed replacement string.
    return `\\I[${iconIndex}]\\C[${colorIndex}]${name}\\C[0]`;
  });
};

/**
 * Translates the quest text code into the quest's name and icon.
 *
 * Core does not know what a quest is- this is a no-op hook that J-Omnipedia's quest extension
 * overrides to supply the real behavior. Core never probes for extensions.
 * @param {string} text The text that may contain a quest text code.
 * @returns {string} The text, unchanged.
 */
Window_Base.prototype.translateQuestTextCode = function(text)
{
  // without the quest extension loaded, there is nothing to translate.
  return text;
};
//endregion more database text codes

// NOTE:
// The bold/italics escape code parsing and helpers (`\\*` and `\\_`) live in J-Base now.
// Keep this plugin focused on database-driven text codes and message flow features.
//endregion Window_Base