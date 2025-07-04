import { Component, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../../../services/apis/auth/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inscription-page',
  imports: [ReactiveFormsModule],
  templateUrl: './inscription-page.component.html',
  styleUrl: './inscription-page.component.scss'
})
export class InscriptionPageComponent {

  protected formulaireInscription: FormGroup;
  @ViewChild('erreur') labelErreur!: ElementRef;

  constructor(private apiAuth: AuthService, fb: FormBuilder, private routeur: Router) { 
    this.formulaireInscription = fb.group({
      email: ['', [Validators.pattern(/^.+@.+\..+$/), Validators.required]],
      pseudo: ['', [Validators.minLength(2), Validators.required]],
      motDePasse: ['', [Validators.minLength(8), Validators.required]]
    });
  }

  protected inscription() {
    const email = this.formulaireInscription.get('email')?.value;
    const pseudo = this.formulaireInscription.get('pseudo')?.value;
    const motDePasse = this.formulaireInscription.get('motDePasse')?.value;
    this.apiAuth.inscription(email, motDePasse, pseudo).subscribe((resultat) => {
      if (resultat.valide) {
        this.routeur.navigateByUrl('/');
      }
      else {
        this.labelErreur.nativeElement.textContent = resultat.message;
      }
    });
  }
}
