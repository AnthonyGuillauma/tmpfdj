import { Component, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../../../services/apis/auth/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-connexion-page',
  imports: [ReactiveFormsModule],
  templateUrl: './connexion-page.component.html',
  styleUrl: './connexion-page.component.scss'
})
export class ConnexionPageComponent {

  protected formulaireConnexion: FormGroup;
  @ViewChild('erreur') labelErreur!: ElementRef;

  constructor(private apiAuth: AuthService, fb: FormBuilder, private routeur: Router) { 
    this.formulaireConnexion = fb.group({
      email: ['', [Validators.pattern(/^.+@.+\..+$/), Validators.required]],
      motDePasse: ['', [Validators.minLength(8), Validators.required]]
    });
  }

  protected connexion() {
    const email = this.formulaireConnexion.get('email')?.value;
    const motDePasse = this.formulaireConnexion.get('motDePasse')?.value;
    this.apiAuth.connexion(email, motDePasse).subscribe((resultat) => {
      if (resultat.valide) {
        this.routeur.navigateByUrl('/');
      }
      else {
        this.labelErreur.nativeElement.textContent = resultat.message;
      }
    });
  }
}
