import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';
import { Session } from '../../../modeles/session.model';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ResultatApi } from '../../../modeles/resultat-api.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private api: string = 'http://localhost:8081/api/auth/';
  private sessionActive: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public sessionActiveObserveur$: Observable<boolean> = this.sessionActive.asObservable();
  public informationsSession: (Session|null) = null;

  constructor(private http: HttpClient, private routeur: Router) { }

  public verifierSession(): Observable<boolean|null>{
    return this.http.get<Session>(
      `${this.api}connecte`,
      {withCredentials: true}
    )
    .pipe(
      map(reponse => {
        this.sessionActive.next(true);
        this.informationsSession = reponse;
        return true;}
      ),
      catchError(() => {
        this.sessionActive.next(false);
        return of(false)}
      )
    )

  }

  public connexion(email: string, motDePasse: string): Observable<ResultatApi> {
    return this.http.post<Session>(
      `${this.api}connexion`,
      {email: email, motdepasse: motDePasse},
      {withCredentials: true}
    )
    .pipe(
      map((reponse) => {
        this.sessionActive.next(true);
        this.informationsSession = reponse;
        return new ResultatApi(true);
      }),
      catchError(({error}) => of(new ResultatApi(false, error.message)))
    );
  }

  public inscription(email: string, motDePasse: string, pseudo: string): Observable<ResultatApi> {
    return this.http.post<Session>(
      `${this.api}inscription`,
      {email: email, motdepasse: motDePasse, pseudo: pseudo},
      {withCredentials: true}
    )
    .pipe(
      map((reponse) => {
        this.sessionActive.next(true);
        this.informationsSession = reponse;
        return new ResultatApi(true);
      }),
      catchError(({error}) => {
        return of(new ResultatApi(false, error.message));
      })
    );
  }

  public deconnexion(): Observable<boolean>{
    return this.http.post(
      `${this.api}deconnexion`,
      {},
      {withCredentials: true}
    )
    .pipe(
      map(() => {
        this.sessionActive.next(false);
        this.informationsSession = null;
        this.routeur.navigateByUrl('/');
        return true;
      }),
      catchError(() => {
        return of(false);
      })
    )
  }
}
