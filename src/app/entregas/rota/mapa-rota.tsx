"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Parada, StatusParada } from "../_lib/dados"

/**
 * MAPA DA ROTA estilo Spoke/Circuit (Marco 11/06): pinos numerados em cada
 * entrega, trajeto ligando as paradas na ordem, a PRÓXIMA pendente destacada
 * (pino azul grande pulsante) avançando conforme o motorista conclui, e o
 * pontinho do próprio motorista (GPS ao vivo). Leaflet + OpenStreetMap (sem
 * chave de API); trajeto por ruas via OSRM público com fallback em linha reta.
 * Client-only (leaflet importado dinamicamente — não roda no SSR).
 */
export default function MapaRota({
  paradas,
  status,
}: {
  paradas: Parada[]
  status: Record<string, StatusParada>
}) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const LRef = useRef<any>(null)
  const pinsRef = useRef<Record<string, any>>({})
  const rotaRef = useRef<any>(null)
  const euRef = useRef<any>(null)
  const ajustouRef = useRef(false)
  // nº do pedido da ÚLTIMA "próxima" enquadrada — pra dar panTo SÓ quando a próxima
  // parada muda (antes recentralizava a cada render e brigava com o gesto do Dedé).
  const proximaRef = useRef<string | null>(null)
  // o leaflet carrega async — este sinal dispara a pintura dos pinos DEPOIS
  // que o mapa existe (sem ele, os pinos rodavam antes e nunca apareciam)
  const [pronto, setPronto] = useState(0)

  // memoizado: sem isso o array novo a cada render entrava nas deps do efeito e
  // disparava panTo em TODA interação (auditoria 18/06).
  const comCoord = useMemo(
    () => paradas.filter((p) => p.dest_lat && p.dest_long),
    [paradas]
  )

  // monta o mapa 1x
  useEffect(() => {
    let vivo = true
    if (!divRef.current || comCoord.length === 0) return
    ;(async () => {
      let L: any
      try {
        L = (await import("leaflet")).default
      } catch {
        return // sem leaflet (ex. dep não materializada) → não derruba a página
      }
      if (!vivo || !divRef.current || mapRef.current) return
      LRef.current = L
      const map = L.map(divRef.current, { zoomControl: false, attributionControl: false })
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map)
      L.control.attribution({ prefix: false }).addAttribution("© OpenStreetMap").addTo(map)
      L.control.zoom({ position: "bottomright" }).addTo(map)
      mapRef.current = map
      setPronto((v) => v + 1)

      // trajeto por ruas (OSRM público); fallback: linha reta na ordem
      const coords = comCoord.map((p) => `${p.dest_long},${p.dest_lat}`).join(";")
      let linha: [number, number][] = comCoord.map((p) => [p.dest_lat!, p.dest_long!])
      try {
        const r: any = await (await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
          { signal: AbortSignal.timeout(6000) }
        )).json()
        const geo = r?.routes?.[0]?.geometry?.coordinates
        if (Array.isArray(geo) && geo.length) linha = geo.map((c: number[]) => [c[1], c[0]])
      } catch { /* linha reta */ }
      if (!vivo || !mapRef.current) return
      rotaRef.current = L.polyline(linha, { color: "#1251b8", weight: 4, opacity: 0.55 }).addTo(map)

      // GPS do motorista ao vivo (pontinho azul)
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
          (pos) => {
            if (!mapRef.current) return
            const ll: [number, number] = [pos.coords.latitude, pos.coords.longitude]
            if (!euRef.current) {
              euRef.current = L.circleMarker(ll, {
                radius: 8, color: "#fff", weight: 2.5, fillColor: "#2563eb", fillOpacity: 1,
              }).addTo(mapRef.current)
            } else euRef.current.setLatLng(ll)
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 15000 }
        )
      }
    })()
    return () => {
      vivo = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        pinsRef.current = {}
        ajustouRef.current = false
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comCoord.length])

  // (re)desenha os pinos sempre que o STATUS muda — a próxima avança sozinha
  useEffect(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map) return
    const proxima = comCoord.find((p) => (status[p.numero_pedido] || "pendente") === "pendente")
    comCoord.forEach((p) => {
      const st = status[p.numero_pedido] || "pendente"
      const ehProxima = proxima?.numero_pedido === p.numero_pedido
      const cor =
        st === "entregue" ? "#9ca3af" : st === "ausente" ? "#f59e0b" : st === "adiado" ? "#818cf8" : ehProxima ? "#1251b8" : "#64748b"
      const tam = ehProxima ? 38 : 26
      const icone = L.divIcon({
        className: "",
        iconSize: [tam, tam],
        iconAnchor: [tam / 2, tam / 2],
        html: `<div style="width:${tam}px;height:${tam}px;border-radius:50%;background:${cor};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:${ehProxima ? 16 : 12}px;border:2.5px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.4);${ehProxima ? "animation:pulso 1.6s infinite;" : ""}${st === "entregue" ? "opacity:.55;" : ""}">${st === "entregue" ? "✓" : p.ordem}</div>`,
      })
      if (pinsRef.current[p.numero_pedido]) {
        pinsRef.current[p.numero_pedido].setIcon(icone)
        pinsRef.current[p.numero_pedido].setZIndexOffset(ehProxima ? 1000 : 0)
      } else {
        pinsRef.current[p.numero_pedido] = L.marker([p.dest_lat!, p.dest_long!], {
          icon: icone, zIndexOffset: ehProxima ? 1000 : 0,
        }).addTo(map)
      }
    })
    // enquadra tudo na primeira pintura; depois acompanha a próxima
    if (!ajustouRef.current && comCoord.length) {
      map.fitBounds(comCoord.map((p) => [p.dest_lat!, p.dest_long!]) as any, { padding: [30, 30] })
      ajustouRef.current = true
      proximaRef.current = proxima?.numero_pedido ?? null
    } else if (proxima && proxima.numero_pedido !== proximaRef.current) {
      // recentraliza SÓ quando a PRÓXIMA parada REALMENTE mudou (Dedé concluiu uma)
      // — não em todo render, pra não brigar com o gesto de arrastar o mapa.
      map.panTo([proxima.dest_lat!, proxima.dest_long!], { animate: true })
      proximaRef.current = proxima.numero_pedido
    }
  }, [status, comCoord, pronto])

  if (comCoord.length === 0) return null

  return (
    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/leaflet/leaflet.css" />
      <style>{`@keyframes pulso { 0%,100% { box-shadow: 0 0 0 0 rgba(18,81,184,.5), 0 1px 6px rgba(0,0,0,.4) } 50% { box-shadow: 0 0 0 12px rgba(18,81,184,0), 0 1px 6px rgba(0,0,0,.4) } }`}</style>
      <div ref={divRef} className="h-[42vh] min-h-[260px] w-full" />
    </div>
  )
}
