/*
    Routes : Authentifications
*/

import { Router } from "express";
import { estConnecte } from "../middlewares/connecte.middleware.js";
import { estDeconnecte } from '../middlewares/deconnecte.middleware.js';
import { AuthentificationsControlleur } from "../controlleurs/authentifications.controlleur.js";


export const authsRoutes = new Router();

authsRoutes.get('/connecte', (req, res) => {
    const controlleur = new AuthentificationsControlleur(req, res);
    controlleur.getEstConnecte();
});

authsRoutes.post('/inscription', estDeconnecte, (req, res) => {
    const controlleur = new AuthentificationsControlleur(req, res);
    controlleur.postInscription();
});

authsRoutes.post('/connexion', estDeconnecte, (req, res) => {
    const controlleur = new AuthentificationsControlleur(req, res);
    controlleur.postConnexion();
});

authsRoutes.post('/deconnexion', estConnecte, (req, res) => {
    const controlleur = new AuthentificationsControlleur(req, res);
    controlleur.postDeconnexion();
});