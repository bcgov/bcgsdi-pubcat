import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'header',
  imports: [MatIconModule, MatToolbarModule, MatButtonModule, RouterLink],
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './header.css',
})
export class Header {
  constructor(public router: Router) {}
  showBreadcrumbs: boolean = false;
}
