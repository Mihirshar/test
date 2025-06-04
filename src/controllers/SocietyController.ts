import { Request, Response } from 'express';
import { SocietyService } from '../services/SocietyService';
import { ResponseUtil } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import Society from '../models/Society';
import Flat from '../models/Flat';

export default class SocietyController {
  // Get all societies
  static getSocieties = asyncHandler(async (req: AuthRequest, res: Response) => {
    const societies = await Society.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'address', 'totalFlats', 'amenities'],
      order: [['name', 'ASC']]
    });
    
    ResponseUtil.success(res, societies);
  });

  // Get flats for a society
  static getFlats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id: societyId } = req.params;
    
    const flats = await Flat.findAll({
      where: { 
        societyId: parseInt(societyId),
        isOccupied: false // Only show unoccupied flats
      },
      attributes: ['id', 'flatNumber', 'block', 'floor', 'type'],
      order: [
        ['block', 'ASC'],
        ['floor', 'ASC'],
        ['flatNumber', 'ASC']
      ]
    });
    
    ResponseUtil.success(res, flats);
  });
} 