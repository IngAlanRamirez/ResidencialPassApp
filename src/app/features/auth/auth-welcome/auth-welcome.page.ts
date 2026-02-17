import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonButton,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-auth-welcome',
  templateUrl: './auth-welcome.page.html',
  styleUrls: ['./auth-welcome.page.scss'],
  standalone: true,
  imports: [
    RouterLink,
    IonContent,
    IonButton,
  ],
})
export class AuthWelcomePage {}
