import {Origin} from 'aurelia-metadata';
import {Loader, TemplateRegistryEntry, LoaderPlugin} from 'aurelia-loader';
import {DOM, PLATFORM} from 'aurelia-pal';

export type LoaderPlugin = { fetch: (address: string) => Promise<TemplateRegistryEntry> | TemplateRegistryEntry };

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
  async loadTemplate(loader: Loader, entry: TemplateRegistryEntry) {
    const text = await loader.loadText(entry.address);
    entry.template = DOM.createTemplateFromMarkup(text);
  }
}

export function ensureOriginOnExports(moduleExports: any, moduleId: string) {
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
export class WebpackLoader extends Loader {
  moduleRegistry = Object.create(null);
  loaderPlugins = Object.create(null) as { [name: string]: LoaderPlugin };
  modulesBeingLoaded = new Map<string, Promise<any>>();
  templateLoader: TextTemplateLoader;

  constructor() {
    super();

    this.useTemplateLoader(new TextTemplateLoader());
    const loader = this;

    this.addPlugin('template-registry-entry', {
      'fetch': function(address) {
        let entry = loader.getOrCreateTemplateRegistryEntry(address);
        return entry.templateIsLoaded ? entry : loader.templateLoader.loadTemplate(loader, entry).then(() => entry);
      }
    } as LoaderPlugin);

    PLATFORM.eachModule = callback => {};
  }

  async _import(moduleId: string) {
    const moduleIdParts = moduleId.split('!');
    const modulePath = moduleIdParts.splice(moduleIdParts.length - 1, 1)[0];
    const loaderPlugin = moduleIdParts.length === 1 ? moduleIdParts[0] : null;

    if (loaderPlugin) {
      const plugin = this.loaderPlugins[loaderPlugin];
      if (!plugin) {
        throw new Error(`Plugin ${loaderPlugin} is not registered in the loader.`);
      }
      return await plugin.fetch(modulePath);
    }

    return require(modulePath);
  }

  /**
  * Maps a module id to a source.
  * @param id The module id.
  * @param source The source to map the module to.
  */
  map(id: string, source: any) {}

  /**
  * Normalizes a module id.
  * @param moduleId The module id to normalize.
  * @param relativeTo What the module id should be normalized relative to.
  * @return The normalized module id.
  */
  normalizeSync(moduleId: string, relativeTo: string) {
    return moduleId;
  }

  /**
  * Normalizes a module id.
  * @param moduleId The module id to normalize.
  * @param relativeTo What the module id should be normalized relative to.
  * @return The normalized module id.
  */
  normalize(moduleId: string, relativeTo: string) {
    return Promise.resolve(moduleId);
  }

  /**
  * Instructs the loader to use a specific TemplateLoader instance for loading templates
  * @param templateLoader The instance of TemplateLoader to use for loading templates.
  */
  useTemplateLoader(templateLoader: TextTemplateLoader) {
    this.templateLoader = templateLoader;
  }

  /**
  * Loads a collection of modules.
  * @param ids The set of module ids to load.
  * @return A Promise for an array of loaded modules.
  */
  loadAllModules(ids: Array<string>) {
    return Promise.all(
      ids.map(id => this.loadModule(id))
    );
  }

  /**
  * Loads a module.
  * @param moduleId The module ID to load.
  * @return A Promise for the loaded module.
  */
  async loadModule(moduleId: string) {
    let existing = this.moduleRegistry[moduleId];
    if (existing) {
      return existing;
    }
    let beingLoaded = this.modulesBeingLoaded.get(moduleId);
    if (beingLoaded) {
      return beingLoaded;
    }
    beingLoaded = this._import(moduleId);
    this.modulesBeingLoaded.set(moduleId, beingLoaded);
    const moduleExports = await beingLoaded;
    this.moduleRegistry[moduleId] = ensureOriginOnExports(moduleExports, moduleId);
    this.modulesBeingLoaded.delete(moduleId);
    return moduleExports;
  }

  /**
  * Loads a template.
  * @param url The url of the template to load.
  * @return A Promise for a TemplateRegistryEntry containing the template.
  */
  loadTemplate(url: string) {
    return this.loadModule(this.applyPluginToUrl(url, 'template-registry-entry'));
  }

  /**
  * Loads a text-based resource.
  * @param url The url of the text file to load.
  * @return A Promise for text content.
  */
  async loadText(url: string) {
    const result = await this.loadModule(url);
    if (result instanceof Array && result[0] instanceof Array && result.hasOwnProperty('toString')) {
      // we're dealing with a file loaded using the css-loader:
      return result.toString();
    }
    return result;
  }

  /**
  * Alters a module id so that it includes a plugin loader.
  * @param url The url of the module to load.
  * @param pluginName The plugin to apply to the module id.
  * @return The plugin-based module id.
  */
  applyPluginToUrl(url: string, pluginName: string) {
    return `${pluginName}!${url}`;
  }

  /**
  * Registers a plugin with the loader.
  * @param pluginName The name of the plugin.
  * @param implementation The plugin implementation.
  */
  addPlugin(pluginName: string, implementation: LoaderPlugin) {
    this.loaderPlugins[pluginName] = implementation;
  }
}

(PLATFORM as any).Loader = WebpackLoader;
