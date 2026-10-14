//region build-tools/okf-header.test.js
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  buildBookUrl,
  extractFrontmatter,
  hasBook,
  orderPagesOfType,
  readIndexOrder,
  renderCommandBlock,
  renderDependencyLines,
  renderHeader,
  renderParameterBlock,
  resolveBookDirectory,
  resolveShipPath,
} from '../../src/build-tools/okf-header.js';

/**
 * Builds a parsed page the way the book reader hands pages to the renderer.
 * @param {string} pagePath The page's path inside its book.
 * @param {object} data The page's parsed frontmatter.
 * @returns {{ path: string, data: object }} The page.
 */
const page = (pagePath, data) => ({ path: pagePath, data });

/**
 * A complete set of the `meta.js` exports a ship with a book provides.
 * @returns {Record<string, string>} Fresh meta exports, safe for a test to alter.
 */
const completeMeta = () => ({
  PLUGIN_NAME: 'J-Test',
  PLUGIN_VERSION: '1.2.3',
  PLUGIN_DESC_TAG: 'TST',
  PLUGIN_DESCRIPTION: 'A plugin for tests.',
});

describe('extractFrontmatter', () =>
{
  it('returns only the frontmatter, even when the body has a rule of its own further down', () =>
  {
    // Arrange
    const text = [ '---', 'type: notetag', 'title: AP', '---', '', '# AP', '', '---', '', 'More body.' ].join('\n');

    // Act
    const frontmatter = extractFrontmatter(text, 'notetags/ap.md');

    // Assert
    expect(frontmatter).toBe('type: notetag\ntitle: AP');
  });

  it('throws, naming the page, when the page does not open with frontmatter', () =>
  {
    // Arrange
    const text = '# AP\n\n---\ntype: notetag\n---\n';

    // Act
    const extract = () => extractFrontmatter(text, 'notetags/ap.md');

    // Assert
    expect(extract).toThrow('notetags/ap.md has no frontmatter block');
  });
});

describe('readIndexOrder', () =>
{
  it('lists every linked page in the order the index lists them, with "./" normalized away', () =>
  {
    // Arrange
    const indexText = [
      '# plugin-command',
      '',
      '* [Second](commands/second.md) - Listed first.',
      '* [First](./commands/first.md) - Listed second.',
      '',
      '# overview',
      '',
      '* [Overview](overview.md) - Listed last.',
    ].join('\n');

    // Act
    const order = readIndexOrder(indexText);

    // Assert
    expect(order).toEqual([ 'commands/second.md', 'commands/first.md', 'overview.md' ]);
  });
});

describe('orderPagesOfType', () =>
{
  it('returns only the pages of the requested type, in the order the index lists them', () =>
  {
    // Arrange
    const pages = [
      page('commands/first.md', { type: 'plugin-command' }),
      page('overview.md', { type: 'overview' }),
      page('commands/second.md', { type: 'plugin-command' }),
    ];
    const indexOrder = [ 'commands/second.md', 'overview.md', 'commands/first.md' ];

    // Act
    const ordered = orderPagesOfType(pages, indexOrder, 'plugin-command');

    // Assert
    expect(ordered.map(orderedPage => orderedPage.path)).toEqual([ 'commands/second.md', 'commands/first.md' ]);
  });

  it('throws, naming the page, when a page of the requested type is missing from the index', () =>
  {
    // Arrange
    const pages = [
      page('commands/listed.md', { type: 'plugin-command' }),
      page('commands/forgotten.md', { type: 'plugin-command' }),
      page('overview.md', { type: 'overview' }),
    ];
    const indexOrder = [ 'commands/listed.md' ];

    // Act
    const order = () => orderPagesOfType(pages, indexOrder, 'plugin-command');

    // Assert
    expect(order).toThrow('index.md does not list commands/forgotten.md');
  });
});

describe('renderParameterBlock', () =>
{
  it('writes every tag the parameter sets in MZ order, whatever order the page wrote them in', () =>
  {
    // Arrange
    const parameterPage = page('parameters/speed.md', {
      type: 'plugin-parameter',
      param: { default: 4, desc: 'How fast.', key: 'speed', min: -1, text: 'Speed', type: 'number', parent: 'movement' },
    });

    // Act
    const lines = renderParameterBlock(parameterPage);

    // Assert
    expect(lines).toEqual([
      '@param speed',
      '@parent movement',
      '@type number',
      '@text Speed',
      '@desc How fast.',
      '@min -1',
      '@default 4',
    ]);
  });

  it('throws, naming the page, when a parameter page has no param block', () =>
  {
    // Arrange
    const parameterPage = page('parameters/speed.md', { type: 'plugin-parameter' });

    // Act
    const render = () => renderParameterBlock(parameterPage);

    // Assert
    expect(render).toThrow('parameters/speed.md has no param block');
  });

  it('throws, naming the key, when the param block carries a key the header cannot write', () =>
  {
    // Arrange
    const parameterPage = page('parameters/speed.md', {
      type: 'plugin-parameter',
      param: { key: 'speed', type: 'number', decimals: 2 },
    });

    // Act
    const render = () => renderParameterBlock(parameterPage);

    // Assert
    expect(render).toThrow('parameters/speed.md (param) has unknown key(s): decimals');
  });

  it('throws when the param block has no key at all', () =>
  {
    // Arrange
    const parameterPage = page('parameters/speed.md', { type: 'plugin-parameter', param: { type: 'number' } });

    // Act
    const render = () => renderParameterBlock(parameterPage);

    // Assert
    expect(render).toThrow('parameters/speed.md (param) is missing its key');
  });

  it('throws when the param block has an empty key', () =>
  {
    // Arrange
    const parameterPage = page('parameters/speed.md', { type: 'plugin-parameter', param: { key: '', type: 'number' } });

    // Act
    const render = () => renderParameterBlock(parameterPage);

    // Assert
    expect(render).toThrow('parameters/speed.md (param) is missing its key');
  });
});

describe('renderCommandBlock', () =>
{
  it('writes only the command\'s own tags when it takes no arguments', () =>
  {
    // Arrange
    const commandPage = page('commands/refresh.md', {
      type: 'plugin-command',
      command: { desc: 'Refreshes everything.', key: 'refresh', text: 'Refresh' },
    });

    // Act
    const lines = renderCommandBlock(commandPage);

    // Assert
    expect(lines).toEqual([ '@command refresh', '@text Refresh', '@desc Refreshes everything.' ]);
  });

  it('writes each argument after the command\'s own tags, in the order the page lists them', () =>
  {
    // Arrange
    const commandPage = page('commands/give.md', {
      type: 'plugin-command',
      command: {
        key: 'give',
        text: 'Give',
        args: [
          { key: 'actorId', default: 1, type: 'actor' },
          { desc: 'How many.', key: 'amount', max: 99, min: 0, type: 'number' },
        ],
      },
    });

    // Act
    const lines = renderCommandBlock(commandPage);

    // Assert
    expect(lines).toEqual([
      '@command give',
      '@text Give',
      '@arg actorId',
      '@type actor',
      '@default 1',
      '@arg amount',
      '@type number',
      '@min 0',
      '@max 99',
      '@desc How many.',
    ]);
  });

  it('throws, naming the page, when a command page has no command block', () =>
  {
    // Arrange
    const commandPage = page('commands/give.md', { type: 'plugin-command' });

    // Act
    const render = () => renderCommandBlock(commandPage);

    // Assert
    expect(render).toThrow('commands/give.md has no command block');
  });

  it('throws, naming the argument, when an argument carries a key the header cannot write', () =>
  {
    // Arrange
    const commandPage = page('commands/give.md', {
      type: 'plugin-command',
      command: {
        key: 'give',
        args: [
          { key: 'actorId', type: 'actor' },
          { key: 'amount', type: 'number', decimals: 2 },
        ],
      },
    });

    // Act
    const render = () => renderCommandBlock(commandPage);

    // Assert
    expect(render).toThrow('commands/give.md (args[1]) has unknown key(s): decimals');
  });
});

describe('renderDependencyLines', () =>
{
  it('writes every base first and every orderAfter second, each in the order the page lists them', () =>
  {
    // Arrange
    const pages = [
      page('dependencies.md', {
        type: 'dependencies',
        dependencies: [
          { key: 'J-Required', version: '1.0.0', base: true, orderAfter: false },
          { key: 'J-Optional', version: '2.0.0', base: false, orderAfter: true },
          { key: 'J-Both', version: '3.0.0', base: true, orderAfter: true },
          { key: 'J-Neither', version: '4.0.0', base: false, orderAfter: false },
        ],
      }),
    ];

    // Act
    const lines = renderDependencyLines(pages);

    // Assert
    expect(lines).toEqual([
      '@base J-Required',
      '@base J-Both',
      '@orderAfter J-Optional',
      '@orderAfter J-Both',
    ]);
  });

  it('declares nothing when the book has no dependencies page, even if another page lists dependencies', () =>
  {
    // Arrange
    const pages = [
      page('overview.md', {
        type: 'overview',
        dependencies: [ { key: 'J-Base', base: true, orderAfter: true } ],
      }),
    ];

    // Act
    const lines = renderDependencyLines(pages);

    // Assert
    expect(lines).toEqual([]);
  });

  it('declares nothing when the dependencies page has no list', () =>
  {
    // Arrange
    const pages = [ page('dependencies.md', { type: 'dependencies', title: 'Dependencies' }) ];

    // Act
    const lines = renderDependencyLines(pages);

    // Assert
    expect(lines).toEqual([]);
  });

  it('throws, naming both pages, when a book has more than one dependencies page', () =>
  {
    // Arrange
    const pages = [
      page('dependencies.md', { type: 'dependencies', dependencies: [] }),
      page('more/dependencies.md', { type: 'dependencies', dependencies: [] }),
    ];

    // Act
    const render = () => renderDependencyLines(pages);

    // Assert
    expect(render).toThrow('this one has dependencies.md, more/dependencies.md');
  });

  it('throws, naming the entry, when a dependency carries a field the header does not know', () =>
  {
    // Arrange
    const pages = [
      page('dependencies.md', {
        type: 'dependencies',
        dependencies: [
          { key: 'J-Base', base: true },
          { key: 'J-Log', orderBefore: true },
        ],
      }),
    ];

    // Act
    const render = () => renderDependencyLines(pages);

    // Assert
    expect(render).toThrow('dependencies.md (dependencies[1]) has unknown key(s): orderBefore');
  });
});

describe('buildBookUrl', () =>
{
  it('points at the book\'s index on GitHub, under the same path the ship has under src/plugins', () =>
  {
    // Arrange
    const shipPath = 'apt/ext/typed';

    // Act
    const url = buildBookUrl(shipPath);

    // Assert
    expect(url).toBe('https://github.com/je-can-code/rmmz-plugins/blob/main/docs/plugins/apt/ext/typed/index.md');
  });
});

describe('renderHeader', () =>
{
  it('renders the complete header: identity, dependencies, help, then parameters and commands in index order', () =>
  {
    // Arrange
    const book = {
      indexText: [
        '# plugin-command',
        '',
        '* [Second](commands/second.md) - Listed first.',
        '* [First](./commands/first.md) - Listed second.',
        '',
        '# plugin-parameter',
        '',
        '* [Speed](parameters/speed.md) - The only parameter.',
      ].join('\n'),
      pages: [
        page('commands/first.md', {
          type: 'plugin-command',
          command: { key: 'first', text: 'First', desc: 'Runs first.' },
        }),
        page('commands/second.md', {
          type: 'plugin-command',
          command: {
            desc: 'Runs second.',
            key: 'second',
            text: 'Second',
            args: [ { key: 'count', default: 3, type: 'number', desc: 'How many.' } ],
          },
        }),
        page('dependencies.md', {
          type: 'dependencies',
          dependencies: [
            { key: 'J-Base', version: '1.0.0', base: true, orderAfter: true },
            { key: 'J-Log', version: '3.0.0', base: false, orderAfter: true },
          ],
        }),
        page('overview.md', { type: 'overview', title: 'Overview' }),
        page('parameters/speed.md', {
          type: 'plugin-parameter',
          param: { key: 'speed', default: 4, type: 'number', text: 'Speed' },
        }),
      ],
    };

    // Act
    const header = renderHeader(book, completeMeta(), 'test/core');

    // Assert
    expect(header).toBe([
      '//region annotations',
      '/*:',
      ' * @target MZ',
      ' * @plugindesc',
      ' * [v1.2.3 TST] A plugin for tests.',
      ' * @author JE',
      ' * @url https://github.com/je-can-code/rmmz-plugins',
      ' * @base J-Base',
      ' * @orderAfter J-Base',
      ' * @orderAfter J-Log',
      ' * @help',
      ' * ============================================================================',
      ' * Please refer to J-Test\'s book for more details:',
      ' * https://github.com/je-can-code/rmmz-plugins/blob/main/docs/plugins/test/core/index.md',
      ' * ============================================================================',
      ' *',
      ' * @param speed',
      ' * @type number',
      ' * @text Speed',
      ' * @default 4',
      ' *',
      ' * @command second',
      ' * @text Second',
      ' * @desc Runs second.',
      ' * @arg count',
      ' * @type number',
      ' * @desc How many.',
      ' * @default 3',
      ' *',
      ' * @command first',
      ' * @text First',
      ' * @desc Runs first.',
      ' */',
      '//endregion annotations',
    ].join('\n'));
  });

  it('writes no block separators when the book has no parameters or commands', () =>
  {
    // Arrange
    const book = {
      indexText: '# overview\n\n* [Overview](overview.md) - The only page.',
      pages: [ page('overview.md', { type: 'overview', title: 'Overview' }) ],
    };

    // Act
    const header = renderHeader(book, completeMeta(), 'test/core');

    // Assert
    expect(header).toBe([
      '//region annotations',
      '/*:',
      ' * @target MZ',
      ' * @plugindesc',
      ' * [v1.2.3 TST] A plugin for tests.',
      ' * @author JE',
      ' * @url https://github.com/je-can-code/rmmz-plugins',
      ' * @help',
      ' * ============================================================================',
      ' * Please refer to J-Test\'s book for more details:',
      ' * https://github.com/je-can-code/rmmz-plugins/blob/main/docs/plugins/test/core/index.md',
      ' * ============================================================================',
      ' */',
      '//endregion annotations',
    ].join('\n'));
  });

  it('throws, naming the field, when meta.js is missing a field a ship with a book needs', () =>
  {
    // Arrange
    const book = { indexText: '', pages: [] };
    const meta = completeMeta();
    delete meta.PLUGIN_DESCRIPTION;

    // Act
    const render = () => renderHeader(book, meta, 'test/core');

    // Assert
    expect(render).toThrow('test/core\'s meta.js is missing PLUGIN_DESCRIPTION,');
  });

  it('throws, naming the field, when a meta.js field is present but empty', () =>
  {
    // Arrange
    const book = { indexText: '', pages: [] };
    const meta = { ...completeMeta(), PLUGIN_DESC_TAG: '' };

    // Act
    const render = () => renderHeader(book, meta, 'test/core');

    // Assert
    expect(render).toThrow('test/core\'s meta.js is missing PLUGIN_DESC_TAG,');
  });
});

describe('resolveShipPath', () =>
{
  it('returns the ship\'s path under src/plugins, with forward slashes', () =>
  {
    // Arrange
    const shipDirectory = '/work/rmmz-plugins/src/plugins/apt/ext/typed';

    // Act
    const shipPath = resolveShipPath(shipDirectory);

    // Assert
    expect(shipPath).toBe('apt/ext/typed');
  });

  it('throws when the directory is not inside src/plugins', () =>
  {
    // Arrange
    const shipDirectory = '/work/rmmz-plugins/src/build-tools';

    // Act
    const resolve = () => resolveShipPath(shipDirectory);

    // Assert
    expect(resolve).toThrow('/work/rmmz-plugins/src/build-tools is not inside src/plugins');
  });
});

describe('resolveBookDirectory', () =>
{
  it('mirrors the ship\'s path from src/plugins into docs/plugins', () =>
  {
    // Arrange
    const shipDirectory = '/work/rmmz-plugins/src/plugins/apt/core';

    // Act
    const bookDirectory = resolveBookDirectory(shipDirectory);

    // Assert
    expect(bookDirectory).toBe('/work/rmmz-plugins/docs/plugins/apt/core');
  });
});

describe('hasBook', () =>
{
  const temporaryRoots = [];

  afterEach(() =>
  {
    temporaryRoots.splice(0)
      .forEach(root => fs.rmSync(root, { recursive: true, force: true }));
  });

  /**
   * Lays out a throwaway repository holding one ship, with or without an index in its book folder.
   * @param {boolean} withIndex Whether the book folder gets an `index.md`.
   * @returns {string} The ship's root directory.
   */
  const layOutShip = withIndex =>
  {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'okf-header-'));
    temporaryRoots.push(root);

    const shipDirectory = path.join(root, 'src', 'plugins', 'apt', 'core');
    const bookDirectory = path.join(root, 'docs', 'plugins', 'apt', 'core');
    fs.mkdirSync(shipDirectory, { recursive: true });
    fs.mkdirSync(bookDirectory, { recursive: true });
    fs.writeFileSync(path.join(bookDirectory, 'overview.md'), '---\ntype: overview\n---\n');
    if (withIndex === true) fs.writeFileSync(path.join(bookDirectory, 'index.md'), '# overview\n');

    return shipDirectory;
  };

  it('is true when the ship\'s book folder has an index', () =>
  {
    // Arrange
    const shipDirectory = layOutShip(true);

    // Act
    const result = hasBook(shipDirectory);

    // Assert
    expect(result).toBe(true);
  });

  it('is false when the book folder exists but has no index yet', () =>
  {
    // Arrange
    const shipDirectory = layOutShip(false);

    // Act
    const result = hasBook(shipDirectory);

    // Assert
    expect(result).toBe(false);
  });
});
//endregion build-tools/okf-header.test.js
