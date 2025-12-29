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
}
