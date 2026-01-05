import { Controller, Get, Res, Param, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getIndex(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  }

  @Get('category')
  getCategory(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'category.html'));
  }

  @Get('new-thread')
  getNewThread(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'new-thread.html'));
  }

  @Get('thread')
  getThread(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'thread.html'));
  }

  @Get('styles.css')
  getStyles(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'styles.css'));
  }

  @Get('api/categories')
  async getCategories() {
    return this.appService.getCategories();
  }

  @Get('api/stats')
  async getStats() {
    return this.appService.getStats();
  }

  @Get('api/categories/:id/posts')
  async getCategoryPosts(@Param('id') id: string) {
    return this.appService.getCategoryPosts(parseInt(id));
  }

  @Post('api/categories/:id/posts')
  async createPost(@Param('id') id: string, @Body() postData: any) {
    return this.appService.createPost(parseInt(id), postData);
  }

  @Get('api/posts/:slug')
  async getPostBySlug(@Param('slug') slug: string) {
    return this.appService.getPostBySlug(slug);
  }
}
