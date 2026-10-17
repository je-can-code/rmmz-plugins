# overview

* [The Plugin Overview](overview.md) - The general overview for what this plugin is about along with the when and how you might use it.

# dependencies

* [Dependencies](dependencies.md) - The list of dependencies- required and optional- for this plugin.

# notetag

* [No Tone Change](notetags/maps/no-tone-change.md) - The map tag that keeps the system from changing the screen tone when transferring to that map.
* [Time Block](notetags/maps/time-block.md) - The map tag that blocks TIME from flowing while the player is on that map.
* [Exact Value](notetags/time-gated/exact-value.md) - The tags gating event pages or choices on one exact minute, hour, day, month, year, time of day or season.
* [Range](notetags/time-gated/range.md) - The tags gating event pages or choices on an inclusive span of minutes, hours, days, months or years.
* [Time Range](notetags/time-gated/time-range.md) - The tags gating event pages or choices on an hour:minute clock-time span within a single day.
* [Full Date Range](notetags/time-gated/full-date-range.md) - The tags gating event pages or choices on an inclusive span across a full calendar date and time.

# plugin-parameter

* [Parameter Group: BASE SETUP](parameters/bas-econfigs.md) - The heading the BASE SETUP parameters sit under in the plugin manager.
* [Origin X Plugin Parameter](parameters/time-window-x.md) - The x coordinate of the overarching TIME window.
* [Origin Y Plugin Parameter](parameters/time-window-y.md) - The y coordinate of the overarching TIME window.
* [Clock Icon Plugin Parameter](parameters/clock-icon.md) - The icon drawn beside the clock. The other rows take their icons from data; this one does not.
* [Start Visible Plugin Parameter](parameters/start-visible.md) - Begins the game with the time window visible.
* [Start Activated Plugin Parameter](parameters/start-activated.md) - Begins the game with TIME active and flowing.
* [Use Real Time Plugin Parameter](parameters/use-real-time.md) - Instead of using artificial time, use real life time. Using real time negates most configs below.
* [Auto-assign Variables Plugin Parameter](parameters/use-variable-assignment.md) - Assign all components of the time to variables.
* [VARIABLE CONFIGS Plugin Parameter](parameters/variabl-econfigs.md) - The VARIABLE CONFIGS plugin parameter.
* [Seconds Variable Plugin Parameter](parameters/seconds-variable.md) - The variable id the seconds value will be assigned to.
* [Minutes Variable Plugin Parameter](parameters/minutes-variable.md) - The variable id the minutes value will be assigned to.
* [Hours Variable Plugin Parameter](parameters/hours-variable.md) - The variable id the hours value will be assigned to.
* [Days Variable Plugin Parameter](parameters/days-variable.md) - The variable id the days value will be assigned to.
* [Months Variable Plugin Parameter](parameters/months-variable.md) - The variable id the months value will be assigned to.
* [Years Variable Plugin Parameter](parameters/years-variable.md) - The variable id the years value will be assigned to.
* [Time of Day Id Variable Plugin Parameter](parameters/time-of-day-id-variable.md) - The variable id the time of the day's name will be assigned to.
* [Time of Day Name Variable Plugin Parameter](parameters/time-of-day-name-variable.md) - The variable id the time of the day's name will be assigned to.
* [Season of Year Id Variable Plugin Parameter](parameters/season-of-year-id-variable.md) - The variable id the season of the year's id will be assigned to.
* [Season of Year Name Variable Plugin Parameter](parameters/season-of-year-name-variable.md) - The variable id the season of the year's name will be assigned to.
* [Parameter Group: ARTIFICAL CONFIGS](parameters/artificia-lconfigs.md) - The heading the ARTIFICAL CONFIGS parameters sit under in the plugin manager.
* [Rate of Time Plugin Parameter](parameters/frames-per-tick.md) - The number of frames that must pass for time to tick. (~60 frames per real second)
* [Starting Second Plugin Parameter](parameters/starting-second.md) - The precise second that time begins on for a new game. Also affects direct time manipulation for seconds.
* [Starting Minute Plugin Parameter](parameters/starting-minute.md) - The number of minutes that are incremented per tock. Also affects direct time manipulation for minutes.
* [Starting Hour Plugin Parameter](parameters/starting-hour.md) - The number of hours that are incremented per tock. Also affects direct time manipulation for hours.
* [Starting Day Plugin Parameter](parameters/starting-day.md) - The number of days that are incremented per tock. Also affects direct time manipulation for days.
* [Starting Month Plugin Parameter](parameters/starting-month.md) - The number of months that are incremented per tock. Also affects direct time manipulation for months.
* [Starting Year Plugin Parameter](parameters/starting-year.md) - The number of years that are incremented per tock. Also affects direct time manipulation for years.
* [Seconds per Tick Plugin Parameter](parameters/seconds-per-increment.md) - The number of seconds that are incremented per tick. Also affects direct time manipulation for seconds.
* [Minutes per Tock Plugin Parameter](parameters/minutes-per-increment.md) - The number of minutes that are incremented per tock. Also affects direct time manipulation for minutes.
* [Hours per Tock Plugin Parameter](parameters/hours-per-increment.md) - The number of hours that are incremented per tock. Also affects direct time manipulation for hours.
* [Days per Tock Plugin Parameter](parameters/days-per-increment.md) - The number of days that are incremented per tock. Also affects direct time manipulation for days.
* [Months per Tock Plugin Parameter](parameters/months-per-increment.md) - The number of months that are incremented per tock. Also affects direct time manipulation for months.
* [Years per Tock Plugin Parameter](parameters/years-per-increment.md) - The number of years that are incremented per tock. Also affects direct time manipulation for years.

# plugin-command

* [Jump to Time of Day Plugin Command](commands/jump-to-time-of-day.md) - Jump to the next instance of a chosen time of day (e.g., morning).
* [Set Time Plugin Command](commands/set-time.md) - Sets the time to a fixed time; only applicable to artificial time.
* [Fast Forward Time Plugin Command](commands/fast-forwardtime.md) - Fast-forwards time by a set amount; artificial time only.
* [Rewind Time Plugin Command](commands/rewind-time.md) - Rewinds time by a set amount; artificial time only.
* [Show TIME on Map Plugin Command](commands/show-map-time.md) - Shows the TIME window on the map.
* [Hide TIME on Map Plugin Command](commands/hide-map-time.md) - Hides the TIME window on the map.
* [Stop TIME Plugin Command](commands/stop-time.md) - Stops the flow of time; only applicable to artificial time.
* [Start TIME Plugin Command](commands/start-time.md) - Starts the flow of time; only applicable to artificial time.

# storage

* [Data Saved](storage.md) - The details about what is saved to disk for this plugin.

# changelog

* [Changelog](changelog.md) - The list of all version updates this plugin has gone through and major change points.
