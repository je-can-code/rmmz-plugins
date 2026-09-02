//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Calendar-based respawn methods for JABS.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-ABS
 * @base J-TIME
 * @orderAfter J-ABS
 * @orderAfter J-TIME
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin teaches the JABS respawn system to speak in appointments rather
 * than durations. Core's <respawn:[seconds, N]> counts playtime; the methods
 * registered here consult the J-TIME calendar instead, so a battler can come
 * back "next morning" or "at the start of winter" rather than "in N seconds".
 *
 * This plugin requires JABS.
 * This plugin requires J-TIME.
 * This plugin requires no plugin parameter configuration.
 * ----------------------------------------------------------------------------
 * DETAILS:
 * All of these methods ride the same <respawn:[METHOD, PARAM]> tag that core
 * owns, on enemies in the database or as comment overrides on individual
 * placements. Every schedule resolves to the start of the NEXT occurrence of
 * the named moment, strictly after the moment of death- dying during the
 * morning schedules tomorrow's morning, not the one already underway.
 *
 * NEW METHODS
 * Everything prefixed "next-" names a moment on the calendar and waits for
 * that moment to come around again, strictly after the battler fell. Anything
 * without the prefix is a plain duration. That split is why the prefix is
 * there: an author reading a tag in an event comment can tell which kind of
 * statement they are looking at without going to find the documentation.
 *
 * - game-minutes:     a duration measured on the game clock rather than on
 *                     playtime, which is what core's [seconds, N] measures.
 *     <respawn:[game-minutes, 30]>
 *     Thirty in-game minutes, so it runs at whatever rate the clock is
 *     configured for and freezes whenever the clock is blocked.
 *
 * - next-time:        the next time the clock reads a given HMM/HHMM.
 *     <respawn:[next-time, 830]>
 *     830 means 8:30am; 1430 means 2:30pm. Falling at 6am schedules 8:30 the
 *     same morning; falling at 9am schedules 8:30 the next one.
 *
 * - next-time-of-day: the next time a time of day begins.
 *     <respawn:[next-time-of-day, morning]>
 *     Valid values: night, dawn, morning, afternoon, evening, twilight.
 *     The phases tile the day in four-hour blocks starting at midnight, so
 *     this is next-time restricted to the six hours they begin on.
 *
 * - next-day-of-week: midnight on the next occurrence of a weekday.
 *     <respawn:[next-day-of-week, monday]>
 *     The artificial calendar cycles a seven-day week anchored so that
 *     day 1 of month 1 of year 0 is a Monday.
 *
 * - next-month:       the first midnight of the next occurrence of a month.
 *     <respawn:[next-month, 3]>
 *
 * - next-season:      the first midnight of the next occurrence of a season.
 *     <respawn:[next-season, winter]>
 *     Seasons begin in months 3, 6, 9, and 12 respectively.
 * ============================================================================
 * CHANGELOG:
 * - 1.1.0
 *    Every calendar method now carries a "next-" prefix, and anything without
 *    one is a plain duration. Four of the five already resolved to the next
 *    occurrence of their moment; the prefix states that at the tag itself,
 *    which is where an author is standing when they need to know it.
 *    Added next-time, the next occurrence of an arbitrary HHMM clock time. The
 *    phases tile the day in four-hour blocks, so an hour like 6am previously
 *    had no way to be named at all. next-time-of-day now resolves its phase to
 *    a starting hour and defers to it, leaving one implementation of the idea.
 *    Retired next-day, which alone jumped a whole day unconditionally and was
 *    misread because of it. Under this grammar it would have meant what
 *    next-time means; a flat day is game-minutes at 1440.
 *    Tag renames: time-of-day becomes next-time-of-day, day-of-week becomes
 *    next-day-of-week, month becomes next-month, season becomes next-season.
 *    This breaks any tag written against the old names.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */