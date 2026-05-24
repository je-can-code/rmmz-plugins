//region JABS_Engine
J.MAP.Aliased.JABS_Engine.set('addLootDropToMap', JABS_Engine.prototype.addLootDropToMap);
JABS_Engine.prototype.addLootDropToMap = function(x, y, item)
{
  // Call the most recent/previous implementation (this will respect CA’s Y offset mod, etc.).
  const lootEvent = J.MAP.Aliased.JABS_Engine.get('addLootDropToMap')
    .call(this, x, y, item);

  // If we didn’t get an event for some reason, bail out.
  if (!lootEvent) return lootEvent;

  // Resolve the underlying data event to inject comment commands into.
  const eventId = lootEvent.eventId();
  const eventData = $dataMap.events[eventId];
  if (!eventData) return lootEvent;

  // The single-line comment event command we want to insert.
  const minimapLootComment = {
    code: 108,           // first-line comment
    indent: 0,
    parameters: [ '<mm:loot>' ]
  };

  // grab the first page for adding to.
  const [ firstPage ] = eventData.pages;

  // Prepend so it’s early in the list, but any position works for parsing.
  firstPage.list.unshift(minimapLootComment);

  // Ensure the in-memory Game_Event sees the updated page list and clears minimap caches.
  lootEvent.refresh();

  // return the updated loot event.
  return lootEvent;
};
//endregion JABS_Engine