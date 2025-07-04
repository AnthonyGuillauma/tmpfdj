/*
    Controlleur : Gestion des actions entre microservices
*/

import { Controlleur, ValeurVerification } from './controlleur.js';
import { CODE_RETOUR as CODE } from '../configs/codes.js';

/**
 * Représente un controlleur pour la gestion des informations avec un microservice
 */
export class InterneControlleur extends Controlleur {

    constructor(req, res) {
        super(req, res);
    }

    /**
     * Indique si le cookie de session est valide ou non.
     */
    getSessionValide() {
        // Vérification des données
        if (!this.verifierRequete()) {
            return;
        }
        if (!this.req.session
            || !this.req.session.email){
            return this.erreur(CODE.ERREUR_CLIENT.NON_CONNECTE,
                `Aucune session avec ce cookie.`
            );
        }
        this.envoyer(CODE.VALIDE.OK, {
            id: this.req.session.idUtilisateur,
            email: this.req.session.email
        });
    }
}