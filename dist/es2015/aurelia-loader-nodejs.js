var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
import { Origin } from 'aurelia-metadata';
import { Loader } from 'aurelia-loader';
import { DOM, PLATFORM } from 'aurelia-pal';
import * as path from 'path';
import * as fs from 'fs';
import * as debug from 'debug';
const log = debug('aurelia-loader-nodejs');
export function TextHandler(filePath) {
    return new Promise((resolve, reject) => fs.readFile(filePath, 'utf-8', (err, text) => err ? reject(err) : resolve(text)));
}
export const Options = {
    relativeToDir: require.main && require.main.filename && path.dirname(require.main.filename) || undefined
};
export const ExtensionHandlers = {
    '.css': TextHandler,
    '.html': TextHandler
};
export function advancedRequire(filePath) {
    const extensionsWithHandlers = Object.keys(ExtensionHandlers);
    for (let extension of extensionsWithHandlers) {
        if (filePath.endsWith(extension)) {
            log(`Requiring: ${filePath}`, `Extension handler: ${extension}`);
            return ExtensionHandlers[extension](filePath);
        }
    }
    log(`Requiring: ${filePath}`);
    return Promise.resolve(require(filePath));
}
/**
* An implementation of the TemplateLoader interface implemented with text-based loading.
*/
export class TextTemplateLoader {
    /**
    * Loads a template.
    * @param loader The loader that is requesting the template load.
    * @param entry The TemplateRegistryEntry to load and populate with a template.
    * @return A promise which resolves when the TemplateRegistryEntry is loaded with a template.
    */
    loadTemplate(loader, entry) {
        return __awaiter(this, void 0, void 0, function* () {
            const text = yield loader.loadText(entry.address);
            entry.template = DOM.createTemplateFromMarkup(text);
        });
    }
}
export function ensureOriginOnExports(moduleExports, moduleId) {
    let target = moduleExports;
    let key;
    let exportedValue;
    if (target.__useDefault) {
        target = target.default;
    }
    Origin.set(target, new Origin(moduleId, 'default'));
    if (typeof target === 'object') {
        for (key in target) {
            exportedValue = target[key];
            if (typeof exportedValue === 'function') {
                Origin.set(exportedValue, new Origin(moduleId, key));
            }
        }
    }
    return moduleExports;
}
/**
* A default implementation of the Loader abstraction which works with webpack (extended common-js style).
*/
export class NodeJsLoader extends Loader {
    constructor() {
        super();
        this.moduleRegistry = Object.create(null);
        this.loaderPlugins = Object.create(null);
        this.modulesBeingLoaded = new Map();
        this.useTemplateLoader(new TextTemplateLoader());
        const loader = this;
        this.addPlugin('template-registry-entry', {
            'fetch': function (address) {
                let entry = loader.getOrCreateTemplateRegistryEntry(address);
                return entry.templateIsLoaded ? entry : loader.templateLoader.loadTemplate(loader, entry).then(() => entry);
            }
        });
        PLATFORM.eachModule = callback => { };
    }
    _import(moduleId) {
        return __awaiter(this, void 0, void 0, function* () {
            const moduleIdParts = moduleId.split('!');
            let modulePath = moduleIdParts.splice(moduleIdParts.length - 1, 1)[0];
            const loaderPlugin = moduleIdParts.length === 1 ? moduleIdParts[0] : null;
            if (modulePath[0] === '.' && Options.relativeToDir) {
                modulePath = path.resolve(Options.relativeToDir, modulePath);
            }
            if (loaderPlugin) {
                const plugin = this.loaderPlugins[loaderPlugin];
                if (!plugin) {
                    throw new Error(`Plugin ${loaderPlugin} is not registered in the loader.`);
                }
                return yield plugin.fetch(modulePath);
            }
            try {
                return yield advancedRequire(require.resolve(modulePath));
            }
            catch (firstError) {
                // second try, relative to module's main
                const splitModuleId = modulePath.split('/');
                let rootModuleId = splitModuleId[0];
                if (rootModuleId[0] === '@') {
                    rootModuleId = splitModuleId.slice(0, 2).join('/');
                }
                const remainingRequest = splitModuleId.slice(rootModuleId[0] === '@' ? 2 : 1).join('/');
                try {
                    if (!remainingRequest) {
                        throw firstError;
                    }
                    const rootResolved = require.resolve(rootModuleId);
                    const mainDir = path.dirname(rootResolved);
                    const mergedPath = path.join(mainDir, remainingRequest);
                    return yield advancedRequire(mergedPath);
                }
                catch (e) {
                    // last try, file is relative, but didn't specify ./ in the path
                    if (!path.isAbsolute(modulePath)) {
                        modulePath = path.resolve(Options.relativeToDir, modulePath);
                        return yield advancedRequire(modulePath);
                    }
                    throw firstError;
                }
            }
        });
    }
    /**
    * Maps a module id to a source.
    * @param id The module id.
    * @param source The source to map the module to.
    */
    map(id, source) { }
    /**
    * Normalizes a module id.
    * @param moduleId The module id to normalize.
    * @param relativeTo What the module id should be normalized relative to.
    * @return The normalized module id.
    */
    normalizeSync(moduleId, relativeTo) {
        return moduleId;
    }
    /**
    * Normalizes a module id.
    * @param moduleId The module id to normalize.
    * @param relativeTo What the module id should be normalized relative to.
    * @return The normalized module id.
    */
    normalize(moduleId, relativeTo) {
        return Promise.resolve(moduleId);
    }
    /**
    * Instructs the loader to use a specific TemplateLoader instance for loading templates
    * @param templateLoader The instance of TemplateLoader to use for loading templates.
    */
    useTemplateLoader(templateLoader) {
        this.templateLoader = templateLoader;
    }
    /**
    * Loads a collection of modules.
    * @param ids The set of module ids to load.
    * @return A Promise for an array of loaded modules.
    */
    loadAllModules(ids) {
        return Promise.all(ids.map(id => this.loadModule(id)));
    }
    /**
    * Loads a module.
    * @param moduleId The module ID to load.
    * @return A Promise for the loaded module.
    */
    loadModule(moduleId) {
        return __awaiter(this, void 0, void 0, function* () {
            let existing = this.moduleRegistry[moduleId];
            if (existing) {
                return existing;
            }
            let beingLoaded = this.modulesBeingLoaded.get(moduleId);
            if (beingLoaded) {
                return beingLoaded;
            }
            beingLoaded = this._import(moduleId).catch(e => {
                this.modulesBeingLoaded.delete(moduleId);
                throw e;
            });
            this.modulesBeingLoaded.set(moduleId, beingLoaded);
            const moduleExports = yield beingLoaded;
            this.moduleRegistry[moduleId] = ensureOriginOnExports(moduleExports, moduleId);
            this.modulesBeingLoaded.delete(moduleId);
            return moduleExports;
        });
    }
    /**
    * Loads a template.
    * @param url The url of the template to load.
    * @return A Promise for a TemplateRegistryEntry containing the template.
    */
    loadTemplate(url) {
        return this.loadModule(this.applyPluginToUrl(url, 'template-registry-entry'));
    }
    /**
    * Loads a text-based resource.
    * @param url The url of the text file to load.
    * @return A Promise for text content.
    */
    loadText(url) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.loadModule(url);
        });
    }
    /**
    * Alters a module id so that it includes a plugin loader.
    * @param url The url of the module to load.
    * @param pluginName The plugin to apply to the module id.
    * @return The plugin-based module id.
    */
    applyPluginToUrl(url, pluginName) {
        return `${pluginName}!${url}`;
    }
    /**
    * Registers a plugin with the loader.
    * @param pluginName The name of the plugin.
    * @param implementation The plugin implementation.
    */
    addPlugin(pluginName, implementation) {
        this.loaderPlugins[pluginName] = implementation;
    }
}
PLATFORM.Loader = NodeJsLoader;
