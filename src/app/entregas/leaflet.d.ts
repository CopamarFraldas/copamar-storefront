// O leaflet é carregado dinamicamente (`await import("leaflet")`) e usado como
// `any` (LRef). @types/leaflet não está no node_modules → o TS reclamava
// "Cannot find module 'leaflet'" (mapa-rota.tsx). Esta declaração resolve o
// import como `any`, sem precisar instalar os tipos (auditoria 18/06).
declare module "leaflet"
