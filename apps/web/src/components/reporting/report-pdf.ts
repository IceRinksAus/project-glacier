export type ReportPdfData = {
  title: string;
  scope: string;
  period: string;
  generatedAt: string;
  metrics: Array<{ label: string; value: string }>;
  columns: Array<{ label: string; width: number; align?: "left" | "right" }>;
  rows: string[][];
  note: string;
};

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 38;
const NAVY = "0.012 0.106 0.188";
const BLUE = "0.039 0.424 0.878";
const PALE_BLUE = "0.925 0.957 0.992";
const BORDER = "0.804 0.867 0.902";
const TEXT = "0.027 0.102 0.188";
const MUTED = "0.321 0.392 0.486";

export function createReportPdf(data: ReportPdfData): Blob {
  const firstPageRows = 7;
  const laterPageRows = 12;
  const pageRows: string[][][] = [];
  pageRows.push(data.rows.slice(0, firstPageRows));
  for (let index = firstPageRows; index < data.rows.length; index += laterPageRows) pageRows.push(data.rows.slice(index, index + laterPageRows));

  const pageIds = pageRows.map((_, index) => 5 + index * 2);
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageRows.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  pageRows.forEach((rows, pageIndex) => {
    const pageId = pageIds[pageIndex];
    const contentId = pageId + 1;
    const stream = drawPage(data, rows, pageIndex, pageRows.length);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /Regular 3 0 R /Bold 4 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function drawPage(data: ReportPdfData, rows: string[][], pageIndex: number, pageCount: number): string {
  const commands: string[] = [];
  commands.push(fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "1 1 1"));
  commands.push(fillRect(0, PAGE_HEIGHT - 82, PAGE_WIDTH, 82, NAVY));
  commands.push(line(38, 548, 56, 568, "0.176 0.635 0.957", 2));
  commands.push(line(56, 568, 72, 548, "0.176 0.635 0.957", 2));
  commands.push(line(48, 556, 56, 564, "0.420 0.804 0.992", 1.5));
  commands.push(text("GLACIER", 82, 553, 18, "Bold", "1 1 1"));
  commands.push(text(data.title, 300, 558, 18, "Bold", "1 1 1"));
  commands.push(text(pageIndex === 0 ? "ORGANISATIONAL REPORT" : "REPORT CONTINUED", 300, 538, 8, "Bold", "0.576 0.773 0.945"));

  let tableTop: number;
  if (pageIndex === 0) {
    commands.push(text(`Scope: ${data.scope}`, MARGIN, 486, 9, "Bold", TEXT));
    commands.push(text(`Period: ${data.period}`, MARGIN, 469, 9, "Regular", MUTED));
    commands.push(text(`Generated: ${data.generatedAt}`, 500, 486, 9, "Regular", MUTED));
    commands.push(text("Currency: AUD", 500, 469, 9, "Regular", MUTED));
    const gap = 10;
    const cardWidth = (PAGE_WIDTH - MARGIN * 2 - gap * 4) / 5;
    data.metrics.slice(0, 5).forEach((metric, index) => {
      const x = MARGIN + index * (cardWidth + gap);
      commands.push(fillRect(x, 390, cardWidth, 58, PALE_BLUE));
      commands.push(strokeRect(x, 390, cardWidth, 58, BORDER, 0.8));
      commands.push(text(truncate(metric.label.toUpperCase(), 25), x + 12, 427, 7, "Bold", MUTED));
      commands.push(text(truncate(metric.value, 19), x + 12, 403, 16, "Bold", TEXT));
    });
    tableTop = 365;
  } else {
    commands.push(text(`${data.scope} | ${data.period}`, MARGIN, 486, 9, "Regular", MUTED));
    tableTop = 460;
  }

  commands.push(...drawTable(data.columns, rows, tableTop));
  commands.push(fillRect(MARGIN, 31, PAGE_WIDTH - MARGIN * 2, 42, "0.965 0.976 0.988"));
  commands.push(text("HOW TO READ THIS REPORT", MARGIN + 12, 59, 7, "Bold", BLUE));
  wrapText(data.note, 150).slice(0, 2).forEach((noteLine, index) => commands.push(text(noteLine, MARGIN + 12, 45 - index * 10, 7.5, "Regular", MUTED)));
  commands.push(text(`Glacier | ${data.title}`, MARGIN, 14, 7, "Regular", MUTED));
  commands.push(text(`Page ${pageIndex + 1} of ${pageCount}`, PAGE_WIDTH - 82, 14, 7, "Regular", MUTED));
  return commands.join("\n");
}

function drawTable(columns: ReportPdfData["columns"], rows: string[][], top: number): string[] {
  const commands: string[] = [];
  const totalWeight = columns.reduce((sum, column) => sum + column.width, 0);
  const available = PAGE_WIDTH - MARGIN * 2;
  const widths = columns.map((column) => available * column.width / totalWeight);
  commands.push(fillRect(MARGIN, top - 28, available, 28, NAVY));
  let x = MARGIN;
  columns.forEach((column, index) => {
    const width = widths[index];
    commands.push(alignedText(column.label.toUpperCase(), x + 9, top - 18, width - 18, 7, "Bold", "1 1 1", column.align));
    x += width;
  });
  if (rows.length === 0) {
    commands.push(strokeRect(MARGIN, top - 68, available, 40, BORDER, 0.8));
    commands.push(text("No report rows match this selection.", MARGIN + 12, top - 53, 9, "Regular", MUTED));
    return commands;
  }
  rows.forEach((row, rowIndex) => {
    const y = top - 28 - (rowIndex + 1) * 34;
    if (rowIndex % 2 === 1) commands.push(fillRect(MARGIN, y, available, 34, "0.974 0.982 0.992"));
    commands.push(strokeRect(MARGIN, y, available, 34, BORDER, 0.45));
    let cellX = MARGIN;
    columns.forEach((column, columnIndex) => {
      const width = widths[columnIndex];
      const maxCharacters = Math.max(5, Math.floor(width / 5.2));
      commands.push(alignedText(truncate(row[columnIndex] ?? "", maxCharacters), cellX + 9, y + 13, width - 18, 8, columnIndex === 0 ? "Bold" : "Regular", TEXT, column.align));
      cellX += width;
    });
  });
  return commands;
}

function text(value: string, x: number, y: number, size: number, font: "Regular" | "Bold", colour: string): string { return `BT /${font} ${size} Tf ${colour} rg 1 0 0 1 ${round(x)} ${round(y)} Tm (${escapePdf(asPdfText(value))}) Tj ET`; }
function alignedText(value: string, x: number, y: number, width: number, size: number, font: "Regular" | "Bold", colour: string, align: "left" | "right" = "left"): string { const estimatedWidth = value.length * size * (font === "Bold" ? 0.55 : 0.5); return text(value, align === "right" ? Math.max(x, x + width - estimatedWidth) : x, y, size, font, colour); }
function fillRect(x: number, y: number, width: number, height: number, colour: string): string { return `${colour} rg ${round(x)} ${round(y)} ${round(width)} ${round(height)} re f`; }
function strokeRect(x: number, y: number, width: number, height: number, colour: string, lineWidth: number): string { return `${colour} RG ${lineWidth} w ${round(x)} ${round(y)} ${round(width)} ${round(height)} re S`; }
function line(x1: number, y1: number, x2: number, y2: number, colour: string, width: number): string { return `${colour} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`; }
function round(value: number): string { return value.toFixed(2).replace(/\.00$/, ""); }
function truncate(value: string, length: number): string { return value.length <= length ? value : `${value.slice(0, Math.max(1, length - 3))}...`; }
function wrapText(value: string, length: number): string[] { const words = value.split(/\s+/); const lines: string[] = []; let current = ""; words.forEach((word) => { if (!current || `${current} ${word}`.length <= length) current = current ? `${current} ${word}` : word; else { lines.push(current); current = word; } }); if (current) lines.push(current); return lines; }
function asPdfText(value: string): string { return value.normalize("NFKD").replace(/[^\x20-\x7E]/g, " "); }
function escapePdf(value: string): string { return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); }
