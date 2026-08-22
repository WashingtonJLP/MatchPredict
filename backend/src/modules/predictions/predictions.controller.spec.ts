import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PredictionProcessorService } from './prediction-processor.service';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';

describe('PredictionsController admin endpoints', () => {
  let controller: PredictionsController;
  let predictionsService: { calculatePrediction: jest.Mock };
  let processorService: { processFixture: jest.Mock };

  beforeEach(() => {
    predictionsService = {
      calculatePrediction: jest.fn().mockResolvedValue({ totalPoints: 3 }),
    };
    processorService = {
      processFixture: jest.fn().mockResolvedValue({ predictionsProcessed: 1 }),
    };

    controller = new PredictionsController(
      predictionsService as unknown as PredictionsService,
      processorService as unknown as PredictionProcessorService,
    );
  });

  it('rejects USER when calculating a prediction manually', () => {
    expect(() => controller.calculate(user, predictionId)).toThrow(
      ForbiddenException,
    );
    expect(predictionsService.calculatePrediction).not.toHaveBeenCalled();
  });

  it('allows ADMIN when calculating a prediction manually', async () => {
    await expect(controller.calculate(admin, predictionId)).resolves.toEqual({
      totalPoints: 3,
    });
    expect(predictionsService.calculatePrediction).toHaveBeenCalledWith(
      predictionId,
    );
  });

  it('rejects USER when processing a fixture manually', () => {
    expect(() => controller.processFixture(user, fixtureId)).toThrow(
      ForbiddenException,
    );
    expect(processorService.processFixture).not.toHaveBeenCalled();
  });

  it('allows ADMIN when processing a fixture manually', async () => {
    await expect(controller.processFixture(admin, fixtureId)).resolves.toEqual({
      predictionsProcessed: 1,
    });
    expect(processorService.processFixture).toHaveBeenCalledWith(fixtureId);
  });
});

const user = createAuthenticatedUser(Role.USER);
const admin = createAuthenticatedUser(Role.ADMIN);
const predictionId = '44444444-4444-4444-8444-444444444444';
const fixtureId = '33333333-3333-4333-8333-333333333333';

function createAuthenticatedUser(role: Role): AuthenticatedUser {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    role,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  };
}
