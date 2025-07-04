/*
    Controlleur : Accès
*/

import { Controlleur, ValeurVerification } from './controlleur.js';
import { CODE_RETOUR as CODE } from '../configs/codes.js';
import mongoose from 'mongoose';
import { Acces } from '../modeles/acces.modele.js';
import { redisClient } from '../services/redis.service.js';

const { ObjectId } = mongoose.Types;

/**
 * Représente un controlleur pour la manipulation des droits d'accès sur les canaux.
 */
export class AccesControlleur extends Controlleur {

    constructor(req, res) {
        super(req, res);
    }

    /**
     * Retourne la liste des accès d'un canal.
     * 
     * Codes :
     * 
     *      200 : Renvoie les accès ;
     *      400 : La query de la requête n'existe pas ou ne contient pas de champs 'canal' ;
     *      409 : Le canal n'existe pas ;
     *      422 : Le champs 'canal' ne contient pas une valeur utilisable.
     */
    async getAcces() {
        // Vérification des données
        if (!this.verifierRequete()) {
            return;
        }
        if (!this.verificationId()) {
            return;
        }

        // Récupération des données
        const canal = this.getParametre('canal');

        // Vérification du droit de récupération
        if (! await this.verifierDroitCanal(canal)) {
            return;
        }

        // Récupération des accès
        const accesCanal = await Acces.findOne({ canal: new ObjectId(canal) });
        if (accesCanal) {
            if (accesCanal.acces.length > 0) {
                return this.envoyer(CODE.VALIDE.OK, { acces: accesCanal.acces });
            }
        }
        this.envoyer(CODE.VALIDE.OK, { acces: [] });
    }

    /**
     * Supprime l'accès, une demande d'accès ou une invitation d'un canal.
     * 
     * Codes :
     * 
     *      204 : L'accès a été supprimé ;
     *      400 : Le corps de la requête n'existe pas ou ne contient pas de champs 'canal' ou 'utilisateur' ;
     *      409 : Le canal n'existe pas ou l'utilisateur n'a déjà aucun accès sur ce canal ;
     *      422 : Le champs 'canal' ou 'utilisateur' ne contient pas une valeur utilisable.
     */
    async deleteAcces() {
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

        // Vérification du droit de suppression
        if (! await this.verifierDroitCanal(canal)) {
            return;
        }

        // Récupération des accès
        const accesCanal = await Acces.findOne({ canal: new ObjectId(canal) });
        if (accesCanal) {
            for (const acces of accesCanal.acces) {
                if (acces.email === utilisateurCible) {
                    // Supprime l'acces
                    await Acces.updateOne({ canal: canal },
                        { $pull: { acces: { email: utilisateurCible } } });
                    if (acces.statut === 'membre') {
                        // Avertit de la suppression si il était membre
                        redisClient.publish('canal', JSON.stringify({
                            'type': 'acces-supprime',
                            'canal': canal,
                            'utilisateur': acces.email
                        }));
                    }
                    return this.envoyer(CODE.VALIDE.SUPPRIME);
                }
            }
        }
        this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
            `L'utilisateur n'a pas d'accès, demande d'accès ou d'invitation sur ce canal.`
        );
    }

    async getEstAutoriseCanal() {
        // Vérification des données
        if (!this.verifierRequete()) {
            return;
        }
        if (!(this.verificationId()
            && this.verifierChamps('utilisateur', 'string',
                new ValeurVerification({ format: /^.+@.+\..+$/ })))) {
            return;
        }

        // Récupération des données
        const utilisateur = this.getParametre('utilisateur');
        const canal = this.getParametre('canal');

        // Vérification que le canal existe
        const informationsCanal = await Acces.findOne({ canal: canal })
            .populate('canal');
        if (!informationsCanal) {
            return this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
                `Le canal n'existe pas.`
            );
        }

        // Vérification si l'utilisateur est membre du canal
        const accesUtilisateur = informationsCanal.acces
            .find(acces => acces.email === utilisateur);
        if (!accesUtilisateur
            || accesUtilisateur.statut !== 'membre') {
            return this.erreur(CODE.ERREUR_CLIENT.NON_AUTORISE,
                `L'utilisateur n'a pas rejoint ce canal.`
            );
        }

        this.envoyer(CODE.VALIDE.OK);
    }

    async postRejoindreCanal() {
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

        // Vérification du droit de rejoindre le canal
        const informationsCanal = await Acces.findOne({ canal: canal })
            .populate('canal');

        if (informationsCanal.canal.visibilite !== 'public') {
            return this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
                `Impossible de rejoindre un canal privé sans autorisation.`
            );
        }
        if (informationsCanal.canal.proprietaire === email) {
            return this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
                `Vous êtes le propriétaire du canal.`
            )
        }
        const accesCanalUtilisateur = informationsCanal.acces.find(acces => acces.email === email);
        if (accesCanalUtilisateur) {
            return this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
                `Vous êtes déjà membre du canal.`
            )
        }

        // Ajout de l'utilisateur comme membre du canal
        await Acces.updateOne(
            { canal: canal },
            { $push: { acces: { email: email, statut: 'membre' } } }
        );

        // Averti qu'un utilisateur a rejoint ce canal
        redisClient.publish('canal', JSON.stringify({
            'type': 'acces-rejoint',
            'canal': canal,
            'utilisateur': this.getId()
        }));

        this.envoyer(CODE.VALIDE.MODIFIE);
    }

}