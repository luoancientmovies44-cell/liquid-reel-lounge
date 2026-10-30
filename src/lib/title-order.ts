const titles = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
export function compareTitles(a: { title: string; id?: string }, b: { title: string; id?: string }): number {
  return titles.compare(a.title.trim(), b.title.trim()) || String(a.id || "").localeCompare(String(b.id || ""));
}