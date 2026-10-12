import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthLayoutRoutes } from './auth-layout.routing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {SharedModule} from "../../shared/shared.module";
import { LoginComponent } from '../../pages/login/login.component';
import { AddUserComponent } from '../../pages/add-user/add-user.component';
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AuthLayoutRoutes),
    FormsModule
    // NgbModule
  ],
  declarations: [
    LoginComponent,
    AddUserComponent,
    
  ]
})
export class AuthLayoutModule { }
