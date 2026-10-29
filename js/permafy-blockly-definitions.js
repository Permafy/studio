(function (global) {
    const colors = {
        json: {primary: '#748BEE', secondary: '#687DD6', tertiary: '#5C6FBE', quaternary: '#5C6FBE'},
        console: {primary: '#6B8E5D', secondary: '#57734C', tertiary: '#56724A', quaternary: '#56724A'}
    };
    const messages = {
        CATEGORY_JSON: 'JSON',
        CATEGORY_CONSOLE: 'Console',
        JSON_ARRAY_ITEMOF: 'item %1 of %2',
        JSON_ARRAY_ITEMNOOF: 'item # of %1 in %2',
        JSON_CONTAINS: '%1 contains %2?',
        JSON_LENGTH: 'length of %1',
        JSON_GET_BY_PATH: 'item by path %1 in %2',
        JSON_SET_BY_PATH: 'set to %1 by path %2 in %3',
        JSON_STRINGIFY_SPACER: 'stringify %1 with spacer %2',
        JSON_ASSIGN: 'for %1 assign %2 %3',
        JSON_ARRAY_EMPTY: 'empty array',
        JSON_ARRAY_SPLIT: 'array from %1 separated by %2',
        JSON_ARRAY_INFRONTOF: '%1 in front of %2',
        JSON_ARRAY_BEHIND: '%1 behind %2',
        JSON_ARRAY_AT: 'insert %1 at %2 of %3',
        JSON_ARRAY_DELETE: 'delete %1 of %2',
        JSON_ARRAY_REPLACE: 'replace item %1 of %2 with %3',
        JSON_ARRAY_EXPANDABLE: 'array by values %1 %2',
        JSON_OBJECT_EMPTY: 'empty object',
        JSON_OBJECT_SPLIT: 'object from %1 with key %2 and pair %3 separators',
        JSON_OBJECT_ITEMOF: 'item of key %1 in %2',
        JSON_OBJECT_CONTAINS_KEY: '%1 contains key %2?',
        JSON_OBJECT_SET: 'set key %1 to %2 in %3',
        JSON_OBJECT_DELETE: 'delete key %1 in %2',
        JSON_OBJECT_ENTRIES: '%1 of %2',
        JSON_OBJECT_ENTRIES_ENTRIES: 'entries',
        JSON_OBJECT_ENTRIES_KEYS: 'keys',
        JSON_OBJECT_ENTRIES_VALUES: 'values',
        CONSOLE_CLEAR: 'clear console',
        CONSOLE_ADDLINE: 'print line %1 to console',
        CONSOLE_ADDLINEANDMOVE: 'print line %1 to console and move cursor',
        CONSOLE_PRINT: 'print %1 to console',
        CONSOLE_EDITLINE: 'edit line in console to %1',
        CONSOLE_EDITSYMBOL: 'edit symbol in console to %1',
        CONSOLE_MOVECURSOR: 'move cursor to row: %1 symbol: %2',
        CONSOLE_OF: '%1 of console',
        CONSOLE_OF_CONTENT: 'content',
        CONSOLE_OF_LINESCOUNT: 'max lines count'
    };
    const extension = (Blockly, name, callback) => {
        try {
            Blockly.Extensions.register(name, callback);
        } catch (error) {
            // Blockly already registered this shared extension.
        }
    };
    const loadScript = src => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Unable to load ${src}`));
        document.head.appendChild(script);
    });
    const toolboxCategories = document => {
        const xml = `
            <xml>
                <category name="JSON" id="json" colour="#748BEE" secondaryColour="#5C6FBE">
                    <block type="json_contains"><value name="VALUE"><shadow type="text"><field name="TEXT">item</field></shadow></value></block>
                    <block type="json_length" />
                    <block type="json_stringify_spacer"><value name="SPACER"><shadow type="text"><field name="TEXT">  </field></shadow></value></block>
                    <block type="json_assign"><mutation inputcount="1"></mutation></block>
                    <sep gap="36" />
                    <block type="json_get_by_path" />
                    <block type="json_set_by_path"><value name="ITEM"><shadow type="text"><field name="TEXT">item</field></shadow></value></block>
                    <label text="Arrays"></label>
                    <block type="json_array_empty" />
                    <block type="json_array_expandable"><mutation inputcount="2"></mutation><value name="INPUT1"><shadow type="text"><field name="TEXT">apple</field></shadow></value><value name="INPUT2"><shadow type="text"><field name="TEXT">banana</field></shadow></value></block>
                    <block type="json_array_split"><value name="TEXT"><shadow type="text"><field name="TEXT">apple,banana</field></shadow></value><value name="DELIM"><shadow type="text"><field name="TEXT">,</field></shadow></value></block>
                    <sep gap="36" />
                    <block type="json_array_item_of"><value name="INDEX"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block>
                    <block type="json_array_item_no_of"><value name="VALUE"><shadow type="text"><field name="TEXT">item</field></shadow></value></block>
                    <sep gap="36" />
                    <block type="json_array_in_front_of"><value name="ITEM"><shadow type="text"><field name="TEXT">item</field></shadow></value></block>
                    <block type="json_array_behind"><value name="ITEM"><shadow type="text"><field name="TEXT">item</field></shadow></value></block>
                    <block type="json_array_at"><value name="ITEM"><shadow type="text"><field name="TEXT">item</field></shadow></value><value name="INDEX"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block>
                    <block type="json_array_replace"><value name="INDEX"><shadow type="math_number"><field name="NUM">1</field></shadow></value><value name="ITEM"><shadow type="text"><field name="TEXT">item</field></shadow></value></block>
                    <block type="json_array_delete"><value name="INDEX"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block>
                    <label text="Objects"></label>
                    <block type="json_object_empty" />
                    <block type="json_object_split"><value name="TEXT"><shadow type="text"><field name="TEXT">key1:apple,key2:banana</field></shadow></value><value name="KEYDELIM"><shadow type="text"><field name="TEXT">:</field></shadow></value><value name="PAIRDELIM"><shadow type="text"><field name="TEXT">,</field></shadow></value></block>
                    <sep gap="36" />
                    <block type="json_object_item_of"><value name="KEY"><shadow type="text"><field name="TEXT">key</field></shadow></value></block>
                    <block type="json_object_contains_key"><value name="KEY"><shadow type="text"><field name="TEXT">key</field></shadow></value></block>
                    <block type="json_object_entries" />
                    <sep gap="36" />
                    <block type="json_object_set"><value name="KEY"><shadow type="text"><field name="TEXT">key</field></shadow></value><value name="ITEM"><shadow type="text"><field name="TEXT">item</field></shadow></value></block>
                    <block type="json_object_delete"><value name="KEY"><shadow type="text"><field name="TEXT">key</field></shadow></value></block>
                    <sep gap="36" />
                </category>
                <category name="Console" id="console" colour="#6B8E5D" secondaryColour="#56724A">
                    <block type="console_clear" />
                    <sep gap="36" />
                    <block type="console_addline"><value name="LINE"><shadow type="text"><field name="TEXT">Hello!</field></shadow></value></block>
                    <block type="console_addlineandmove"><value name="LINE"><shadow type="text"><field name="TEXT">Hello!</field></shadow></value></block>
                    <block type="console_print"><value name="LINE"><shadow type="text"><field name="TEXT">Hello!</field></shadow></value></block>
                    <sep gap="36" />
                    <block type="console_editline"><value name="LINE"><shadow type="text"><field name="TEXT">Hello!</field></shadow></value></block>
                    <block type="console_editsymbol"><value name="VALUE"><shadow type="text"><field name="TEXT">a</field></shadow></value></block>
                    <sep gap="36" />
                    <block type="console_movecursor"><value name="ROW"><shadow type="math_number"><field name="NUM">1</field></shadow></value><value name="SYMBOL"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block>
                    <sep gap="36" />
                    <block type="console_of" />
                </category>
                <category name="Customs" id="customs" colour="#FFBF00" secondaryColour="#CC9900">
                    <block type="procedures_definition" />
                    <block type="procedures_callnoreturn" />
                    <block type="procedures_callreturn" />
                    <block type="procedures_ifreturn" />
                </category>
            </xml>`;
        const parsed = new DOMParser().parseFromString(xml, 'text/xml');
        return Array.from(parsed.documentElement.children, category => document.importNode(category, true));
    };

    global.PermafyCreateToolboxCategories = toolboxCategories;

    global.PermafyRegisterBlocklyDefinitions = Blockly => {
        if (global.__permafyBlocklyDefinitionsPromise) return global.__permafyBlocklyDefinitionsPromise;
        global.Blockly = Blockly;
        Blockly.Categories.json = 'json';
        Blockly.Categories.console = 'console';
        Blockly.Colours.json = colors.json;
        Blockly.Colours.console = colors.console;
        Object.assign(Blockly.Msg, messages);

        for (const [category, categoryColors] of Object.entries(colors)) {
            extension(Blockly, `colours_${category}`, function () {
                this.setColourFromRawValues_(categoryColors.primary, categoryColors.secondary,
                    categoryColors.tertiary, categoryColors.quaternary);
            });
        }
        extension(Blockly, 'shape_statement', function () {
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
        });
        extension(Blockly, 'shape_round', function () {
            this.setInputsInline(true);
            this.setOutputShape(Blockly.OUTPUT_SHAPE_ROUND);
        });
        extension(Blockly, 'output_number', function () {
            this.setInputsInline(true);
            this.setOutputShape(Blockly.OUTPUT_SHAPE_ROUND);
            this.setOutput(true, 'Number');
        });
        extension(Blockly, 'output_string', function () {
            this.setInputsInline(true);
            this.setOutputShape(Blockly.OUTPUT_SHAPE_ROUND);
            this.setOutput(true, 'String');
        });
        extension(Blockly, 'output_boolean', function () {
            this.setInputsInline(true);
            this.setOutputShape(Blockly.OUTPUT_SHAPE_HEXAGONAL);
            this.setOutput(true, 'Boolean');
        });
        extension(Blockly, 'output_array', function () {
            this.setInputsInline(true);
            this.setOutputShape(Blockly.OUTPUT_SHAPE_SQUARE);
            this.setOutput(true, 'Array');
        });
        extension(Blockly, 'output_object', function () {
            this.setInputsInline(true);
            this.setOutputShape(Blockly.OUTPUT_SHAPE_PLUS);
            this.setOutput(true, 'Object');
        });

        global.__permafyBlocklyDefinitionsPromise = loadScript('/js/permafy-blocks-json.js')
            .then(() => loadScript('/js/permafy-blocks-console.js'));
        return global.__permafyBlocklyDefinitionsPromise;
    };
}(window));
