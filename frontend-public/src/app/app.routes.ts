import { Routes } from '@angular/router';
import { SearchResults } from './pages/search-results/search-results';
import { Search } from './pages/search/search';

export const routes: Routes = [
  { path: '', redirectTo: 'search', pathMatch: 'full' },
  { path: 'search', component: Search },
  { path: 'results', component: SearchResults },
];
