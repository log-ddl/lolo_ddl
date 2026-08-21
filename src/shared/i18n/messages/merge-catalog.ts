type CatalogSection = Readonly<Record<string, string>>;

/** Merge translation domains and fail fast if a key is declared twice. */
export function mergeCatalogSections(...sections: CatalogSection[]): Record<string, string> {
  const catalog: Record<string, string> = {};

  for (const section of sections) {
    for (const [key, value] of Object.entries(section)) {
      if (Object.prototype.hasOwnProperty.call(catalog, key)) {
        throw new Error(`Duplicate i18n key: ${key}`);
      }
      catalog[key] = value;
    }
  }

  return catalog;
}
