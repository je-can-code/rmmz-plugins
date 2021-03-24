//#region Introduction
/*:
 * @target MZ
 * @plugindesc 
 * [v1.0 JCMS] J's Custom Menu System- for menus that need more sprucing up.
 * @author JE
 * @url https://github.com/je-can-code/rmmz
 * @help
 * This is not officially released and thus has no/incomplete documentation.
 */

 /**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.CMS = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.CMS.Metadata = {
  /**
   * The version of this plugin.
   */
  Name: `J-CMS-MainMenu`,

  /**
   * The version of this plugin.
   */
  Version: 1.00,
};

/**
 * The actual `plugin parameters` extracted from RMMZ.
 */
J.CMS.PluginParameters = PluginManager.parameters(J.CMS.Metadata.Name);

class Scene_JCMS extends Scene_Base {
  constructor() {
    super();
  };
};

class Window_JCMS_Main extends Window_HorzCommand {
  constructor(rect) {
    super(rect);
    this.initialize(rect);
  };

  initialize(rect) {
    super.initialize(rect);
    // ...
  };

  makeCommandList() {
    // ...
  };
};