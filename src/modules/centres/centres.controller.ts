import type { Request, Response, NextFunction } from 'express';
import * as centresService from './centres.service';

export async function createCentreHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const centre = await centresService.createCentre(req.body);
    res.status(201).json(centre);
  } catch (err) {
    next(err);
  }
}

export async function listCentresHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const centres = await centresService.listCentres();
    res.status(200).json(centres);
  } catch (err) {
    next(err);
  }
}

export async function getCentreHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const centre = await centresService.getCentreWithTests(req.params.id);
    res.status(200).json(centre);
  } catch (err) {
    next(err);
  }
}

export async function addTestHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const test = await centresService.addTestToCentre(req.params.id, req.body);
    res.status(201).json(test);
  } catch (err) {
    next(err);
  }
}

export async function listTestsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tests = await centresService.listTestsForCentre(req.params.id);
    res.status(200).json(tests);
  } catch (err) {
    next(err);
  }
}