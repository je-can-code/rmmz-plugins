//region level-class-data
/**
 * Fills `$dataClasses[1]` with eight base-parameter rows (length 100) so
 * `currentClass().params[paramId][level]` matches editor-style indexing for tests.
 *
 * @param {object} sandbox VM context after {@link loadLevelPluginVm}.
 */
export function installMinimalClassParamRows(sandbox)
{
  const makeRow = function()
  {
    const row = [];

    for (let i = 0; i < 100; i++)
    {
      row[i] = i * 100 + 2;
    }

    return row;
  };

  const params = [];

  for (let p = 0; p < 8; p++)
  {
    params.push(makeRow());
  }

  sandbox.$dataClasses = [ null, { id: 1, params } ];
}

/**
 * Ensures `$gameTemp` exists with Level-Master `initMembers` state.
 *
 * @param {object} sandbox
 */
export function installGameTempForLevelTests(sandbox)
{
  sandbox.$gameTemp = new sandbox.Game_Temp();
  sandbox.$gameTemp.initMembers();
}
//endregion level-class-data
