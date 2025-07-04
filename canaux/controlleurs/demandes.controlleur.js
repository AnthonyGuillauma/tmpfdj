/*
    Controlleur : Gestion des demandes d'accès
*/

import { Acces } from "../modeles/acces.modele.js";
import { Controlleur, ValeurVerification } from "./controlleur.js";
import { CODE_RETOUR as CODE } from "../configs/codes.js";
import { redisClient } from '../services/redis.service.js';


export class DemandesControlleur extends Controlleur {

    constructor(req, res) {
        super(req, res);
    }

    /**
     * Vérifie que la demande est bien fournie et valide dans la requête.
     * @returns {Number}
     */
    verificationDemande() {
        const valeurId = new ValeurVerification({ format: /^[a-f0-9]{24}$/ });
        return this.verifierChamps('demande', 'string', valeurId);
    }

    /**
     * Crée un demande d'accès pour un canal.
     * 
     * Codes :
     * 
     *      204 : Demande envoyée ;
     *      400 : Le corps de la requête n'existe pas ou ne contient pas de champs 'canal' ;
     *      409 : L'utilisateur a déjà fait une demande, a déjà été invité ou est déjà membre du canal ;
     *      422 : Le champs 'canal' ne contient pas une valeur utilisable.
     */
    async postDemande() {
        // Vérification des données
        if (!this.verifierRequete()) {
            return;
        }
        if (!this.verificationId()) {
            return;
        }

        // Récupération des données
        const email = this.getEmail();
        const canal = this.getChamps('canal');

        // Vérification du droit de faire une demande d'accès
        const informationsAccesCanal = await Acces.findOne(
            { canal: canal }).populate('canal');
        // Vérification que le canal existe
        if (!informationsAccesCanal) {
            return this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
                `Le canal n'existe pas.`
            )
        }
        // Vérification que le canal n'est pas public
        if (informationsAccesCanal.canal.visibilite === 'public') {
            return this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
                `Impossible de faire une demande d'accès sur un canal public.`
            );
        }
        // Vérification que l'utilisateur ne s'invite pas lui-même
        if (informationsAccesCanal.canal.proprietaire === email) {
            return this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
                `Vous êtes déjà le propriétaire de ce canal.`
            );
        }
        // Vérification que l'utilisateur n'est pas déjà membre ou autres
        const accesUtilisateur = informationsAccesCanal.acces
            .find(acces => acces.email === email);
        if (accesUtilisateur) {
            const statutAccesUtilisateur = accesUtilisateur.statut;
            let messageErreurAcces;
            if (statutAccesUtilisateur === 'demande') {
                messageErreurAcces = `L'utilisateur a déjà fait une demande d'accès sur ce canal.`;
            }
            else if (statutAccesUtilisateur === 'invite') {
                messageErreurAcces = `L'utilisateur a déjà été invité sur ce canal.`;
            }
            else {
                messageErreurAcces = `L'utilisateur est déjà membre du canal.`;
            }
            return this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
                messageErreurAcces
            );
        }

        // Ajout d'un demande d'accès
        await Acces.updateOne({ canal: canal },
            { $push: { acces: { email: email, statut: 'demande' } } }
        );
        this.envoyer(CODE.VALIDE.CREE);
    }

    async putAccepteDemande() {
        // Vérification des données
        if (!this.verifierRequete()) {
            return;
        }
        if (!this.verificationDemande()) {
            return;
        }

        // Récupération des données
        const email = this.getEmail();
        const demande = this.getChamps('demande');

        // Vérification de la demande
        const informationAcces = await Acces.findOne(
            { 'acces._id': demande }, { "acces.$": 1, canal: 1 }
        ).populate('canal');
        if (!informationAcces
            || informationAcces.acces[0].statut !== 'demande') {
            return this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
                `La demande d'accès n'existe pas.`
            );
        }

        // Vérification du droit d'acceptation de demande d'accès
        if (informationAcces.canal.proprietaire !== email) {
            return this.erreur(CODE.ERREUR_CLIENT.NON_AUTORISE,
                `Vous n'êtes pas le propriétaire de ce canal.`
            )
        }

        // Acceptation de la demande d'accès
        await Acces.updateOne(
            { 'acces._id': demande }, { $set: { 'acces.$.statut': 'membre' } }
        );

        // Avertit du nouvel acces
        redisClient.publish('canal', JSON.stringify({
            'type': 'acces-rejoint',
            'canal': informationAcces.canal._id,
            'utilisateur': email
        }));

        this.envoyer(CODE.VALIDE.MODIFIE);

    }
}