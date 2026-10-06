📋 Plan de Desarrollo: App Web de Liga de Amigos (React + JSONBin en Archivos Separados)

1. Objetivo de la Aplicación

Crear una SPA (Single Page Application) ligera en React (con Vite + Tailwind CSS) para gestionar una liga de 12 jugadores. La aplicación se alojará en Vercel y utilizará JSONBin.io como almacenamiento en la nube, estructurando los datos en diferentes "archivos" (Bins) para separar responsabilidades y mantener la arquitectura limpia.

2. Estrategia de Almacenamiento: Archivos JSON Separados

Para cumplir con tu idea de guardar los datos en diferentes ficheros, crearemos 3 Bins independientes en JSONBin.io (o carpetas/archivos si en el futuro se migra a un backend propio o repositorio). Esto evita sobrecargar un único archivo JSON gigante y permite aislar los datos.

Estructura de los 3 Archivos JSON:

matches.json (El registro histórico crudo)

{
"matches": [
{
"id": "m-1",
"matchNumber": 1,
"week": 1,
"date": "2026-10-06",
"table": "A",
"player": "Iván",
"position": 1,
"points": 10
}
]
}


players.json (El listado oficial de los 12 jugadores de la liga)

{
"players": [
{ "id": "p-1", "name": "Iván" },
{ "id": "p-2", "name": "Dani" },
{ "id": "p-3", "name": "Paco" }
]
}


settings.json (Configuración de la temporada y reglas de puntuación)

{
"pointsSystem": {
"1": 10,
"2": 7,
"3": 5,
"4": 3,
"5": 2,
"6": 1
},
"currentWeek": 1
}


3. Arquitectura del Proyecto en React

src/
├── services/
│   └── api.js              # Funciones genéricas para leer/escribir en JSONBin usando los diferentes BIN_IDs
├── components/
│   ├── Navbar.jsx          # Barra de navegación por pestañas
│   ├── MatchForm.jsx       # Formulario para registrar partidas (lee players.json, escribe en matches.json)
│   ├── MatchesView.jsx     # Tabla con el histórico de todas las partidas
│   ├── StandingsView.jsx   # Pestaña de Clasificación General (calculada desde matches)
│   ├── WeeklyView.jsx      # Pestaña de Resumen Semanal
│   └── StatsView.jsx       # Pestaña de Estadísticas avanzadas
└── App.jsx                 # Estado global y gestión de carga inicial de los 3 archivos JSON


4. Capa de Servicios (api.js)

El agente deberá implementar un servicio centralizado que recupere los datos de los diferentes archivos mediante variables de entorno en Vercel:

// Ejemplo conceptual para el agente
const MASTER_KEY = import.meta.env.VITE_JSONBIN_MASTER_KEY;
const BIN_IDS = {
matches: import.meta.env.VITE_BIN_MATCHES,
players: import.meta.env.VITE_BIN_PLAYERS,
settings: import.meta.env.VITE_BIN_SETTINGS,
};

export const fetchResource = async (resourceName) => {
const binId = BIN_IDS[resourceName];
const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
headers: { 'X-Master-Key': MASTER_KEY }
});
const data = await res.json();
return data.record;
};

export const updateResource = async (resourceName, newData) => {
const binId = BIN_IDS[resourceName];
await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
method: 'PUT',
headers: {
'Content-Type': 'application/json',
'X-Master-Key': MASTER_KEY
},
body: JSON.stringify(newData)
});
};


5. Prompt Listo para Copiar y Pasar al Agente de Desarrollo

"Actúa como un desarrollador experto en React y Tailwind CSS. Crea una aplicación web SPA para gestionar una liga de 12 jugadores.

Requisitos técnicos:

Usa React (con Hooks) y Tailwind CSS para un diseño limpio, moderno y responsive.

Implementa la persistencia de datos conectada a JSONBin.io, pero separando la información en diferentes archivos/bins independientes (matches.json, players.json, settings.json) gestionados a través de un servicio de API.

La app debe tener 4 vistas principales mediante pestañas:

Clasificación General: Calculada automáticamente a partir del archivo de partidas (Puntos Totales, Partidas, Victorias, Podios, Media).

Registro de Partidas: Formulario rápido para introducir resultados (asigna puntos automáticamente según la posición: 1º=10, 2º=7, etc.) y tabla inferior para listar/borrar partidas.

Resumen Semanal: Desglose por semanas con podios.

Estadísticas: Récords de la liga.

Configura la app para que lea los IDs de los bins y la llave maestra desde variables de entorno (import.meta.env)."