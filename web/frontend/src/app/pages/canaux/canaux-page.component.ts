import { Component } from '@angular/core';
import { CanauxService } from '../../services/apis/canaux/canaux.service';
import { CommonModule } from '@angular/common';
import { Canal } from '../../modeles/canal.model';
import { Router } from '@angular/router';
import { GestionCanauxService } from '../../services/gestions/canaux/gestion-canaux.service';

@Component({
  selector: 'app-canaux-page',
  imports: [CommonModule],
  templateUrl: './canaux-page.component.html',
  styleUrl: './canaux-page.component.scss'
})
export class CanauxPageComponent{

  protected canauxPublics: Canal[] = [];
  protected canauxInscrit: Canal[] = [];

  constructor(private apiCanaux: CanauxService, private gestionnaireCanaux: GestionCanauxService, private routeur: Router) { 
    this.apiCanaux.getCanauxDisponibles().subscribe(canaux => {
      this.canauxPublics = canaux;
    });
    this.apiCanaux.getCanauxInscrit().subscribe(canaux => {
      this.canauxInscrit = canaux;
    });
  }

  protected rejoindreCanal(canal: string) {
    this.apiCanaux.rejoindreCanal(canal).subscribe( resultat => {
      if (resultat.valide) {
        const infosCanal = this.canauxPublics.find(c => c.id === canal)!;
        this.gestionnaireCanaux.addCanalInscrit(infosCanal);
        this.routeur.navigateByUrl('/canal/' + canal);
      }
    });
  }

  protected ouvreCanal(canal: string) {
    this.routeur.navigateByUrl('/canal/' + canal);
  }
}
