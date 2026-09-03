export interface ContactRow {
  id: string;
  name: string;
  phone: string;
  platform: string;
  source: string;
  status: string;
}

export function filterContacts<T extends ContactRow>(
  rows: T[],
  query: { platform: string; search: string; source: string; status: string },
): T[] {
  const keyword = query.search.trim();
  return rows.filter((row) => {
    if (query.platform !== 'all' && row.platform !== query.platform)
      return false;
    if (query.status !== 'all' && row.status !== query.status) return false;
    if (query.source !== 'all' && row.source !== query.source) return false;
    if (keyword && !row.name.includes(keyword) && !row.phone.includes(keyword))
      return false;
    return true;
  });
}
