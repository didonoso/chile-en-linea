import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Servicio principal de la aplicación del foro
 * Contiene la lógica de negocio para gestionar categorías, posts y estadísticas
 */
@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene todas las categorías con contador de posts
   * @returns Lista de categorías
   */
  async getCategories() {
    try {
      return await this.prisma.category.findMany({
        include: {
          _count: {
            select: { posts: true }
          }
        },
        orderBy: {
          id: 'asc'
        }
      });
    } catch (error) {
      this.logger.error('Error obteniendo categorías', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas generales del foro de forma optimizada
   * Usa Promise.all para ejecutar consultas en paralelo
   * @returns Estadísticas del foro
   */
  async getStats() {
    try {
      const [totalPosts, totalComments, latestPost] = await Promise.all([
        this.prisma.post.count(),
        this.prisma.comment.count(),
        this.prisma.post.findFirst({
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { username: true }
            }
          },
          take: 1
        })
      ]);
      
      return {
        threads: totalPosts,
        posts: totalPosts + totalComments,
        latestPost: latestPost ? {
          title: latestPost.title,
          slug: latestPost.slug,
          createdAt: latestPost.createdAt,
          author: latestPost.author.username
        } : null
      };
    } catch (error) {
      this.logger.error('Error obteniendo estadísticas', error);
      throw error;
    }
  }

  /**
   * Obtiene posts de una categoría con paginación y orden
   * @param categoryId ID de la categoría
   * @param page Número de página (opcional)
   * @param limit Cantidad de posts por página (opcional)
   * @returns Lista de posts ordenados
   */
  async getCategoryPosts(categoryId: number, page: number = 1, limit: number = 50) {
    try {
      const skip = (page - 1) * limit;

      return await this.prisma.post.findMany({
        where: { categoryId },
        include: {
          author: {
            select: { username: true }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: skip
      });
    } catch (error) {
      this.logger.error(`Error obteniendo posts de categoría ${categoryId}`, error);
      throw error;
    }
  }

  /**
   * Crea un nuevo post sanitizando el contenido
   * @param categoryId ID de la categoría
   * @param postData Datos del post
   * @returns Post creado
   */
  async createPost(categoryId: number, postData: { title: string; content: string; authorId: number }) {
    try {
      // Sanitizar y limpiar datos
      const sanitizedTitle = postData.title.trim().slice(0, 255);
      const sanitizedContent = postData.content.trim().slice(0, 50000);

      // Verificar o crear usuario si no existe
      let user = await this.prisma.user.findUnique({
        where: { id: postData.authorId }
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            id: postData.authorId,
            email: `demo${postData.authorId}@example.com`,
            username: 'Usuario Demo',
            password: 'demo123' // En producción, usar hash
          }
        });
      }

      // Verificar o crear categoría si no existe
      let category = await this.prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        category = await this.prisma.category.create({
          data: {
            id: categoryId,
            name: 'Soporte General',
            slug: 'soporte-general',
            description: 'Soporte general del foro, para cualquier consulta o problema.'
          }
        });
      }

      // Generar slug único y seguro
      const slug = this.generateSlug(sanitizedTitle);
      const uniqueSlug = `${slug}-${Date.now()}`;

      const post = await this.prisma.post.create({
        data: {
          title: sanitizedTitle,
          content: sanitizedContent,
          slug: uniqueSlug,
          authorId: postData.authorId,
          categoryId: categoryId
        },
        include: {
          author: {
            select: { username: true }
          },
          _count: {
            select: { comments: true }
          }
        }
      });

      this.logger.log(`Post creado: ${post.id} - ${post.title}`);
      return post;
    } catch (error) {
      this.logger.error('Error creando post', error);
      throw error;
    }
  }

  /**
   * Obtiene un post por slug con estadísticas del autor optimizado
   * Usa Promise.all para consultas paralelas
   * @param slug Identificador del post
   * @returns Post con información completa
   */
  async getPostBySlug(slug: string) {
    try {
      const post = await this.prisma.post.findUnique({
        where: { slug },
        include: {
          author: {
            select: { 
              username: true, 
              avatar: true,
              createdAt: true
            }
          },
          category: {
            select: { name: true, slug: true }
          },
          _count: {
            select: { comments: true, likes: true }
          }
        }
      });

      if (!post) {
        return null;
      }

      // Incrementar contador de vistas de forma asíncrona (fire and forget)
      this.prisma.post.update({
        where: { id: post.id },
        data: { views: { increment: 1 } }
      }).catch(err => this.logger.error('Error incrementando vistas', err));

      // Obtener estadísticas del autor en paralelo
      const [authorPosts, authorComments] = await Promise.all([
        this.prisma.post.count({ where: { authorId: post.authorId } }),
        this.prisma.comment.count({ where: { authorId: post.authorId } })
      ]);

      return {
        ...post,
        author: {
          ...post.author,
          stats: {
            totalPosts: authorPosts + authorComments,
            totalThreads: authorPosts,
            joinedDate: post.author.createdAt
          }
        }
      };
    } catch (error) {
      this.logger.error(`Error obteniendo post con slug: ${slug}`, error);
      throw error;
    }
  }

  /**
   * Genera un slug SEO-friendly desde un título
   * @param title Título del post
   * @returns Slug generado
   * @private
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales
      .replace(/^-+|-+$/g, '') // Eliminar guiones al inicio y final
      .slice(0, 100); // Limitar longitud
  }
}
