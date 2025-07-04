/*
    Controlleur : Gestion des invitations
*/

import { Acces } from "../modeles/acces.modele.js";
import { Controlleur, ValeurVerification } from "./controlleur.js";
import { CODE_RETOUR as CODE } from "../configs/codes.js";
import { redisClient } from '../services/redis.service.js';


export class InvitationsControlleur extends Controlleur {

    constructor(req, res) {
        super(req, res);
    }

    /**
     * Vérifie que l'invitation est bien fournie et valide dans la requête.
     * @returns {Number}
     */
    verificationInvitation() {
        const valeurId = new ValeurVerification({ format: /^[a-f0-9]{24}$/ });
        return this.verifierChamps('invitation', 'string', valeurId);
    }

    /**
     * Créer une invitation pour qu'un utilisateur puisse rejoindre un canal privé.
     * 
     * Codes :
     * 
     *      204 : Invitation créee ;
     *      400 : Le corps de la requête n'existe pas ou ne contient pas de champs 'canal' ou 'utilisateur' ;
     *      409 : Le canal n'existe pas, le canal est public ou l'utilisateur a déjà accès au canal ;
     *      422 : Le champs 'canal' ou 'utilisateur' ne contient pas une valeur utilisable.
     */
    async postInvitation() {
        // Vérification des données
        if (!this.verifierRequete()) {
            return;
        }
        if (!(this.verificationId() && this.verificationEmailCible())) {
            return;
        }

        // Récupération des données
        const canal = this.getChamps('canal');
        const utilisateurCible = this.getChamps('utilisateur');

        // Vérification du droit d'invitation
        if (! await this.verifierDroitCanal(canal)) {
            return;
        }

        // Vérification de l'invitation
        const informationsAccesCanal = await Acces.findOne({ canal: canal }).populate('canal');
        // Vérification que le canal n'est pas public
        if (informationsAccesCanal.canal.visibilite === 'public') {
            return this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
                `Impossible de faire une invitation pour un canal public.`
            );
        }
        // Vérification que l'utilisateur n'est pas déjà membre ou invité
        const accesUtilisateurCible = informationsAccesCanal.acces
            .find(acces => acces.email === utilisateurCible);
        if (accesUtilisateurCible !== undefined) {
            const statutAcces = accesUtilisateurCible.statut;
            let messageErreurAcces;
            if (statutAcces === 'demande') {
                messageErreurAcces = `L'utilisateur a déjà fait une demande d'accès sur ce canal.`;
            }
            else if (statutAcces === 'invite') {
                messageErreurAcces = `L'utilisateur a déjà été invité sur ce canal.`;
            }
            else {
                messageErreurAcces = `L'utilisateur est déjà membre du canal.`;
            }
            return this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
                messageErreurAcces
            );
        }

        // Utilisateur existe

        // Invitation de l'utilisateur
        await Acces.updateOne({ canal: canal },
            { $push: { acces: { email: utilisateurCible, statut: 'invite' } } }
        );
        this.envoyer(CODE.VALIDE.CREE);
    }

    /**
     * Accepte une invitation pour devenir membre d'un canal.
     * 
     * Codes :
     * 
     *      204 : Invitation acceptée ;
     *      400 : Le corps de la requête n'existe pas ou ne contient pas de champs 'invitation' ;
     *      409 : L'invitation n'existe pas ;
     *      422 : Le champs 'invitation' ne contient pas une valeur utilisable.
     */
    async putAccepteInvitation() {
        // Vérification des données
        if (!this.verifierRequete()) {
            return;
        }
        if (!this.verificationInvitation()){
            return;
        }

        // Récupération des données
        const email = this.getEmail();
        const invitation = this.getChamps('invitation');

        // Vérification de l'invitation
        const informationAcces = await Acces.findOne(
            { 'acces._id': invitation }, { "acces.$": 1 }
        ).populate('canal');
        if (!informationAcces 
            || informationAcces.acces[0].statut !== 'invite'
            || informationAcces.acces[0].email !== email) {
            return this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
                `L'invitation n'existe pas.`
            );
        }

        // Acceptation de l'invitation
        await Acces.updateOne(
            { 'acces._id': invitation }, { $set: { 'acces.$.statut': 'membre'}}
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