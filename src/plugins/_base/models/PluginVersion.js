//region PluginVersion
class PluginVersion
{
  /**
   * The major version of this plugin.
   * @type {number}
   */
  major = 0;

  /**
   * The minor version of this plugin.
   * @type {number}
   */
  minor = 0

  /**
   * The patch version of this plugin.
   * @type {number}
   */
  patch = 0

  /**
   * Constructor.
   * It is strongly recommended to use the {@link PluginVersion.builder} to
   * create these classes due to their string-parsing sensitivity.
   * @param {string} version
   */
  constructor(version)
  {
    // the string should be three whole integer parts.
    const semverParts = version
      .split('.')
      .map(parseInt);

    // the order is as below:
    const [ major, minor, patch ] = semverParts;

    // assign the properties.
    this.major = major;
    this.minor = minor;
    this.patch = patch;
  }

  /**
   * Gets the string version of this overall version.
   * @return {string}
   */
  version()
  {
    return [ this.major, this.minor, this.patch ].join('.');
  }

  /**
   * Checks if this {@link PluginVersion} is at or above another.
   * @param {PluginVersion} pluginVersion The other version to check satisfaction with.
   */
  satisfiesPluginVersion(pluginVersion)
  {
    // if our major version is higher than the target, then we always win.
    if (this.major > pluginVersion.major) return true;

    // if our major is below the target, then they always win.
    if (this.major < pluginVersion.major) return false;

    // major versions must be equal.

    // if our major.minor is higher than the target, then we win.
    if (this.minor > pluginVersion.minor) return true;

    // if our major.minor is below the target, then they win.
    if (this.minor < pluginVersion.minor) return false;

    // minor versions also equal.

    // if our major.minor.patch is higher than the target, then we win.
    if (this.patch > pluginVersion.patch) return true;

    // if our major.minor.patch is below the target, then they win.
    if (this.patch < pluginVersion.patch) return false;

    // the versions are actually the same, so we win :).
    return true;
  }

  /**
   * A static builder class for more easily building {@link PluginVersion}s.
   * @type {PluginVersionBuilder}
   */
  static builder = new class PluginVersionBuilder
  {
    //region parameters
    #major = 0;
    #minor = 0;
    #patch = 0;

    //endregion parameters

    /**
     * Build the {@link PluginVersion} with the current parameters.
     * Any unassigned parameters are defaulted to zero.
     * @return {PluginVersion}
     */
    build()
    {
      // group all the parts in the correct order.
      const semverParts = [ this.#major, this.#minor, this.#patch ];

      // join the semver parts into a string as the 3 parts.
      const semver = semverParts.join('.');
      const pluginVersion = new PluginVersion(semver)

      // clear the builder parameters.
      this.#clear();

      // return the newly-built plugin version.
      return pluginVersion;
    }

    /**
     * The major version, typically incremented on breaking changes or
     * with drastic changes to existing functionality.
     * @param {number} version The numeric value of the version.
     * @return {PluginVersionBuilder} The builder for chaining.
     */
    major(version)
    {
      const parsedVersion = parseInt(version);
      this.#major = parsedVersion;
      return this;
    }

    /**
     * The minor version, typically incremented on non-breaking changes or
     * additions in functionality.
     * @param {number} version The numeric value of the version.
     * @return {PluginVersionBuilder} The builder for chaining.
     */
    minor(version)
    {
      const parsedVersion = parseInt(version);
      this.#minor = parsedVersion;
      return this;
    }

    /**
     * The patch version, typically incremented on tiny non-breaking changes
     * or fixes to existing functionality.
     * @param {number} version The numeric value of the version.
     * @return {PluginVersionBuilder} The builder for chaining.
     */
    patch(version)
    {
      const parsedVersion = parseInt(version);
      this.#patch = parsedVersion;
      return this;
    }

    /**
     * Clears the data in the builder.
     */
    #clear()
    {
      this.#major = 0;
      this.#minor = 0
      this.#patch = 0
    }
  }
}

//endregion PluginVersion