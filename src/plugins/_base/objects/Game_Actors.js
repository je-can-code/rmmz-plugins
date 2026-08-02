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

/**
 * Gets the actor store exactly as the engine keeps it: a sparse array indexed by actor id, holding
 * only the actors this playthrough has actually built.
 *
 * This is deliberately not {@link #actors}. That one walks the database and hands each id to
 * {@link Game_Actors.actor}, which lazily constructs any actor it does not find- so asking it "who
 * exists right now" answers by making the answer true. Anything that wants to touch the actors a
 * save genuinely knows about must read the store instead.
 *
 * The holes are left in place. `forEach`, `filter`, and `map` all skip them by definition, so a
 * caller iterating this array only ever sees real actors.
 * @returns {Game_Actor[]}
 */
Game_Actors.prototype.existingActors = function()
{
  return this._data;
};

//endregion Game_Actors