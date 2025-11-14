import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WordProcessor } from './word-processor';

describe('WordProcessor', () => {
  let component: WordProcessor;
  let fixture: ComponentFixture<WordProcessor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WordProcessor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WordProcessor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
