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
 * - time-of-day:  the next time a time of day begins.
 *     <respawn:[time-of-day, morning]>
 *     Valid values: night, dawn, morning, afternoon, evening, twilight.
 *
 * - next-day:     tomorrow, at a clock time written as HMM/HHMM.
 *     <respawn:[next-day, 830]>
 *     830 means 8:30am; 1430 means 2:30pm.
 *
 * - day-of-week:  midnight on the next occurrence of a weekday.
 *     <respawn:[day-of-week, monday]>
 *     The artificial calendar cycles a seven-day week anchored so that
 *     day 1 of month 1 of year 0 is a Monday.
 *
 * - month:        the first midnight of the next occurrence of a month.
 *     <respawn:[month, 3]>
 *
 * - season:       the first midnight of the next occurrence of a season.
 *     <respawn:[season, winter]>
 *     Seasons begin in months 3, 6, 9, and 12 respectively.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */