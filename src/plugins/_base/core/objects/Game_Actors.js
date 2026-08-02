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
 * Gets the raw actor store: the array the engine indexes by actor id.
 *
 * Almost nothing wants this. {@link #existingActors} is the readable form, and it is the one to reach
 * for unless you specifically need the id-to-actor indexing that only survives here.
 * @returns {Game_Actor[]}
 */
Game_Actors.prototype.data = function()
{
  return this._data;
};

/**
 * Gets every actor this playthrough has actually built, compacted.
 *
 * This is deliberately not {@link #actors}. That one walks the database and hands each id to
 * {@link Game_Actors.actor}, which lazily constructs any actor it does not find- so asking it "who
 * exists right now" answers by making the answer true. Anything that wants to touch the actors a
 * save genuinely knows about must read the store instead.
 *
 * The compaction is not a guard against a broken contract; it is the contract. The engine indexes
 * this store by actor id and never fills the gaps, and **the gaps change shape across a save**: a
 * store built during play carries real holes, which iteration skips for free, while one restored from
 * a file carries explicit nulls, because `JSON.stringify` writes a hole as `null` and `JSON.parse`
 * hands it back as a real element. Index 0 is always one of them- there is no actor 0. A caller that
 * iterated the raw store would work until the first load and then fail on its very first element.
 * @returns {Game_Actor[]}
 */
Game_Actors.prototype.existingActors = function()
{
  return this.data()
    .filter(actor => actor !== null);
};

//endregion Game_Actors