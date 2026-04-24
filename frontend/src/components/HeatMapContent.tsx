"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import api from "@/lib/api";

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
      radius: 35,
      blur: 15,
      maxZoom: 17,
      max: 0.5,
      gradient: {
        0.2: 'blue',
        0.4: 'cyan',
        0.6: 'lime',
        0.8: 'yellow',
        1.0: 'red'
      }
    }).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}

export default function HeatMapContent() {
  const [points, setPoints] = useState<[number, number, number][]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Obter todas as crianças para gerar o mapa de calor de alertas
        const res = await api.get('/children?limit=1000');
        const children = res.data.data;
        
        const heatPoints: [number, number, number][] = [];
        
        children.forEach((child: any) => {
          const numAlertas = 
            (child.saude?.alertas?.length || 0) + 
            (child.educacao?.alertas?.length || 0) + 
            (child.assistencia_social?.alertas?.length || 0);

          if (numAlertas > 0 && BairrosCoords[child.bairro]) {
            const [lat, lng] = BairrosCoords[child.bairro];
            // Introduzir um leve desvio aleatório para que os pontos não fiquem exatamente no mesmo lugar
            const jitterLat = lat + (Math.random() - 0.5) * 0.005;
            const jitterLng = lng + (Math.random() - 0.5) * 0.005;
            
            heatPoints.push([jitterLat, jitterLng, numAlertas * 0.5]); // Intensidade baseada no nº de alertas
          }
        });

        setPoints(heatPoints);
      } catch (error) {
        console.error("Erro ao carregar dados do mapa", error);
      }
    };

    loadData();
  }, []);

  return (
    <MapContainer 
      center={[-22.9068, -43.1729]} // Rio de Janeiro center
      zoom={11} 
      style={{ height: "100%", width: "100%", zIndex: 10, borderRadius: "0.5rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <HeatmapLayer points={points} />
    </MapContainer>
  );
}
