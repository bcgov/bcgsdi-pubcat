import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  imports: [MatButtonModule, MatIconModule],
  selector: 'search-results',
  styleUrl: './search-results.css',
  templateUrl: './search-results.html',
})
export class SearchResults {
  private readonly router = inject(Router);

  back() {
    this.router.navigate(['/search']);
  }
}
