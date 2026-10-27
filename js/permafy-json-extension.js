(function (global) {
    const parse = value => {
        if (typeof value !== 'string') return value;
        try {
            return JSON.parse(value);
        } catch (error) {
            return value;
        }
    };
    const output = value => value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
    const array = value => {
        const parsed = parse(value);
        return Array.isArray(parsed) ? parsed : [];
    };
    const object = value => {
        const parsed = parse(value);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    };
    const index = (value, length, allowEnd) => {
        const number = Math.floor(Number(value));
        return Number.isFinite(number) && number >= 1 && number <= length + (allowEnd ? 1 : 0) ? number - 1 : -1;
    };
    const path = value => {
        const parsed = parse(value);
        if (Array.isArray(parsed)) return parsed;
        return String(value).split('/').filter(Boolean);
    };
    const stringify = (value, space) => JSON.stringify(parse(value), null, space);

    class PermafyJSONExtension {
        getInfo() {
            const text = (defaultValue = '') => ({type: 'string', defaultValue});
            const number = defaultValue => ({type: 'number', defaultValue});
            return {
                id: 'json',
                name: 'JSON',
                color1: '#748BEE',
                color2: '#687DD6',
                color3: '#5C6FBE',
                blocks: [
                    {opcode: 'contains', blockType: 'Boolean', text: 'does [JSON] contain [VALUE]?', arguments: {JSON: text('{}'), VALUE: text('item')}},
                    {opcode: 'length', blockType: 'reporter', text: 'length of [VALUE]', arguments: {VALUE: text('{}')}},
                    {opcode: 'stringify_spacer', blockType: 'reporter', text: 'stringify [VALUE] with spacer [SPACER]', arguments: {VALUE: text('{}'), SPACER: text('  ')}},
                    {opcode: 'assign', blockType: 'reporter', text: 'combine [MAIN] and [INPUT1]', arguments: {MAIN: text('{}'), INPUT1: text('{}')}},
                    {opcode: 'get_by_path', blockType: 'reporter', text: 'get path [PATH] from [VALUE]', arguments: {PATH: text('key'), VALUE: text('{}')}},
                    {opcode: 'set_by_path', blockType: 'reporter', text: 'set path [PATH] to [ITEM] in [VALUE]', arguments: {PATH: text('key'), ITEM: text('item'), VALUE: text('{}')}},
                    {opcode: 'array_empty', blockType: 'reporter', text: 'empty array'},
                    {opcode: 'array_expandable', blockType: 'reporter', text: 'array with [INPUT1] and [INPUT2]', arguments: {INPUT1: text('apple'), INPUT2: text('banana')}},
                    {opcode: 'array_split', blockType: 'reporter', text: 'split [TEXT] by [DELIM]', arguments: {TEXT: text('apple,banana'), DELIM: text(',')}},
                    {opcode: 'array_item_of', blockType: 'reporter', text: 'item [INDEX] of array [ARRAY]', arguments: {INDEX: number(1), ARRAY: text('["apple","banana"]')}},
                    {opcode: 'array_item_no_of', blockType: 'reporter', text: 'index of [VALUE] in array [ARRAY]', arguments: {VALUE: text('apple'), ARRAY: text('["apple","banana"]')}},
                    {opcode: 'array_in_front_of', blockType: 'reporter', text: 'add [ITEM] to front of array [ARRAY]', arguments: {ITEM: text('item'), ARRAY: text('[]')}},
                    {opcode: 'array_behind', blockType: 'reporter', text: 'add [ITEM] behind array [ARRAY]', arguments: {ITEM: text('item'), ARRAY: text('[]')}},
                    {opcode: 'array_at', blockType: 'reporter', text: 'insert [ITEM] at [INDEX] in array [ARRAY]', arguments: {ITEM: text('item'), INDEX: number(1), ARRAY: text('[]')}},
                    {opcode: 'array_replace', blockType: 'reporter', text: 'replace item [INDEX] with [ITEM] in array [ARRAY]', arguments: {INDEX: number(1), ITEM: text('item'), ARRAY: text('[]')}},
                    {opcode: 'array_delete', blockType: 'reporter', text: 'delete item [INDEX] from array [ARRAY]', arguments: {INDEX: number(1), ARRAY: text('[]')}},
                    {opcode: 'object_empty', blockType: 'reporter', text: 'empty object'},
                    {opcode: 'object_split', blockType: 'reporter', text: 'create object from [TEXT] using [KEYDELIM] and [PAIRDELIM]', arguments: {TEXT: text('key:value'), KEYDELIM: text(':'), PAIRDELIM: text(',')}},
                    {opcode: 'object_item_of', blockType: 'reporter', text: 'item [KEY] of object [VALUE]', arguments: {KEY: text('key'), VALUE: text('{}')}},
                    {opcode: 'object_contains_key', blockType: 'Boolean', text: 'object [OBJECT] contains key [KEY]?', arguments: {OBJECT: text('{}'), KEY: text('key')}},
                    {opcode: 'object_entries', blockType: 'reporter', text: '[PROPERTY] of object [OBJECT]', arguments: {PROPERTY: {type: 'string', menu: 'objectEntriesMenu', defaultValue: 'entries'}, OBJECT: text('{}')}},
                    {opcode: 'object_set', blockType: 'reporter', text: 'set key [KEY] to [ITEM] in object [OBJECT]', arguments: {KEY: text('key'), ITEM: text('item'), OBJECT: text('{}')}},
                    {opcode: 'object_delete', blockType: 'reporter', text: 'delete key [KEY] from object [OBJECT]', arguments: {KEY: text('key'), OBJECT: text('{}')}}
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

        contains(args) {
            const value = parse(args.VALUE);
            const json = parse(args.JSON);
            return Array.isArray(json) ? json.some(item => JSON.stringify(item) === JSON.stringify(value)) :
                Boolean(json && typeof json === 'object' && Object.values(json).some(item => JSON.stringify(item) === JSON.stringify(value)));
        }

        length(args) {
            const value = parse(args.VALUE);
            return value && typeof value === 'object' ? Object.keys(value).length : String(value || '').length;
        }

        stringify_spacer(args) {
            return stringify(args.VALUE, args.SPACER);
        }

        assign(args) {
            const main = parse(args.MAIN);
            const other = parse(args.INPUT1);
            if (Array.isArray(main)) return JSON.stringify(main.concat(Array.isArray(other) ? other : [other]));
            return JSON.stringify({...object(args.MAIN), ...object(args.INPUT1)});
        }

        get_by_path(args) {
            let value = parse(args.VALUE);
            for (const key of path(args.PATH)) {
                if (Array.isArray(value)) {
                    const itemIndex = index(key, value.length, false);
                    if (itemIndex < 0) return '';
                    value = value[itemIndex];
                } else if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key)) {
                    value = value[key];
                } else {
                    return '';
                }
            }
            return output(value);
        }

        set_by_path(args) {
            const original = parse(args.VALUE);
            const result = JSON.parse(JSON.stringify(original));
            const keys = path(args.PATH);
            if (!keys.length) return output(result);
            let current = result;
            for (let cursor = 0; cursor < keys.length - 1; cursor++) {
                const key = keys[cursor];
                const next = keys[cursor + 1];
                if (Array.isArray(current)) {
                    const itemIndex = index(key, current.length, true);
                    if (itemIndex < 0) return output(original);
                    if (current[itemIndex] === undefined) current[itemIndex] = /^\d+$/.test(String(next)) ? [] : {};
                    current = current[itemIndex];
                } else if (current && typeof current === 'object') {
                    if (current[key] === undefined) current[key] = /^\d+$/.test(String(next)) ? [] : {};
                    current = current[key];
                } else {
                    return output(original);
                }
            }
            const last = keys[keys.length - 1];
            if (Array.isArray(current)) {
                const itemIndex = index(last, current.length, true);
                if (itemIndex < 0) return output(original);
                current[itemIndex] = parse(args.ITEM);
            } else if (current && typeof current === 'object') {
                current[last] = parse(args.ITEM);
            } else {
                return output(original);
            }
            return JSON.stringify(result);
        }

        array_empty() {
            return '[]';
        }

        array_expandable(args) {
            return JSON.stringify([parse(args.INPUT1), parse(args.INPUT2)]);
        }

        array_split(args) {
            return JSON.stringify(String(args.TEXT).split(String(args.DELIM)));
        }

        array_item_of(args) {
            const values = array(args.ARRAY);
            const itemIndex = index(args.INDEX, values.length, false);
            return itemIndex < 0 ? '' : output(values[itemIndex]);
        }

        array_item_no_of(args) {
            return array(args.ARRAY).findIndex(value => JSON.stringify(value) === JSON.stringify(parse(args.VALUE))) + 1;
        }

        array_in_front_of(args) {
            return JSON.stringify([...array(args.ARRAY), parse(args.ITEM)]);
        }

        array_behind(args) {
            return JSON.stringify([parse(args.ITEM), ...array(args.ARRAY)]);
        }

        array_at(args) {
            const values = array(args.ARRAY);
            const itemIndex = index(args.INDEX, values.length, true);
            if (itemIndex < 0) return JSON.stringify(values);
            values.splice(itemIndex, 0, parse(args.ITEM));
            return JSON.stringify(values);
        }

        array_replace(args) {
            const values = array(args.ARRAY);
            const itemIndex = index(args.INDEX, values.length, false);
            if (itemIndex >= 0) values[itemIndex] = parse(args.ITEM);
            return JSON.stringify(values);
        }

        array_delete(args) {
            const values = array(args.ARRAY);
            const itemIndex = index(args.INDEX, values.length, false);
            if (itemIndex >= 0) values.splice(itemIndex, 1);
            return JSON.stringify(values);
        }

        object_empty() {
            return '{}';
        }

        object_split(args) {
            const result = {};
            const keyDelimiter = String(args.KEYDELIM);
            const pairDelimiter = String(args.PAIRDELIM);
            for (const pair of String(args.TEXT).split(pairDelimiter)) {
                const splitAt = pair.indexOf(keyDelimiter);
                if (splitAt < 0 || splitAt !== pair.lastIndexOf(keyDelimiter)) return '{}';
                result[pair.slice(0, splitAt)] = pair.slice(splitAt + keyDelimiter.length);
            }
            return JSON.stringify(result);
        }

        object_item_of(args) {
            const value = object(args.VALUE);
            return Object.prototype.hasOwnProperty.call(value, args.KEY) ? output(value[args.KEY]) : '';
        }

        object_contains_key(args) {
            return Object.prototype.hasOwnProperty.call(object(args.OBJECT), args.KEY);
        }

        object_entries(args) {
            const value = object(args.OBJECT);
            if (args.PROPERTY === 'keys') return JSON.stringify(Object.keys(value));
            if (args.PROPERTY === 'values') return JSON.stringify(Object.values(value));
            return JSON.stringify(Object.entries(value));
        }

        object_set(args) {
            const value = {...object(args.OBJECT)};
            value[args.KEY] = parse(args.ITEM);
            return JSON.stringify(value);
        }

        object_delete(args) {
            const value = {...object(args.OBJECT)};
            delete value[args.KEY];
            return JSON.stringify(value);
        }
    }

    global.PermafyJSONExtension = PermafyJSONExtension;
}(window));
