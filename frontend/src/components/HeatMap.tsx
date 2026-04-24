"use client";

import dynamic from "next/dynamic";

const HeatMapContent = dynamic(() => import("./HeatMapContent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400">
      Carregando mapa...
    </div>
  ),
});

export default function HeatMap() {
  return <HeatMapContent />;
}
