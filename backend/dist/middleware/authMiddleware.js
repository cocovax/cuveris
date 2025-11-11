"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = void 0;
const authService_1 = require("../services/authService");
const extractToken = (header) => {
    if (!header)
        return undefined;
    const [type, token] = header.split(' ');
    if (type?.toLowerCase() !== 'bearer' || !token)
        return undefined;
    return token;
};
const authenticate = (req, res, next) => {
    const token = extractToken(req.headers.authorization);
    if (!token) {
        return res.status(401).json({ error: 'Token manquant' });
    }
    const payload = authService_1.authService.verifyToken(token);
    if (!payload) {
        return res.status(401).json({ error: 'Token invalide' });
    }
    req.user = payload;
    return next();
};
exports.authenticate = authenticate;
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Non authentifié' });
        }
        if (req.user.role !== role) {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        return next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=authMiddleware.js.map