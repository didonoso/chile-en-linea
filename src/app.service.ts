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
      const [totalPosts, totalComments, latestPost, totalMembers, newestMember] = await Promise.all([
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
        }),
        this.prisma.user.count(),
        this.prisma.user.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { username: true, createdAt: true },
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
        } : null,
        boardStats: {
          totalPosts: totalPosts + totalComments,
          totalThreads: totalPosts,
          totalMembers: totalMembers,
          newestMember: newestMember?.username || 'N/A',
          mostOnline: 15,
          mostOnlineDate: '05-01-2026, 02:27 PM'
        }
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
              createdAt: true,
              userGroup: {
                select: {
                  id: true,
                  name: true,
                  color: true
                }
              },
              receivedReputations: {
                select: {
                  type: true
                }
              }
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
      
      // Calcular reputación
      const positives = post.author.receivedReputations.filter(r => r.type === 'positive').length;
      const negatives = post.author.receivedReputations.filter(r => r.type === 'negative').length;
      const reputation = positives - negatives;

      return {
        ...post,
        author: {
          username: post.author.username,
          avatar: post.author.avatar,
          userGroup: post.author.userGroup,
          stats: {
            totalPosts: authorPosts + authorComments,
            totalThreads: authorPosts,
            joinedDate: post.author.createdAt,
            reputation
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

  /**
   * Obtiene los comentarios de un post con estadísticas del autor
   * @param postId ID del post
   * @returns Lista de comentarios
   */
  async getPostComments(postId: number) {
    try {
      const comments = await this.prisma.comment.findMany({
        where: { postId },
        include: {
          author: {
            select: { 
              username: true, 
              avatar: true,
              createdAt: true,
              userGroup: {
                select: {
                  id: true,
                  name: true,
                  color: true
                }
              },
              receivedReputations: {
                select: {
                  type: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Obtener estadísticas de cada autor en paralelo
      const commentsWithStats = await Promise.all(
        comments.map(async (comment) => {
          const [authorPosts, authorComments] = await Promise.all([
            this.prisma.post.count({ where: { authorId: comment.authorId } }),
            this.prisma.comment.count({ where: { authorId: comment.authorId } })
          ]);
          
          // Calcular reputación
          const positives = comment.author.receivedReputations.filter(r => r.type === 'positive').length;
          const negatives = comment.author.receivedReputations.filter(r => r.type === 'negative').length;
          const reputation = positives - negatives;

          return {
            ...comment,
            author: {
              username: comment.author.username,
              avatar: comment.author.avatar,
              userGroup: comment.author.userGroup,
              stats: {
                totalPosts: authorPosts + authorComments,
                totalThreads: authorPosts,
                joinedDate: comment.author.createdAt,
                reputation
              }
            }
          };
        })
      );

      return commentsWithStats;
    } catch (error) {
      this.logger.error(`Error obteniendo comentarios del post ${postId}`, error);
      throw error;
    }
  }

  /**
   * Crea un comentario en un post
   * @param postId ID del post
   * @param commentData Datos del comentario
   * @returns Comentario creado
   */
  async createComment(postId: number, commentData: { content: string; authorId: number }) {
    try {
      const sanitizedContent = commentData.content.trim().slice(0, 50000);

      // Verificar que el post existe
      const post = await this.prisma.post.findUnique({
        where: { id: postId }
      });

      if (!post) {
        throw new Error('Post no encontrado');
      }

      // Verificar o crear usuario si no existe
      let user = await this.prisma.user.findUnique({
        where: { id: commentData.authorId }
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            id: commentData.authorId,
            email: `demo${commentData.authorId}@example.com`,
            username: 'Usuario Demo',
            password: 'demo123'
          }
        });
      }

      const comment = await this.prisma.comment.create({
        data: {
          content: sanitizedContent,
          postId: postId,
          authorId: commentData.authorId
        },
        include: {
          author: {
            select: { username: true }
          }
        }
      });

      this.logger.log(`Comentario creado en post ${postId} por usuario ${commentData.authorId}`);
      return comment;
    } catch (error) {
      this.logger.error('Error creando comentario', error);
      throw error;
    }
  }

  /**
   * Obtiene lista de miembros con paginación
   * @param page Número de página
   * @param limit Cantidad de miembros por página
   * @returns Lista de usuarios con estadísticas
   */
  async getMembers(page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [users, totalUsers] = await Promise.all([
        this.prisma.user.findMany({
          select: {
            id: true,
            username: true,
            avatar: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            userGroup: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            _count: {
              select: {
                posts: true,
                comments: true
              }
            },
            receivedReputations: {
              select: {
                type: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        this.prisma.user.count()
      ]);

      // Calcular total de páginas
      const totalPages = Math.ceil(totalUsers / limit);

      // Formatear usuarios con conteo de posts y reputación
      const formattedUsers = users.map(user => {
        const positives = user.receivedReputations.filter(r => r.type === 'positive').length;
        const negatives = user.receivedReputations.filter(r => r.type === 'negative').length;
        const reputation = positives - negatives;
        
        return {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          joined: user.createdAt,
          lastVisit: user.lastLoginAt || user.createdAt,
          postCount: user._count.posts + user._count.comments,
          reputation,
          userGroup: user.userGroup
        };
      });

      return {
        users: formattedUsers,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      this.logger.error('Error obteniendo miembros', error);
      throw error;
    }
  }

  /**
   * Obtiene el perfil completo de un usuario por username
   * @param username Nombre de usuario
   * @returns Perfil del usuario con estadísticas
   */
  async getUserProfile(username: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { username },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          createdAt: true,
          lastLoginAt: true,
          userGroup: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          _count: {
            select: {
              posts: true,
              comments: true
            }
          },
          receivedReputations: {
            select: {
              type: true
            }
          }
        }
      });

      if (!user) {
        return null;
      }

      // Obtener posts recientes del usuario
      const recentPosts = await this.prisma.post.findMany({
        where: { authorId: user.id },
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
          views: true,
          _count: {
            select: { comments: true }
          },
          category: {
            select: { name: true, slug: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      // Calcular reputación
      const positives = user.receivedReputations.filter(r => r.type === 'positive').length;
      const negatives = user.receivedReputations.filter(r => r.type === 'negative').length;
      const reputation = positives - negatives;
      
      return {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        joinedDate: user.createdAt,
        lastLogin: user.lastLoginAt || user.createdAt,
        userGroup: user.userGroup,
        stats: {
          totalThreads: user._count.posts,
          totalPosts: user._count.posts + user._count.comments,
          reputation,
          warningLevel: 0
        },
        recentPosts
      };
    } catch (error) {
      this.logger.error(`Error obteniendo perfil de usuario: ${username}`, error);
      throw error;
    }
  }

  /**
   * Obtiene todos los grupos de usuario
   * @returns Lista de grupos con contador de usuarios
   */
  async getUserGroups() {
    try {
      const groups = await this.prisma.userGroup.findMany({
        include: {
          _count: {
            select: { users: true }
          }
        },
        orderBy: {
          order: 'asc'
        }
      });

      return groups.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        order: group.order,
        color: group.color,
        isDefault: group.isDefault,
        _count: group._count,
        userCount: group._count.users
      }));
    } catch (error) {
      this.logger.error('Error obteniendo grupos de usuario', error);
      throw error;
    }
  }

  /**
   * Obtiene un grupo de usuario por ID
   * @param id ID del grupo
   * @returns Información del grupo
   */
  async getUserGroupById(id: number) {
    try {
      return await this.prisma.userGroup.findUnique({
        where: { id },
        include: {
          _count: {
            select: { users: true }
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error obteniendo grupo de usuario: ${id}`, error);
      throw error;
    }
  }

  /**
   * Obtiene los usuarios de un grupo específico
   * @param groupId ID del grupo
   * @returns Lista de usuarios en el grupo
   */
  async getUsersByGroup(groupId: number) {
    try {
      const users = await this.prisma.user.findMany({
        where: { userGroupId: groupId },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          createdAt: true,
          lastLoginAt: true,
          userGroup: {
            select: {
              id: true,
              name: true,
              color: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return users;
    } catch (error) {
      this.logger.error(`Error obteniendo usuarios del grupo: ${groupId}`, error);
      throw error;
    }
  }

  /**
   * Cambia el grupo de un usuario (solo para administradores)
   * @param userId ID del usuario a modificar
   * @param newGroupId ID del nuevo grupo
   * @param adminId ID del administrador que realiza el cambio
   * @returns Usuario actualizado
   */
  async changeUserGroup(userId: number, newGroupId: number, adminId: number) {
    try {
      // Verificar que el admin es realmente administrador (userGroupId: 4)
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId },
        select: { userGroupId: true }
      });

      if (!admin || admin.userGroupId !== 4) {
        throw new Error('No tienes permisos para realizar esta acción');
      }

      // Verificar que el grupo existe
      const group = await this.prisma.userGroup.findUnique({
        where: { id: newGroupId }
      });

      if (!group) {
        throw new Error('El grupo no existe');
      }

      // Actualizar el grupo del usuario
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { userGroupId: newGroupId },
        include: {
          userGroup: {
            select: {
              id: true,
              name: true,
              color: true
            }
          }
        }
      });

      this.logger.log(`Admin ${adminId} cambió el grupo del usuario ${userId} al grupo ${newGroupId}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Error cambiando grupo de usuario: ${userId}`, error);
      throw error;
    }
  }

  /**
   * Obtiene el reporte de reputación de un usuario con estadísticas agregadas
   * @param username Nombre del usuario
   */
  async getReputationReport(username: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { username },
        include: {
          userGroup: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          receivedReputations: {
            include: {
              fromUser: {
                select: {
                  id: true,
                  username: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Calcular totales de reputación
      const positives = user.receivedReputations.filter(r => r.type === 'positive').length;
      const neutrals = user.receivedReputations.filter(r => r.type === 'neutral').length;
      const negatives = user.receivedReputations.filter(r => r.type === 'negative').length;
      const totalReputation = positives - negatives;

      // Estadísticas por periodo
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

      const getStatsByPeriod = (since: Date) => {
        const filtered = user.receivedReputations.filter(r => r.createdAt >= since);
        return {
          positives: filtered.filter(r => r.type === 'positive').length,
          neutrals: filtered.filter(r => r.type === 'neutral').length,
          negatives: filtered.filter(r => r.type === 'negative').length
        };
      };

      return {
        user: {
          id: user.id,
          username: user.username,
          userGroup: user.userGroup
        },
        summary: {
          totalReputation,
          positives,
          neutrals,
          negatives
        },
        periods: {
          lastWeek: getStatsByPeriod(oneWeekAgo),
          lastMonth: getStatsByPeriod(oneMonthAgo),
          last6Months: getStatsByPeriod(sixMonthsAgo)
        },
        reputations: user.receivedReputations.map(r => ({
          id: r.id,
          type: r.type,
          comment: r.comment,
          createdAt: r.createdAt,
          fromUser: r.fromUser
        }))
      };
    } catch (error) {
      this.logger.error(`Error obteniendo reporte de reputación para ${username}`, error);
      throw error;
    }
  }

  /**
   * Da reputación a un usuario
   * @param fromUserId ID del usuario que da la reputación
   * @param toUserId ID del usuario que recibe la reputación
   * @param type Tipo de reputación: positive, neutral, negative
   * @param comment Comentario opcional
   */
  async giveReputation(fromUserId: number, toUserId: number, type: string, comment?: string) {
    try {
      // Validar que no se de reputación a sí mismo
      if (fromUserId === toUserId) {
        const { HttpException, HttpStatus } = require('@nestjs/common');
        throw new HttpException('No puedes darte reputación a ti mismo', HttpStatus.BAD_REQUEST);
      }

      // Validar tipo de reputación
      if (!['positive', 'neutral', 'negative'].includes(type)) {
        const { HttpException, HttpStatus } = require('@nestjs/common');
        throw new HttpException('Tipo de reputación inválido', HttpStatus.BAD_REQUEST);
      }

      // Verificar que el usuario receptor existe
      const toUser = await this.prisma.user.findUnique({
        where: { id: toUserId }
      });

      if (!toUser) {
        const { HttpException, HttpStatus } = require('@nestjs/common');
        throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
      }

      const reputation = await this.prisma.reputation.create({
        data: {
          fromUserId,
          toUserId,
          type,
          comment: comment || null
        },
        include: {
          fromUser: {
            select: {
              id: true,
              username: true
            }
          }
        }
      });

      this.logger.log(`Usuario ${fromUserId} dio reputación ${type} a usuario ${toUserId}`);
      return reputation;
    } catch (error) {
      this.logger.error(`Error dando reputación`, error);
      throw error;
    }
  }

  /**
   * Elimina una reputación (solo quien la dio puede eliminarla)
   * @param reputationId ID de la reputación
   * @param userId ID del usuario que intenta eliminarla
   */
  async deleteReputation(reputationId: number, userId: number) {
    try {
      const reputation = await this.prisma.reputation.findUnique({
        where: { id: reputationId }
      });

      if (!reputation) {
        throw new Error('Reputación no encontrada');
      }

      // Solo quien dio la reputación puede eliminarla
      if (reputation.fromUserId !== userId) {
        throw new Error('No tienes permiso para eliminar esta reputación');
      }

      await this.prisma.reputation.delete({
        where: { id: reputationId }
      });

      this.logger.log(`Usuario ${userId} eliminó reputación ${reputationId}`);
      return { success: true, message: 'Reputación eliminada correctamente' };
    } catch (error) {
      this.logger.error(`Error eliminando reputación`, error);
      throw error;
    }
  }
}

