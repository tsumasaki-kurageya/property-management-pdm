export function expandBusinessReferences(expression, catalog) {
  const text = expression.replace(/`/g, '');
  const catalogIds = new Set(catalog.tasks.map((task) => task.id));
  const areaTasks = new Map(catalog.areas.map((area) => [area.id, area.tasks.map((task) => task.id)]));
  const ids = new Set();

  const normalized = text.replace(
    /BM-(\d{2})-(\d{2})\s*([〜～])\s*BM-\1-(\d{2})/g,
    (_match, area, start, separator, end) => `BM-${area}-${start}${separator}${end}`,
  );
  const explicit = [...normalized.matchAll(/BM-(\d{2})-(\d{2})/g)];

  for (let index = 0; index < explicit.length; index += 1) {
    const match = explicit[index];
    const area = match[1];
    const segmentEnd = explicit[index + 1]?.index ?? normalized.length;
    const segment = normalized.slice(match.index, segmentEnd);
    const tail = segment
      .replace(new RegExp(`^BM-${area}-`), '')
      .replace(/[\s|）)】\]]+$/g, '')
      .replace(/[、，,]+$/g, '');

    for (const group of tail.split(/[、，,]/).map((value) => value.trim()).filter(Boolean)) {
      if (/^BM-\d{2}-/.test(group)) continue;
      for (const token of group.split('・').map((value) => value.trim()).filter(Boolean)) {
        const range = token.match(/^(\d{2})\s*[〜～]\s*(\d{2})$/);
        if (range) {
          for (let number = Number(range[1]); number <= Number(range[2]); number += 1) {
            const id = `BM-${area}-${String(number).padStart(2, '0')}`;
            if (catalogIds.has(id)) ids.add(id);
          }
        } else {
          const number = token.match(/^(\d{2})(?!\d)/)?.[1];
          if (number) {
            const id = `BM-${area}-${number}`;
            if (catalogIds.has(id)) ids.add(id);
          }
        }
      }
    }
  }

  for (const match of normalized.matchAll(/BM-(\d{2})(?!-\d{2})/g)) {
    for (const id of areaTasks.get(`BM-${match[1]}`) ?? []) ids.add(id);
  }

  return [...ids];
}
