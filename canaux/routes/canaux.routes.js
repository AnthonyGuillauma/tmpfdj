/*
    Routes : Canaux
*/

import { Router } from 'express';
import { CanauxControlleur } from '../controlleurs/canaux.controlleur.js';
import { estConnecteMiddleware } from '../middlewares/connecte.middleware.js';


export const canauxRoutes = new Router();

// GET 'api/canal' -> Lister canaux
canauxRoutes.get('/', estConnecteMiddleware, (req, res) => {
    const controlleur = new CanauxControlleur(req, res);
    controlleur.getCanaux(req, res);
});

// POST 'api/canal' -> Ajouter canal
canauxRoutes.post('/', estConnecteMiddleware, (req, res) => {
    const controlleur = new CanauxControlleur(req, res);
    controlleur.postCanal(req, res);
});

// PUT 'api/canal' -> Modifier canal
canauxRoutes.put('/', estConnecteMiddleware, (req, res) => {
    const controlleur = new CanauxControlleur(req, res);
    controlleur.putCanal(req, res);
});

// DELETE 'api/canal' -> Supprimer canal
canauxRoutes.delete('/', estConnecteMiddleware, (req, res) => {
    const controlleur = new CanauxControlleur(req, res);
    controlleur.deleteCanal(req, res);
});
