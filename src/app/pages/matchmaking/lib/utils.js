export const getTimezoneLabel = (tz) => tz?.name || tz?.text || tz?.value || "";
export const getLanguageLabel = (lang) => lang?.name || lang?.value || "";

export function filterByQuery(items, query, labeler) {
  const q = (query || "").toLowerCase();
  return (items || []).filter((it) => labeler(it).toLowerCase().includes(q));
}
