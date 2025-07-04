/*
    Middleware : Vérification de la connexion
*/

import { CODE_RETOUR } from '../configs/codes.js';


/**
 * Vérifie que le client est bien connecté.
 * @param {Request} req 
 * @param {Response} res 
 * @param {*} next 
 */
export function estConnecte(req, res, next){
    if (!req.session.email){
        return res.status(CODE_RETOUR.ERREUR_CLIENT.NON_CONNECTE).json({message: 'Identification invalide.'});
    }
    next();
};