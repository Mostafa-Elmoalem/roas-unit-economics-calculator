import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportElementToPDF(
  elementId: string,
  fileName: string = 'ROAS_Unit_Economics_Report'
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return false;
  }

  try {
    // Temporarily ensure high contrast rendering
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#09090b',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const renderWidth = imgWidth * ratio;
    const renderHeight = imgHeight * ratio;

    const marginX = (pdfWidth - renderWidth) / 2;
    const marginY = (pdfHeight - renderHeight) / 2;

    pdf.addImage(imgData, 'PNG', marginX, marginY, renderWidth, renderHeight);
    pdf.save(`${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    return true;
  } catch (error) {
    console.error('PDF Generation failed', error);
    // Fallback: window.print()
    window.print();
    return false;
  }
}
