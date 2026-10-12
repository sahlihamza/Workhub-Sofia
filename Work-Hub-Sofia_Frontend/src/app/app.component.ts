import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'WorkHub Sofia';
  constructor(private translate: TranslateService, private datepickerConfig: NgbDatepickerConfig) {
    translate.setDefaultLang('en');
    const savedLang = localStorage.getItem('lang') || 'en';
    translate.use(savedLang);


    datepickerConfig.navigation = 'arrows';
  }

}
