import { Component, signal } from '@angular/core';
import { WordProcessorComponent } from './word-processor/word-processor.component';

@Component({
  selector: 'app-root',
  imports: [WordProcessorComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('wordtemp');
}
