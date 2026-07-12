//region plugins/time/game-time-logic-direct.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installTimeHostGlobals } from './fixtures/install-time-host-globals.js';

describe('J-TIME Game_Time logic (direct src import)', () =>
{
  let Game_Time;

  beforeAll(async () =>
  {
    vi.resetModules();

    installTimeHostGlobals();

    await import('../../../src/plugins/time/core/_metadata/initialization.js');

    ({ default: Game_Time } = await import('../../../src/plugins/time/core/_models/Game_Time.js'));
  });

  it('setTickSpeed clamps flow multiplier and updates tick frames', () =>
  {
    const t = new Game_Time();
    t.setTickSpeed(100);
    expect(t.getTickSpeed()).toBe(Math.ceil(60 / 10));
    t.setTickSpeed(0.01);
    expect(t.getTickSpeed()).toBe(Math.ceil(60 / 0.1));
  });

  it('addSeconds rolls into minutes using metadata increments', () =>
  {
    const t = new Game_Time();
    t.setTime(0, 0, 0, 1, 1, 2020);
    t.addSeconds(59);
    expect(t._seconds).toBe(59);
    t.addSeconds(1);
    expect(t._seconds).toBe(0);
    expect(t._minutes).toBe(1);
  });

  it('timeOfDay and seasonOfYear map hours and months', () =>
  {
    const t = new Game_Time();
    expect(t.timeOfDay(0)).toBe(0);
    expect(t.timeOfDay(5)).toBe(1);
    expect(t.timeOfDay(12)).toBe(3);
    expect(t.seasonOfYear(6)).toBe(1);
    expect(t.seasonOfYear(12)).toBe(3);
  });

  it('determineArtificialTime snapshot carries ids and names', () =>
  {
    const t = new Game_Time();
    t.setTime(5, 4, 14, 10, 6, 2024);
    const snap = t.determineArtificialTime();
    expect(snap.seconds).toBe(5);
    expect(snap.hours).toBe(14);
    expect(snap.timeOfDayName).toBe('Afternoon');
    expect(snap.seasonOfTheYearName).toBe('Summer');
  });

  it('jumpToTimeOfDay advances hours toward the next matching bucket', () =>
  {
    const t = new Game_Time();
    t.setTime(0, 0, 10, 1, 1, 2020);
    t.jumpToTimeOfDay(3);
    expect(t._hours).toBe(12);
    expect(t._minutes).toBe(0);
    expect(t._seconds).toBe(0);
  });

  it('toneBetweenTones interpolates rgb channels', () =>
  {
    const t = new Game_Time();
    const a = [ 0, 0, 0, 0 ];
    const b = [ 10, 20, 30, 40 ];
    const mid = t.toneBetweenTones(a, b, 0.5);
    expect(mid[0]).toBe(5);
    expect(mid[1]).toBe(10);
    expect(mid[2]).toBe(15);
    expect(mid[3]).toBe(20);
  });

  it('canUpdateTime respects Graphics.frameCount and tick speed', () =>
  {
    const t = new Game_Time();
    globalThis.Graphics.frameCount = 59;
    expect(t.canUpdateTime()).toBe(false);
    globalThis.Graphics.frameCount = 60;
    expect(t.canUpdateTime()).toBe(true);
  });
});
//endregion plugins/time/game-time-logic-direct.test.js
