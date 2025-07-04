/*
    Routes : Internes
*/

import { Router } from 'express';
import { estMicroservice } from '../middlewares/microservice.middleware.js';
import { InterneControlleur } from '../controlleurs/interne.controlleur.js';


export const internesRoutes = new Router();

internesRoutes.get('/auth/session', estMicroservice, (req, res) => {
    const controlleur = new InterneControlleur(req, res);
    controlleur.getSessionValide();
});