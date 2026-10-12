import { TestBed } from '@angular/core/testing';

import { PostesService } from './postes.service';

describe('PostesService', () => {
  let service: PostesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PostesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
