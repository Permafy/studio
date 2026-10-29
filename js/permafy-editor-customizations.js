(function () {
    const app = document.getElementById('app');
    if (!app) return;

    document.addEventListener('change', event => {
        const input = event.target;
        if (!(input instanceof HTMLInputElement) || input.type !== 'file') return;
        if (!/\.sb3\b/i.test(input.accept)) return;

        if (!/\.dbp(?:,|$)/i.test(input.accept)) input.accept += ',.dbp';
        for (const file of input.files || []) {
            if (!/\.dbp$/i.test(file.name)) continue;
            try {
                Object.defineProperty(file, 'name', {
                    configurable: true,
                    value: file.name.replace(/\.dbp$/i, '.sb3')
                });
            } catch (error) {
                // Keep the original file when the browser does not allow name shadowing.
            }
        }
    }, true);

    const projectInputs = new MutationObserver(() => {
        app.querySelectorAll('input[type="file"]').forEach(input => {
            if (/\.sb3\b/i.test(input.accept) && !/\.dbp(?:,|$)/i.test(input.accept)) {
                input.accept += ',.dbp';
            }
        });
    });
    projectInputs.observe(app, {childList: true, subtree: true});

    const addStyles = () => {
        if (document.getElementById('permafy-editor-customizations')) return;
        const style = document.createElement('style');
        style.id = 'permafy-editor-customizations';
        style.textContent = `
            li[data-permafy-theme-menu] li.menu_menu-item_3EwYA:hover {
                background-color: transparent !important;
            }
            .menu-bar_menu-bar_JcuHF.menu-bar_topbar-turbo-gray_Muqcf .menu-bar_back-to-home-item_1WHo4 button {
                color: #333 !important;
            }
            .menu-bar_menu-bar_JcuHF button[class*="see-inside-button"] {
                background-color: var(--pen-primary, #0fbd8c) !important;
                color: #fff !important;
            }
            body[permafy-topbar-accent="turbo-gray"] #gui-main-logo,
            body[permafy-topbar-accent="turbo-gray"] #gui-editor-logo {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    };

    const addThemeSwitch = themeMenu => {
        const list = themeMenu.querySelector(':scope > div.menu_submenu_2Yzd1 ul');
        if (!list || list.querySelector('[data-permafy-theme-toggle]')) return;
        const accentItem = Array.from(list.children).find(item => {
            const label = item.querySelector(':scope > div > span');
            return label && label.textContent.trim() === 'Accent';
        });
        if (!accentItem) return;

        const option = accentItem.querySelector(':scope > div').cloneNode(false);
        const label = document.createElement('span');
        label.className = 'settings-menu_submenu-label_r-gA3';
        label.textContent = 'Switch Dark/Light';
        option.appendChild(label);

        const toggle = document.createElement('li');
        toggle.className = accentItem.className;
        toggle.dataset.permafyThemeToggle = 'true';
        toggle.setAttribute('role', 'menuitem');
        toggle.tabIndex = 0;
        toggle.appendChild(option);
        const switchTheme = event => {
            event.preventDefault();
            event.stopPropagation();
            const themeButton = app.querySelector('button[aria-label="Toggle light and dark mode"], button[title="Toggle light and dark mode"]') ||
                (() => {
                    const themeIcon = app.querySelector('[class*="menu-bar_moon-icon"], [class*="menu-bar_sun-icon"]');
                    return themeIcon && themeIcon.closest('[class*="menu-bar_menu-bar-item"]')?.querySelector('button');
                })();
            if (themeButton) {
                themeButton.click();
            }
        };
        toggle.addEventListener('click', switchTheme);
        toggle.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') switchTheme(event);
        });
        list.insertBefore(toggle, accentItem);
    };

    const updateThemeMenu = () => {
        const accentSwatch = app.querySelector('[class*="settings-menu_topbar-color"]');
        let themeMenu = accentSwatch && accentSwatch.closest('li');
        while (themeMenu) {
            const parentItem = themeMenu.parentElement && themeMenu.parentElement.closest('li');
            if (!parentItem) break;
            themeMenu = parentItem;
        }
        if (!themeMenu) return;

        if (themeMenu.dataset.permafyThemeMenu !== 'true') {
            themeMenu.dataset.permafyThemeMenu = 'true';
        }
        const label = themeMenu.querySelector(':scope > div > span');
        if (label && label.textContent.trim() !== 'Theme') label.textContent = 'Theme';
        addThemeSwitch(themeMenu);
    };

    const updateAccentStyles = () => {
        const topbar = app.querySelector('[class*="menu-bar_menu-bar_"]');
        if (!topbar) return;
        const accent = Array.from(topbar.classList).some(className => className.includes('topbar-turbo-gray')) ?
            'turbo-gray' : 'permafy';
        document.body.setAttribute('permafy-topbar-accent', accent);
    };

    const blockSearchAliases = {
        motion_movesteps: ['move steps', 'motion.movesteps', 'move', 'steps'],
        operator_join: ['join', 'text join', 'concatenate', 'concatenation', 'combine text', 'operator.join'],
        operator_join3: ['join three', 'join 3', 'concatenate three', 'operator.join3'],
        operator_expandablejoininputs: ['join many', 'join multiple', 'join several', 'operator.expandablejoininputs']
    };

    const addTextInput = (document, block, name, text) => {
        const value = document.createElement('value');
        value.setAttribute('name', name);
        const shadow = document.createElement('shadow');
        shadow.setAttribute('type', 'text');
        const field = document.createElement('field');
        field.setAttribute('name', 'TEXT');
        field.textContent = text;
        shadow.appendChild(field);
        value.appendChild(shadow);
        block.appendChild(value);
    };

    const debuggerLogProcedures = [
        '\u200B\u200Blog\u200B\u200B %s',
        '\u200B\u200Bwarn\u200B\u200B %s',
        '\u200B\u200Berror\u200B\u200B %s'
    ];
    const patchBlocksInstance = instance => {
        if (typeof instance.getBlockSearchLabels === 'function' && !instance.__permafySearchPatched) {
            const getLabels = instance.getBlockSearchLabels.bind(instance);
            instance.getBlockSearchLabels = () => {
                const labels = {...getLabels()};
                Object.keys(labels).forEach(type => {
                    labels[type] = `${labels[type]} ${type} ${type.replace(/_/g, ' ')} ${type.replace(/_/, '.')}`;
                });
                Object.entries(blockSearchAliases).forEach(([type, aliases]) => {
                    if (instance.ScratchBlocks.Blocks[type]) {
                        labels[type] = `${labels[type] || type} ${aliases.join(' ')}`;
                    }
                });
                return labels;
            };
            instance.__permafySearchPatched = true;
        }

        if (typeof instance.componentWillUnmount === 'function' && !instance.__permafyUnmountGuard) {
            const unmount = instance.componentWillUnmount.bind(instance);
            instance.componentWillUnmount = () => {
                if (instance.workspace) return unmount();
                instance.detachVM();
                clearTimeout(instance.toolboxUpdateTimeout);
                instance.props.vm.setInEditor(false);
            };
            instance.__permafyUnmountGuard = true;
        }

        if (!instance.workspace || !instance.props || typeof instance.props.updateToolboxState !== 'function') return;
        if (!instance.ScratchBlocks || !instance.ScratchBlocks.Blocks) return;
        const extensionManager = instance.props.vm && instance.props.vm.extensionManager;
        if (!extensionManager || typeof window.PermafyRegisterBlocklyDefinitions !== 'function') return;
        if (!instance.__permafyDefinitionsReady) {
            if (instance.__permafyDefinitionsLoading) return;
            instance.__permafyDefinitionsLoading = true;
            window.PermafyRegisterBlocklyDefinitions(instance.ScratchBlocks).then(() => {
                instance.__permafyDefinitionsReady = true;
                instance.__permafyDefinitionsLoading = false;
                const updatedToolbox = instance.getToolboxXML();
                if (updatedToolbox) instance.props.updateToolboxState(updatedToolbox);
            }).catch(error => {
                instance.__permafyDefinitionsLoading = false;
                console.error('Unable to register Permafy block definitions', error);
            });
            return;
        }

        if (typeof instance.getToolboxXML === 'function' && !instance.__permafyDebugCategoryFiltered) {
            const getToolboxXML = instance.getToolboxXML.bind(instance);
            instance.getToolboxXML = () => {
                const xml = getToolboxXML();
                if (!xml) return xml;
                const toolbox = new DOMParser().parseFromString(xml, 'text/xml');
                toolbox.querySelectorAll('category[id="debug"]').forEach(category => category.remove());
                return toolbox.documentElement.outerHTML;
            };
            instance.__permafyDebugCategoryFiltered = true;
        }
        const toolboxXML = instance.props.toolboxXML || '';
        if (instance.__permafyProcessedToolboxXML === toolboxXML) return;
        const missingJoinBlocks = [
            'operator_join',
            'operator_join3',
            'operator_expandablejoininputs',
            'operator_newLine',
            'operator_tabCharacter'
        ].filter(type =>
            instance.ScratchBlocks.Blocks[type] && !toolboxXML.includes(`type="${type}"`));

        const document = new DOMParser().parseFromString(toolboxXML, 'text/xml');
        const operatorCategory = Array.from(document.getElementsByTagName('category')).find(item =>
            item.getAttribute('id') === 'operators');
        let toolboxChanged = false;

        const customsCategory = Array.from(document.getElementsByTagName('category')).find(item =>
            item.getAttribute('id') === 'customs' || item.getAttribute('id') === 'custom' || item.getAttribute('id') === 'procedures');
        if (customsCategory) {
            customsCategory.setAttribute('name', 'Customs');
            customsCategory.setAttribute('id', 'customs');
            toolboxChanged = true;
        }

        if (operatorCategory) {
            missingJoinBlocks.forEach(type => {
                const block = document.createElement('block');
                block.setAttribute('type', type);
                if (type === 'operator_join') {
                    ['STRING1', 'STRING2'].forEach((name, index) => addTextInput(document, block, name, `text ${index + 1}`));
                } else if (type === 'operator_join3') {
                    ['STRING1', 'STRING2', 'STRING3'].forEach((name, index) => addTextInput(document, block, name, `text ${index + 1}`));
                } else if (type === 'operator_expandablejoininputs') {
                    const mutation = document.createElement('mutation');
                    mutation.setAttribute('inputcount', '2');
                    block.appendChild(mutation);
                    ['INPUT1', 'INPUT2'].forEach((name, index) => addTextInput(document, block, name, `text ${index + 1}`));
                }
                operatorCategory.appendChild(block);
                toolboxChanged = true;
            });
        }

        const eventsCategory = Array.from(document.getElementsByTagName('category')).find(item =>
            item.getAttribute('id') === 'events');
        const toolboxCategories = window.PermafyCreateToolboxCategories(document);
        const jsonCategory = Array.from(document.getElementsByTagName('category')).find(item =>
            item.getAttribute('id') === 'json');
        const consoleCategory = Array.from(document.getElementsByTagName('category')).find(item =>
            item.getAttribute('id') === 'console');
        const replaceCategory = (existing, replacement) => {
            if (existing) existing.parentNode.replaceChild(replacement, existing);
            else document.documentElement.appendChild(replacement);
            toolboxChanged = true;
        };
        replaceCategory(jsonCategory, toolboxCategories[0]);
        replaceCategory(consoleCategory, toolboxCategories[1]);
        if (toolboxCategories[2] && customsCategory) {
            replaceCategory(customsCategory, toolboxCategories[2]);
        }

        const debuggerCategory = Array.from(document.getElementsByTagName('category')).find(item =>
            item.getAttribute('id') === 'a-b');
        if (debuggerCategory) {
            Array.from(debuggerCategory.querySelectorAll('block')).forEach(block => {
                const procedureCode = block.querySelector('mutation')?.getAttribute('proccode');
                if (debuggerLogProcedures.includes(procedureCode)) {
                    const alreadyInConsole = Array.from(consoleCategory.querySelectorAll('mutation'))
                        .some(mutation => mutation.getAttribute('proccode') === procedureCode);
                    if (!alreadyInConsole) {
                        consoleCategory.appendChild(block.cloneNode(true));
                        toolboxChanged = true;
                    }
                    block.remove();
                    toolboxChanged = true;
                }
            });
        }

        Array.from(document.getElementsByTagName('category'))
            .filter(category => category.getAttribute('id') === 'debug')
            .forEach(category => {
                category.remove();
                toolboxChanged = true;
            });

        if (eventsCategory) {
            const hatOrder = [
                'event_whenflagclicked',
                'event_whenstopclicked',
                'event_whenpausebuttonclicked',
                'event_whenplaybuttonclicked'
            ];
            if (hatOrder.some(type => !instance.ScratchBlocks.Blocks[type])) return;
            const hats = hatOrder.map(type => {
                let block = Array.from(eventsCategory.children).find(child =>
                    child.tagName === 'block' && child.getAttribute('type') === type);
                if (!block && instance.ScratchBlocks.Blocks[type]) {
                    block = document.createElement('block');
                    block.setAttribute('type', type);
                    toolboxChanged = true;
                }
                return block && instance.ScratchBlocks.Blocks[type] ? block : null;
            }).filter(Boolean);
            const currentTopHats = Array.from(eventsCategory.children)
                .filter(child => child.tagName === 'block')
                .slice(0, hats.length)
                .map(block => block.getAttribute('type'));
            if (hats.some((block, index) => currentTopHats[index] !== block.getAttribute('type'))) {
                hats.slice().reverse().forEach(block => eventsCategory.insertBefore(block, eventsCategory.firstChild));
                toolboxChanged = true;
            }

            const openLinkType = 'lmsutilsblocks_goToLink';
            if (instance.ScratchBlocks.Blocks[openLinkType] &&
                !Array.from(eventsCategory.children).some(child =>
                    child.tagName === 'block' && child.getAttribute('type') === openLinkType)) {
                const block = document.createElement('block');
                block.setAttribute('type', openLinkType);
                addTextInput(document, block, 'INPUT', 'https://example.com');
                eventsCategory.appendChild(block);
                toolboxChanged = true;
            }
        }

        instance.__permafyProcessedToolboxXML = toolboxXML;
        if (!toolboxChanged) return;
        instance.props.updateToolboxState(document.documentElement.outerHTML);
    };

    const patchBlockSearch = () => {
        app.querySelectorAll('[class*="blocks_search_"]').forEach(input => {
            const fiberKey = Object.keys(input).find(key =>
                key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$'));
            let fiber = fiberKey ? input[fiberKey] : null;
            while (fiber) {
                const instance = fiber.stateNode;
                if (instance && instance.workspace && instance.props &&
                    typeof instance.props.updateToolboxState === 'function' &&
                    typeof instance.getBlockSearchLabels === 'function') {
                    patchBlocksInstance(instance);
                    break;
                }
                fiber = fiber.return;
            }
        });
    };

    const hideTopbarThemeButton = () => {
        app.querySelectorAll('[class*="menu-bar_moon-icon"], [class*="menu-bar_sun-icon"]').forEach(icon => {
            const item = icon.closest('[class*="menu-bar_menu-bar-item"]');
            if (item && item.style.display !== 'none') item.style.display = 'none';
        });
        app.querySelectorAll('[class*="menu-bar_menu-bar-item"]').forEach(item => {
            const isInSettings = item.closest('[class*="menu-bar_menu-bar-menu"]');
            if (!isInSettings && item.textContent.trim() === 'Theme' && item.style.display !== 'none') {
                item.style.display = 'none';
            }
        });
    };

    const patchProjectPageNavigation = () => {
        const communityButton = app.querySelector('button[class*="community-button"]') ||
            Array.from(app.querySelectorAll('button')).find(button =>
                button.textContent.trim().toLowerCase() === 'see project page');
        if (!communityButton) return;

        const fiberKey = Object.keys(communityButton).find(key =>
            key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$'));
        let fiber = fiberKey ? communityButton[fiberKey] : null;
        let menuBarInstance = null;
        const watcherInstances = [];
        while (fiber) {
            const instance = fiber.stateNode;
            if (instance && typeof instance.handleClickSeeCommunity === 'function' && instance.props) {
                menuBarInstance = instance;
            }
            if (instance && typeof instance.waitForUpdate === 'function' && typeof instance.fulfill === 'function') {
                watcherInstances.push(instance);
            }
            fiber = fiber.return;
        }
        if (!menuBarInstance || !menuBarInstance.props.projectId) return;

        const projectId = String(menuBarInstance.props.projectId);
        if (projectId === '0') return;
        const querySource = new URLSearchParams(window.location.search).get('source');
        const isScratchProject = /(?:^|\/)scratch(?:\/|$)/i.test(window.location.pathname) || querySource === 'scratch';
        const source = isScratchProject ? 'scratch' : 'penguinmod';
        const projectUrl = `https://projects.permafy.org/${source}/${encodeURIComponent(projectId)}/player`;
        watcherInstances.forEach(instance => {
            if (instance.__permafyProjectPageNavigationPatched) return;
            instance.fulfill = function () {
                if (this.__permafyProjectPageNavigationStarted) return;
                this.__permafyProjectPageNavigationStarted = true;
                this.setState({waiting: false}, () => window.location.assign(projectUrl));
            };
            instance.__permafyProjectPageNavigationPatched = true;
        });
    };

    const updateForkButton = () => {
        const button = Array.from(app.querySelectorAll('button')).find(item =>
            Array.from(item.classList).some(className => className.includes('see-inside-button')));
        if (!button) return;

        const icon = button.querySelector('img');
        const forkIcon = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="3" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="21" r="2"/><path d="M6 5v14M20 6a6 6 0 0 1-6 6H8"/></svg>'
        );
        if (icon && icon.src !== forkIcon) {
            icon.src = forkIcon;
            icon.alt = '';
        }
        if (button.dataset.permafyForkAction === 'true') return;
        button.dataset.permafyForkAction = 'true';
        button.addEventListener('click', event => {
            const remixButton = app.querySelector('button[class*="remix-button"]');
            if (!remixButton || remixButton === button) return;
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            remixButton.click();
        }, true);
    };

    addStyles();
    const observer = new MutationObserver(() => {
        updateThemeMenu();
        updateAccentStyles();
        updateForkButton();
        hideTopbarThemeButton();
        patchBlockSearch();
        patchProjectPageNavigation();
    });
    observer.observe(app, {attributes: true, childList: true, subtree: true});
    updateThemeMenu();
    updateAccentStyles();
    updateForkButton();
    hideTopbarThemeButton();
    patchBlockSearch();
    patchProjectPageNavigation();
}());