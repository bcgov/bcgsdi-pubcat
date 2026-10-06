import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'pubcat-header',
  imports: [MatIconModule, MatToolbarModule, MatButtonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  readonly router = inject(Router);

  showBreadcrumbs = false;
}
