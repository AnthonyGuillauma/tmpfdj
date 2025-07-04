import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Canal } from '../../../modeles/canal.model';
import { GestionCanauxService } from '../../../services/gestions/canaux/gestion-canaux.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CanauxService } from '../../../services/apis/canaux/canaux.service';

@Component({
  selector: 'app-canaux-modification-page',
  imports: [ReactiveFormsModule],
  templateUrl: './canaux-modification-page.component.html',
  styleUrl: './canaux-modification-page.component.scss'
})
export class CanauxModificationPageComponent {

  private canal: string;
  private informationsCanal: Canal;
  protected formulaireModification: FormGroup;

  @ViewChild('erreur') labelErreur!: ElementRef;

  constructor(private gestionnaireCanaux: GestionCanauxService, 
    route: ActivatedRoute,
    fb: FormBuilder,
    private apiCanaux: CanauxService,
    private routeur: Router) {

    if (!route.snapshot.paramMap.has('id')) {
      throw Error(`Impossible d'ouvrir cette page sans l'identifiant du canal.`);
    }
    this.canal = route.snapshot.paramMap.get('id')!;

    const informations = this.gestionnaireCanaux.getCanalUtilisateur(this.canal);
    if (!informations) {
      throw Error(`Impossible d'ouvrir cette page avec un mauvais identifiant.`);
    }
    this.informationsCanal = informations;
    this.formulaireModification = fb.group({
      nom: [this.informationsCanal.nom, [Validators.required]],
      visibilite: [this.informationsCanal.visibilite]
    });
  }

  protected modifier() {
    const nom = this.formulaireModification.get('nom')!.value;
    const visibilite = this.formulaireModification.get('visibilite')!.value;
    this.apiCanaux.modifierCanal(this.canal, nom, visibilite).subscribe(
      reussi => {
        if (reussi.valide) {
          this.routeur.navigateByUrl('/compte');
          this.informationsCanal.nom = nom;
          this.informationsCanal.visibilite = visibilite;
        }
        else {
          this.labelErreur.nativeElement.value = reussi.message;
        }
      }
    );
  }
}
