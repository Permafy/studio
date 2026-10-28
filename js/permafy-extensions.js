(function (global) {
    const parse = value => {
        if (typeof value !== 'string') return value;
        try {
            return JSON.parse(value);
        } catch (error) {
            return value;
        }
    };
    const pathParts = value => Array.isArray(value) ? value : String(value).split('/').filter(Boolean);
    const clone = value => JSON.parse(JSON.stringify(value));
    const deepEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);
    const text = (defaultValue = '') => ({type: 'string', defaultValue});
    const number = (defaultValue = 1) => ({type: 'number', defaultValue});
    const reporter = (opcode, blockText, argumentsMap = {}) => ({opcode, blockType: 'reporter', text: blockText, arguments: argumentsMap});
    const command = (opcode, blockText, argumentsMap = {}) => ({opcode, blockType: 'command', text: blockText, arguments: argumentsMap});

    class PermafyJSONExtension {
        constructor(runtime) {
            this.runtime = runtime;
        }

        getInfo() {
            return {
                id: 'json',
                name: 'JSON',
                color1: '#748BEE',
                color2: '#687DD6',
                color3: '#5C6FBE',
                blocks: [
                    reporter('array_item_of', 'item [INDEX] of [VALUE]', {INDEX: number(), VALUE: text('[]')}),
                    reporter('array_item_no_of', 'item # of [VALUE] in [ARRAY]', {VALUE: text('item'), ARRAY: text('[]')}),
                    {opcode: 'contains', blockType: 'Boolean', text: '[JSON] contains [VALUE]?', arguments: {JSON: text('{}'), VALUE: text('item')}},
                    reporter('length', 'length of [VALUE]', {VALUE: text('{}')}),
                    reporter('get_by_path', 'item by path [PATH] in [VALUE]', {PATH: text('[]'), VALUE: text('{}')}),
                    reporter('set_by_path', 'set to [ITEM] by path [PATH] in [VALUE]', {ITEM: text('item'), PATH: text('[]'), VALUE: text('{}')}),
                    reporter('stringify_spacer', 'stringify [VALUE] with spacer [SPACER]', {VALUE: text('{}'), SPACER: text('  ')}),
                    reporter('assign', 'for [MAIN] assign [INPUT1]', {MAIN: text('{}'), INPUT1: text('{}')}),
                    reporter('array_empty', 'empty array'),
                    reporter('array_split', 'array from [TEXT] separated by [DELIM]', {TEXT: text('apple,banana'), DELIM: text(',')}),
                    reporter('array_in_front_of', '[ITEM] in front of [ARRAY]', {ITEM: text('item'), ARRAY: text('[]')}),
                    reporter('array_behind', '[ITEM] behind [ARRAY]', {ITEM: text('item'), ARRAY: text('[]')}),
                    reporter('array_at', 'insert [ITEM] at [INDEX] of [ARRAY]', {ITEM: text('item'), INDEX: number(), ARRAY: text('[]')}),
                    reporter('array_delete', 'delete [INDEX] of [ARRAY]', {INDEX: number(), ARRAY: text('[]')}),
                    reporter('array_replace', 'replace item [INDEX] of [ARRAY] with [ITEM]', {INDEX: number(), ARRAY: text('[]'), ITEM: text('item')}),
                    reporter('array_expandable', 'array by values [INPUT1] [INPUT2]', {INPUT1: text('apple'), INPUT2: text('banana')}),
                    reporter('object_empty', 'empty object'),
                    reporter('object_split', 'object from [TEXT] with key [KEYDELIM] and pair [PAIRDELIM] separators', {TEXT: text('key:value'), KEYDELIM: text(':'), PAIRDELIM: text(',')}),
                    reporter('object_item_of', 'item of key [KEY] in [VALUE]', {KEY: text('key'), VALUE: text('{}')}),
                    {opcode: 'object_contains_key', blockType: 'Boolean', text: '[OBJECT] contains key [KEY]?', arguments: {OBJECT: text('{}'), KEY: text('key')}},
                    reporter('object_set', 'set key [KEY] to [ITEM] in [OBJECT]', {KEY: text('key'), ITEM: text('item'), OBJECT: text('{}')}),
                    reporter('object_delete', 'delete key [KEY] in [OBJECT]', {KEY: text('key'), OBJECT: text('{}')}),
                    reporter('object_entries', '[PROPERTY] of [OBJECT]', {PROPERTY: {type: 'string', defaultValue: 'entries', menu: 'objectEntriesMenu'}, OBJECT: text('{}')})
                ],
                menus: {
                    objectEntriesMenu: {
                        acceptReporters: false,
                        items: [
                            {text: 'entries', value: 'entries'},
                            {text: 'keys', value: 'keys'},
                            {text: 'values', value: 'values'}
                        ]
                    }
                }
            };
        }

        array_item_of(args) {
            const values = Array.isArray(parse(args.VALUE)) ? parse(args.VALUE) : [];
            const itemIndex = Number(args.INDEX) - 1;
            return itemIndex >= 0 && itemIndex < values.length ? values[itemIndex] : '';
        }

        array_item_no_of(args) {
            const values = Array.isArray(parse(args.ARRAY)) ? parse(args.ARRAY) : [];
            return values.findIndex(value => deepEqual(value, parse(args.VALUE))) + 1;
        }

        contains(args) {
            const json = parse(args.JSON);
            const value = parse(args.VALUE);
            if (Array.isArray(json)) return json.some(item => deepEqual(item, value));
            return Boolean(json && typeof json === 'object' && Object.values(json).some(item => deepEqual(item, value)));
        }

        length(args) {
            const value = parse(args.VALUE);
            return value && typeof value === 'object' ? Object.keys(value).length : 0;
        }

        get_by_path(args) {
            let value = parse(args.VALUE);
            for (const key of pathParts(args.PATH)) {
                if (Array.isArray(value)) {
                    const index = Number(key) - 1;
                    if (!Number.isInteger(index) || index < 0 || index >= value.length) return '';
                    value = value[index];
                } else if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key)) {
                    value = value[key];
                } else {
                    return '';
                }
            }
            return value;
        }

        set_by_path(args) {
            const original = parse(args.VALUE);
            const result = clone(original);
            const keys = pathParts(args.PATH);
            if (!keys.length) return result;
            let current = result;
            for (let cursor = 0; cursor < keys.length - 1; cursor++) {
                const key = keys[cursor];
                const next = keys[cursor + 1];
                if (Array.isArray(current)) {
                    const index = Number(key) - 1;
                    if (!Number.isInteger(index) || index < 0 || index > current.length) return original;
                    if (current[index] === undefined) current[index] = /^\d+$/.test(String(next)) ? [] : {};
                    current = current[index];
                } else if (current && typeof current === 'object') {
                    if (current[key] === undefined) current[key] = /^\d+$/.test(String(next)) ? [] : {};
                    current = current[key];
                } else {
                    return original;
                }
            }
            const last = keys[keys.length - 1];
            if (Array.isArray(current)) {
                const index = Number(last) - 1;
                if (!Number.isInteger(index) || index < 0 || index > current.length) return original;
                current[index] = parse(args.ITEM);
            } else if (current && typeof current === 'object') {
                current[last] = parse(args.ITEM);
            } else {
                return original;
            }
            return result;
        }

        stringify_spacer(args) {
            return JSON.stringify(parse(args.VALUE), null, args.SPACER);
        }

        assign(args) {
            const main = parse(args.MAIN);
            const inputs = Object.keys(args).filter(key => /^INPUT\d+$/.test(key)).sort().map(key => parse(args[key]));
            if (Array.isArray(main)) return main.concat(...inputs.map(value => Array.isArray(value) ? value : [value]));
            return Object.assign({}, main && typeof main === 'object' && !Array.isArray(main) ? main : {}, ...inputs);
        }

        array_empty() {
            return [];
        }

        array_split(args) {
            return String(args.TEXT).split(String(args.DELIM));
        }

        array_in_front_of(args) {
            const values = Array.isArray(parse(args.ARRAY)) ? parse(args.ARRAY) : [];
            return [parse(args.ITEM), ...values];
        }

        array_behind(args) {
            const values = Array.isArray(parse(args.ARRAY)) ? parse(args.ARRAY) : [];
            return [...values, parse(args.ITEM)];
        }

        array_at(args) {
            const values = Array.isArray(parse(args.ARRAY)) ? parse(args.ARRAY).slice() : [];
            const index = Number(args.INDEX) - 1;
            if (Number.isInteger(index) && index >= 0 && index <= values.length) values.splice(index, 0, parse(args.ITEM));
            return values;
        }

        array_delete(args) {
            const values = Array.isArray(parse(args.ARRAY)) ? parse(args.ARRAY).slice() : [];
            const rawIndex = String(args.INDEX).toLowerCase();
            if (rawIndex === 'all') return [];
            const index = rawIndex === 'last' ? values.length - 1 : Number(rawIndex) - 1;
            if (Number.isInteger(index) && index >= 0 && index < values.length) values.splice(index, 1);
            return values;
        }

        array_replace(args) {
            const values = Array.isArray(parse(args.ARRAY)) ? parse(args.ARRAY).slice() : [];
            const index = Number(args.INDEX) - 1;
            if (Number.isInteger(index) && index >= 0 && index < values.length) values[index] = parse(args.ITEM);
            return values;
        }

        array_expandable(args) {
            return Object.keys(args).filter(key => /^INPUT\d+$/.test(key)).sort().map(key => parse(args[key]));
        }

        object_empty() {
            return {};
        }

        object_split(args) {
            const object = {};
            const keyDelimiter = String(args.KEYDELIM);
            const pairDelimiter = String(args.PAIRDELIM);
            for (const pair of String(args.TEXT).split(pairDelimiter)) {
                const splitAt = pair.indexOf(keyDelimiter);
                if (splitAt < 0 || splitAt !== pair.lastIndexOf(keyDelimiter)) return {};
                object[pair.slice(0, splitAt)] = pair.slice(splitAt + keyDelimiter.length);
            }
            return object;
        }

        object_item_of(args) {
            const value = parse(args.VALUE);
            return value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, args.KEY) ? value[args.KEY] : '';
        }

        object_contains_key(args) {
            const value = parse(args.OBJECT);
            return Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, args.KEY));
        }

        object_set(args) {
            const value = parse(args.OBJECT);
            return {...(value && typeof value === 'object' && !Array.isArray(value) ? value : {}), [args.KEY]: parse(args.ITEM)};
        }

        object_delete(args) {
            const value = parse(args.OBJECT);
            const result = {...(value && typeof value === 'object' && !Array.isArray(value) ? value : {})};
            delete result[args.KEY];
            return result;
        }

        object_entries(args) {
            const value = parse(args.OBJECT);
            const object = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
            if (args.PROPERTY === 'keys') return Object.keys(object);
            if (args.PROPERTY === 'values') return Object.values(object);
            return Object.entries(object);
        }
    }

    class PermafyConsoleExtension {
        constructor(runtime) {
            this.runtime = runtime;
            this.lines = [];
        }

        getInfo() {
            return {
                id: 'console',
                name: 'Console',
                color1: '#6B8E5D',
                color2: '#57734C',
                color3: '#56724A',
                blocks: [
                    command('clear', 'clear console'),
                    command('addline', 'print line [LINE] to console', {LINE: text('Hello!')}),
                    command('addlineandmove', 'print line [LINE] to console and move cursor', {LINE: text('Hello!')}),
                    command('print', 'print [LINE] to console', {LINE: text('Hello!')}),
                    command('editline', 'edit line in console to [LINE]', {LINE: text('Hello!')}),
                    command('editsymbol', 'edit symbol in console to [VALUE]', {VALUE: text('a')}),
                    command('movecursor', 'move cursor to row: [ROW] symbol: [SYMBOL]', {ROW: number(), SYMBOL: number()}),
                    reporter('of', '[PROPERTY] of console', {PROPERTY: {type: 'string', defaultValue: 'content', menu: 'properties'}})
                ],
                menus: {
                    properties: {
                        acceptReporters: false,
                        items: [
                            {text: 'content', value: 'content'},
                            {text: 'max lines count', value: 'linescount'}
                        ]
                    }
                }
            };
        }

        log(textValue, type = 'log') {
            const text = String(textValue);
            this.lines.push(text);
            this.runtime.emit('PERMAFY_CONSOLE_LOG', {text, type});
        }

        clear() {
            this.lines = [];
            this.runtime.emit('PERMAFY_CONSOLE_CLEAR');
        }

        addline(args) { this.log(args.LINE); }
        addlineandmove(args) { this.log(args.LINE); }
        print(args) { this.log(args.LINE); }
        editline(args) { this.log(args.LINE); }
        editsymbol(args) { this.log(args.VALUE); }
        movecursor() {}

        of(args) {
            if (args.PROPERTY === 'linescount') return this.lines.length;
            return this.lines.slice();
        }
    }

    global.PermafyJSONExtension = PermafyJSONExtension;
    global.PermafyConsoleExtension = PermafyConsoleExtension;
}(window));
