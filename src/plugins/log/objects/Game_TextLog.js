//region MapLogManager
class MapLogManager
{
  //region properties
  /**
   * The logs currently being managed.
   * @type {Map_Log[]}
   */
  #logs = [];

  /**
   * Whether or not we have an unattended log.
   * @type {boolean}
   */
  #needsProcessing = false;

  /**
   * Whether or not the log window should be visible.
   * @type {boolean}
   */
  #visible = true;
  //endregion properties

  /**
   * Gets all logs that are currently being tracked by this log manager.<br>
   * The logs will be in reverse order from that of which they are displayed in the window.
   * @returns {Map_Log[]}
   */
  getLogs()
  {
    return this.#logs;
  };

  /**
   * Adds a new log to this log manager's log tracker.<br>
   * If there are more than the maximum capacity of logs currently being tracked,
   * this will also start dropping logs from the tail until the limit is reached.
   * @param {Map_Log} log The new log to add.
   */
  addLog(log)
  {
    // add a log to the collection.
    this.#logs.push(log);

    // make sure we don't have too many logs to work with.
    this.handleLogCount();

    // alert any listeners that we have a new log.
    this.flagForProcessing();
  };

  /**
   * Maintains this log manager's the log tracker to stay under the max log count.
   */
  handleLogCount()
  {
    // check if we have too many logs.
    while (this.hasTooManyLogs())
    {
      // remove from the front until we are within the threshold.
      this.#logs.shift();
    }
  }

  /**
   * Checks whether or not this log manager has more logs than it can retain in memory.
   * @returns {boolean}
   */
  hasTooManyLogs()
  {
    return (this.#logs.length > this._maxLogCount());
  }

  /**
   * Returns the maximum count of logs that this log manager will retain in memory.
   *
   * NOTE: This is probably the only method that would ever require any overriding.
   * @returns {number}
   * @private
   */
  _maxLogCount()
  {
    return 100;
  }

  /**
   * Checks whether or not this log manager is currently in need of processing.
   */
  needsProcessing()
  {
    return this.#needsProcessing;
  }

  /**
   * Indicates this log manager has logs needing processing.
   */
  flagForProcessing()
  {
    this.#needsProcessing = true;
  }

  /**
   * Informs this log manager that logs have been processed.
   */
  acknowledgeProcessing()
  {
    this.#needsProcessing = false;
  }

  /**
   * Clears all logs currently stored by this log manager.
   */
  clearLogs()
  {
    this.#logs.splice(0, this.#logs.length);
  }

  /**
   * Returns if this log manager is currently visible.
   * @returns {boolean}
   */
  isVisible()
  {
    return this.#visible;
  }

  /**
   * Returns if this log manager is currently hidden.
   * @returns {boolean}
   */
  isHidden()
  {
    return !this.#visible;
  }

  /**
   * Hides this log manager.
   */
  hideMapLog()
  {
    this.#visible = false;
  }

  /**
   * Reveals this log manager.
   */
  showMapLog()
  {
    this.#visible = true;
  }
}
//endregion MapLogManager