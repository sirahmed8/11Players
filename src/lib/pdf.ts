import { PlayerProfile } from "@/types";
import React from 'react';
import { createRoot } from 'react-dom/client';
import PDFPlayerCard from '@/components/PDFPlayerCard';
import PDFBulkTable from '@/components/PDFBulkTable';

export async function generateProfilePDF(profile: PlayerProfile, locale: 'en' | 'ar' = 'en'): Promise<void> {
  if (typeof window === "undefined") {
    console.log("PDF generation skipped on server-side execution");
    return;
  }

  try {
    const { jsPDF } = await import("jspdf");

    // Create a hidden container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);

    // Render the React component
    const root = createRoot(container);
    root.render(React.createElement(PDFPlayerCard, { player: profile, locale }));

    // Wait for a brief moment to let React render and images load
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Select the actual card element
    const cardElement = container.querySelector('#pdf-player-card') as HTMLElement;
    if (!cardElement) throw new Error("Card element not found");

    const html2canvas = (await import('html2canvas')).default;

    // Capture with html2canvas
    const canvas = await html2canvas(cardElement, {
      scale: 3, // Ultra high resolution for print quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
    });

    const imgData = canvas.toDataURL('image/png');

    // Create PDF (A4 size is ~210x297mm)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // A4 dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate aspect ratio for the card (500x750)
    const cardRatio = 500 / 750;
    
    // We want the card to fill most of the page but keep aspect ratio
    const margin = 10;
    let targetWidth = pdfWidth - (margin * 2);
    let targetHeight = targetWidth / cardRatio;

    if (targetHeight > pdfHeight - (margin * 2)) {
      targetHeight = pdfHeight - (margin * 2);
      targetWidth = targetHeight * cardRatio;
    }

    const xPos = (pdfWidth - targetWidth) / 2;
    const yPos = (pdfHeight - targetHeight) / 2;

    pdf.addImage(imgData, 'PNG', xPos, yPos, targetWidth, targetHeight);
    pdf.save(`${profile.cardName.toLowerCase().replace(/\s+/g, "_")}_profile.pdf`);

    // Cleanup
    root.unmount();
    document.body.removeChild(container);
  } catch (error) {
    console.error("Error generating profile PDF:", error);
    throw error;
  }
}

export async function generateMasterBulkPDF(profiles: PlayerProfile[], locale: 'en' | 'ar' = 'en'): Promise<void> {
  if (typeof window === "undefined") {
    console.log("PDF generation skipped on server-side execution");
    return;
  }

  try {
    const { jsPDF } = await import("jspdf");

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const ITEMS_PER_PAGE = 15;
    const totalPages = Math.ceil(profiles.length / ITEMS_PER_PAGE) || 1;

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);

    const root = createRoot(container);

    for (let i = 0; i < totalPages; i++) {
      const pageProfiles = profiles.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE);
      
      root.render(React.createElement(PDFBulkTable, {
        profiles: pageProfiles,
        pageIndex: i,
        totalPages: totalPages,
        locale
      }));

      // Wait for render and images
      await new Promise(resolve => setTimeout(resolve, 1500));

      const tableElement = container.querySelector('#pdf-bulk-table') as HTMLElement;
      if (!tableElement) throw new Error("Bulk table element not found");

      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(tableElement, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');

      const targetWidth = pdfWidth; // Full width landscape
      const targetHeight = (canvas.height * pdfWidth) / canvas.width;

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'PNG', 0, 0, targetWidth, targetHeight);
    }

    pdf.save("master_player_directory.pdf");

    // Cleanup
    root.unmount();
    document.body.removeChild(container);
  } catch (error) {
    console.error("Error generating master bulk PDF:", error);
    throw error;
  }
}
