import { Controller, Get, Res, Param, Post, Body, HttpException, HttpStatus, ParseIntPipe, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { join } from 'path';

/**
 * Controlador principal de la aplicación del foro
 * Maneja las rutas de páginas estáticas y endpoints de la API
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
   * @param postData Datos del post (title, content, authorId)
   * @returns Post creado con información completa
   */
  @Post('api/categories/:id/posts')
  async createPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() postData: { title: string; content: string; authorId: number }
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

    if (!postData.authorId || postData.authorId <= 0) {
      throw new HttpException('ID de autor inválido', HttpStatus.BAD_REQUEST);
    }

    return this.appService.createPost(id, postData);
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
   * @param commentData Datos del comentario (content, authorId)
   * @returns Comentario creado
   */
  @Post('api/posts/:id/comments')
  async createComment(
    @Param('id', ParseIntPipe) postId: number,
    @Body() commentData: { content: string; authorId: number }
  ) {
    if (!commentData.content || commentData.content.trim().length === 0) {
      throw new HttpException('El contenido es requerido', HttpStatus.BAD_REQUEST);
    }

    if (commentData.content.length > 50000) {
      throw new HttpException('El contenido no puede exceder 50000 caracteres', HttpStatus.BAD_REQUEST);
    }

    if (!commentData.authorId || commentData.authorId <= 0) {
      throw new HttpException('ID de autor inválido', HttpStatus.BAD_REQUEST);
    }

    return this.appService.createComment(postId, commentData);
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
}
