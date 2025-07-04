import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostBinding, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/apis/auth/auth.service';
import { Observable } from 'rxjs';
import { GestionCanauxService } from '../../../services/gestions/canaux/gestion-canaux.service';
import { Canal } from '../../../modeles/canal.model';
import { GestionMessagesService } from '../../../services/gestions/messages/gestion-messages.service';

@Component({
  selector: 'app-menu-cote',
  imports: [RouterLink, CommonModule],
  templateUrl: './menu-cote.component.html',
  styleUrl: './menu-cote.component.scss'
})
export class MenuCoteComponent {

  private estOuvert: boolean = true;
  protected estConnecte$: Observable<boolean>;
  protected canauxInscrit$: Observable<Canal[]>;

  @ViewChild('boutonMenu') boutonMenu!: ElementRef;
  @HostBinding('class.menu-ouvert') get getEstOuvert() {
    return this.estOuvert;
  }

  constructor(private apiAuth: AuthService, 
    private gestionnaireCanaux: GestionCanauxService,
    protected gestionnaireMessages: GestionMessagesService, 
    private routeur: Router) {
    this.estConnecte$ = this.apiAuth.sessionActiveObserveur$;
    this.canauxInscrit$ = this.gestionnaireCanaux.canauxInscritObservable$;
  }

  protected basculerMenu() {
    this.estOuvert = !this.estOuvert;
    this.boutonMenu.nativeElement.textContent = this.estOuvert ? 'Fermer' : 'Menu';
  }

  protected deconnexion() {
    this.apiAuth.deconnexion().subscribe();
  }

  protected ouvreCanal(canal: string) {
    this.routeur.navigateByUrl('/canal/' + canal)
  }

}
