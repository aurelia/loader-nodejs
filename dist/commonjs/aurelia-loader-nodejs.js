"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var aurelia_metadata_1 = require("aurelia-metadata");
var aurelia_loader_1 = require("aurelia-loader");
var aurelia_pal_1 = require("aurelia-pal");
var path = require("path");
var fs = require("fs");
var debug = require("debug");
var log = debug('aurelia-loader-nodejs');
function TextHandler(filePath) {
    return new Promise(function (resolve, reject) {
        return fs.readFile(filePath, 'utf-8', function (err, text) { return err ? reject(err) : resolve(text); });
    });
}
exports.TextHandler = TextHandler;
exports.Options = {
    relativeToDir: require.main && require.main.filename && path.dirname(require.main.filename) || undefined
};
exports.ExtensionHandlers = {
    '.css': TextHandler,
    '.html': TextHandler
};
function advancedRequire(filePath) {
    var extensionsWithHandlers = Object.keys(exports.ExtensionHandlers);
    for (var _i = 0, extensionsWithHandlers_1 = extensionsWithHandlers; _i < extensionsWithHandlers_1.length; _i++) {
        var extension = extensionsWithHandlers_1[_i];
        if (filePath.endsWith(extension)) {
            log("Requiring: " + filePath, "Extension handler: " + extension);
            return exports.ExtensionHandlers[extension](filePath);
        }
    }
    log("Requiring: " + filePath);
    return Promise.resolve(require(filePath));
}
exports.advancedRequire = advancedRequire;
/**
* An implementation of the TemplateLoader interface implemented with text-based loading.
*/
var TextTemplateLoader = (function () {
    function TextTemplateLoader() {
    }
    /**
    * Loads a template.
    * @param loader The loader that is requesting the template load.
    * @param entry The TemplateRegistryEntry to load and populate with a template.
    * @return A promise which resolves when the TemplateRegistryEntry is loaded with a template.
    */
    TextTemplateLoader.prototype.loadTemplate = function (loader, entry) {
        return __awaiter(this, void 0, void 0, function () {
            var text;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, loader.loadText(entry.address)];
                    case 1:
                        text = _a.sent();
                        entry.template = aurelia_pal_1.DOM.createTemplateFromMarkup(text);
                        return [2 /*return*/];
                }
            });
        });
    };
    return TextTemplateLoader;
}());
exports.TextTemplateLoader = TextTemplateLoader;
function ensureOriginOnExports(moduleExports, moduleId) {
    var target = moduleExports;
    var key;
    var exportedValue;
    if (target.__useDefault) {
        target = target.default;
    }
    aurelia_metadata_1.Origin.set(target, new aurelia_metadata_1.Origin(moduleId, 'default'));
    if (typeof target === 'object') {
        for (key in target) {
            exportedValue = target[key];
            if (typeof exportedValue === 'function') {
                aurelia_metadata_1.Origin.set(exportedValue, new aurelia_metadata_1.Origin(moduleId, key));
            }
        }
    }
    return moduleExports;
}
exports.ensureOriginOnExports = ensureOriginOnExports;
/**
* A default implementation of the Loader abstraction which works with webpack (extended common-js style).
*/
var NodeJsLoader = (function (_super) {
    __extends(NodeJsLoader, _super);
    function NodeJsLoader() {
        var _this = _super.call(this) || this;
        _this.moduleRegistry = Object.create(null);
        _this.loaderPlugins = Object.create(null);
        _this.modulesBeingLoaded = new Map();
        _this.useTemplateLoader(new TextTemplateLoader());
        var loader = _this;
        _this.addPlugin('template-registry-entry', {
            'fetch': function (address) {
                var entry = loader.getOrCreateTemplateRegistryEntry(address);
                return entry.templateIsLoaded ? entry : loader.templateLoader.loadTemplate(loader, entry).then(function () { return entry; });
            }
        });
        aurelia_pal_1.PLATFORM.eachModule = function (callback) { };
        return _this;
    }
    NodeJsLoader.prototype._import = function (moduleId) {
        return __awaiter(this, void 0, void 0, function () {
            var moduleIdParts, modulePath, loaderPlugin, plugin, firstError_1, splitModuleId, rootModuleId, remainingRequest, rootResolved, mainDir, mergedPath, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        moduleIdParts = moduleId.split('!');
                        modulePath = moduleIdParts.splice(moduleIdParts.length - 1, 1)[0];
                        loaderPlugin = moduleIdParts.length === 1 ? moduleIdParts[0] : null;
                        if (modulePath[0] === '.' && exports.Options.relativeToDir) {
                            modulePath = path.resolve(exports.Options.relativeToDir, modulePath);
                        }
                        if (!loaderPlugin)
                            return [3 /*break*/, 2];
                        plugin = this.loaderPlugins[loaderPlugin];
                        if (!plugin) {
                            throw new Error("Plugin " + loaderPlugin + " is not registered in the loader.");
                        }
                        return [4 /*yield*/, plugin.fetch(modulePath)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        _a.trys.push([2, 4, , 11]);
                        return [4 /*yield*/, advancedRequire(require.resolve(modulePath))];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        firstError_1 = _a.sent();
                        splitModuleId = modulePath.split('/');
                        rootModuleId = splitModuleId[0];
                        if (rootModuleId[0] === '@') {
                            rootModuleId = splitModuleId.slice(0, 2).join('/');
                        }
                        remainingRequest = splitModuleId.slice(rootModuleId[0] === '@' ? 2 : 1).join('/');
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 10]);
                        if (!remainingRequest) {
                            throw firstError_1;
                        }
                        rootResolved = require.resolve(rootModuleId);
                        mainDir = path.dirname(rootResolved);
                        mergedPath = path.join(mainDir, remainingRequest);
                        return [4 /*yield*/, advancedRequire(mergedPath)];
                    case 6: return [2 /*return*/, _a.sent()];
                    case 7:
                        e_1 = _a.sent();
                        if (!!path.isAbsolute(modulePath))
                            return [3 /*break*/, 9];
                        modulePath = path.resolve(exports.Options.relativeToDir, modulePath);
                        return [4 /*yield*/, advancedRequire(modulePath)];
                    case 8: return [2 /*return*/, _a.sent()];
                    case 9: throw firstError_1;
                    case 10: return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
    * Maps a module id to a source.
    * @param id The module id.
    * @param source The source to map the module to.
    */
    NodeJsLoader.prototype.map = function (id, source) { };
    /**
    * Normalizes a module id.
    * @param moduleId The module id to normalize.
    * @param relativeTo What the module id should be normalized relative to.
    * @return The normalized module id.
    */
    NodeJsLoader.prototype.normalizeSync = function (moduleId, relativeTo) {
        return moduleId;
    };
    /**
    * Normalizes a module id.
    * @param moduleId The module id to normalize.
    * @param relativeTo What the module id should be normalized relative to.
    * @return The normalized module id.
    */
    NodeJsLoader.prototype.normalize = function (moduleId, relativeTo) {
        return Promise.resolve(moduleId);
    };
    /**
    * Instructs the loader to use a specific TemplateLoader instance for loading templates
    * @param templateLoader The instance of TemplateLoader to use for loading templates.
    */
    NodeJsLoader.prototype.useTemplateLoader = function (templateLoader) {
        this.templateLoader = templateLoader;
    };
    /**
    * Loads a collection of modules.
    * @param ids The set of module ids to load.
    * @return A Promise for an array of loaded modules.
    */
    NodeJsLoader.prototype.loadAllModules = function (ids) {
        var _this = this;
        return Promise.all(ids.map(function (id) { return _this.loadModule(id); }));
    };
    /**
    * Loads a module.
    * @param moduleId The module ID to load.
    * @return A Promise for the loaded module.
    */
    NodeJsLoader.prototype.loadModule = function (moduleId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var existing, beingLoaded, moduleExports;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        existing = this.moduleRegistry[moduleId];
                        if (existing) {
                            return [2 /*return*/, existing];
                        }
                        beingLoaded = this.modulesBeingLoaded.get(moduleId);
                        if (beingLoaded) {
                            return [2 /*return*/, beingLoaded];
                        }
                        beingLoaded = this._import(moduleId).catch(function (e) {
                            _this.modulesBeingLoaded.delete(moduleId);
                            throw e;
                        });
                        this.modulesBeingLoaded.set(moduleId, beingLoaded);
                        return [4 /*yield*/, beingLoaded];
                    case 1:
                        moduleExports = _a.sent();
                        this.moduleRegistry[moduleId] = ensureOriginOnExports(moduleExports, moduleId);
                        this.modulesBeingLoaded.delete(moduleId);
                        return [2 /*return*/, moduleExports];
                }
            });
        });
    };
    /**
    * Loads a template.
    * @param url The url of the template to load.
    * @return A Promise for a TemplateRegistryEntry containing the template.
    */
    NodeJsLoader.prototype.loadTemplate = function (url) {
        return this.loadModule(this.applyPluginToUrl(url, 'template-registry-entry'));
    };
    /**
    * Loads a text-based resource.
    * @param url The url of the text file to load.
    * @return A Promise for text content.
    */
    NodeJsLoader.prototype.loadText = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadModule(url)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
    * Alters a module id so that it includes a plugin loader.
    * @param url The url of the module to load.
    * @param pluginName The plugin to apply to the module id.
    * @return The plugin-based module id.
    */
    NodeJsLoader.prototype.applyPluginToUrl = function (url, pluginName) {
        return pluginName + "!" + url;
    };
    /**
    * Registers a plugin with the loader.
    * @param pluginName The name of the plugin.
    * @param implementation The plugin implementation.
    */
    NodeJsLoader.prototype.addPlugin = function (pluginName, implementation) {
        this.loaderPlugins[pluginName] = implementation;
    };
    return NodeJsLoader;
}(aurelia_loader_1.Loader));
exports.NodeJsLoader = NodeJsLoader;
aurelia_pal_1.PLATFORM.Loader = NodeJsLoader;
