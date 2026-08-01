/**
 * Minimal CSV utilities — quoting is RFC 4180 compliant and the BOM keeps
 * accented characters readable when the file is opened in Excel.
 */

function escapeCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows, columns) {
  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const body = rows.map((row) =>
    columns
      .map((c) => escapeCell(c.accessor ? c.accessor(row) : row[c.key]))
      .join(",")
  );
  return [header, ...body].join("\n");
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
