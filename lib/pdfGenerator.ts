import PDFDocument from "pdfkit";
import type { ResearchResult } from "./types";

const ACCENT = "#B5651D";
const INK = "#1A1A1A";
const MUTED = "#6B6B6B";
const RULE = "#D8D2C4";

function drawSectionHeading(doc: PDFKit.PDFDocument, text: string) {
  doc.moveDown(0.8);
  doc
    .fillColor(ACCENT)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(text.toUpperCase(), { characterSpacing: 1.2 });
  const y = doc.y + 2;
  doc
    .strokeColor(RULE)
    .lineWidth(1)
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .stroke();
  doc.moveDown(0.6);
  doc.fillColor(INK).font("Helvetica").fontSize(10.5);
}

function bulletList(doc: PDFKit.PDFDocument, items: string[]) {
  if (!items.length) {
    doc.fillColor(MUTED).text("Not available.", { indent: 10 });
    return;
  }
  items.forEach((item) => {
    doc
      .fillColor(INK)
      .text(`•  ${item}`, { indent: 10, lineGap: 2 });
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

      // --- Header ---
      doc
        .fillColor(MUTED)
        .font("Helvetica")
        .fontSize(9)
        .text("COMPANY RESEARCH REPORT", { characterSpacing: 1.5 });
      doc.moveDown(0.3);
      doc
        .fillColor(INK)
        .font("Helvetica-Bold")
        .fontSize(24)
        .text(company.name);
      doc
        .fillColor(ACCENT)
        .font("Helvetica")
        .fontSize(11)
        .text(company.website);
      doc
        .fillColor(MUTED)
        .fontSize(8.5)
        .text(
          `Generated ${new Date(result.generatedAt).toLocaleString()} · Model: ${result.model}`
        );

      doc
        .moveDown(0.5)
        .strokeColor(RULE)
        .lineWidth(1.5)
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke();

      // --- Company Information ---
      drawSectionHeading(doc, "Company Information");
      const infoRows: [string, string][] = [
        ["Phone", company.phone ?? "Not available"],
        ["Address", company.address ?? "Not available"],
      ];
      infoRows.forEach(([label, value]) => {
        doc
          .font("Helvetica-Bold")
          .fillColor(INK)
          .fontSize(10)
          .text(`${label}:  `, { continued: true })
          .font("Helvetica")
          .fillColor(MUTED)
          .text(value);
      });

      doc.moveDown(0.4);
      doc.font("Helvetica").fillColor(INK).fontSize(10.5).text(company.summary, {
        lineGap: 3,
      });

      // --- Products / Services ---
      drawSectionHeading(doc, "Products & Services");
      bulletList(doc, company.productsServices);

      // --- Pain Points ---
      drawSectionHeading(doc, "AI-Generated Pain Points");
      bulletList(doc, company.painPoints);

      // --- Competitors ---
      drawSectionHeading(doc, "Competitor Analysis");
      if (!competitors.length) {
        doc.fillColor(MUTED).text("No competitors identified.", { indent: 10 });
      } else {
        competitors.forEach((c, i) => {
          doc
            .font("Helvetica-Bold")
            .fillColor(INK)
            .fontSize(10.5)
            .text(`${i + 1}. ${c.name}`, { continued: false });
          doc
            .font("Helvetica")
            .fillColor(ACCENT)
            .fontSize(9.5)
            .text(c.website, { indent: 14 });
          doc
            .fillColor(MUTED)
            .fontSize(9.5)
            .text(c.reason, { indent: 14, lineGap: 2 });
          doc.moveDown(0.35);
        });
      }

      // --- Footer ---
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .fillColor(MUTED)
          .text(
            `Company Research Assistant · Page ${i + 1} of ${range.count}`,
            doc.page.margins.left,
            doc.page.height - 40,
            {
              width:
                doc.page.width -
                doc.page.margins.left -
                doc.page.margins.right,
              align: "center",
            }
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
