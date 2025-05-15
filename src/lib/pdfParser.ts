import pdfParse from "pdf-parse";

export type DamLevel = {
  damName: string;
  district: string;
  currentLevel: number;
  fullReservoirLevel: number;
  storagePercentage: number;
  lastUpdated: string;
};

export async function parseKSEBPdf(pdfBuffer: Buffer): Promise<DamLevel[]> {
  const data = await pdfParse(pdfBuffer);
  const lines = data.text.split("\n").filter((line: string) => line.trim());

  const damLevels: DamLevel[] = [];
  let currentDistrict = "";
  let isDataSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and headers
    if (!line || line.includes("KERALA STATE ELECTRICITY BOARD")) continue;

    // Check for district line
    if (line.includes("District")) {
      currentDistrict = line.split(":")[1]?.trim() || currentDistrict;
      continue;
    }

    // Check if we've reached the data section
    if (line.includes("Sl.") || line.includes("No.")) {
      isDataSection = true;
      continue;
    }

    // Parse dam data
    if (isDataSection && /^\d+\./.test(line)) {
      const parts = line.split(/\s+/);
      if (parts.length >= 6) {
        try {
          // Remove the serial number and dot
          parts.shift();

          const damLevel: DamLevel = {
            damName: parts[0].replace(/\d+\./g, "").trim(),
            district: currentDistrict,
            currentLevel: parseFloat(parts[2]) || 0,
            fullReservoirLevel: parseFloat(parts[1]) || 0,
            storagePercentage: parseFloat(parts[4].replace("%", "")) || 0,
            lastUpdated: new Date().toISOString(), // PDF usually has date in header
          };

          if (damLevel.currentLevel > 0 && damLevel.fullReservoirLevel > 0) {
            damLevels.push(damLevel);
          }
        } catch (error) {
          console.error("Error parsing KSEB dam line:", line);
        }
      }
    }
  }

  return damLevels;
}

export async function parseIrrigationPdf(
  pdfBuffer: Buffer
): Promise<DamLevel[]> {
  const data = await pdfParse(pdfBuffer);
  const lines = data.text.split("\n").filter((line: string) => line.trim());

  const damLevels: DamLevel[] = [];
  let currentDistrict = "";
  let isDataSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and headers
    if (!line || line.includes("IRRIGATION DEPARTMENT")) continue;

    // Check for district line
    if (line.includes("District")) {
      currentDistrict = line.split(":")[1]?.trim() || currentDistrict;
      continue;
    }

    // Check if we've reached the data section
    if (line.includes("Name of Dam") || line.includes("Reservoir")) {
      isDataSection = true;
      continue;
    }

    // Parse dam data
    if (isDataSection && line.length > 0 && !line.includes("Note:")) {
      const parts = line.split(/\s+/);
      if (parts.length >= 5) {
        try {
          const damLevel: DamLevel = {
            damName: parts[0].replace(/\d+\./g, "").trim(),
            district: currentDistrict,
            currentLevel: parseFloat(parts[2]) || 0,
            fullReservoirLevel: parseFloat(parts[1]) || 0,
            storagePercentage: parseFloat(parts[4].replace("%", "")) || 0,
            lastUpdated: new Date().toISOString(), // PDF usually has date in header
          };

          if (damLevel.currentLevel > 0 && damLevel.fullReservoirLevel > 0) {
            damLevels.push(damLevel);
          }
        } catch (error) {
          console.error("Error parsing Irrigation dam line:", line);
        }
      }
    }
  }

  return damLevels;
}

// Helper function to combine data from both PDFs
export async function parseAllDamLevels(
  ksebPdfBuffer: Buffer,
  irrigationPdfBuffer: Buffer
): Promise<DamLevel[]> {
  const [ksebDams, irrigationDams] = await Promise.all([
    parseKSEBPdf(ksebPdfBuffer),
    parseIrrigationPdf(irrigationPdfBuffer),
  ]);

  // Combine and deduplicate if needed
  const allDams = [...ksebDams, ...irrigationDams];
  return allDams.filter(
    (dam, index, self) =>
      index === self.findIndex((d) => d.damName === dam.damName)
  );
}
