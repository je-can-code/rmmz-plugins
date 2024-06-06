//region JABS_Battler
//region getters/setters
J.ABS.EXT.POSES.Aliased.JABS_Battler.set('initialize', JABS_Battler.prototype.initialize);
/**
 * Extends {@link #initialize}.<br>
 * Also intializes the pose information.
 * @param {Game_Event} event The event the battler is bound to.
 * @param {Game_Actor|Game_Enemy} battler The battler data itself.
 * @param {JABS_BattlerCoreData} battlerCoreData The core data for the battler.
 */
JABS_Battler.prototype.initialize = function(event, battler, battlerCoreData)
{
  // perform original logic.
  J.ABS.EXT.POSES.Aliased.JABS_Battler.get('initialize')
    .call(this, event, battler, battlerCoreData);

  // also initialize the action poses.
  this.initPoseInfo();
};

/**
 * Initializes the properties of this battler that are related to the character posing.
 */
JABS_Battler.prototype.initPoseInfo = function()
{
  /**
   * The number of frames to pose for.
   * @type {number}
   */
  this._poseFrames = 0;

  /**
   * Whether or not this battler is currently posing.
   * @type {boolean}
   */
  this._posing = false;

  /**
   * The name of the file that contains this battler's character sprite (without extension).
   * @type {string}
   */
  this._baseSpriteImage = String.empty;

  /**
   * The index of this battler's character sprite in the `_baseSpriteImage`.
   * @type {number}
   */
  this._baseSpriteIndex = 0;

  // capture the default/base/original information of this battler upon initialization.
  this.captureBaseSpriteInfo();
};

/**
 * Gets the current number of remaining frames left to be posing.
 */
JABS_Battler.prototype.getPoseFrames = function()
{
  return this._poseFrames;
};

/**
 * Checks whether or not this battler has active pose frames remaining.
 * @returns {boolean}
 */
JABS_Battler.prototype.hasPoseFrames = function()
{
  return this._poseFrames > 0;
};

/**
 * Sets the current number of posing frames to the given amount.<br>
 * Also returns this amount.
 * @param {number} poseFrames The number of frames to pose for.
 */
JABS_Battler.prototype.setPoseFrames = function(poseFrames)
{
  this._poseFrames = poseFrames;
  return this._poseFrames;
};

/**
 * Adds the given amount of frames to the current number of pose frames.<br>
 * Use negative numbers to reduce the frame count by a given amount.
 * @param {number} modPoseFrames The number of frames to modify this amount by.
 */
JABS_Battler.prototype.modPoseFrames = function(modPoseFrames)
{
  this._poseFrames += modPoseFrames;
  return this._poseFrames;
};

/**
 * Gets the original character sprite's image name.
 */
JABS_Battler.prototype.getBaseSpriteImage = function()
{
  return this._baseSpriteImage;
};

/**
 * Sets the name of this battler's original character sprite.
 * @param {string} name The name to set.
 */
JABS_Battler.prototype.setBaseSpriteImage = function(name)
{
  this._baseSpriteImage = name;
};

/**
 * Gets this battler's original character sprite index.
 */
JABS_Battler.prototype.getBaseSpriteIndex = function()
{
  return this._baseSpriteIndex;
};

/**
 * Sets the index of this battler's original character sprite.
 * @param {number} index The index to set.
 */
JABS_Battler.prototype.setBaseSpriteIndex = function(index)
{
  this._baseSpriteIndex = index;
};

/**
 * Gets whether or not this battler is currently posing.
 * @returns {boolean}
 */
JABS_Battler.prototype.isPosing = function()
{
  return this._posing;
};

/**
 * Flags the battler to start posing.
 */
JABS_Battler.prototype.startPosing = function()
{
  this._posing = true;
};

/**
 * Ends the battler's posing status.
 */
JABS_Battler.prototype.endPosing = function()
{
  this._posing = false;
};

/**
 * Initializes the sprite info for this battler.
 */
JABS_Battler.prototype.captureBaseSpriteInfo = function()
{
  this.setBaseSpriteImage(this.getCharacterSpriteName());
  this.setBaseSpriteIndex(this.getCharacterSpriteIndex());
};

/**
 * Gets the name of this battler's current character sprite.
 * @returns {string}
 */
JABS_Battler.prototype.getCharacterSpriteName = function()
{
  return this.getCharacter()._characterName;
};

/**
 * Gets the index of this battler's current character sprite.
 * @returns {number}
 */
JABS_Battler.prototype.getCharacterSpriteIndex = function()
{
  return this.getCharacter()._characterIndex;
};

/**
 * Sets this battler's underlying character's pose pattern.
 * @param {number} pattern The pattern to set for this character.
 */
JABS_Battler.prototype.setPosePattern = function(pattern)
{
  this.getCharacter()._pattern = pattern;
};
//endregion getters/setters

//region execution
/**
 * Executes an action pose.
 * Will silently fail if the asset is missing.
 * @param {RPG_Skill} skill The skill to pose for.
 */
JABS_Battler.prototype.performActionPose = function(skill)
{
  // if we are still animating from a previous skill, prematurely end it.
  if (this._posing)
  {
    this.endAnimation();
  }

  // if we have a pose suffix for this skill, then try to perform the pose.
  if (skill.jabsPoseData)
  {
    this.tryStartPose(skill);
  }
};

/**
 * Executes the change of character sprite based on the action pose data
 * from within a skill's notes.
 * @param {RPG_Skill} skill The skill to pose for.
 */
JABS_Battler.prototype.tryStartPose = function(skill)
{
  // establish the base sprite data.
  const baseSpriteName = this.getCharacterSpriteName();
  this.captureBaseSpriteInfo();

  // define the duration for this pose.
  this.setPoseDuration(skill.jabsPoseDuration);

  // determine the new action pose sprite name.
  const newCharacterSprite = `${baseSpriteName}${skill.jabsPoseSuffix}`;

  // stitch the file path together with the sprite url.
  const spritePath = `img/characters/${Utils.encodeURI(newCharacterSprite)}.png`;

  // check if the sprite exists.
  const spriteExists = StorageManager.fileExists(spritePath);

  // only actually switch to the other character sprite if it exists.
  if (spriteExists)
  {
    // load the character into cache.
    ImageManager.loadCharacter(newCharacterSprite);

    // actually set the character.
    this.getCharacter()
      .setImage(newCharacterSprite, skill.jabsPoseIndex);
  }
  else
  {
    console.warn('Skill executed that declared pose data, but no matching sprite was found.');
    console.warn(`Skill of id [ ${skill.id} ]; consider cross-checking the database with your assets.`);
    console.warn('Parsed JABS pose data:');
    console.warn(skill.jabsPoseData);
  }
};

/**
 * Forcefully ends the pose animation.
 */
JABS_Battler.prototype.endAnimation = function()
{
  // immediately end the animation counter.
  this.setPoseDuration(0);

  // force-reset the pose back to the original one.
  this.resetPose();
};

/**
 * Sets the pose animation count to a given amount.
 * @param {number} frames The number of frames to animate for.
 */
JABS_Battler.prototype.setPoseDuration = function(frames)
{
  // sets the frames to a new amount.
  this.setPoseFrames(frames);

  // updates the posing state by the potentially new state.
  this.normalizePosing();
};

/**
 * Handles the state of posing for this battler based on the current pose frames.
 */
JABS_Battler.prototype.normalizePosing = function()
{
  // validate our animation count is above zero- just in case and start posing.
  if (this.getPoseFrames() > 0)
  {
    this.startPosing();
  }
  // if the animation count not above zero, then stop posing and cleanse the count.
  else
  {
    this.endPosing();
    this.setPoseFrames(0);
  }
};

/**
 * Resets the pose animation for this battler.
 */
JABS_Battler.prototype.resetPose = function()
{
  // don't reset the animation if there is nothing to reset to.
  if (!this.getBaseSpriteImage() && !this.getBaseSpriteIndex()) return;

  // check if we are currently posing.
  if (this.isPosing())
  {
    // stop that.
    this.endAnimation();
  }

  // use variable names to better describe the validation we're about to perform.
  const originalImage = this.getBaseSpriteImage();
  const originalIndex = this.getBaseSpriteIndex();
  const currentImage = this.getCharacterSpriteName();
  const currentIndex = this.getCharacterSpriteIndex();
  const character = this.getCharacter();

  // check if the character image and index are the same as the original.
  if (originalImage !== currentImage || originalIndex !== currentIndex)
  {
    // we are done posing- time to set the image back to the original.
    character.setImage(originalImage, originalIndex);
  }
};
//endregion execution

//region updates
J.ABS.EXT.POSES.Aliased.JABS_Battler.set('update', JABS_Battler.prototype.update);
/**
 * Things that are battler-respective and should be updated on their own.
 */
JABS_Battler.prototype.update = function()
{
  // perform original logic.
  J.ABS.EXT.POSES.Aliased.JABS_Battler.get('update')
    .call(this);

  // also update the pose effects.
  this.updatePoses();
};

/**
 * Update all character sprite animations executing on this battler.
 */
JABS_Battler.prototype.updatePoses = function()
{
  // if we cannot update pose effects, then do not.
  if (!this.canUpdatePoses()) return;

  // countdown the timer for posing.
  this.countdownPoseTimer();

  // manage the actual adjustments to the character's pose pattern.
  this.handlePosePattern();
};

/**
 * Determines whether or not this battler can update its own pose effects.
 * @returns {boolean}
 */
JABS_Battler.prototype.canUpdatePoses = function()
{
  // don't do JABS things if JABS isn't enabled.
  if (!$jabsEngine.absEnabled) return false;

  // we need to be currently animating in order to update animations.
  if (!this.isPosing()) return false;

  // update animations!
  return true;
};

/**
 * Counts down the pose animation frames and manages the pose pattern.
 */
JABS_Battler.prototype.countdownPoseTimer = function()
{
  // if guarding, then do not countdown the pose frames.
  if (this.guarding()) return;

  // check if we are still posing.
  if (this.hasPoseFrames())
  {
    // decrement the pose frames.
    this.modPoseFrames(-1);
  }
};

/**
 * Manages whether or not this battler is posing based on pose frames.
 */
JABS_Battler.prototype.handlePosePattern = function()
{
  // check if we are still posing.
  if (this.hasPoseFrames())
  {
    // manage the current pose pattern based on the animation frame count.
    this.managePosePattern();
  }
  // we are done posing now.
  else
  {
    // reset the pose back to default.
    this.resetPose();
  }
};

/**
 * Watches the current pose frames and adjusts the pose pattern accordingly.
 */
JABS_Battler.prototype.managePosePattern = function()
{

  // TODO: this should be probably optimized in some way?
  // TODO: direction should be dynamically determined based on current facing.


  // if the battler has 4 or less frames left.
  if (this.getPoseFrames() < 4)
  {
    // set the pose pattern to 0, the left side.
    this.setPosePattern(0);
  }
  // check ii the battler has more than 10 frames left.
  else if (this.getPoseFrames() > 10)
  {
    // set the pose pattern to 2, the right side.
    this.setPosePattern(2);
  }
  // the battler is between 5-9 pose frames.
  else
  {
    // set the pose pattern to 1, the middle.
    this.setPosePattern(1);
  }
};
//endregion updates

//region action poses
J.ABS.EXT.POSES.Aliased.JABS_Battler.set('startGuarding', JABS_Battler.prototype.startGuarding);
/**
 * Extends {@link #startGuarding}.
 * Executes an action pose when guarding.
 * @param {string} skillSlot The skill slot containing the guard data.
 */
JABS_Battler.prototype.startGuarding = function(skillSlot)
{
  // perform original logic.
  J.ABS.EXT.POSES.Aliased.JABS_Battler.get('startGuarding')
    .call(this, skillSlot);

  // set the pose!
  const skillId = this.getBattler()
    .getEquippedSkillId(skillSlot);
  const skill = this.getSkill(skillId);
  this.performActionPose(skill);
};

J.ABS.EXT.POSES.Aliased.JABS_Battler.set('executeDodgeSkill', JABS_Battler.prototype.executeDodgeSkill);
/**
 * Executes the provided dodge skill.
 * @param {RPG_Skill} skill The RPG item representing the dodge skill.
 */
JABS_Battler.prototype.executeDodgeSkill = function(skill)
{
  // perform original logic.
  J.ABS.EXT.POSES.Aliased.JABS_Battler.get('executeDodgeSkill')
    .call(this, skill);

  // change over to the action pose for the skill.
  this.performActionPose(skill);

  // TODO: should the function go before or after initial logic?
};
//endregion action poses
//endregion JABS_Battler