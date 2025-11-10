"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const demoUser = {
    id: 'demo-user',
    email: env_1.env.auth.demoUser.email,
    role: 'supervisor',
};
const isValidCredentials = (email, password) => email === env_1.env.auth.demoUser.email && password === env_1.env.auth.demoUser.password;
exports.authService = {
    authenticate: (email, password) => {
        if (!isValidCredentials(email, password))
            return null;
        return demoUser;
    },
    issueToken: (user) => {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return jsonwebtoken_1.default.sign(payload, env_1.env.auth.secret, { expiresIn: '4h' });
    },
    verifyToken: (token) => {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.auth.secret);
            return decoded;
        }
        catch (error) {
            console.warn('[Auth] Token invalide', error);
            return null;
        }
    },
    getDemoUser: () => demoUser,
};
//# sourceMappingURL=authService.js.map