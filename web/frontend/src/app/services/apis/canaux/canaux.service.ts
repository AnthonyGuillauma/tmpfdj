import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Canal } from '../../../modeles/canal.model';
import { catchError, map, Observable, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { GestionCanauxService } from '../../gestions/canaux/gestion-canaux.service';
import { ResultatApi } from '../../../modeles/resultat-api.model';

@Injectable({
  providedIn: 'root'
})
export class CanauxService {

  private api: string = 'http://localhost:8082/api/canal/';

  constructor(private http: HttpClient) { }

  public getCanauxInscrit(): Observable<Canal[]> {
    return this.http.get<Canal[]>(this.api, {withCredentials: true, params: {
      portee: 'inscrit'}}
    );
  }

  public getCanauxDisponibles() : Observable<Canal[]> {
    return this.http.get<Canal[]>(this.api, {withCredentials: true, params: {
      portee: 'public'}}
    );
  }

  public getCanauxUtilisateur() : Observable<Canal[]> {
    return this.http.get<Canal[]>(this.api, {withCredentials: true, params: {
      portee: 'utilisateur'}}
    );
  }

  public ajouterCanal(nom: string, visibilite: string): Observable<ResultatApi> {
    return this.http.post<{id: string}>(this.api, {
      nom: nom,
      visibilite: visibilite
    }, {withCredentials: true})
    .pipe(map((infosCanal) => new ResultatApi(true, infosCanal.id)), catchError(({error}) => of(new ResultatApi(false, error.message))));
  }

  public modifierCanal(canal: string, nom: string, visibilite: string): Observable<ResultatApi> {
    return this.http.put(this.api, {
      nom: nom,
      visibilite: visibilite,
      canal: canal
    }, {withCredentials: true})
    .pipe(map(() => new ResultatApi(true)), catchError(({error}) => of(new ResultatApi(false, error.message))));
  }

  public supprimerCanal(canal: string): Observable<ResultatApi> {
    return this.http.delete(this.api, {
      body: {
        canal: canal
      },
      withCredentials: true
    })
    .pipe(map(() => new ResultatApi(true)), catchError(({error}) => of(new ResultatApi(false, error.message))));
  }

  public rejoindreCanal(canal: string): Observable<ResultatApi> {
    return this.http.post('http://localhost:8082/api/acces/rejoindre', {
      canal: canal
    }, { withCredentials: true })
    .pipe(map(() => new ResultatApi(true)), catchError((error) => of(new ResultatApi(false, error))));
  }
}
