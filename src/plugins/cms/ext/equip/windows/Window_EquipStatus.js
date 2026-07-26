//region Window_EquipStatus
/**
 * Overwrites {@link #lineHeight}.<br/>
 * Matches the status scene's line height so both screens read identically.
 * @returns {number}
 */
Window_EquipStatus.prototype.lineHeight = function()
{
  return 32;
};

/**
 * Overwrites {@link #makeFontSmaller}.<br/>
 * Matches the status scene's reduced font step.
 */
Window_EquipStatus.prototype.makeFontSmaller = function()
{
  if (this.contents.fontSize >= 24)
  {
    this.contents.fontSize -= 6;
  }
};

/**
 * Overwrites {@link #makeFontBigger}.<br/>
 * Matches the status scene's expanded font step.
 */
Window_EquipStatus.prototype.makeFontBigger = function()
{
  if (this.contents.fontSize <= 96)
  {
    this.contents.fontSize += 6;
  }
};

/**
 * Overwrites {@link #drawAllParams}.<br/>
 * Renders every registered parameter — vanilla b/x/s params and every custom one alike — through
 * the shared {@link ParameterCatalogRenderer}, grouped and chromed identically to the status
 * scene's page 1 (Combat/Vitality/Precision/Defensive/Haste/Fate). This is the same catalog data
 * the status scene reads, so nothing shown here can drift out of sync with what the player already
 * knows from that screen.
 *
 * When a `_tempActor` is present (the player is hovering a candidate piece of equipment), each row
 * renders "current → projected" instead of a bare value, so the impact of the swap is visible
 * without leaving this window.
 */
Window_EquipStatus.prototype.drawAllParams = function()
{
  const { rowGap } = ParameterCatalogRenderer.PAGE_LAYOUT;
  const columnLayout = ParameterCatalogRenderer.computeThreeColumnLayout(this);
  let cursorY = 0;

  if (columnLayout)
  {
    const columnXs = [ columnLayout.leftX, columnLayout.middleX ];

    ParameterCatalogRenderer.PAGE_GROUP_ROW_GROUPS.forEach(rowGroups =>
    {
      const rowHeights = rowGroups.map((groupId, columnIndex) =>
      {
        return ParameterCatalogRenderer.drawParameterGroup(
          this, columnXs[columnIndex], cursorY, groupId, columnLayout.columnWidth, this._actor, this._tempActor);
      });

      const tallestSection = Math.max(...rowHeights);
      cursorY += tallestSection + rowGap;
    });

    return;
  }

  // when the window is too narrow for two columns, stack the groups in a single column instead.
  const fallbackWidth = this.innerWidth;

  ParameterCatalogRenderer.PAGE_GROUP_ROW_GROUPS.forEach(rowGroups =>
  {
    rowGroups.forEach(groupId =>
    {
      const groupHeight = ParameterCatalogRenderer.drawParameterGroup(
        this, 0, cursorY, groupId, fallbackWidth, this._actor, this._tempActor);
      cursorY += groupHeight + rowGap;
    });
  });
};
//endregion Window_EquipStatus
