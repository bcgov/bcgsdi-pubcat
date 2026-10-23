import { NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './components/footer/footer';
import { Header } from './components/header/header';
import { NavigationService } from './services/navigation-service';

@Component({
  imports: [RouterOutlet, NgTemplateOutlet, Header, Footer],
  selector: 'pubcat-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  // The NavigationService is not directly used in this component, but it is
  // injected nonetheless to ensure it is property initialized on application
  // load
  readonly navigationService = inject(NavigationService);
}
