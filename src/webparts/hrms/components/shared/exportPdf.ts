import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import html2canvas from "html2canvas";

/** Renders a titled table into a single-page PDF and downloads it. */
export function exportTableToPdf(filename: string, title: string, columns: string[], rows: Array<Array<string | number>>): void {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  autoTable(doc, {
    startY: 22,
    head: [columns],
    body: rows.map((row) => row.map((cell) => String(cell ?? ""))),
  });
  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

/** Snapshots a DOM element into a (possibly multi-page) PDF and downloads it. */
export async function exportElementToPdf(filename: string, element: HTMLElement): Promise<void> {
  const canvas = await html2canvas(element, { scale: 2 });
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imageData = canvas.toDataURL("image/png");

  let heightLeft = imgHeight;
  let position = 0;

  doc.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    doc.addPage();
    doc.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
