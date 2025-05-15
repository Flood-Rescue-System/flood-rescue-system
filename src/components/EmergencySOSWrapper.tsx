"use client";

import dynamic from "next/dynamic";

const EmergencySOSForm = dynamic(() => import("./EmergencySOSForm"), {
  ssr: false,
});

export default function EmergencySOSWrapper() {
  return <EmergencySOSForm />;
}
