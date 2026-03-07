export function parseCsv(text: string): Record<string, string>[] {
  const result: Record<string, string>[] = [];
  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;

  // Split into lines respecting quotes
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === '\n' && !insideQuotes) {
      lines.push(currentLine);
      currentLine = "";
      continue;
    } else if (char === '\r' && !insideQuotes) {
      continue; // Ignore carriage returns
    }
    currentLine += char;
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]!).map(h => h.trim());

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;

    const values = parseLine(line);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]!] = values[j] ? values[j]!.trim() : "";
    }
    result.push(row);
  }

  return result;
}

function parseLine(line: string): string[] {
  const result: string[] = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentValue += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(currentValue);
      currentValue = "";
    } else {
      currentValue += char;
    }
  }
  result.push(currentValue);
  return result;
}

export function generateCsv(data: Record<string, any>[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]!);
  
  const escapeValue = (val: any) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escapeValue).join(",");
  const rows = data.map(row => 
    headers.map(header => escapeValue(row[header])).join(",")
  );

  return [headerRow, ...rows].join("\n");
}
