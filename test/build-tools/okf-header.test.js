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
  renderStructBlock,
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
  it('writes every tag a parameter can set in the fleet\'s order, whatever order the page wrote them in', () =>
  {
    // Arrange
    const parameterPage = page('parameters/speed.md', {
      type: 'plugin-parameter',
      param: {
        default: 4,
        off: 'Slow',
        on: 'Fast',
        desc: 'How fast.',
        text: 'Speed',
        max: 9,
        min: -1,
        decimals: 2,
        options: [ { option: 'Brisk', value: 3 } ],
        dir: 'img/system',
        type: 'number',
        parent: 'movement',
        key: 'speed',
      },
    });

    // Act
    const lines = renderParameterBlock(parameterPage);

    // Assert
    expect(lines).toEqual([
      '@param speed',
      '@parent movement',
      '@type number',
      '@dir img/system',
      '@option Brisk',
      '@value 3',
      '@decimals 2',
      '@min -1',
      '@max 9',
      '@text Speed',
      '@desc How fast.',
      '@on Fast',
      '@off Slow',
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
      param: { key: 'speed', type: 'number', require: 1 },
    });

    // Act
    const render = () => renderParameterBlock(parameterPage);

    // Assert
    expect(render).toThrow('parameters/speed.md (param) has unknown key(s): require');
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

describe('tag values', () =>
{
  it('writes a value YAML read as blank as the bare tag, beside a tag that keeps its value', () =>
  {
    // Arrange
    const parameterPage = page('parameters/speed.md', {
      type: 'plugin-parameter',
      param: { key: 'speed', type: 'number', default: null },
    });

    // Act
    const lines = renderParameterBlock(parameterPage);

    // Assert
    expect(lines).toEqual([ '@param speed', '@type number', '@default' ]);
  });

  it('writes an empty string as the bare tag too', () =>
  {
    // Arrange
    const parameterPage = page('parameters/speed.md', {
      type: 'plugin-parameter',
      param: { key: 'speed', text: 'Speed', desc: '' },
    });

    // Act
    const lines = renderParameterBlock(parameterPage);

    // Assert
    expect(lines).toEqual([ '@param speed', '@text Speed', '@desc' ]);
  });

  it('keeps a multi-line value\'s line breaks, writing each further line beneath its tag', () =>
  {
    // Arrange
    const parameterPage = page('parameters/speed.md', {
      type: 'plugin-parameter',
      param: { key: 'speed', desc: 'How fast the walker goes.\nFaster costs more.', default: 4 },
    });

    // Act
    const lines = renderParameterBlock(parameterPage);

    // Assert
    expect(lines).toEqual([ '@param speed', '@desc How fast the walker goes.', 'Faster costs more.', '@default 4' ]);
  });

  it('leaves the tag bare when a multi-line value starts on the line below it', () =>
  {
    // Arrange
    const commandPage = page('commands/set-skill.md', {
      type: 'plugin-command',
      command: { key: 'setSkill', text: 'Set Skill', desc: '\nChanges a skill in a slot.\nAny slot works.' },
    });

    // Act
    const lines = renderCommandBlock(commandPage);

    // Assert
    expect(lines).toEqual([
      '@command setSkill',
      '@text Set Skill',
      '@desc',
      'Changes a skill in a slot.',
      'Any slot works.',
    ]);
  });

  it('drops the line break a YAML block value ends with, rather than writing an empty line', () =>
  {
    // Arrange
    const parameterPage = page('parameters/speed.md', {
      type: 'plugin-parameter',
      param: { key: 'speed', desc: 'How fast the walker goes.\nFaster costs more.\n', default: 4 },
    });

    // Act
    const lines = renderParameterBlock(parameterPage);

    // Assert
    expect(lines).toEqual([ '@param speed', '@desc How fast the walker goes.', 'Faster costs more.', '@default 4' ]);
  });

  it('throws, naming the tag, when a value is a list, the way an unquoted [] default reads in YAML', () =>
  {
    // Arrange
    const parameterPage = page('parameters/icons.md', {
      type: 'plugin-parameter',
      param: { key: 'icons', type: 'number[]', default: [] },
    });

    // Act
    const render = () => renderParameterBlock(parameterPage);

    // Assert
    expect(render).toThrow('parameters/icons.md (param) default is a list or a mapping; quote it to keep it as text');
  });
});

describe('options', () =>
{
  it('writes each option in the order the page lists them, with its value beneath it only when it has one', () =>
  {
    // Arrange
    const parameterPage = page('parameters/precision.md', {
      type: 'plugin-parameter',
      param: {
        key: 'precision',
        type: 'select',
        options: [ { option: 'Coarse', value: 1 }, { option: 'Fine' }, { option: '' } ],
      },
    });

    // Act
    const lines = renderParameterBlock(parameterPage);

    // Assert
    expect(lines).toEqual([
      '@param precision',
      '@type select',
      '@option Coarse',
      '@value 1',
      '@option Fine',
      '@option',
    ]);
  });

  it('throws, naming the option, when an option carries a field the header does not know', () =>
  {
    // Arrange
    const parameterPage = page('parameters/precision.md', {
      type: 'plugin-parameter',
      param: { key: 'precision', type: 'select', options: [ { option: 'Coarse' }, { option: 'Fine', text: 'F' } ] },
    });

    // Act
    const render = () => renderParameterBlock(parameterPage);

    // Assert
    expect(render).toThrow('parameters/precision.md (param) options[1] has unknown key(s): text');
  });

  it('throws, naming the option, when an option has no text to offer', () =>
  {
    // Arrange
    const parameterPage = page('parameters/precision.md', {
      type: 'plugin-parameter',
      param: { key: 'precision', type: 'select', options: [ { option: 'Coarse' }, { value: 2 } ] },
    });

    // Act
    const render = () => renderParameterBlock(parameterPage);

    // Assert
    expect(render).toThrow('parameters/precision.md (param) options[1] is missing its option');
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
          { desc: 'How many.', key: 'amount', text: 'Amount', max: 99, min: 0, type: 'number' },
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
      '@text Amount',
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

  it('throws, naming the argument, when an argument carries a key only a parameter can have', () =>
  {
    // Arrange
    const commandPage = page('commands/give.md', {
      type: 'plugin-command',
      command: {
        key: 'give',
        args: [
          { key: 'actorId', type: 'actor' },
          { key: 'amount', type: 'number', parent: 'quantities' },
        ],
      },
    });

    // Act
    const render = () => renderCommandBlock(commandPage);

    // Assert
    expect(render).toThrow('commands/give.md (args[1]) has unknown key(s): parent');
  });
});

describe('renderStructBlock', () =>
{
  it('writes the struct as a comment of its own, its fields set apart by an empty comment line', () =>
  {
    // Arrange
    const structPage = page('structs/sound-effect.md', {
      type: 'plugin-struct',
      struct: {
        key: 'soundEffect',
        params: [
          { key: 'name', type: 'file', dir: 'audio/se', default: '' },
          { key: 'volume', default: 90, text: 'Volume', max: 100, min: 0, type: 'number' },
        ],
      },
    });

    // Act
    const lines = renderStructBlock(structPage);

    // Assert
    expect(lines).toEqual([
      '/*~struct~soundEffect:',
      ' * @param name',
      ' * @type file',
      ' * @dir audio/se',
      ' * @default',
      ' *',
      ' * @param volume',
      ' * @type number',
      ' * @min 0',
      ' * @max 100',
      ' * @text Volume',
      ' * @default 90',
      ' */',
    ]);
  });

  it('throws, naming the page, when a struct page has no struct block', () =>
  {
    // Arrange
    const structPage = page('structs/sound-effect.md', { type: 'plugin-struct' });

    // Act
    const render = () => renderStructBlock(structPage);

    // Assert
    expect(render).toThrow('structs/sound-effect.md has no struct block');
  });

  it('throws, naming the key, when the struct block carries a key the header cannot write', () =>
  {
    // Arrange
    const structPage = page('structs/sound-effect.md', {
      type: 'plugin-struct',
      struct: { key: 'soundEffect', text: 'Sound Effect', params: [ { key: 'name', type: 'file' } ] },
    });

    // Act
    const render = () => renderStructBlock(structPage);

    // Assert
    expect(render).toThrow('structs/sound-effect.md (struct) has unknown key(s): text');
  });

  it('throws when the struct has no params list at all', () =>
  {
    // Arrange
    const structPage = page('structs/sound-effect.md', { type: 'plugin-struct', struct: { key: 'soundEffect' } });

    // Act
    const render = () => renderStructBlock(structPage);

    // Assert
    expect(render).toThrow('structs/sound-effect.md (struct) has no params');
  });

  it('throws when the struct\'s params list is empty', () =>
  {
    // Arrange
    const structPage = page('structs/sound-effect.md', {
      type: 'plugin-struct',
      struct: { key: 'soundEffect', params: [] },
    });

    // Act
    const render = () => renderStructBlock(structPage);

    // Assert
    expect(render).toThrow('structs/sound-effect.md (struct) has no params');
  });

  it('throws, naming the field, when a struct field carries a key only a parameter can have', () =>
  {
    // Arrange
    const structPage = page('structs/sound-effect.md', {
      type: 'plugin-struct',
      struct: {
        key: 'soundEffect',
        params: [
          { key: 'name', type: 'file' },
          { key: 'volume', type: 'number', parent: 'levels' },
        ],
      },
    });

    // Act
    const render = () => renderStructBlock(structPage);

    // Assert
    expect(render).toThrow('structs/sound-effect.md (params[1]) has unknown key(s): parent');
  });
});

describe('renderDependencyLines', () =>
{
  it('writes every base, then every orderAfter, then every orderBefore, each in the order the page lists them', () =>
  {
    // Arrange
    const pages = [
      page('dependencies.md', {
        type: 'dependencies',
        dependencies: [
          { key: 'J-Ahead', orderBefore: true },
          { key: 'J-Required', version: '1.0.0', base: true, orderAfter: false },
          { key: 'J-Optional', version: '2.0.0', base: false, orderAfter: true, orderBefore: false },
          { key: 'J-Both', version: '3.0.0', base: true, orderAfter: true },
          { key: 'J-Neither', version: '4.0.0', base: false, orderAfter: false, orderBefore: false },
          { key: 'J-AlsoAhead', base: false, orderBefore: true },
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
      '@orderBefore J-Ahead',
      '@orderBefore J-AlsoAhead',
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
          { key: 'J-Log', orderafter: true },
        ],
      }),
    ];

    // Act
    const render = () => renderDependencyLines(pages);

    // Assert
    expect(render).toThrow('dependencies.md (dependencies[1]) has unknown key(s): orderafter');
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
  it('renders the complete header: identity, dependencies, help, parameters, commands, then structs in index order', () =>
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
        '',
        '# plugin-struct',
        '',
        '* [Zeta](structs/zeta.md) - Listed first.',
        '* [Alpha](structs/alpha.md) - Listed second.',
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
        page('structs/alpha.md', {
          type: 'plugin-struct',
          struct: { key: 'Alpha', params: [ { key: 'first', type: 'number' } ] },
        }),
        page('structs/zeta.md', {
          type: 'plugin-struct',
          struct: { key: 'Zeta', params: [ { key: 'last', type: 'string' } ] },
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
      '/*~struct~Zeta:',
      ' * @param last',
      ' * @type string',
      ' */',
      '/*~struct~Alpha:',
      ' * @param first',
      ' * @type number',
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
