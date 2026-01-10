import { Injectable, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException('No autenticado');
    }

    // Verificar si el usuario está baneado
    if (user.isBanned) {
      throw new ForbiddenException('Tu cuenta ha sido suspendida. Contacta con los administradores.');
    }

    return user;
  }
}
