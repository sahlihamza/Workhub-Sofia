import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UserSidebarComponent } from './user-sidebar/user-sidebar.component';
import {ReactiveFormsModule} from "@angular/forms";
import {TranslateModule} from "@ngx-translate/core";


@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        NgbModule,
        ReactiveFormsModule,
        TranslateModule,

    ],
  declarations: [
    FooterComponent,
    NavbarComponent,
    SidebarComponent,
    UserSidebarComponent,


  ],
  exports: [
    FooterComponent,
    NavbarComponent,
    SidebarComponent,
    UserSidebarComponent
  ]
})
export class ComponentsModule { }
