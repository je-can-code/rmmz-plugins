//region Window_AptitudeAggregateDetails
/**
 * Extends {@link #drawExtensionData}.<br/>
 * Also draws a small typed badge (icon + label) when the source row is typed.
 * @param {AptitudeSkillSourceProgress} sourceProgress - The per-source progress for this skill.
 * @param {number} x - The row's x coordinate.
 * @param {number} y - The row's y coordinate.
 */
J.APT.EXT.TYPED.Aliased.Window_AptitudeAggregateDetails.set(
  'drawExtensionData',
  Window_AptitudeAggregateDetails.prototype.drawExtensionData
);
Window_AptitudeAggregateDetails.prototype.drawExtensionData = function(sourceProgress, x, y)
{
  // perform original logic (no-op by default in core).
  J.APT.EXT.TYPED.Aliased.Window_AptitudeAggregateDetails.get('drawExtensionData')
    .call(this, sourceProgress, x, y);

  // acquire the actor for context.
  const actor = this.actor();

  // extract the stable key for the source.
  const sourceKey = sourceProgress.sourceKey();

  // extract the teachable's skill id on this row.
  const skillId = sourceProgress.skillId();

  // resolve the live source object for this actor by key (skill resolves to actor.skill(id)).
  const source = ApManager.resolveSourceByKey(actor, sourceKey);

  // extract all teachables from the source.
  const teachables = source.aptitudeTeachings;

  // attempt to find the teachable for the row's skill id.
  const found = teachables.find(teachable => teachable.skillId === skillId);

  // if no teachable was found, then do nothing.
  if (!found)
  {
    console.warn(`Could not find teachable for skillId: ${skillId}`);
    return;
  }

  // acquire the typed key off the teachable if present.
  const key = found.apTypeKey();

  // if there is no typed key, then do nothing further.
  if (!key)
  {
    return;
  }

  // render the centralized typed badge.
  const badgeX = x + this.gaugeWidth() - 350;
  this.drawTypedBadge(key, badgeX, y);
};
//endregion Window_AptitudeAggregateDetails (typed badge)