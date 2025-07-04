import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../apis/auth/auth.service';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthRoutageService implements CanActivate {

  constructor(private apiAuth: AuthService) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<GuardResult> {
    const doitEtreConnecte = route.data['connecte'] ?? true;
    return this.apiAuth.sessionActiveObserveur$.pipe(
      map(connecte => connecte == doitEtreConnecte)
    );
  }
}
