//region ApManager
/**
 * Overrides {@link #gainAp}.<br/>
 * Routes untyped AP through `gainApUntypedOnly` so typed tracks are not fueled by it.
 * @param {Game_Actor} actor The actor gaining AP.
 * @param {number} amount The amount of AP awarded.
 * @param {string} cause A short label describing the cause.
 */
ApManager.gainAp = function(actor, amount, cause = 'victory')
{
  // route through the untyped-only implementation.
  return this.gainApUntypedOnly(actor, amount, cause);
};

/**
 * Awards typed AP to the given actor for teachables matching the `domain` and `id`.
 * @param {Game_Actor} actor The actor gaining AP.
 * @param {number} amount The amount of AP awarded.
 * @param {string} domain The domain key ('element' | 'weaponType' | 'skillType').
 * @param {number} id The id within the domain.
 * @param {string} cause A short label (ex: 'on-kill:typed').
 */
ApManager.gainTypedAp = function(actor, amount, domain, id, cause = 'typed')
{
  // validate we can gain AP.
  if (this.canGainAp(actor, amount) === false) return;

  // normalize domain key for matching.
  const dom = String(domain)
    .trim()
    .toLowerCase();

  // collect active source → teachables entries.
  const sources = this.activeTeachables(actor);

  // apply typed AP only to compatible teachables.
  sources.forEach(({
    key,
    teachables
  }) =>
  {
    // filter teachables that are typed and match the exact domain+id.
    const matches = teachables.filter(teachable =>
    {
      // if there is no key, this is not a typed teachable.
      if (teachable.isTyped() === false) return false;

      // grab the type key.
      const apTypeKey = teachable.apTypeKey();

      // if the domain and id don't match, then this is not a match.
      if (apTypeKey.domain !== dom) return false;
      if (apTypeKey.id !== id) return false;

      // everything aligns, so this teachable is a match.
      return true;
    });

    // skip if no matches.
    if (matches.length === 0) return;

    // apply AP to the matched teachables only.
    this.applyApToSource(actor, key, matches, amount, cause);
  });
};

/**
 * Routes untyped AP to only untyped teachables (those lacking `apType`).
 * @param {Game_Actor} actor The actor gaining AP.
 * @param {number} amount The amount of AP awarded.
 * @param {string} cause A short label describing the cause.
 */
ApManager.gainApUntypedOnly = function(actor, amount, cause = 'victory')
{
  // validate we can gain AP.
  if (this.canGainAp(actor, amount) === false) return;

  // build the list of active sources for this actor.
  const sources = this.activeTeachables(actor);

  // iterate each source to apply AP.
  sources.forEach(({
    key,
    teachables
  }) =>
  {
    // filter out typed teachables.
    const untypedTeachables = teachables.filter(teachable =>
    {
      // if the teachable has a type key, it doesn't apply.
      if (teachable.isTyped() === true) return false;

      // its good!
      return true;
    });

    // skip if none.
    if (untypedTeachables.length === 0) return;

    // apply AP to only untyped teachables.
    this.applyApToSource(actor, key, untypedTeachables, amount, cause);
  });
};

/**
 * Resolves a domain/idOrName pair into a numeric id using $dataSystem lists.
 * Supported domains: 'element' | 'weaponType' | 'skillType'.
 * @param {string} domain The domain to resolve against.
 * @param {string|number} idOrName The numeric id or case-insensitive name.
 * @returns {number} The resolved id (NaN if not found).
 */
ApManager.resolveDomainId = function(domain, idOrName)
{
  // numeric fast-path.
  const asNum = Number(idOrName);
  if (Number.isFinite(asNum)) return asNum;

  // choose list by domain.
  const key = String(domain)
    .trim()
    .toLowerCase();
  let list;
  switch (key)
  {
    case ApTypeKey.DomainType.Element:
      list = $dataSystem.elements;
      break;
    case ApTypeKey.DomainType.WeaponType:
      list = $dataSystem.weaponTypes;
      break;
    case ApTypeKey.DomainType.SkillType:
      list = $dataSystem.skillTypes;
      break;
    default:
      return NaN;
  }

  // find first case-insensitive exact match.
  const needle = String(idOrName)
    .trim()
    .toLowerCase();

  // identify the index of the type.
  const nameIndex = list.findIndex(name => name && String(name)
    .trim()
    .toLowerCase() === needle);

  // validate we found an index.
  if (nameIndex === -1)
  {
    // we didn't find a match.
    return NaN;
  }

  // return the resolved id.
  return nameIndex;
};

/**
 * Resolves display parts (name + iconIndex) for a typed AP key.
 *
 * @param {ApTypeKey|{domain:string,id:number}} key - The typed key to resolve.
 * @returns {ApTypeDisplayInfo} - The display name and icon index.
 */
ApManager.apTypeDisplay = function(key)
{
  // normalize the key parts.
  const domain = String(key.domain)
    .trim()
    .toLowerCase();
  const id = Number(key.id);

  // resolved in the switch — always assigned before return.
  let name;
  let icon;

  switch (domain)
  {
    case ApTypeKey.DomainType.Element:
      name = $dataSystem.elements[id];
      icon = IconManager.element(id);
      break;
    case ApTypeKey.DomainType.WeaponType:
      name = $dataSystem.weaponTypes[id];
      icon = IconManager.weaponType(id);
      break;
    case ApTypeKey.DomainType.SkillType:
      name = $dataSystem.skillTypes[id];
      icon = IconManager.skillType(id);
      break;
    default:
      name = `${domain}:${id}`;
      icon = 0;
      break;
  }

  // return the resolved data.
  return new ApTypeDisplayInfo(name, icon);
};
//endregion ApManager