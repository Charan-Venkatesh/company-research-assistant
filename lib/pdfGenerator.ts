import PDFDocument from "pdfkit";
import type { ResearchResult } from "./types";

const ACCENT = "#e0b466";
const INK = "#1A1A1A";
const MUTED = "#6B6B6B";
const BLACK = "#0d0e10";
const WHITE = "#FFFFFF";

function drawSectionHeading(doc: PDFKit.PDFDocument, text: string) {
  doc.moveDown(0.8);
  doc
    .fillColor(ACCENT)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(text.toUpperCase(), { characterSpacing: 0.5 });
    doc.moveDown(0.6);
  doc.fillColor(INK).font("Helvetica").fontSize(10);
}

function bulletList(doc: PDFKit.PDFDocument, items: string[]) {
  if (!items.length) {
    doc.fillColor(MUTED).text("Not available.", { indent: 10 });
    return;
  }
  items.forEach((item) => {
    doc
      .fillColor(INK)
      .text(`•  ${item}`, { indent: 0, lineGap: 4 });
  });
}

export function generateReportPdf(result: ResearchResult): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 56 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const { company, competitors } = result;

      // --- Header (Black bar with orange line) ---
      doc.rect(0, 0, doc.page.width, 100).fill(BLACK);

      doc
        .fillColor(ACCENT)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("RELU CONSULTANCY - COMPANY RESEARCH REPORT", 56, 40, { characterSpacing: 0.5 });

      doc
        .fillColor(WHITE)
        .font("Helvetica-Bold")
        .fontSize(24)
        .text(company.name, 56, 56);

      doc.rect(0, 100, doc.page.width, 4).fill(ACCENT);

      doc.y = 130;
      doc.x = 56;

      // --- Company Information ---
      drawSectionHeading(doc, "Company Information");

      const startX = 56;
      const labelX = startX;
      const valueX = startX + 100;

      doc.font("Helvetica").fillColor(MUTED).fontSize(9);
      doc.text("Website", labelX, doc.y);
      doc.fillColor(INK).text(company.website, valueX, doc.y);

      doc.moveDown(0.5);
      doc.fillColor(MUTED).text("Phone", labelX, doc.y);
      doc.fillColor(INK).text(company.phone ?? "Not publicly listed", valueX, doc.y);

      doc.moveDown(0.5);
      doc.fillColor(MUTED).text("Address", labelX, doc.y);
      doc.fillColor(INK).text(company.address ?? "Not publicly listed", valueX, doc.y);

      doc.moveDown(2);

      // --- Products / Services ---
      drawSectionHeading(doc, "Products & Services");
      bulletList(doc, company.productsServices);

      // --- Pain Points ---
      drawSectionHeading(doc, "AI-Generated Pain Points");
      bulletList(doc, company.painPoints);

      // --- Competitors ---
      drawSectionHeading(doc, "Competitors");
      if (!competitors.length) {
        doc.fillColor(MUTED).text("No competitors identified.", { indent: 10 });
      } else {
        const col1 = 56;
        const col2 = 56 + (doc.page.width - 112) / 2;

        competitors.forEach((c, i) => {
          const isLeft = i % 2 === 0;
          const x = isLeft ? col1 : col2;
          const y = isLeft ? doc.y : doc.y - 12; // Adjust y to stay on same line

          if (isLeft && i > 0) doc.moveDown(1);

          doc
            .font("Helvetica-Bold")
            .fillColor(INK)
            .fontSize(9)
            .text(c.name, x, isLeft ? undefined : y, { continued: false });
          doc
            .font("Helvetica")
            .fillColor(MUTED)
            .fontSize(9)
            .text(c.website, x, doc.y + 2);

          if (!isLeft) doc.moveDown(1);
        });
      }
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
