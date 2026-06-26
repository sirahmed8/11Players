import { PlayerProfile } from "@/types";

export async function generateProfilePDF(profile: PlayerProfile): Promise<void> {
  if (typeof window === "undefined") {
    console.log("PDF generation skipped on server-side execution");
    return;
  }

  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Write title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(34, 197, 94); // emerald-500
    doc.text("11PLAYERS PLAYER PROFILE", 20, 25);

    // Profile Info
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`Full Name: ${profile.fullName}`, 20, 45);
    doc.text(`Card Name: ${profile.cardName}`, 20, 55);
    doc.text(`Date of Birth: ${profile.dateOfBirth} (Age: ${profile.calculatedAge})`, 20, 65);
    doc.text(`Height: ${profile.height} cm | Weight: ${profile.weight} kg`, 20, 75);
    doc.text(`Preferred Foot: ${profile.preferredFoot}`, 20, 85);
    doc.text(`Primary Position: ${profile.primaryPosition}`, 20, 95);

    // Attributes
    doc.setFontSize(16);
    doc.setTextColor(21, 128, 61); // emerald-700
    doc.text("PLAYER ATTRIBUTES", 20, 115);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    let yPos = 125;
    Object.entries(profile.attributes).forEach(([key, val]) => {
      const label = key.replace(/([A-Z])/g, " $1");
      doc.text(`${label.toUpperCase()}: ${val}`, 25, yPos);
      yPos += 10;
    });

    // Save the PDF
    doc.save(`${profile.cardName.toLowerCase().replace(/\s+/g, "_")}_profile.pdf`);
  } catch (error) {
    console.error("Error generating profile PDF:", error);
    throw error;
  }
}

export async function generateMasterBulkPDF(profiles: PlayerProfile[]): Promise<void> {
  if (typeof window === "undefined") {
    console.log("PDF generation skipped on server-side execution");
    return;
  }

  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(34, 197, 94);
    doc.text("11PLAYERS MASTER PLAYER DIRECTORY", 20, 25);

    // Table Header
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("Name", 20, 45);
    doc.text("Position", 80, 45);
    doc.text("Age", 110, 45);
    doc.text("Foot", 130, 45);
    doc.text("Verified", 160, 45);
    doc.text("Warning", 190, 45);
    doc.text("Goals", 220, 45);
    doc.text("Assists", 250, 45);

    doc.line(20, 48, 275, 48);

    let yPos = 55;
    profiles.forEach((p) => {
      if (yPos > 185) {
        doc.addPage();
        yPos = 30;
      }
      doc.text(p.fullName, 20, yPos);
      doc.text(p.primaryPosition, 80, yPos);
      doc.text(p.calculatedAge.toString(), 110, yPos);
      doc.text(p.preferredFoot, 130, yPos);
      doc.text(p.isVerifiedByAdmin ? "Yes" : "No", 160, yPos);
      doc.text(p.hasWarning ? "Yes" : "No", 190, yPos);
      doc.text((p.stats?.goals || 0).toString(), 220, yPos);
      doc.text((p.stats?.assists || 0).toString(), 250, yPos);

      yPos += 10;
    });

    doc.save("master_player_directory.pdf");
  } catch (error) {
    console.error("Error generating master bulk PDF:", error);
    throw error;
  }
}
