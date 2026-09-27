import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as centresRepository from './centres.repository';
import {
  createCentre,
  listCentres,
  getCentreWithTests,
  addTestToCentre,
  listTestsForCentre,
} from './centres.service';

vi.mock('./centres.repository');

const fakeCentre = {
  id: 'centre-1',
  name: 'Apollo Diagnostics',
  location: 'Bhubaneswar',
  created_at: new Date(),
  updated_at: new Date(),
};

const fakeTest = {
  id: 'test-1',
  centre_id: 'centre-1',
  name: 'Complete Blood Count',
  price: '499.00',
  created_at: new Date(),
  updated_at: new Date(),
};

describe('centres.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCentre', () => {
    it('creates and returns a new centre', async () => {
      vi.mocked(centresRepository.createCentre).mockResolvedValue(fakeCentre);

      const result = await createCentre({ name: 'Apollo Diagnostics', location: 'Bhubaneswar' });

      expect(result).toEqual(fakeCentre);
      expect(centresRepository.createCentre).toHaveBeenCalledWith('Apollo Diagnostics', 'Bhubaneswar');
    });
  });

  describe('listCentres', () => {
    it('returns all centres', async () => {
      vi.mocked(centresRepository.findAllCentres).mockResolvedValue([fakeCentre]);

      const result = await listCentres();

      expect(result).toEqual([fakeCentre]);
    });
  });

  describe('getCentreWithTests', () => {
    it('returns centre with its tests when centre exists', async () => {
      vi.mocked(centresRepository.findCentreById).mockResolvedValue(fakeCentre);
      vi.mocked(centresRepository.findTestsByCentreId).mockResolvedValue([fakeTest]);

      const result = await getCentreWithTests('centre-1');

      expect(result).toEqual({ ...fakeCentre, tests: [fakeTest] });
    });

    it('throws a 404 error when centre does not exist', async () => {
      vi.mocked(centresRepository.findCentreById).mockResolvedValue(null);

      await expect(getCentreWithTests('nonexistent-id')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('addTestToCentre', () => {
    it('adds a test when centre exists', async () => {
      vi.mocked(centresRepository.findCentreById).mockResolvedValue(fakeCentre);
      vi.mocked(centresRepository.createTest).mockResolvedValue(fakeTest);

      const result = await addTestToCentre('centre-1', { name: 'Complete Blood Count', price: 499 });

      expect(result).toEqual(fakeTest);
      expect(centresRepository.createTest).toHaveBeenCalledWith('centre-1', 'Complete Blood Count', 499);
    });

    it('throws a 404 error when centre does not exist', async () => {
      vi.mocked(centresRepository.findCentreById).mockResolvedValue(null);

      await expect(
        addTestToCentre('nonexistent-id', { name: 'CBC', price: 499 }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('listTestsForCentre', () => {
    it('returns tests when centre exists', async () => {
      vi.mocked(centresRepository.findCentreById).mockResolvedValue(fakeCentre);
      vi.mocked(centresRepository.findTestsByCentreId).mockResolvedValue([fakeTest]);

      const result = await listTestsForCentre('centre-1');

      expect(result).toEqual([fakeTest]);
    });

    it('throws a 404 error when centre does not exist', async () => {
      vi.mocked(centresRepository.findCentreById).mockResolvedValue(null);

      await expect(listTestsForCentre('nonexistent-id')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});