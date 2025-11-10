import { type User } from '../domain/user';
export interface AuthTokenPayload {
    sub: string;
    email: string;
    role: User['role'];
}
export declare const authService: {
    authenticate: (email: string, password: string) => User | null;
    issueToken: (user: User) => string;
    verifyToken: (token: string) => AuthTokenPayload | null;
    getDemoUser: () => User;
};
//# sourceMappingURL=authService.d.ts.map