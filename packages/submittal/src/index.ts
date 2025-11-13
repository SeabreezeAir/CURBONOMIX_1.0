import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export interface SubmittalSummary {
  title: string;
  notes?: string[];
  dimensions: Record<string, number>;
}

export interface SubmittalContext {
  summary: SubmittalSummary;
  parts: Array<{ name: string; notes?: string[] }>;
}

function escapePdfText(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildContent(ctx: SubmittalContext): string {
  const lines: string[] = [];
  lines.push(ctx.summary.title);
  for (const [key, value] of Object.entries(ctx.summary.dimensions)) {
    lines.push(`${key}: ${value.toFixed(2)} in`);
  }
  if (ctx.summary.notes) {
    lines.push("Notes:");
    for (const note of ctx.summary.notes) {
      lines.push(`- ${note}`);
    }
  }
  lines.push("Parts:");
  for (const part of ctx.parts) {
    lines.push(`• ${part.name}`);
    for (const note of part.notes ?? []) {
      lines.push(`    ${note}`);
    }
  }

  const escapedLines = lines.map(escapePdfText);
  const contentBody = escapedLines
    .map((line, index) => (index === 0 ? `(${line}) Tj` : `T* (${line}) Tj`))
    .join("\n");

  return `BT
/F1 12 Tf
72 720 Td
${contentBody}
ET`;
}

function buildPdf(ctx: SubmittalContext): string {
  const content = buildContent(ctx);
  const contentLength = Buffer.byteLength(content, "utf8");

  const objects: string[] = [];
  objects.push(`1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj`);
  objects.push(`2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj`);
  objects.push(`3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj`);
  objects.push(`4 0 obj
<< /Length ${contentLength} >>
stream
${content}
endstream
endobj`);
  objects.push(`5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj`);

  let offset = 9; // length of "%PDF-1.4\n"
  const xref: number[] = [0];
  const bodyParts: string[] = [];

  for (const object of objects) {
    xref.push(offset);
    const section = `${object}\n`;
    bodyParts.push(section);
    offset += Buffer.byteLength(section, "utf8");
  }

  const xrefStart = offset;
  const xrefEntries = xref
    .map((entry) => entry.toString().padStart(10, "0"))
    .map((entry, index) => `${entry} 00000 ${index === 0 ? "f" : "n"} `)
    .join("\n");

  const xrefTable = `xref
0 ${xref.length}
${xrefEntries}
`;
  const trailer = `trailer
<< /Size ${xref.length} /Root 1 0 R >>
startxref
${xrefStart}
%%EOF`;

  return `%PDF-1.4
${bodyParts.join("")}${xrefTable}${trailer}`;
}

export async function renderPDF(ctx: SubmittalContext, outPath: string): Promise<void> {
  await mkdir(dirname(outPath), { recursive: true });
  const pdf = buildPdf(ctx);
  await writeFile(outPath, pdf, "utf8");
}
