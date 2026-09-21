import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { UserRole } from '../../../db/schema/index.js';
import { UsersService } from '../../users/users.service.js';
import type { AuthUser } from '../decorators/current-user.decorator.js';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('الحساب غير موجود');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('تم حظر هذا الحساب');
    }

    return { userId: user.id, email: user.email, role: user.role };
  }
}
