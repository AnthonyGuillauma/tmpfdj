import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/apis/auth/auth.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-accueil-page',
  imports: [RouterLink, CommonModule],
  templateUrl: './accueil-page.component.html',
  styleUrl: './accueil-page.component.scss'
})
export class AccueilPageComponent {

  protected estConnecte$: Observable<boolean>;

  constructor(private apiAuth: AuthService) {
    this.estConnecte$ = this.apiAuth.sessionActiveObserveur$;
  }
}
