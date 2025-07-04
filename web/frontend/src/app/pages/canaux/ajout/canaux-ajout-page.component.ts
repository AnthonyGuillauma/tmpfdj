import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Canal } from '../../../modeles/canal.model';
import { ActivatedRoute, Router } from '@angular/router';
import { CanauxService } from '../../../services/apis/canaux/canaux.service';
import { GestionCanauxService } from '../../../services/gestions/canaux/gestion-canaux.service';
import { AuthService } from '../../../services/apis/auth/auth.service';

@Component({
  selector: 'app-canaux-ajout-page',
  imports: [ReactiveFormsModule],
  templateUrl: './canaux-ajout-page.component.html',
  styleUrl: './canaux-ajout-page.component.scss'
})
export class CanauxAjoutPageComponent {

  protected formulaireAjout: FormGroup;

  @ViewChild('erreur') labelErreur!: ElementRef;

  constructor(
    private gestionnaireCanaux: GestionCanauxService, 
    fb: FormBuilder,
    private apiCanaux: CanauxService,
    private apiAuth: AuthService,
    private routeur: Router) {

      this.formulaireAjout = fb.group({
        nom: ['', [Validators.required]],
        visibilite: ['public']
      });
  }

  protected ajouter() {
    const nom = this.formulaireAjout.get('nom')!.value;
    const visibilite = this.formulaireAjout.get('visibilite')!.value;
    this.apiCanaux.ajouterCanal(nom, visibilite).subscribe(
      resultat => {
        if (resultat.valide) {
          this.gestionnaireCanaux.addCanalInscrit(
            new Canal(resultat.message!, nom, this.apiAuth.informationsSession!.email, visibilite)
          );
          this.routeur.navigateByUrl('/compte');
        }
        else {
          this.labelErreur.nativeElement.textContent = resultat.message;
        }
      }
    );
  }

}
