export type SetCatalogRecord = {
  setNum: string;
  name: string;
  year: number | null;
  themeName: string | null;
  themeId: number | null;
  numParts: number | null;
  setImgUrl: string | null;
  lastModifiedDt: string | null;
  fetchedAt: string;
};

export type SetLookupResponse = {
  set: SetCatalogRecord;
  source: "cache" | "rebrickable";
};
