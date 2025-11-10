"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const authService_1 = require("../services/authService");
const authMiddleware_1 = require("../middleware/authMiddleware");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.authRoutes = (0, express_1.Router)();
exports.authRoutes.post('/login', (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors });
    }
    const user = authService_1.authService.authenticate(parsed.data.email, parsed.data.password);
    if (!user) {
        return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    const token = authService_1.authService.issueToken(user);
    return res.json({
        data: {
            token,
            user,
            expiresIn: authService_1.authService.tokenTtlSeconds,
        },
    });
});
exports.authRoutes.get('/me', authMiddleware_1.authenticate, (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    return res.json({ data: req.user });
});
exports.authRoutes.post('/refresh', authMiddleware_1.authenticate, (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    const user = authService_1.authService.userFromPayload(req.user);
    const token = authService_1.authService.issueToken(user);
    return res.json({
        data: {
            token,
            expiresIn: authService_1.authService.tokenTtlSeconds,
        },
    });
});
//# sourceMappingURL=authRoutes.js.map