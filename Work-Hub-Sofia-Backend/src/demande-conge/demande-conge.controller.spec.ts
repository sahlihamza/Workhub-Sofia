import { Test, TestingModule } from '@nestjs/testing';
import { DemandeCongeController } from './demande-conge.controller';
import { DemandeCongeService } from './demande-conge.service';

describe('DemandeCongeController', () => {
  let controller: DemandeCongeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DemandeCongeController],
      providers: [DemandeCongeService],
    }).compile();

    controller = module.get<DemandeCongeController>(DemandeCongeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
