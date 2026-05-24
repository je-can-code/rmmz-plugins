/**
 * Extends {@link DataManager.makeSaveContents}.<br/>
 * Reviews the save contents to ensure that there are no circular references.
 */
J.UTILS.Aliased.DataManager.set('makeSaveContents', DataManager.makeSaveContents);
DataManager.makeSaveContents = function()
{
  // perform original logic.
  const contents = J.UTILS.Aliased.DataManager.get('makeSaveContents')
    .call(this);

  // this is extremely noisy in the console, so gate it behind metadata check.
  if (J.UTILS.Metadata.useCircularSaveDataCheck)
  {
    // peek at all the contents
    console.log(contents);

    // usually the map is the offender, but you may need to check other properties.
    console.log(contents.map);

    // iterate over all the sub-offenders to see which is the culprit.
    for (const event of contents.map._events)
    {
      // peek at the details.
      console.log(event);

      // check their depth to see if they are causing circular problems.
      console.log(J.UTILS.Helpers.depth(event));
    }
  }

  // return the contents.
  return contents;
};