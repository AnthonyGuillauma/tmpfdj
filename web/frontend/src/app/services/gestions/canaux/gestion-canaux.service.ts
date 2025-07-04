import { Injectable } from '@angular/core';
import { Canal } from '../../../modeles/canal.model';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { CanauxService } from '../../apis/canaux/canaux.service';
import { AuthService } from '../../apis/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class GestionCanauxService {

  public canalActif: string | null = null;

  private canauxInscrit = new BehaviorSubject<Canal[]>([]);
  public canauxInscritObservable$ = this.canauxInscrit.asObservable();

  constructor(private apiAuth: AuthService, private apiCanaux: CanauxService) { 
    this.apiAuth.sessionActiveObserveur$.subscribe(estConnecte => {
      if (estConnecte) this.apiCanaux.getCanauxInscrit().subscribe(canaux => {
        this.setCanauxInscrit(canaux);
      });
    });
  }

  getCanalInscrit(canal: string): Canal | undefined {
    return this.canauxInscrit.value.find(c => c.id === canal);
  }

  getCanalUtilisateur(canal: string): Canal | undefined {
    const canauxInscrit = this.canauxInscrit.value;
    const email = this.apiAuth.informationsSession!.email;
    return canauxInscrit.find(c => c.id === canal && c.proprietaire === email);
  }

  setCanauxInscrit(canaux: Canal[]): void {
    this.canauxInscrit.next(canaux);
  }

  addCanalInscrit(canal: Canal) {
    this.canauxInscrit.next([...this.canauxInscrit.value, canal]);
  }

  deleteCanalInscrit(canal: string) {
    this.canauxInscrit.next(this.canauxInscrit.value.filter(c => c.id !== canal));
  }
}
