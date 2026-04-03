import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { RpButtonComponent } from '../../../shared/components/rp-button/rp-button.component';

@Component({
  selector: 'app-auth-welcome',
  templateUrl: './auth-welcome.page.html',
  styleUrls: ['./auth-welcome.page.scss'],
  standalone: true,
  imports: [RouterLink, IonContent, RpButtonComponent],
})
export class AuthWelcomePage {}
