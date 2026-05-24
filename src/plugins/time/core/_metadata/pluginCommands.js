//region plugin commands
/**
 * Plugin command for hiding the TIME window on the map.
 */
PluginManager.registerCommand(J.TIME.Metadata.name, "hideMapTime", () =>
{
  $gameTime.hideMapWindow();
});

/**
 * Plugin command for showing the TIME window on the map.
 */
PluginManager.registerCommand(J.TIME.Metadata.name, "showMapTime", () =>
{
  $gameTime.showMapWindow();
});

/**
 * Plugin command for setting the time to a new point in time.
 */
PluginManager.registerCommand(J.TIME.Metadata.name, "setTime", args =>
{
  const {
    Second,
    Minute,
    Hour,
    Day,
    Month,
    Year
  } = args;
  $gameTime.setTime(parseInt(Second), parseInt(Minute), parseInt(Hour), parseInt(Day), parseInt(Month), parseInt(Year));
});

/**
 * Plugin command for fast-forwarding time by a designated amount.
 */
PluginManager.registerCommand(J.TIME.Metadata.name, "fastForwardtime", args =>
{
  const {
    Second,
    Minute,
    Hour,
    Day,
    Month,
    Year
  } = args;
  $gameTime.addSeconds(parseInt(Second));
  $gameTime.addMinutes(parseInt(Minute));
  $gameTime.addHours(parseInt(Hour));
  $gameTime.addDays(parseInt(Day));
  $gameTime.addMonths(parseInt(Month));
  $gameTime.addYears(parseInt(Year));
});

/**
 * Plugin command for rewinding time by a designated amount.
 */
PluginManager.registerCommand(J.TIME.Metadata.name, "rewindTime", args =>
{
  const {
    Second,
    Minute,
    Hour,
    Day,
    Month,
    Year
  } = args;
  $gameTime.addSeconds(-parseInt(Second));
  $gameTime.addMinutes(-parseInt(Minute));
  $gameTime.addHours(-parseInt(Hour));
  $gameTime.addDays(-parseInt(Day));
  $gameTime.addMonths(-parseInt(Month));
  $gameTime.addYears(-parseInt(Year));
});

/**
 * Plugin command for jumping to the next instance of a particular time of day.
 */
PluginManager.registerCommand(J.TIME.Metadata.name, "jumpToTimeOfDay", args =>
{
  const { TimeOfDay } = args;
  $gameTime.jumpToTimeOfDay(parseInt(TimeOfDay));
});

/**
 * Plugin command for stopping artificial TIME.
 */
PluginManager.registerCommand(J.TIME.Metadata.name, "stopTime", () =>
{
  $gameTime.deactivate();
});

/**
 * Plugin command for resuming artificial TIME.
 */
PluginManager.registerCommand(J.TIME.Metadata.name, "startTime", () =>
{
  $gameTime.activate();
});

/**
 * Plugin command for allowing the TIME system to control the screen tone.
 * Does nothing if the plugin parameters are set to disable tone changing.
 */
PluginManager.registerCommand(J.TIME.Metadata.name, "unlockTone", () =>
{
  $gameTime.unlockTone();
});

/**
 * Plugin command for locking the TIME system from controlling screen tone.
 */
PluginManager.registerCommand(J.TIME.Metadata.name, "lockTone", () =>
{
  $gameTime.lockTone();
});
//endregion plugin commands