import { Routes } from '@angular/router';
import { AccueilPageComponent } from './pages/accueil/accueil-page.component';
import { ConnexionPageComponent } from './pages/auth/connexion/connexion-page.component';
import { AuthRoutageService } from './services/routage/auth/auth-routage.service';
import { InscriptionPageComponent } from './pages/auth/inscription/inscription-page.component';
import { CanauxPageComponent } from './pages/canaux/canaux-page.component';
import { ChatPageComponent } from './pages/chat/chat-page.component';
import { ComptePageComponent } from './pages/compte/compte-page.component';
import { CanauxModificationPageComponent } from './pages/canaux/modification/canaux-modification-page.component';
import { CanauxAjoutPageComponent } from './pages/canaux/ajout/canaux-ajout-page.component';

export const routes: Routes = [
    {path: '', component: AccueilPageComponent},
    {path: 'compte', component: ComptePageComponent, canActivate: [AuthRoutageService]},
    {path: 'connexion', component: ConnexionPageComponent, canActivate: [AuthRoutageService], data: {connecte: false}},
    {path: 'inscription', component: InscriptionPageComponent, canActivate: [AuthRoutageService], data: {connecte: false}},
    {path: 'canaux', component: CanauxPageComponent, canActivate: [AuthRoutageService]},
    {path: 'canal/ajout', component: CanauxAjoutPageComponent, canActivate: [AuthRoutageService]},
    {path: 'canal/:id', component: ChatPageComponent, canActivate: [AuthRoutageService]},
    {path: 'canal/:id/modification', component: CanauxModificationPageComponent, canActivate: [AuthRoutageService]},
    {path: '**', redirectTo: ''}
];
