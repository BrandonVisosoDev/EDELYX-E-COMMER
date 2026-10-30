import { Routes } from '@angular/router';

import { CatalogComponent } from './features/catalog/catalog.component';

export const routes: Routes = [
  { path: '', component: CatalogComponent },
  { path: 'catalog', redirectTo: '', pathMatch: 'full' },
];
