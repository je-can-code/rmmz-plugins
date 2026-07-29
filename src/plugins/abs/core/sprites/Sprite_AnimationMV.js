//region Sprite_AnimationMV
/**
 * Extends {@link Sprite_AnimationMV.prototype.updatePosition}.<br/>
 * Adds a guard to ensure we don't attempt to follow destroyed or removed sprites.
 */
J.ABS.Aliased.Sprite_AnimationMV.set('updatePosition', Sprite_AnimationMV.prototype.updatePosition);
Sprite_AnimationMV.prototype.updatePosition = function ()
{
  // if this is a screen animation, use original logic.
  if (this.animation().position === 3)
  {
    // perform original logic.
    J.ABS.Aliased.Sprite_AnimationMV.get('updatePosition')
      .call(this);
    return;
  }

  // filter out destroyed targets or those belonging to JABS actions being removed.
  const validTargets = this.targets().filter(target =>
  {
    // if there is no target, it isn't valid.
    if (!target || target.destroyed) return false;

    // if the target is a JABS action being removed, it isn't valid.
    if (target.character && target.character() && target.character()
      .getJabsActionNeedsRemoving())
    {
      return false;
    }

    // target is valid.
    return true;
  });

  // if the primary target is gone, do nothing.
  if (validTargets.length === 0)
  {
    return;
  }

  // perform original logic with the valid target list if it was reduced.
  if (validTargets.length !== this.targets().length)
  {
    // retrieve the first valid target.
    const [target] = validTargets;

    // calculate parent/grandparent relations.
    const {parent} = target;
    const grandparent = parent
      ? parent.parent
      : null;

    // update this animation's position to match the target.
    this.x = target.x;
    this.y = target.y;

    // if the parent is the grandparent, then we need to offset the position.
    if (this.parent === grandparent)
    {
      this.x += parent.x;
      this.y += parent.y;
    }

    // adjust height based on animation position settings.
    if (this.animation().position === 0)
    {
      this.y -= target.height;
    }
    else if (this.animation().position === 1)
    {
      this.y -= target.height / 2;
    }
  }
  else
  {
    // perform original logic.
    J.ABS.Aliased.Sprite_AnimationMV.get('updatePosition')
      .call(this);
  }
};
//endregion Sprite_AnimationMV