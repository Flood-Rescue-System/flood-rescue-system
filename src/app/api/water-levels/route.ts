import { NextResponse } from "next/server";
// import { parseAllDamLevels } from "@/lib/pdfParser";

// Mock data for testing
const mockDamLevels = [
  {
    damName: "Idukki Dam",
    district: "Idukki",
    currentLevel: 2325.5,
    fullReservoirLevel: 2403,
    storagePercentage: 85,
    lastUpdated: new Date().toISOString(),
  },
  {
    damName: "Mullaperiyar Dam",
    district: "Idukki",
    currentLevel: 135.2,
    fullReservoirLevel: 142,
    storagePercentage: 92,
    lastUpdated: new Date().toISOString(),
  },
  // Add a few more mock entries...
];

export async function GET() {
  try {
    // Comment out PDF fetching for now
    /* const [ksebResponse, irrResponse] = await Promise.all([...]);
    const [ksebBuffer, irrBuffer] = await Promise.all([...]);
    const damLevels = await parseAllDamLevels(...); */

    return NextResponse.json(mockDamLevels);
  } catch (error) {
    console.error("Error processing dam levels:", error);
    return NextResponse.json(
      { error: "Failed to fetch dam levels" },
      { status: 500 }
    );
  }
}
