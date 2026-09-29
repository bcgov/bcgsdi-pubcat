import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private readonly router = inject(Router);

  private previousUrl: string | null = null;
  private currentUrl: string | null = null;

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.previousUrl = this.currentUrl;
        this.currentUrl = event.urlAfterRedirects;
      });
  }

  public get canGoBack(): boolean {
    return this.previousUrl !== null;
  }

  getPreviousUrl(): string | null {
    return this.previousUrl;
  }

  public back(): void {
    if (this.previousUrl) {
      this.router.navigateByUrl(this.previousUrl);
    }
  }
}
