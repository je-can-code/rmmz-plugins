//region install-minimal-menu-ui-stubs
const noop = function()
{
};

/**
 * Minimal Scene_MenuBase / Window_* chain so plugins that define menu scenes and windows can evaluate in the VM.
 *
 * @param {object} sandbox
 */
export function installMinimalMenuUiStubs(sandbox)
{
  function Rectangle(x, y, width, height)
  {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  sandbox.Rectangle = Rectangle;

  sandbox.Scene_Base.prototype.initialize = noop;
  sandbox.Scene_Base.prototype.initMembers = noop;
  sandbox.Scene_Base.prototype.create = noop;
  sandbox.Scene_Base.prototype.start = noop;
  sandbox.Scene_Base.prototype.update = noop;

  function Scene_MenuBase()
  {
  }

  Object.setPrototypeOf(Scene_MenuBase.prototype, sandbox.Scene_Base.prototype);
  Scene_MenuBase.prototype.constructor = Scene_MenuBase;
  Scene_MenuBase.prototype.initialize = noop;
  Scene_MenuBase.prototype.initMembers = noop;
  Scene_MenuBase.prototype.create = noop;
  Scene_MenuBase.prototype.addWindow = noop;
  Scene_MenuBase.prototype.popScene = noop;
  Scene_MenuBase.prototype.isMenuEnabled = function()
  {
    return true;
  };

  sandbox.Scene_MenuBase = Scene_MenuBase;

  sandbox.SceneManager = {
    push: noop,
    goto: noop,
    pop: noop,
  };

  function Window_Selectable()
  {
  }

  Window_Selectable.prototype.initialize = noop;
  Window_Selectable.prototype.processCursorMove = noop;
  Window_Selectable.prototype.processHandling = noop;
  Window_Selectable.prototype.update = noop;
  Window_Selectable.prototype.refresh = noop;
  Window_Selectable.prototype.paint = noop;
  Window_Selectable.prototype.open = noop;
  Window_Selectable.prototype.close = noop;
  Window_Selectable.prototype.show = noop;
  Window_Selectable.prototype.hide = noop;
  Window_Selectable.prototype.activate = noop;
  Window_Selectable.prototype.deactivate = noop;
  Window_Selectable.prototype.select = noop;
  Window_Selectable.prototype.deselect = noop;
  Window_Selectable.prototype.contents = { clear: noop, paintOpacity: 255, fontSize: 28 };
  Window_Selectable.prototype.maxItems = function()
  {
    return 0;
  };

  sandbox.Window_Selectable = Window_Selectable;

  function Window_Base()
  {
  }

  Object.setPrototypeOf(Window_Base.prototype, Window_Selectable.prototype);
  Window_Base.prototype.constructor = Window_Base;
  Window_Base.prototype.initialize = noop;
  Window_Base.prototype.lineHeight = function()
  {
    return 24;
  };

  Window_Base.prototype.resetFontSettings = noop;
  Window_Base.prototype.changeTextColor = noop;
  Window_Base.prototype.drawText = noop;
  Window_Base.prototype.textWidth = function()
  {
    return 0;
  };

  Window_Base.prototype.modFontSize = noop;

  sandbox.Window_Base = Window_Base;

  function Window_Command()
  {
  }

  Object.setPrototypeOf(Window_Command.prototype, Window_Selectable.prototype);
  Window_Command.prototype.constructor = Window_Command;
  Window_Command.prototype.initialize = function()
  {
  };

  Window_Command.prototype.initMembers = noop;
  Window_Command.prototype.makeCommandList = noop;
  Window_Command.prototype.addCommand = noop;
  Window_Command.prototype.setHandler = noop;
  Window_Command.prototype.refresh = noop;
  Window_Command.prototype.itemHeight = function()
  {
    return 24;
  };

  Window_Command.prototype.innerWidth = function()
  {
    return 100;
  };

  Window_Command.prototype.maxItems = function()
  {
    return 0;
  };

  Window_Command.prototype.numVisibleRows = function()
  {
    return 4;
  };

  sandbox.Window_Command = Window_Command;

  function Window_MenuCommand()
  {
  }

  Object.setPrototypeOf(Window_MenuCommand.prototype, Window_Command.prototype);
  Window_MenuCommand.prototype.constructor = Window_MenuCommand;
  Window_MenuCommand.prototype.initialize = noop;
  Window_MenuCommand.prototype.makeCommandList = noop;

  sandbox.Window_MenuCommand = Window_MenuCommand;

  function Window_Help()
  {
  }

  Object.setPrototypeOf(Window_Help.prototype, Window_Base.prototype);
  Window_Help.prototype.constructor = Window_Help;
  Window_Help.prototype.initialize = noop;

  sandbox.Window_Help = Window_Help;
}
//endregion install-minimal-menu-ui-stubs
