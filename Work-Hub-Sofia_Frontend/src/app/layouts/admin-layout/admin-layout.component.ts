import {Component, HostBinding, OnInit} from '@angular/core';
import { LayoutService } from 'src/app/services/layout.service';
import {Subscription} from "rxjs";

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit {
  @HostBinding('class.sidebar-minimized')
  public isSidebarMinimized = false;
  private layoutSub: Subscription;
  constructor(private layoutService: LayoutService) { }

  ngOnInit() {
    this.layoutSub = this.layoutService.isSidebarMinimized$.subscribe(state => {
      this.isSidebarMinimized = state;
    });
  }

  ngOnDestroy() {
    if (this.layoutSub) {
      this.layoutSub.unsubscribe();
    }
  }

  toggleSidebar() {
    this.isSidebarMinimized = !this.isSidebarMinimized;
    this.layoutService.toggleSidebar();
  }

}
