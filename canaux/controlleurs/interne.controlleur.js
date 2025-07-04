/*
    Controlleur : Gestion des actions entre microservices
*/

import { Controlleur, ValeurVerification } from './controlleur.js';
import { CODE_RETOUR as CODE } from '../configs/codes.js';
import { Canal } from '../modeles/canaux.modele.js';
import { Acces } from '../modeles/acces.modele.js';

/**
 * Représente un controlleur pour la gestion des informations avec un microservice
 */
export class InterneControlleur extends Controlleur {

    constructor(req, res) {
        super(req, res);
    }

    /**
     * Fournit les canaux où l'utilisateur est inscrit.
     */
    async recupererCanaux() {
        // Vérification des données
        if (!this.verifierRequete()) {
            return;
        }
        if (!this.verifierChamps('utilisateur', 'string', new ValeurVerification({}))) {
            return;
        }

        // Récupération des données
        const utilisateur = this.req.body.utilisateur;
        // Canaux dont l'utilisateur est le propriétaire
        let canaux = await Canal.find({ proprietaire: utilisateur });
        // Canaux dont l'utilisateur est membre ou propriétaire
        canaux = await Acces.find({
            $or: [
                { 'acces.email': utilisateur, 'acces.statut': 'membre' },
                { 'canal': { $in: canaux.map(canal => canal._id) } }
            ]
        }).populate('canal');
        // Mise en forme des informations
        canaux = canaux.map(infoCanal => ({
            'id': infoCanal.canal._id
        }));
        this.envoyer(CODE.VALIDE.OK, canaux);
    }
}