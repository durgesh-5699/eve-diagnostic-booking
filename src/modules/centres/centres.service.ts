import { AppError } from '../../utils/AppError';
import * as centresRepository from './centres.repository';
import type { CreateCentreInput, CreateTestInput } from './centres.schema';

export async function createCentre(input: CreateCentreInput) {
  return centresRepository.createCentre(input.name, input.location);
}

export async function listCentres() {
  return centresRepository.findAllCentres();
}

export async function getCentreWithTests(centreId: string) {
  const centre = await centresRepository.findCentreById(centreId);
  if (!centre) {
    throw new AppError(404, 'Diagnostic centre not found');
  }
  const tests = await centresRepository.findTestsByCentreId(centreId);
  return { ...centre, tests };
}

export async function addTestToCentre(centreId: string, input: CreateTestInput) {
  const centre = await centresRepository.findCentreById(centreId);
  if (!centre) {
    throw new AppError(404, 'Diagnostic centre not found');
  }
  return centresRepository.createTest(centreId, input.name, input.price);
}

export async function listTestsForCentre(centreId: string) {
  const centre = await centresRepository.findCentreById(centreId);
  if (!centre) {
    throw new AppError(404, 'Diagnostic centre not found');
  }
  return centresRepository.findTestsByCentreId(centreId);
}