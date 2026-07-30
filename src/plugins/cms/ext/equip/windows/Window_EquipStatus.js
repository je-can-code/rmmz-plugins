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
 * This window uses a two-column layout, and the elements and ailments the actor deviates from the
 * baseline on are drawn beneath the grid rather than in a third column. Equipment is the main thing
 * that moves those numbers, so this is where they belong- and only deviations are listed, so an actor
 * wearing nothing unusual costs two short "all standard" lines rather than fifty rows.
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

    // the affiliations sit beneath the grid, sharing its two columns.
    this.drawAffiliations(columnXs, cursorY, columnLayout.columnWidth);

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

  // stacked too, when there is not room to sit them side by side.
  const stackedHalf = Math.floor((fallbackWidth - 16) / 2);
  this.drawAffiliations([ 0, stackedHalf + 16 ], cursorY, stackedHalf);
};

/**
 * Draws the element and ailment affiliations beneath the parameter grid.
 *
 * Only entries deviating from the 100% baseline appear, so this occupies the space it earns- a
 * character with no unusual resistances shows two short lines rather than an inventory of nothing.
 * @param {number[]} columnXs The x coordinate of each column.
 * @param {number} y The y coordinate to begin drawing at.
 * @param {number} columnWidth The width of a single column.
 */
Window_EquipStatus.prototype.drawAffiliations = function(columnXs, y, columnWidth)
{
  // leave a little air between the last catalog group and these.
  const affiliationY = y + 8;

  ParameterCatalogRenderer.drawElementAffiliations(this, this.actor(), columnXs[0], affiliationY, columnWidth);
  ParameterCatalogRenderer.drawAilmentAffiliations(this, this.actor(), columnXs[1], affiliationY, columnWidth);
};
//endregion Window_EquipStatus
