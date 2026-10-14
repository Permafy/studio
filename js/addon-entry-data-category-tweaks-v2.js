(window["webpackJsonpGUI"] = window["webpackJsonpGUI"] || []).push([["addon-entry-data-category-tweaks-v2"], {
  "./src/addons/addons/data-category-tweaks-v2/_runtime_entry.js": function(module, __webpack_exports__, __webpack_require__) {
    "use strict";
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, "resources", function() {
      return resources;
    });
    const resources = {
      "userscript.js": async function({addon}) {
        const ScratchBlocks = await addon.tab.traps.getBlockly();
        const vm = addon.tab.traps.vm;
        const smallGap = 8;
        const bigGap = 24;
        const moveReportersDown = items => {
          const reporters = [];
          const statements = [];
          for (const item of items) {
            if (item.hasAttribute("id") || item.tagName === "BUTTON") reporters.push(item);
            else statements.push(item);
          }
          if (statements.length) statements[statements.length - 1].setAttribute("gap", bigGap);
          return statements.concat(reporters);
        };
        const updateCategory = (workspace, category) => {
          const items = category(workspace);
          return !addon.self.disabled && addon.settings.get("moveReportersDown") ? moveReportersDown(items) : items;
        };

        const oldShow = ScratchBlocks.Flyout.prototype.show;
        ScratchBlocks.Flyout.prototype.show = function(flyoutDefinition) {
          this.targetWorkspace.registerToolboxCategoryCallback("VARIABLE", workspace => updateCategory(workspace, ScratchBlocks.VariableCategory));
          this.targetWorkspace.registerToolboxCategoryCallback("LIST", workspace => updateCategory(workspace, ScratchBlocks.VariableCategory.ListCategory));
          return oldShow.call(this, flyoutDefinition);
        };

        const refreshToolbox = () => {
          if (vm.editingTarget) vm.emitWorkspaceUpdate();
          const workspace = addon.tab.traps.getWorkspace();
          if (workspace && typeof workspace.refreshToolboxSelection_ === "function") workspace.refreshToolboxSelection_();
        };
        addon.settings.addEventListener("change", refreshToolbox);
        addon.self.addEventListener("disabled", refreshToolbox);
        addon.self.addEventListener("reenabled", refreshToolbox);
        refreshToolbox();
      }
    };
  }
}]);