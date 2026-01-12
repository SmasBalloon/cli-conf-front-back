import type { Request, Response, NextFunction } from 'express';
import { indexService } from '../services/index.service.js';

export class IndexController {
  async getWelcome(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await indexService.getWelcomeMessage();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async getHealthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await indexService.getHealthCheck();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
}

export const indexController = new IndexController();
