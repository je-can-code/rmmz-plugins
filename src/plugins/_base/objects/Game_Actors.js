//region Game_Actors
/**
 * Gets all proper actor ids available for actors in the database.
 * @returns {number[]}
 */
Game_Actors.prototype.actorIds = function()
{
  // start with an empty array.
  const actorIds = Array.empty;

  // iterate over all the actors in the database.
  $dataActors.forEach(actor =>
  {
    // the first actor is always null.
    if (!actor) return;

    // funny-named actors shouldn't be considered.
    if (actor.name.length === 0) return;
    if (actor.name.startsWith(" ")) return;
    if (actor.name.startsWith("==")) return;
    if (actor.name.startsWith("__")) return;

    // add the valid actor id.
    actorIds.push(actor.id);
  });

  // return the collection of defined actor ids.
  return actorIds;
};

/**
 * Gets all proper actors available in the database.
 * @returns {Game_Actor[]}
 */
Game_Actors.prototype.actors = function()
{
  return this.actorIds()
    .map(id => this.actor(id), this);
};

//endregion Game_Actors