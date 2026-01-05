import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getCategories() {
    return this.prisma.category.findMany({
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });
  }

  async getStats() {
    const totalPosts = await this.prisma.post.count();
    const totalComments = await this.prisma.comment.count();
    
    const latestPost = await this.prisma.post.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        author: {
          select: { username: true }
        }
      }
    });
    
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
  }

  async getCategoryPosts(categoryId: number) {
    return this.prisma.post.findMany({
      where: {
        categoryId: categoryId
      },
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
      ]
    });
  }

  async createPost(categoryId: number, postData: { title: string; content: string; authorId: number }) {
    // Verificar o crear usuario si no existe
    let user = await this.prisma.user.findUnique({
      where: { id: postData.authorId }
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: postData.authorId,
          email: 'demo@example.com',
          username: 'Usuario Demo',
          password: 'demo123'
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

    // Generar slug desde el título
    const slug = postData.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con guiones
      .replace(/^-+|-+$/g, ''); // Eliminar guiones al inicio y final
    
    // Añadir timestamp al slug para hacerlo único
    const uniqueSlug = `${slug}-${Date.now()}`;

    return this.prisma.post.create({
      data: {
        title: postData.title,
        content: postData.content,
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
  }

  async getPostBySlug(slug: string) {
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

    // Obtener estadísticas del autor
    const authorPosts = await this.prisma.post.count({
      where: { authorId: post.authorId }
    });

    const authorComments = await this.prisma.comment.count({
      where: { authorId: post.authorId }
    });

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
  }
}
