import { Component, signal } from '@angular/core';
import { FitbotAngular } from 'fitbot-angular';

@Component({
  selector: 'app-root',
  imports: [FitbotAngular],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('fitbot-angular-demo');
}
