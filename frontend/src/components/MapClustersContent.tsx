"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.heat";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MapPin, ShieldAlert } from "lucide-react";
import Link from "next/link";

const BairrosCoords: Record<string, [number, number]> = {
  "Rocinha": [-22.9897, -43.2458],
  "Maré": [-22.8643, -43.2409],
  "Jacarezinho": [-22.8872, -43.2575],
  "Complexo do Alemão": [-22.8623, -43.2721],
  "Mangueira": [-22.9055, -43.2384],
};

function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || points.length === 0) return;
    // @ts-ignore
    const layer = L.heatLayer(points, {
      radius: 35, blur: 15, maxZoom: 17, max: 0.5,
      gradient: { 0.2: 'blue', 0.4: 'cyan', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' }
    }).addTo(map);
    return () => { map.removeLayer(layer); };
  }, [map, points]);
  return null;
}

function MarkerClusterLayer({ 
  childrenData, 
  onClusterClick 
}: { 
  childrenData: any[], 
  onClusterClick: (children: any[]) => void 
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || childrenData.length === 0) return;

    // @ts-ignore
    const clusters = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: function(cluster: any) {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600/90 border-2 border-white shadow-lg text-white font-bold text-sm animate-in zoom-in duration-300">${count}</div>`,
          className: 'cluster-icon',
          iconSize: [40, 40]
        });
      }
    });

    childrenData.forEach((child) => {
      if (BairrosCoords[child.bairro]) {
        const [lat, lng] = BairrosCoords[child.bairro];
        const jitterLat = lat + (Math.random() - 0.5) * 0.005;
        const jitterLng = lng + (Math.random() - 0.5) * 0.005;

        const numAlertas = 
          (child.saude?.alertas?.length || 0) + 
          (child.educacao?.alertas?.length || 0) + 
          (child.assistencia_social?.alertas?.length || 0);

        const marker = L.marker([jitterLat, jitterLng], {
          icon: L.divIcon({
            html: `<div class="w-7 h-7 rounded-full ${numAlertas > 0 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'} border-2 border-white flex items-center justify-center text-[10px] text-white font-bold transition-transform hover:scale-125">${numAlertas}</div>`,
            className: 'custom-div-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })
        });

        // @ts-ignore
        marker.childData = child;

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onClusterClick([child]);
        });

        clusters.addLayer(marker);
      }
    });

    clusters.on('clusterclick', (e: any) => {
      const childMarkers = e.layer.getAllChildMarkers();
      const clusterChildren = childMarkers.map((m: any) => m.childData);
      onClusterClick(clusterChildren);
    });

    map.addLayer(clusters);

    return () => {
      map.removeLayer(clusters);
    };
  }, [map, childrenData, onClusterClick]);

  return null;
}

export default function MapClustersContent() {
  const [children, setChildren] = useState<any[]>([]);
  const [heatPoints, setHeatPoints] = useState<[number, number, number][]>([]);
  const [selectedChildren, setSelectedChildren] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get('/children?limit=1000');
        const data = res.data.data;
        // Fetch inconsistency info (backend already includes it in /children)
        setChildren(data);

        // Prepara pontos de calor
        const hPoints: [number, number, number][] = [];
        data.forEach((child: any) => {
          const numAlertas = 
            (child.saude?.alertas?.length || 0) + 
            (child.educacao?.alertas?.length || 0) + 
            (child.assistencia_social?.alertas?.length || 0);

          if ((numAlertas > 0 || child.inconsistencies) && BairrosCoords[child.bairro]) {
            const [lat, lng] = BairrosCoords[child.bairro];
            hPoints.push([lat, lng, (numAlertas || 1) * 0.4]);
          }
        });
        setHeatPoints(hPoints);
      } catch (error) {
        console.error("Erro ao carregar dados do mapa", error);
      }
    };
    loadData();
  }, []);

  const handleMarkerClick = (childrenList: any[]) => {
    setSelectedChildren(childrenList);
    setIsModalOpen(true);
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer 
        center={[-22.9068, -43.1729]} 
        zoom={11} 
        style={{ height: "100%", width: "100%", zIndex: 1, borderRadius: "0.5rem" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer points={heatPoints} />
        <MarkerClusterLayer childrenData={children} onClusterClick={handleMarkerClick} />
      </MapContainer>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden dark:bg-gray-950 dark:border-gray-800">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl flex items-center gap-2 dark:text-gray-100">
              <MapPin className="w-5 h-5 text-blue-600" />
              Crianças Identificadas
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {selectedChildren.length} crianças encontradas nesta área.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-2">
            {/* Desktop View */}
            <div className="hidden md:block rounded-md border dark:border-gray-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                  <TableRow className="dark:border-gray-800">
                    <TableHead className="dark:text-gray-400">Nome</TableHead>
                    <TableHead className="dark:text-gray-400">Bairro</TableHead>
                    <TableHead className="dark:text-gray-400 text-center">Alertas</TableHead>
                    <TableHead className="text-right dark:text-gray-400">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedChildren.map((child) => {
                    const numAlertas = 
                      (child.saude?.alertas?.length || 0) + 
                      (child.educacao?.alertas?.length || 0) + 
                      (child.assistencia_social?.alertas?.length || 0);
                    
                    return (
                      <TableRow key={child.id} className="dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 dark:text-gray-100">{child.nome}</span>
                            <span className="text-[10px] text-gray-500 font-medium">Resp: {child.responsavel}</span>
                          </div>
                        </TableCell>
                        <TableCell className="dark:text-gray-300">{child.bairro}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {child.inconsistencies && (
                              <span 
                                title={`Inconsistência Identificada:\n${child.inconsistencies.issues.map((iss: string, idx: number) => `• ${iss}\n  Sugestão: ${child.inconsistencies.suggestions[idx]}`).join('\n')}`}
                                className="flex items-center"
                              >
                                <ShieldAlert size={16} className="text-pink-500 cursor-help" />
                              </span>
                            )}
                            {numAlertas > 0 ? (
                              <Badge variant="destructive" className="font-bold px-3 py-1">
                                {numAlertas} {numAlertas === 1 ? 'alerta' : 'alertas'}
                              </Badge>
                            ) : child.inconsistencies ? (
                              <Badge variant="outline" className="text-pink-700 border-pink-200 bg-pink-50 dark:bg-pink-950/30 dark:border-pink-900/50 dark:text-pink-400 font-bold px-3 py-1">
                                Inconsistência
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-400 font-bold px-3 py-1">
                                Tudo OK
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/children/${child.originalId}`} passHref>
                            <Button variant="outline" size="sm" className="h-8 rounded-full border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white transition-all">
                              <Eye className="w-3.5 h-3.5 mr-1.5" /> Ver Detalhes
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {selectedChildren.map((child) => {
                const numAlertas = 
                  (child.saude?.alertas?.length || 0) + 
                  (child.educacao?.alertas?.length || 0) + 
                  (child.assistencia_social?.alertas?.length || 0);
                
                return (
                  <div key={child.id} className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 flex-1">
                        <p className="text-base font-black text-gray-900 dark:text-gray-100 leading-tight">{child.nome}</p>
                        <p className="text-[10px] text-gray-500 font-bold">Resp: {child.responsavel}</p>
                        <div className="inline-block bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-[10px] text-gray-600 dark:text-gray-400 uppercase font-bold mt-1">
                          {child.bairro}
                        </div>
                      </div>
                      <Link href={`/children/${child.originalId}`} passHref className="shrink-0">
                        <Button variant="default" size="sm" className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 transition-all cursor-pointer font-medium">
                          Ver
                        </Button>
                      </Link>
                    </div>

                    <div className="flex items-center justify-between border-t dark:border-gray-800 pt-3">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Status Alertas</p>
                      {numAlertas > 0 ? (
                        <div className="flex items-center text-red-600 dark:text-red-400 font-bold text-xs">
                          <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2 animate-pulse" />
                          {numAlertas} {numAlertas === 1 ? 'Alerta' : 'Alertas'}
                        </div>
                      ) : child.inconsistencies ? (
                        <div className="flex items-center text-pink-600 dark:text-pink-400 font-bold text-xs">
                          <span 
                            title={`Inconsistência Identificada:\n${child.inconsistencies.issues.map((iss: string, idx: number) => `• ${iss}\n  Sugestão: ${child.inconsistencies.suggestions[idx]}`).join('\n')}`}
                            className="flex items-center mr-2"
                          >
                            <ShieldAlert size={14} className="cursor-help" />
                          </span>
                          Inconsistência
                        </div>
                      ) : (
                        <div className="flex items-center text-green-600 dark:text-green-400 font-bold text-xs">
                          <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2" />
                          Tudo em Dia
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 flex justify-end">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
