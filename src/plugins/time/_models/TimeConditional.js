class TimeConditional
{
  isTimeRange = false;
  isFullDateRange = false;

  seconds = -1;
  minutes = -1;
  hours = -1;
  days = -1;
  months = -1;
  years = -1;

  timeOfDay = -1;
  seasonOfYear = -1;

  /**
   * The start range for a time if there are two numbers in the array, or a full date range if there are 5 numbers.
   * @type {[number, number]|[number,number,number,number,number]}
   */
  startRange = [];

  /**
   * The end range for a time if there are two numbers in the array, or a full date range if there are six numbers.
   * When it is two numbers, it is `[hour, minute]`, like reading a clock.<br/>
   * When it is six numbers, it is `[second, minute, hour, day, month, year]`- though seconds are not customizable.
   * @type {[number, number]|[number,number,number,number,number,number]}
   */
  endRange = [];
}