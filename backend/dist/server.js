"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = __importDefault(require("node:http"));
const socket_io_1 = require("socket.io");
const app_1 = require("./app");
const env_1 = require("./config/env");
const tankRepository_1 = require("./repositories/tankRepository");
const mqttGateway_1 = require("./services/mqttGateway");
const app = (0, app_1.createApp)();
const httpServer = node_http_1.default.createServer(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: env_1.env.nodeEnv === 'development' ? '*' : undefined,
    },
});
io.on('connection', (socket) => {
    socket.emit('tanks:init', tankRepository_1.tankRepository.list());
});
const unsubscribe = mqttGateway_1.mqttGateway.onTelemetry(({ tank }) => {
    io.emit('tanks:update', tank);
});
mqttGateway_1.mqttGateway.start();
const port = env_1.env.port;
httpServer.listen(port, () => {
    console.log(`🚀 Backend Cuverie lancé sur http://localhost:${port} (${env_1.env.nodeEnv})`);
});
const shutdown = (signal) => {
    console.log(`\n${signal} reçu, arrêt du serveur...`);
    unsubscribe();
    mqttGateway_1.mqttGateway.stop();
    io.close();
    httpServer.close(() => {
        console.log('Serveur arrêté proprement.');
        process.exit(0);
    });
};
['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => shutdown(signal));
});
//# sourceMappingURL=server.js.map