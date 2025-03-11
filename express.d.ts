// express.d.ts
import { Role } from '@prisma/client';

declare global {
    namespace Express {
        interface Request {
            usuario?: {
                id: number;
                email: string;
                role: Role;
            };
        }
    }
}

export function Router() {
    throw new Error('Function not implemented.');
}
