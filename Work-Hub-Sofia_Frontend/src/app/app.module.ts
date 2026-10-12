import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app.routing';
import { ComponentsModule } from './components/components.module';
import { DepartmentComponent } from './pages/department/department.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { TeamsComponent } from './pages/teams/teams.component';
import { PlanningComponent} from "./pages/planning/planning.component";
import { PostesComponent } from './pages/postes/postes.component';
// import { ResetPasswordComponent } from './pages/reset-password/reset-password..component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password..component';
import { NewPasswordComponent } from './pages/new-password/new-password.component';
import { UpdatePasswordComponent } from './pages/update-password/update-password.component';
import { DemandeCongeComponent } from './pages/demande-conge/demande-conge.component';
import { GererDemandeComponent } from './pages/gerer-demande/gerer-demande.component';
import { GererCompensationComponent } from './pages/gerer-compensation/gerer-compensation.component';
import {AuthInterceptor} from "./auth.interceptor";
import { NgxPaginationModule } from 'ngx-pagination';
import { ToastrModule } from 'ngx-toastr';
import { AdminPlanningComponent } from './pages/admin-planning/admin-planning.component';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { CampaignsComponent } from './pages/campaigns/campaigns.component';



export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
@NgModule({
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    ComponentsModule,
    NgbModule,
    RouterModule,
    AppRoutingModule,
    ReactiveFormsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    NgxPaginationModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    })

  ],
  declarations: [
    AppComponent,
    AdminLayoutComponent,
    AuthLayoutComponent,
    ResetPasswordComponent,
    AuthLayoutComponent,
    DepartmentComponent,
    ConfirmationDialogComponent,
    TeamsComponent,
    NewPasswordComponent,
    UpdatePasswordComponent,



    AuthLayoutComponent,
    DepartmentComponent,
    ConfirmationDialogComponent,
    TeamsComponent,
    PostesComponent,
    DemandeCongeComponent,
    GererDemandeComponent,
    GererCompensationComponent,
    PlanningComponent,
    AdminPlanningComponent,
    CampaignsComponent,



  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
