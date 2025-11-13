export interface CatalogSource {
  name: string;
  url: string;
  fetchedAt: Date;
}

export interface RawCatalogResult {
  brand: string;
  model: string;
  documentUrl: string;
  data: Record<string, unknown>;
}

export async function fetchCatalog(_brand: string, _model: string): Promise<RawCatalogResult | undefined> {
  // Placeholder: runtime ingestion will use fetch + parsers once wired.
  return undefined;
}
