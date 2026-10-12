import { Test, TestingModule } from '@nestjs/testing';
import { DemandeCongeService } from './demande-conge.service';

describe('DemandeCongeService', () => {
  let service: DemandeCongeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DemandeCongeService],
    }).compile();

    service = module.get<DemandeCongeService>(DemandeCongeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
