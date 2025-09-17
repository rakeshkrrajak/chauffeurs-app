/**
 * A utility function to escape cell content for CSV format.
 * It handles commas, double quotes, and newlines.
 * @param cell The content of the cell.
 * @returns A CSV-safe string.
 */
const escapeCsvCell = (cell: any): string => {
  if (cell === null || cell === undefined) {
    return '';
  }
  const cellStr = String(cell);
  // If the cell contains a comma, a newline, or a double quote, wrap it in double quotes.
  if (/[",\n]/.test(cellStr)) {
    // Also, escape any existing double quotes by doubling them.
    return `"${cellStr.replace(/"/g, '""')}"`;
  }
  return cellStr;
};

/**
 * A generic helper to export an array of objects to a CSV file.
 * @param filename The desired name of the downloaded file (e.g., 'report.csv').
 * @param data An array of objects to export.
 * @param headers An array of header objects with 'key' and 'label'.
 */
export const exportToCsv = (
  filename: string,
  data: any[],
  headers: { key: string; label: string }[]
): void => {
  // Create header row
  const headerRow = headers.map(h => escapeCsvCell(h.label)).join(',');

  // Create data rows
  const dataRows = data.map(row => {
    return headers.map(header => {
      // Basic key access, can be extended for nested properties if needed.
      return escapeCsvCell(row[header.key]);
    }).join(',');
  });

  // Combine header and data rows
  const csvContent = [headerRow, ...dataRows].join('\n');

  // Create a Blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
