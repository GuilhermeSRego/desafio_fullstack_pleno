"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, Flame } from "lucide-react";

const HeatMapContent = dynamic(() => import("./HeatMapContent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400">
      Carregando mapa de calor...
    </div>
  ),
});

const MapClustersContent = dynamic(() => import("./MapClustersContent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400">
      Carregando aglomerados...
    </div>
  ),
});

export default function InteractiveMap() {
  const [view, setView] = useState<"heatmap" | "clusters">("clusters");

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center gap-2">
        <Button 
          variant={view === "clusters" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setView("clusters")}
          className="flex items-center gap-2"
        >
          <MapIcon size={16} /> Aglomerados (Listagem)
        </Button>
        <Button 
          variant={view === "heatmap" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setView("heatmap")}
          className="flex items-center gap-2"
        >
          <Flame size={16} /> Mapa de Calor
        </Button>
      </div>
      <div className="flex-1 min-h-0 rounded-lg overflow-hidden border dark:border-gray-800">
        {view === "heatmap" ? <HeatMapContent /> : <MapClustersContent />}
      </div>
    </div>
  );
}
