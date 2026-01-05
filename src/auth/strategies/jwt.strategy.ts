import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Extraer token de cookie
          let token = null;
          if (request && request.cookies) {
            token = request.cookies['access_token'];
          }
          // Si no hay en cookie, intentar desde header
          if (!token && request.headers.authorization) {
            token = request.headers.authorization.replace('Bearer ', '');
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'chile-en-linea-secret-key-2026',
    });
  }

  async validate(payload: any) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    return {
      userId: payload.sub,
      username: payload.username,
    };
  }
}
