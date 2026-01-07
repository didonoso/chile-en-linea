import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class AvatarService {
  constructor(private prisma: PrismaService) {}

  async uploadAvatar(userId: number, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Validar tipo de archivo
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      // Eliminar archivo temporal
      fs.unlinkSync(file.path);
      throw new BadRequestException('Solo se permiten imágenes (JPG, PNG, GIF, WEBP)');
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      fs.unlinkSync(file.path);
      throw new BadRequestException('La imagen no debe superar los 5MB');
    }

    // Obtener usuario y eliminar avatar anterior si existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    if (user?.avatar) {
      const oldAvatarPath = path.join(process.cwd(), 'public', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Redimensionar imagen a 200x200 y optimizar
    const resizedFilename = `avatar-${Date.now()}-${userId}.jpg`;
    const resizedPath = path.join(process.cwd(), 'public', 'uploads', 'avatars', resizedFilename);

    try {
      await sharp(file.path)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 90 })
        .toFile(resizedPath);

      // Eliminar archivo original
      fs.unlinkSync(file.path);
    } catch (error) {
      // Si falla el procesamiento, eliminar archivo original
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new BadRequestException('Error procesando la imagen');
    }

    // Guardar ruta relativa en la base de datos
    const avatarUrl = `/uploads/avatars/${resizedFilename}`;
    
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        username: true,
        avatar: true
      }
    });

    return updatedUser;
  }

  async deleteAvatar(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    if (!user?.avatar) {
      throw new BadRequestException('El usuario no tiene avatar');
    }

    // Eliminar archivo físico
    const avatarPath = path.join(process.cwd(), 'public', user.avatar);
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }

    // Actualizar base de datos
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
      select: {
        id: true,
        username: true,
        avatar: true
      }
    });

    return updatedUser;
  }
}
