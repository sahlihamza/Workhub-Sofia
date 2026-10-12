import { Routes } from '@angular/router';

import { LoginComponent } from '../../pages/login/login.component';
import { AddUserComponent } from '../../pages/add-user/add-user.component';
import { ResetPasswordComponent } from 'src/app/pages/reset-password/reset-password..component';
import { NewPasswordComponent } from 'src/app/pages/new-password/new-password.component';


export const AuthLayoutRoutes: Routes = [
    { path: 'login',          component: LoginComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: 'new-password', component: NewPasswordComponent },


];
