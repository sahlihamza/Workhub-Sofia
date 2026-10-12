import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'
import { DashboardComponent } from '../pages/dashboard/dashboard.component';
import { IconsComponent } from '../pages/icons/icons.component';
import { MapsComponent } from '../pages/maps/maps.component';
import { UserProfileComponent } from '../pages/user-profile/user-profile.component';
import { ManageUsersComponent } from '../pages/manage-users/manage-users.component';
import {NgbTooltipModule} from "@ng-bootstrap/ng-bootstrap";
import {ClipboardModule} from "ngx-clipboard";



@NgModule({
  declarations: [
    DashboardComponent,
    IconsComponent,
    MapsComponent,
    UserProfileComponent,
    ManageUsersComponent
  ],
  imports: [
    CommonModule,
    NgbTooltipModule,
    ClipboardModule
  ]
})
export class  SharedModule { }
