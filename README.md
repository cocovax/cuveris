# Cuveris — Gestion dynamique des cuveries

## 1. Présentation
Application PWA de pilotage des cuveries vinicoles : visualisation des cuves par cuverie, gestion des modes généraux (chaud/froid/arrêt), contrôle individuel (consigne, marche/arrêt, contenu), journal d’événements et paramétrage MQTT.  
L’architecture repose sur :

- **Backend** Node.js/TypeScript (Express, Socket.IO, MQTT.js) ;
- **Frontend** React + Vite (PWA, Tailwind, Zustand, Socket.IO client) ;
- **MQTT** pour la configuration des cuves et la télémétrie temps réel ;
- **PostgreSQL/TimescaleDB** pour la persistance (journal + historiques).

## 2. Structure du dépôt
```
├── backend/              # API Express + passerelle MQTT
│   ├── src/
│   │   ├── app.ts, server.ts
│   │   ├── services/ (mqttGateway, auth, eventBus…)
│   │   ├── repositories/ (tanks, cuveries, settings…)
│   │   ├── data/ (stores mémoire & adaptateurs Postgres)
│   │   └── routes/ (auth, tanks, settings, events…)
│   └── Dockerfile
├── frontend/             # PWA React
│   ├── src/
│   │   ├── App.tsx, routes, pages, components
│   │   ├── store/ (Zustand : auth, tanks, config…)
│   │   └── services/api.ts, mqttGateway.ts
│   ├── docker/nginx.conf
│   └── Dockerfile
├── docker/               # Ressources Docker partagées
│   └── db/init.sql       # Script init PostgreSQL
├── docker-compose.yml    # Orchestration complète (frontend, backend, MQTT, Postgres)
└── README.md
```

## 3. Prérequis
- Node.js ≥ 20
- npm ≥ 10
- Docker ≥ 24 / Docker Compose V2 (pour le déploiement containerisé)

## 4. Configuration environnement
### Backend (`backend/.env`)
Copier `backend/.env.example` et adapter :
```
NODE_ENV=production
PORT=4000
MQTT_URL=wss://broker.exemple:9001
MQTT_USERNAME=
MQTT_PASSWORD=
ENABLE_MQTT_MOCK=false
AUTH_SECRET=change-me
DEMO_USER_EMAIL=demo@cuverie.local
DEMO_USER_PASSWORD=cuverie
DATA_PROVIDER=postgres        # memory ou postgres
DATABASE_URL=postgres://cuve_user:cuve_password@postgres:5432/cuvedb
TIMESERIES_DATABASE_URL=postgres://cuve_user:cuve_password@postgres:5432/cuvedb
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:4000
VITE_REALTIME_MODE=socket
VITE_ENABLE_MOCKS=false
```

## 5. Lancement en développement
### Backend
```bash
cd backend
npm install
npm run dev            # start Express + Socket.IO (http://localhost:4000)
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # Vite (http://localhost:5173)
```

### MQTT (développement rapide)
```bash
docker run -it --rm -p 1883:1883 -p 9001:9001 eclipse-mosquitto:2
```

## 6. Utilisation Docker (prod/dev)
```bash
docker compose build
docker compose up -d
# Services :
# - http://localhost:5173  (frontend)
# - http://localhost:4000  (API backend)
# - MQTT : localhost:1883 / WS : localhost:9001
# - PostgreSQL : localhost:5432 (cuve_user / cuve_password)
```

Le script `docker/db/init.sql` crée les tables `event_log` et `temperature_samples`.  
Les événements et télémétries sont automatiquement synchronisés en base via l’adaptateur Postgres.

## 7. Principales fonctionnalités
- Gestion dynamique des cuveries (MQTT `global/config/cuves`) et des modes généraux (`global/prod/<cuverie>/mode`).
- Contrôle individuel des cuves : consigne, marche/arrêt, contenu, visualisation télémétrie.
- Historique unifié (Socket.IO + REST) : commandes, télémétrie, alarmes.
- Paramétrage admin (rôle `supervisor`) : configuration broker MQTT dans l’interface.
- Support mock (mode démo) : simulation télémétrie côté backend et frontend.

## 8. Endpoints principaux (API)
| Méthode | Chemin | Description |
|---------|--------|-------------|
| POST | `/api/auth/login` | Authentification (demo) |
| POST | `/api/auth/refresh` | Rafraîchissement token |
| GET | `/api/tanks` | Liste des cuves |
| POST | `/api/tanks/:id/setpoint` | Modification consigne |
| POST | `/api/tanks/:id/running` | Marche/Arrêt cuve |
| POST | `/api/tanks/:id/contents` | Mise à jour contenu |
| GET | `/api/config` | Configuration cuveries + modes |
| POST | `/api/cuveries/:id/mode` | Mode général chaud/froid/arrêt |
| GET | `/api/events` | Journal des événements |
| GET/PATCH | `/api/settings` | Paramètres (MQTT, préférences) — rôle `supervisor` |

## 9. Scripts utiles
```bash
# Backend
npm run build          # compilation TypeScript
npm run start          # node dist/server.js

# Frontend
npm run build          # build PWA (dist/)
npm run preview        # prévisualisation build
```

## 10. Tests & Qualité
- Compilation TypeScript (`npm run build`) côté backend et frontend.
- Vérifier la réception MQTT (télémétrie, config, modes) et la persistance Postgres.
- Les warnings Vite indiquent un bundle principal > 500 kB : l’application utilise `React.lazy` pour limiter l’impact, mais pour une optimisation supplémentaire ajuster `build.rollupOptions.manualChunks`.

## 11. Notes & évolutions possibles
- Remplacer l’authentification “demo” par un annuaire réel (JWT signé, base `users`, RBAC fin).
- Implémenter un adaptateur Postgres complet pour `tankRepository` (création/mise à jour cuves en base).
- Ajouter des tests automatisés (Jest/Testing Library, Playwright e2e).
- Surveiller et superviser : instrumentation metrics (Prometheus) + logs centralisés.

