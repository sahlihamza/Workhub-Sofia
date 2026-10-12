import { Routes } from '@angular/router';

import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { IconsComponent } from '../../pages/icons/icons.component';
import { MapsComponent } from '../../pages/maps/maps.component';
import { UserProfileComponent } from '../../pages/user-profile/user-profile.component';
import { ManageUsersComponent } from '../../pages/manage-users/manage-users.component';
import {AddUserComponent} from "../../pages/add-user/add-user.component";
import {SharedModule} from "../../shared/shared.module";
import { AuthGuard } from 'src/app/guards/auth.guard';
import { DepartmentComponent } from '../../pages/department/department.component';
import { TeamsComponent } from '../../pages/teams/teams.component';
import { PostesComponent } from '../../pages/postes/postes.component';
import { UpdatePasswordComponent } from 'src/app/pages/update-password/update-password.component';
import { PlanningComponent } from '../../pages/planning/planning.component';
import { DemandeCongeComponent } from 'src/app/pages/demande-conge/demande-conge.component';
import { GererDemandeComponent } from 'src/app/pages/gerer-demande/gerer-demande.component';
import { RoleGuard } from 'src/app/guards/role.guard';
import { GererCompensationComponent } from 'src/app/pages/gerer-compensation/gerer-compensation.component';
import {AdminPlanningComponent} from "../../pages/admin-planning/admin-planning.component";
import {CampaignsComponent} from "../../pages/campaigns/campaigns.component";



export const AdminLayoutRoutes: Routes = [
    { path: 'dashboard',      component: DashboardComponent,canActivate: [AuthGuard] },
    { path: 'user-profile',   component: UserProfileComponent, canActivate: [AuthGuard] },
    { path: 'update-password',   component: UpdatePasswordComponent, canActivate: [AuthGuard] },

    { path: 'manager-users',  component: ManageUsersComponent, canActivate: [AuthGuard,RoleGuard],data: { roles: ['superadmin', 'admin'] } },
    { path: 'icons',          component: IconsComponent,   canActivate: [AuthGuard] },
    { path: 'maps',           component: MapsComponent, canActivate: [AuthGuard] },
    { path: 'add-user',       component: AddUserComponent,  canActivate: [AuthGuard,RoleGuard],data: { roles: ['superadmin', 'admin'] } },
    { path: 'gerer-demande',       component: GererDemandeComponent,  canActivate: [AuthGuard,RoleGuard],data: { roles: ['superadmin', 'admin','manager'] }  },
    { path: 'gerer-compensation',       component: GererCompensationComponent,  canActivate: [AuthGuard,RoleGuard],data: { roles: ['admin'] }  },

    {
    path: 'department',
    component: DepartmentComponent,
    canActivate: [AuthGuard,RoleGuard],
    data: { roles: ['superadmin'] }
  },

  {
    path: 'teams',
    component: TeamsComponent,
    canActivate: [AuthGuard,RoleGuard],
    data: { roles: ['superadmin', 'admin', 'manager'] }
  },
  {
    path: 'postes',
    component: PostesComponent,
    canActivate: [AuthGuard,RoleGuard],
    data: { roles: ['superadmin'] }
  },
  {
    path: 'planning',
    component: PlanningComponent,
    canActivate: [AuthGuard,RoleGuard],
    data: { roles: ['superadmin', 'admin', 'manager', 'collaborateur'] }
  },
  {
    path: 'admin-planning',
    component: AdminPlanningComponent,
    canActivate: [AuthGuard,RoleGuard],
    data: { roles: ['superadmin', 'admin', 'manager'] }
  },


  { path: 'demande-conge', component: DemandeCongeComponent, canActivate: [AuthGuard,RoleGuard],data: { roles: ['superadmin', 'admin','manager','collaborateur'] }  },
  {
    path: 'campaigns',
    component: CampaignsComponent,
    canActivate: [AuthGuard,RoleGuard],
    data: { roles: ['superadmin'] }
  },
];
