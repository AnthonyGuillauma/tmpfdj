import { Component } from '@angular/core';
import { AuthService } from '../../services/apis/auth/auth.service';
import { Session } from '../../modeles/session.model';
import { CommonModule } from '@angular/common';
import { Canal } from '../../modeles/canal.model';
import { GestionCanauxService } from '../../services/gestions/canaux/gestion-canaux.service';
import { map, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { CanauxService } from '../../services/apis/canaux/canaux.service';

@Component({
  selector: 'app-compte-page',
  imports: [CommonModule],
  templateUrl: './compte-page.component.html',
  styleUrl: './compte-page.component.scss'
})
export class ComptePageComponent {

  protected session: Session;
  protected canaux: Observable<Canal[]>;

  constructor(private apiAuth: AuthService,
    private gestionnaireCanaux: GestionCanauxService,
    private routeur: Router,
    private apiCanaux: CanauxService) {
    this.session = this.apiAuth.informationsSession!;
    this.canaux = this.gestionnaireCanaux.canauxInscritObservable$.pipe(
      map(canaux => {
        const canauxUtilisateur = [];
        for (const canal of canaux) {
          if (canal.proprietaire === this.session.email) {
            canauxUtilisateur.push(canal);
          }
        }
        return canauxUtilisateur;
      })
    );
  }

  protected ouvreCanal(canal: string) {
    this.routeur.navigateByUrl('/canal/' + canal);
  }

  protected ouvreModificationCanal(canal: string) {
    this.routeur.navigateByUrl('/canal/' + canal + '/modification');
  }

  protected ouvreAjoutCanal() {
    this.routeur.navigateByUrl('/canal/ajout');
  }

  protected supprimerCanal(canal: string) {
    this.apiCanaux.supprimerCanal(canal).subscribe(
      (resultat) => {
        if (resultat) this.gestionnaireCanaux.deleteCanalInscrit(canal);
      }
    )
  }

}
