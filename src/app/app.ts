import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WordProcessorComponent } from './word-processor/word-processor.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WordProcessorComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('wordtemp');
}
