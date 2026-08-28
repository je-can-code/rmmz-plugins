//region plugins/_base/core/save/fixtures/install-fake-save-filesystem.js
/**
 * An in-memory stand-in for the `fs*` helpers {@link SaveFileSystem} reaches through
 * {@link StorageManager}.
 *
 * The point is not to avoid touching a disk - it is that every crash-injection case needs a write to
 * fail at an exact step, and counting writes is the only way to say "fail on the fourth one" without
 * guessing at filenames. Reads are counted too, so a test can assert the load menu never opened a
 * world.
 * @returns {object} The fake, with its own bookkeeping exposed for assertions.
 */
export function installFakeSaveFilesystem()
{
  const files = new Map();
  const directories = new Set([ 'save/' ]);

  const withTrailingSlash = path => path.endsWith('/')
    ? path
    : `${path}/`;

  const fake = {
    files,
    directories,

    /**
     * How many writes have happened, so a test can inject a failure at an exact step.
     */
    writeCount: 0,

    /**
     * The write index to throw on, or zero to never throw.
     */
    failOnWrite: 0,

    /**
     * Every path handed to a read, in order.
     */
    reads: [],
  };

  const storageManager = {
    fileDirectoryPath: () => 'save/',

    fsExists: path => files.has(path) || directories.has(withTrailingSlash(path)),

    fsIsDirectory: path => directories.has(withTrailingSlash(path)),

    fsMkdirRecursive: path =>
    {
      // every ancestor comes into existence with the leaf, the same way `recursive: true` behaves.
      const segments = withTrailingSlash(path)
        .split('/')
        .filter(segment => segment !== '');

      segments.reduce((accumulated, segment) =>
      {
        const next = `${accumulated}${segment}/`;
        directories.add(next);

        return next;
      }, '');
    },

    fsReaddir: path =>
    {
      const prefix = withTrailingSlash(path);

      // the real implementation is fs.readdirSync, which throws ENOENT rather than answering empty.
      // a fake that quietly returns [] here lets callers drop their own existence checks without any
      // test noticing, which is the whole reason those checks exist.
      if (directories.has(prefix) === false)
      {
        const error = new Error(`ENOENT: no such file or directory, scandir '${path}'`);
        error.code = 'ENOENT';

        throw error;
      }

      const entries = new Set();

      const collect = candidate =>
      {
        if (candidate.startsWith(prefix) === false) return;

        const remainder = candidate.slice(prefix.length);

        if (remainder === '') return;

        entries.add(remainder.split('/')[0]);
      };

      files.forEach((contents, candidate) => collect(candidate));
      directories.forEach(candidate => collect(candidate));

      return [ ...entries ];
    },

    fsWriteFileSynced: (path, contents) =>
    {
      fake.writeCount += 1;

      if (fake.writeCount === fake.failOnWrite)
      {
        throw new Error(`injected failure on write ${fake.writeCount}`);
      }

      files.set(path, contents);
    },

    fsSyncDirectory: () =>
    {
    },

    fsReadFile: path =>
    {
      fake.reads.push(path);

      if (files.has(path) === false) return null;

      return files.get(path);
    },

    fsRename: (oldPath, newPath) =>
    {
      if (files.has(oldPath) === false) return;

      files.set(newPath, files.get(oldPath));
      files.delete(oldPath);
    },

    fsUnlink: path =>
    {
      files.delete(path);
    },

    fsRemoveDirectory: path =>
    {
      const prefix = withTrailingSlash(path);

      [ ...files.keys() ].filter(candidate => candidate.startsWith(prefix))
        .forEach(candidate => files.delete(candidate));

      [ ...directories ].filter(candidate => candidate.startsWith(prefix))
        .forEach(candidate => directories.delete(candidate));
    },
  };

  globalThis.StorageManager = storageManager;

  fake.storageManager = storageManager;

  return fake;
}
//endregion plugins/_base/core/save/fixtures/install-fake-save-filesystem.js