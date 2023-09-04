//region StorageManager
/**
 * Checks whether or not a file exists given the path with the file name.
 * @param {string} pathWithFile The path including the filename and extension.
 * @returns {boolean} True if the file is present, false otherwise.
 */
StorageManager.fileExists = function(pathWithFile)
{
  // import the "fs" nodejs library.
  const fs = require("fs");

  // return whether or not a file exists at the given path.
  return fs.existsSync(pathWithFile);
};
//endregion StorageManager