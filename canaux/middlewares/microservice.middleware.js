/*
    Middleware : Vérification du microservice
*/

import jsonwebtoken from 'jsonwebtoken';
import { CODE_RETOUR } from '../configs/codes.js';


/**
 * Vérifie que le client est bien un microservice de l'application.
 * @param {Request} req 
 * @param {Response} res 
 * @param {*} next 
 */
export function estMicroservice(req, res, next){
    
    // Récupération de l'en-tête du token
    const enteteToken = req.headers['authorization'];
    if (!enteteToken) {
        return res.status(CODE_RETOUR.ERREUR_CLIENT.NON_CONNECTE).send(
            `Aucun token d'authentification fourni.`
        );
    }

    // Récupération du token
    const token = enteteToken.split(' ')[1];
    if (!token) {
        return res.status(CODE_RETOUR.ERREUR_CLIENT.NON_CONNECTE).send(
            `Le format du token n'est pas valide.`
        );
    }
    // Analyse du token
    try {
        const tokenDecode = jsonwebtoken.verify(token, process.env['CLE_SERVICE']);
        if (tokenDecode.scope !== 'interne') {
            return res.status(CODE_RETOUR.ERREUR_CLIENT.NON_AUTORISE).send(
                `Le token est invalide.`
            );
        }
        next();
    }
    catch {
        return res.status(CODE_RETOUR.ERREUR_CLIENT.NON_AUTORISE).send(
            `Le token est invalide.`
        );
    }
};