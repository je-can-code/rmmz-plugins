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
 * Eases off the reduction step compared to the status scene — this window has a wider two-column
 * layout with room to spare, so parameter names don't need to squeeze down as far to fit.
 */
Window_EquipStatus.prototype.makeFontSmaller = function()
{
  if (this.contents.fontSize >= 20)
  {
    this.contents.fontSize -= 2;
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
 * Overwrites {@link #refresh}.<br/>
 * Drops the vanilla name/face block — {@link Window_EquipActorRibbon} owns that now, in its own
 * row above this window — so the parameter grid gets the full window instead of carving out space
 * for a portrait internally.
 */
Window_EquipStatus.prototype.refresh = function()
{
  this.contents.clear();
  if (this.actor())
  {
    this.drawAllParams();
  }
};

/**
 * Overwrites {@link #drawAllParams}.<br/>
 * Renders every registered parameter — vanilla b/x/s params and every custom one alike — through
 * the shared {@link ParameterCatalogRenderer}, grouped and chromed identically to the status
 * scene's page 1 (Combat/Vitality/Precision/Defensive/Haste/Fate/Support). This is the same catalog
 * data the status scene reads, so nothing shown here can drift out of sync with what the player
 * already knows from that screen.
 *
 * Unlike the status page, this window uses a two-column layout instead of three — there's no
 * elements/ailments panel to reserve a third column for here, so the freed width goes toward
 * wider, more legible name/value columns instead.
 *
 * When a `_tempActor` is present (the player is hovering a candidate piece of equipment), each row
 * renders "current → projected" instead of a bare value, so the impact of the swap is visible
 * without leaving this window.
 */
Window_EquipStatus.prototype.drawAllParams = function()
{
  const { rowGap } = ParameterCatalogRenderer.PAGE_LAYOUT;
  const columnLayout = ParameterCatalogRenderer.computeTwoColumnLayout(this);
  let cursorY = 0;

  if (columnLayout)
  {
    const columnXs = [ columnLayout.leftX, columnLayout.middleX ];

    ParameterCatalogRenderer.PAGE_GROUP_ROW_GROUPS.forEach(rowGroups =>
    {
      const rowHeights = rowGroups.map((groupId, columnIndex) =>
      {
        return ParameterCatalogRenderer.drawParameterGroup(
          this, columnXs[columnIndex], cursorY, groupId, columnLayout.columnWidth, this.actor(), this.tempActor());
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
        this, 0, cursorY, groupId, fallbackWidth, this.actor(), this.tempActor());
      cursorY += groupHeight + rowGap;
    });
  });
};
//endregion Window_EquipStatus
