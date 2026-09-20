import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UserRole } from '../../../db/schema/index.js';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest<{ user: AuthUser }>().user;
  },
);
