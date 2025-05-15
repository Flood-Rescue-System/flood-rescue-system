import { supabase } from "@/lib/supabase";

export type InfrastructureStatus = {
  roads: {
    status: "open" | "closed" | "partially_open";
    condition: string;
  };
  powerSupply: {
    status: "normal" | "disrupted" | "restored";
    estimatedRestoration?: Date;
  };
  network: {
    status: "normal" | "limited" | "down";
    coverage: number;
    emergencyNetwork: boolean;
  };
  bridges: {
    status: "safe" | "at_risk" | "closed";
    waterLevel: number;
  };
};

export async function getInfrastructureStatus(
  subdivisionId?: number
): Promise<InfrastructureStatus> {
  try {
    // Get latest status for each infrastructure type
    const { data: roads } = await supabase
      .from("road_status")
      .select("*")
      .order("last_updated", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: powerSupply } = await supabase
      .from("power_supply_status")
      .select("*")
      .order("last_updated", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: network } = await supabase
      .from("network_status")
      .select("*")
      .order("last_updated", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: bridges } = await supabase
      .from("bridge_status")
      .select("*")
      .order("last_inspected", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Transform and return the data in the expected format
    return {
      roads: {
        status: roads?.status || "closed",
        condition: roads?.condition || "Unknown",
      },
      powerSupply: {
        status: powerSupply?.status || "disrupted",
        estimatedRestoration: powerSupply?.estimated_restoration
          ? new Date(powerSupply.estimated_restoration)
          : undefined,
      },
      network: {
        status: network?.status || "down",
        coverage: network?.coverage || 0,
        emergencyNetwork: network?.emergency_network || false,
      },
      bridges: {
        status: bridges?.status || "closed",
        waterLevel: parseFloat(bridges?.water_level?.toString() || "0"),
      },
    };
  } catch (error) {
    console.error("Error fetching infrastructure status:", error);
    // Return default values if there's an error
    return {
      roads: { status: "closed", condition: "Unknown" },
      powerSupply: { status: "disrupted" },
      network: { status: "down", coverage: 0, emergencyNetwork: false },
      bridges: { status: "closed", waterLevel: 0 },
    };
  }
} 