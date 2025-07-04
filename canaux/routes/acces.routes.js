/* 
    Routes : Accès
*/

import { Router } from 'express';
import { AccesControlleur } from '../controlleurs/acces.controlleur.js';
import { estConnecteMiddleware } from '../middlewares/connecte.middleware.js';
import { InvitationsControlleur } from '../controlleurs/invitations.controlleur.js';
import { DemandesControlleur } from '../controlleurs/demandes.controlleur.js';

export const accesRoutes = new Router();


accesRoutes.get('/', estConnecteMiddleware, (req, res) => {
    const controlleur = new AccesControlleur(req, res);
    controlleur.getAcces();
});

accesRoutes.delete('/', estConnecteMiddleware, (req, res) => {
    const controlleur = new AccesControlleur(req, res);
    controlleur.deleteAcces();
});

accesRoutes.post('/rejoindre', estConnecteMiddleware, (req, res) => {
    const controlleur = new AccesControlleur(req, res);
    controlleur.postRejoindreCanal();
});

accesRoutes.get('/autorise', (req, res) => {
    const controlleur = new AccesControlleur(req, res);
    controlleur.getEstAutoriseCanal();
});

accesRoutes.post('/invitation', estConnecteMiddleware, (req, res) => {
    const controlleur = new InvitationsControlleur(req, res);
    controlleur.postInvitation();
});

accesRoutes.put('/invitation', estConnecteMiddleware, (req, res) => {
    const controlleur = new InvitationsControlleur(req, res);
    controlleur.putAccepteInvitation();
});

accesRoutes.post('/demande', estConnecteMiddleware, (req, res) => {
    const controlleur = new DemandesControlleur(req, res);
    controlleur.postDemande();
});

accesRoutes.put('/demande', estConnecteMiddleware, (req, res) => {
    const controlleur = new DemandesControlleur(req, res);
    controlleur.putAccepteDemande();
});