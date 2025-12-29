import { Controller, Get, Res } from '@nestjs/common';
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
}
