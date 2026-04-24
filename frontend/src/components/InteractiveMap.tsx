"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, Flame } from "lucide-react";

import { cn } from "@/lib/utils";

const HeatMapContent = dynamic(() => import("./HeatMapContent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-xl text-gray-400">
      Carregando mapa de calor...
    </div>
  ),
});

const MapClustersContent = dynamic(() => import("./MapClustersContent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-xl text-gray-400">
      Carregando aglomerados...
    </div>
  ),
});

export default function InteractiveMap() {
  const [view, setView] = useState<"heatmap" | "clusters">("clusters");

  return (
    <div className="flex flex-col h-full bg-white dark:bg-transparent p-1">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Button 
          variant={view === "clusters" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setView("clusters")}
          className={cn(
            "h-10 px-5 rounded-2xl font-medium transition-all cursor-pointer shadow-sm active:scale-95",
            view === "clusters" 
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20" 
              : "bg-white dark:bg-gray-900 border-2 border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
          )}
        >
          <MapIcon size={18} className="mr-2" /> Aglomerados
        </Button>
        <Button 
          variant={view === "heatmap" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setView("heatmap")}
          className={cn(
            "h-10 px-5 rounded-2xl font-medium transition-all cursor-pointer shadow-sm active:scale-95",
            view === "heatmap" 
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20" 
              : "bg-white dark:bg-gray-900 border-2 border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
          )}
        >
          <Flame size={18} className="mr-2" /> Mapa de Calor
        </Button>
      </div>
      <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-800/50 shadow-inner">
        {view === "heatmap" ? <HeatMapContent /> : <MapClustersContent />}
      </div>
    </div>
  );
}
