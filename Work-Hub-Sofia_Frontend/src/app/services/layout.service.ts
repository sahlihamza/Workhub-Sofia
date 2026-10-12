
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // A BehaviorSubject holds the current state of the sidebar
  public isSidebarMinimized$ = new BehaviorSubject<boolean>(false);
  private previousSidebarState = false;

  constructor() { }

  // Called by the regular sidebar toggle button
  toggleSidebar(): void {
    this.isSidebarMinimized$.next(!this.isSidebarMinimized$.value);
  }

  // Called when entering a mode that requires a collapsed sidebar
  enterFullscreen(): void {
    this.previousSidebarState = this.isSidebarMinimized$.value; // Save current state
    this.isSidebarMinimized$.next(true); // Force sidebar to collapse
  }

  // Called when exiting that mode
  exitFullscreen(): void {
    this.isSidebarMinimized$.next(this.previousSidebarState); // Restore previous state
  }
}
