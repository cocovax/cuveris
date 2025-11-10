import { type User } from '../domain/user';
export interface AuthTokenPayload {
    sub: string;
    email: string;
    role: User['role'];
}
export declare const authService: {
    tokenTtlSeconds: number;
    authenticate: (email: string, password: string) => User | null;
    issueToken: (user: User, expiresIn?: number) => string;
    verifyToken: (token: string) => AuthTokenPayload | null;
    userFromPayload: (payload: AuthTokenPayload) => User;
    getDemoUser: () => User;
};
//# sourceMappingURL=authService.d.ts.map