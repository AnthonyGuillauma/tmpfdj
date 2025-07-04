/*
    Middleware : Vérification de la déconnexion
*/

import { CODE_RETOUR } from "../configs/codes.js";


/**
 * Vérifie que le client est bien déconnecté.
 * @param {Request} req 
 * @param {Response} res 
 * @param {*} next 
 */
export function estDeconnecte(req, res, next){
    if (req.session.email){
        return res.status(CODE_RETOUR.ERREUR_CLIENT.NON_AUTORISE).json({message: "Déjà connecté."})
    }
    next();
}