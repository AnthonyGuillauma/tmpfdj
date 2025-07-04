/*
    Middleware : Vérification de la connexion
*/

import axios from "axios";
import { CODE_RETOUR as CODE } from "../configs/codes.js";


/**
 * Vérifie que l'utilisateur est connecté.
 * @param {Request} req 
 * @param {Response} res 
 * @param {*} next 
 * @returns {void}
 */
export async function estConnecteMiddleware(req, res, next){
    // Vérifie que le cookie de session existe
    const sessionUtilisateur = req.cookies['sid'];
    if (!sessionUtilisateur){
        return res.status(CODE.ERREUR_CLIENT.NON_CONNECTE).json({message: 'Identification invalide.'});
    }
    // Vérifie que le cookie de session est valide
    else{
        // Demande au microservice d'authentification
        await axios.get(`${process.env['DOMAINE_AUTH']}/interne/auth/session`,
            {
                headers: {
                    Authorization: `Bearer ${process.env['CLE_AUTH']}`,
                    Cookie: `sid=${sessionUtilisateur}`
                }
            })
        // Récupération
        .then(reponse => {
            req.utilisateur = { email: reponse.data.email, id: reponse.data.id };
            next();
        })
        // Gestion des erreurs lors de la communication
        .catch(() => {
            res.status(CODE.ERREUR_SERVEUR.ERREUR_INTERNE).json({ message: `Erreur dans l'authentification.`});
        });
    }
};