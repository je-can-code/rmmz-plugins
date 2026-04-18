//region Sprite_Character
/**
 * Gets this battler's name.
 * If there is no battler, this will return an empty string.
 * @returns {string}
 */
J.LEVEL.Aliased.Sprite_Character.set('getBattlerName', Sprite_Character.prototype.getBattlerName);
Sprite_Character.prototype.getBattlerName = function()
{
  // get the original name of the sprite.
  const originalName = J.LEVEL.Aliased.Sprite_Character.get('getBattlerName')
    .call(this);

  // if there was no battler name, then there probably isn't a battler.
  if (originalName === String.empty) return originalName;

  // grab the battler- we know it should exist by now.
  const battler = this.getBattler();

  // non-enemies don't get levels in their names.
  if (battler.isEnemy() === false) return originalName;

  // get the battler's level.
  const level = battler.level;

  // a zero level indicates there is no level logic associated with this battler.
  if (level === 0) return originalName;

  // capture the level as a string type for type-correct potential overriding.
  let levelString = `${level.padZero(3)}`;

  // check if this character is an event and if the level should be hidden
  if (this._character && this._character.isEvent() && this._character.shouldHideLevel())
  {
    levelString = "???";
  }

  // if the level is not already hidden by event comments, check the enemy notes
  if (levelString !== "???" && battler.shouldHideLevel())
  {
    levelString = "???";
  }

  // return the name with level.
  return `${levelString} ${originalName}`;
};
//endregion Sprite_Character