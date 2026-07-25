//region plugins/sks/_component/fixtures/window-command-stub.js
/**
 * A minimal stand-in for RMMZ's `Window_Command` base class, scoped to exactly what the SKS
 * `Window_SkillEquipList` / `Window_SkillEquipSlots` classes rely on from their parent: an
 * internal command list, cursor index tracking, and the `refresh()` -> `makeCommandList()`
 * rebuild cycle. It intentionally omits all rendering (`drawItem`, `contents`, etc.) since the
 * SKS subclasses under test never touch those paths in their pure list-building logic.
 *
 * Installed onto `globalThis` (not a VM sandbox) so the real SKS window source files can be
 * `import()`-ed directly and attributed real v8 coverage.
 *
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 */
export function installWindowCommandStub(sandbox = globalThis)
{
  class Window_Command
  {
    /**
     * Constructor. Real RMMZ windows take a placement rect; the stub ignores it since nothing
     * under test touches layout.
     * @param {object} rect The rectangle for this window (unused by the stub).
     */
    // eslint-disable-next-line no-unused-vars
    constructor(rect)
    {
      // the backing array for all commands currently built into this window.
      this._list = [];

      // the currently-selected row index.
      this._index = 0;

      // real Window_Command builds its initial list at construction time; mirror that so a
      // window can be queried immediately without an explicit refresh() call.
      this.makeCommandList();
    }

    /**
     * Gets all commands currently in this list.
     * @returns {object[]}
     */
    commandList()
    {
      return this._list ?? [];
    }

    /**
     * Gets the currently-selected row index.
     * @returns {number}
     */
    index()
    {
      return this._index;
    }

    /**
     * Sets the currently-selected row index.
     * @param {number} index The new index.
     */
    select(index)
    {
      this._index = index;
    }

    /**
     * Adds a pre-built command (mirrors J-Base's `Window_Command.prototype.addBuiltCommand`).
     * @param {object} command The built command to add.
     */
    addBuiltCommand(command)
    {
      this._list.push(command);
    }

    /**
     * Clears and rebuilds the command list. Real subclasses override `makeCommandList()`
     * to populate `this._list` again after the clear.
     */
    refresh()
    {
      // clear whatever was built previously.
      this._list = [];

      // let the subclass rebuild against current state.
      this.makeCommandList();
    }

    /**
     * Builds the command list for this window. No-op by default; SKS subclasses override this.
     */
    makeCommandList()
    {
    }
  }

  sandbox.Window_Command = Window_Command;
}
//endregion plugins/sks/_component/fixtures/window-command-stub.js
