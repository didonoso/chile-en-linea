import { Controller, Get, Res, Param, Post, Body, HttpException, HttpStatus, ParseIntPipe, Query, Put, UseGuards, Request, UseInterceptors, UploadedFile, Delete } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { join } from 'path';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AvatarService } from './avatar.service';
import { extname } from 'path';

/**
 * Controlador principal de la aplicación del foro
 * Maneja las rutas de páginas estáticas y endpoints de la API
 */
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly avatarService: AvatarService
  ) {}

  /**
   * Renderiza la página principal del foro
   */
  @Get()
  getIndex(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  }

  /**
   * Renderiza la página de categoría con listado de threads
   */
  @Get('category')
  getCategory(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'category.html'));
  }

  /**
   * Renderiza el formulario para crear un nuevo thread
   */
  @Get('new-thread')
  getNewThread(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'new-thread.html'));
  }

  /**
   * Renderiza la página de visualización de un thread completo
   */
  @Get('thread')
  getThread(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'thread.html'));
  }

  /**
   * Renderiza la página de login
   */
  @Get('login')
  getLogin(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'login.html'));
  }

  /**
   * Renderiza la página de registro
   */
  @Get('register')
  getRegister(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'register.html'));
  }

  /**
   * Renderiza la página de lista de miembros
   */
  @Get('members')
  getMembers(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'members.html'));
  }

  /**
   * Renderiza la página de perfil de usuario
   */
  @Get('user/:username')
  getUserProfile(@Res() res: Response, @Param('username') username: string) {
    return res.sendFile(join(__dirname, '..', 'public', 'profile.html'));
  }

  /**
   * Renderiza la página de grupo de usuarios
   */
  @Get('group')
  getGroupPage(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'group.html'));
  }

  /**
   * Renderiza el panel de administrador
   */
  @Get('admin')
  getAdminPanel(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'admin.html'));
  }

  /**
   * Renderiza la página de reporte de reputación
   */
  @Get('reputation/:username')
  getReputationPage(@Res() res: Response, @Param('username') username: string) {
    return res.sendFile(join(__dirname, '..', 'public', 'reputation.html'));
  }

  /**
   * Sirve el archivo CSS principal
   */
  @Get('styles.css')
  getStyles(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'styles.css'));
  }

  /**
   * Sirve el archivo JavaScript de autenticación
   */
  @Get('auth.js')
  getAuthScript(@Res() res: Response) {
    res.setHeader('Content-Type', 'application/javascript');
    return res.sendFile(join(__dirname, '..', 'public', 'auth.js'));
  }

  /**
   * Obtiene todas las categorías del foro
   * @returns Lista de categorías con contador de posts
   */
  @Get('api/categories')
  async getCategories() {
    return this.appService.getCategories();
  }

  /**
   * Obtiene estadísticas generales del foro
   * @returns Objeto con total de threads, posts y último post publicado
   */
  @Get('api/stats')
  async getStats() {
    return this.appService.getStats();
  }

  /**
   * Obtiene todos los posts de una categoría específica
   * @param id ID de la categoría
   * @returns Lista de posts con información del autor y estadísticas
   */
  @Get('api/categories/:id/posts')
  async getCategoryPosts(@Param('id', ParseIntPipe) id: number) {
    return this.appService.getCategoryPosts(id);
  }

  /**
   * Crea un nuevo post en una categoría
   * @param id ID de la categoría
   * @param postData Datos del post (title, content)
   * @param req Request con usuario autenticado
   * @returns Post creado con información completa
   */
  @UseGuards(JwtAuthGuard)
  @Post('api/categories/:id/posts')
  async createPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() postData: { title: string; content: string },
    @Request() req
  ) {
    // Validación de datos
    if (!postData.title || postData.title.trim().length === 0) {
      throw new HttpException('El título es requerido', HttpStatus.BAD_REQUEST);
    }
    
    if (postData.title.length > 255) {
      throw new HttpException('El título no puede exceder 255 caracteres', HttpStatus.BAD_REQUEST);
    }

    if (!postData.content || postData.content.trim().length === 0) {
      throw new HttpException('El contenido es requerido', HttpStatus.BAD_REQUEST);
    }

    if (postData.content.length > 50000) {
      throw new HttpException('El contenido no puede exceder 50000 caracteres', HttpStatus.BAD_REQUEST);
    }

    const authorId = req.user?.sub || req.user?.id;
    if (!authorId) {
      throw new HttpException('Usuario no autenticado', HttpStatus.UNAUTHORIZED);
    }

    return this.appService.createPost(id, { ...postData, authorId });
  }

  /**
   * Obtiene un post específico por su slug
   * @param slug Identificador único del post
   * @returns Post con información del autor, categoría y estadísticas
   */
  @Get('api/posts/:slug')
  async getPostBySlug(@Param('slug') slug: string) {
    if (!slug || slug.trim().length === 0) {
      throw new HttpException('Slug inválido', HttpStatus.BAD_REQUEST);
    }

    const post = await this.appService.getPostBySlug(slug);
    
    if (!post) {
      throw new HttpException('Post no encontrado', HttpStatus.NOT_FOUND);
    }

    return post;
  }

  /**
   * Obtiene los comentarios de un post
   * @param postId ID del post
   * @returns Lista de comentarios con información del autor
   */
  @Get('api/posts/:id/comments')
  async getPostComments(@Param('id', ParseIntPipe) postId: number) {
    return this.appService.getPostComments(postId);
  }

  /**
   * Crea un comentario en un post
   * @param postId ID del post
   * @param commentData Datos del comentario (content)
   * @param req Request con usuario autenticado
   * @returns Comentario creado
   */
  @UseGuards(JwtAuthGuard)
  @Post('api/posts/:id/comments')
  async createComment(
    @Param('id', ParseIntPipe) postId: number,
    @Body() commentData: { content: string },
    @Request() req
  ) {
    if (!commentData.content || commentData.content.trim().length === 0) {
      throw new HttpException('El contenido es requerido', HttpStatus.BAD_REQUEST);
    }

    if (commentData.content.length > 50000) {
      throw new HttpException('El contenido no puede exceder 50000 caracteres', HttpStatus.BAD_REQUEST);
    }

    const authorId = req.user?.sub || req.user?.id;
    if (!authorId) {
      throw new HttpException('Usuario no autenticado', HttpStatus.UNAUTHORIZED);
    }

    return this.appService.createComment(postId, { ...commentData, authorId });
  }

  /**
   * Obtiene la lista de miembros con paginación
   * @param page Número de página (opcional, default: 1)
   * @param limit Cantidad de miembros por página (opcional, default: 20)
   * @returns Lista de miembros con paginación
   */
  @Get('api/members')
  async getMembersList(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20
  ) {
    return this.appService.getMembers(page, limit);
  }

  /**
   * Obtiene el perfil de un usuario por username
   * @param username Nombre de usuario
   * @returns Perfil del usuario con estadísticas
   */
  @Get('api/user/:username')
  async getUserProfileData(@Param('username') username: string) {
    const profile = await this.appService.getUserProfile(username);
    
    if (!profile) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }
    
    return profile;
  }

  /**
   * Renderiza la página de grupos de usuario
   */
  @Get('groups')
  getUserGroups(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'groups.html'));
  }

  /**
   * Obtiene todos los grupos de usuario
   * @returns Lista de grupos con contador de usuarios
   */
  @Get('api/groups')
  async getUserGroupsList() {
    return this.appService.getUserGroups();
  }

  /**
   * Obtiene información de un grupo específico
   * @param id ID del grupo
   * @returns Información del grupo
   */
  @Get('api/groups/:id')
  async getUserGroupById(@Param('id', ParseIntPipe) id: number) {
    const group = await this.appService.getUserGroupById(id);
    
    if (!group) {
      throw new HttpException('Grupo no encontrado', HttpStatus.NOT_FOUND);
    }
    
    return group;
  }

  /**
   * Obtiene los usuarios de un grupo específico
   * @param id ID del grupo
   * @returns Lista de usuarios en el grupo
   */
  @Get('api/groups/:id/users')
  async getUsersByGroup(@Param('id', ParseIntPipe) id: number) {
    return this.appService.getUsersByGroup(id);
  }

  /**
   * Cambia el grupo de un usuario (solo para administradores)
   * @param userId ID del usuario a modificar
   * @param body Contiene el nuevo groupId
   * @param req Request con el usuario autenticado
   * @returns Usuario actualizado
   */
  @UseGuards(JwtAuthGuard)
  @Put('api/users/:userId/group')
  async changeUserGroup(
    @Param('userId', ParseIntPipe) userId: number,
    @Body('groupId', ParseIntPipe) groupId: number,
    @Request() req
  ) {
    try {
      // El JWT strategy guarda el userId como 'sub' en el payload
      const adminId = req.user?.sub || req.user?.id;
      
      if (!adminId) {
        throw new HttpException('Usuario no autenticado', HttpStatus.UNAUTHORIZED);
      }

      const updatedUser = await this.appService.changeUserGroup(userId, groupId, adminId);
      return {
        success: true,
        message: 'Grupo de usuario actualizado correctamente',
        user: updatedUser
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al cambiar el grupo del usuario',
        HttpStatus.FORBIDDEN
      );
    }
  }

  /**
   * Sube o actualiza el avatar de un usuario
   * @param userId ID del usuario
   * @param file Archivo de imagen
   * @param req Request con el usuario autenticado
   */
  @UseGuards(JwtAuthGuard)
  @Post('api/users/:userId/avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: './public/uploads/avatars',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        callback(null, `avatar-${uniqueSuffix}${ext}`);
      }
    }),
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    }
  }))
  async uploadAvatar(
    @Param('userId', ParseIntPipe) userId: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    try {
      const currentUserId = req.user?.sub || req.user?.id;
      
      // Solo el usuario puede cambiar su propio avatar
      if (currentUserId !== userId) {
        throw new HttpException('No tienes permiso para cambiar este avatar', HttpStatus.FORBIDDEN);
      }

      const updatedUser = await this.avatarService.uploadAvatar(userId, file);
      return {
        success: true,
        message: 'Avatar actualizado correctamente',
        user: updatedUser
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al subir el avatar',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Elimina el avatar de un usuario
   * @param userId ID del usuario
   * @param req Request con el usuario autenticado
   */
  @UseGuards(JwtAuthGuard)
  @Delete('api/users/:userId/avatar')
  async deleteAvatar(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req
  ) {
    try {
      const currentUserId = req.user?.sub || req.user?.id;
      
      // Solo el usuario puede eliminar su propio avatar
      if (currentUserId !== userId) {
        throw new HttpException('No tienes permiso para eliminar este avatar', HttpStatus.FORBIDDEN);
      }

      const updatedUser = await this.avatarService.deleteAvatar(userId);
      return {
        success: true,
        message: 'Avatar eliminado correctamente',
        user: updatedUser
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al eliminar el avatar',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Obtiene el reporte de reputación de un usuario
   */
  @Get('api/reputation/:username')
  async getReputationReport(@Param('username') username: string) {
    return this.appService.getReputationReport(username);
  }

  /**
   * Da reputación a un usuario
   */
  @UseGuards(JwtAuthGuard)
  @Post('api/reputation')
  async giveReputation(
    @Request() req,
    @Body() body: { toUserId: number; type: string; comment?: string }
  ) {
    try {
      const fromUserId = req.user?.sub || req.user?.id;
      return await this.appService.giveReputation(fromUserId, body.toUserId, body.type, body.comment);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Error al dar reputación',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Elimina una reputación (solo quien la dio puede eliminarla)
   */
  @UseGuards(JwtAuthGuard)
  @Delete('api/reputation/:id')
  async deleteReputation(
    @Param('id', ParseIntPipe) reputationId: number,
    @Request() req
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.appService.deleteReputation(reputationId, userId);
  }
}

