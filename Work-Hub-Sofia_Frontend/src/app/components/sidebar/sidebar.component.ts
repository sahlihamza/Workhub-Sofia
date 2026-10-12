import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import { Router } from '@angular/router';


declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
  roles?: string[]; // Ajouté pour spécifier les rôles autorisés
}

export const ROUTES: RouteInfo[] = [
  { path: '/planning', title: 'Planning',icon: 'ni-calendar-grid-58 text-primary', class: '', roles: ['superadmin', 'admin', 'manager','collaborateur'] },
  // { path: '/icons', title: 'Icons', icon: 'ni-planet text-primary', class: '' },
  // { path: '/maps', title: 'Maps', icon: 'ni-pin-3 text-primary', class: '' },
  { path: '/manager-users', title: 'Utilisateurs', icon: 'ni-bullet-list-67 text-primary', class: '', roles: ['superadmin', 'admin', 'manager'] },
  { path: '/add-user', title: 'Ajouter utilisateur', icon: 'ni-circle-08 text-primary', class: '', roles: ['superadmin', 'admin'] },
  { path: '/department', title: 'Manage Departments',icon: 'ni-building text-primary', class: '', roles: ['superadmin'] },
  { path: '/teams', title: 'Manage Teams',icon: 'ni-user-run text-primary', class: '', roles: ['superadmin', 'admin', 'manager'] },
  { path: '/postes', title: 'Manage Positions',icon: 'ni-ungroup text-primary', class: '', roles: ['superadmin'] },

  { path: '/admin-planning', title: 'Manage Plannings',icon: 'ni-calendar-grid-58 text-primary', class: '', roles: ['superadmin', 'admin', 'manager'] },
  { path: '/demande-conge', title: 'Demandes de congé', icon: 'ni ni-watch-time text-primary', class: '', roles: ['superadmin', 'admin', 'manager', 'collaborateur'] },
  { path: '/gerer-demande', title: 'Gérer demandes', icon: 'ni ni-collection text-primary', class: '', roles: ['superadmin', 'admin', 'manager'] },
  { path: '/gerer-compensation', title: 'Gérer compensation', icon: 'ni-calendar-grid-58 text-primary', class: '', roles: ['admin'] },
  { path: '/campaigns', title: 'Manage Campaigns',  icon: 'ni-chart-bar-32 text-primary', class: '', roles: ['superadmin'] },


];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() minimized = false;
  @Output() onToggleSidebar = new EventEmitter<void>();
  public menuItems: RouteInfo[] = [];
  public isCollapsed = true;
  currentUserRole = '';

  constructor(private router: Router) {}

  ngOnInit() {
    this.currentUserRole = this.getCurrentUserRole();
    this.menuItems = ROUTES.filter(item => {
      // Si aucun rôle n'est défini sur l'élément, il est accessible à tous
      if (!item.roles) return true;
      // Sinon, on vérifie que le rôle actuel est autorisé
      return item.roles.includes(this.currentUserRole);
    });

    this.router.events.subscribe(() => {
      this.isCollapsed = true;
    });
  }


  getCurrentUserRole(): string {
    const token = localStorage.getItem('access_token');
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || '';
    } catch (e) {
      return '';
    }
  }

  toggleSidebar() {
    this.onToggleSidebar.emit();
  }
}
