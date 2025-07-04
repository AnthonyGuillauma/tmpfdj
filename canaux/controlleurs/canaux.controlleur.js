/*
    Controlleur : Canaux
*/

import { CODE_RETOUR as CODE } from '../configs/codes.js';
import { Controlleur, ValeurVerification } from './controlleur.js';
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
import { Canal } from '../modeles/canaux.modele.js';
import { Acces } from '../modeles/acces.modele.js';
import { redisClient } from '../services/redis.service.js';

/**
 * Représente un controlleur pour la manipulation des informations élémentaires des canaux.
 */
export class CanauxControlleur extends Controlleur {

    constructor(req, res) {
        super(req, res);
    }

    /**
     * Vérifie que le nom du canal est bien fourni et valide dans la requête.
     * @param {boolean} obligatoire
     * @returns {Number}
     */
    verificationNom(obligatoire = true) {
        const valeurNom = new ValeurVerification({ tailleMinMax: { 'min': 1, 'max': 64 } });
        return this.verifierChamps('nom', 'string', valeurNom, obligatoire);
    }

    /**
     * Vérifie que la visibilité du canal est bien fourni et valide dans la requête.
     * @param {boolean} obligatoire
     * @returns {Number}
     */
    verificationVisibilite(obligatoire = true) {
        const valeurVisibilite = new ValeurVerification({ valeursPossibles: ['public', 'prive'] });
        return this.verifierChamps('visibilite', 'string', valeurVisibilite, obligatoire);
    }

    /**
     * Renvoie au client la liste des canaux accessible par ce dernier.
     * 
     * Dans la query de la requête, une portée doit être définie.
     * 
     * Portée :
     * 
     *      'public' : Les canaux de l'utilisateur ainsi que ceux qui sont publics ;
     *      'utilisateur' : Les canaux de l'utilisateur.
     *      'inscrit' : Les canaux dont fait parti l'utilisateur
     * 
     * Codes :
     * 
     *      200 : Renvoie les canaux ;
     *      400 : La query de la requête ne contient pas de champs 'portee' ;
     *      422 : La valeur du champs 'portee' ne contient pas 'public', 'utilisateur' ou 'inscrit'.
    */
    async getCanaux() {
        // Vérification des données
        if (!this.verifierRequete()) {
            return;
        }
        if (!this.verifierChamps('portee', 'string',
            new ValeurVerification({ valeursPossibles: ['public', 'utilisateur', 'inscrit'] }))) {
            return;
        }

        // Récupération des données
        const email = this.getEmail();
        const portee = this.getParametre('portee');

        // Récupération des canaux
        let canaux;
        // Portée : Public
        if (portee === 'public') {
            let canauxMembre = await Promise.all([
                Canal.find({ proprietaire: email }).select('_id'),
                Acces.find({ 'acces.email': email }).select('canal')
            ]);
            canauxMembre = [
                ...canauxMembre[0].map(c => c._id),
                ...canauxMembre[1].map(a => a.canal)
            ];
            canaux = await Canal.find({
                _id: { $nin: canauxMembre }
            });
            // Mise en forme des informations
            canaux = canaux.map(infoCanal => ({
                'id': infoCanal._id,
                'nom': infoCanal.nom,
                'proprietaire': infoCanal.proprietaire,
                'visibilite': infoCanal.visibilite
            }));
        }
        // Portée : Inscrit
        else if (portee === 'inscrit') {
            // Canaux dont l'utilisateur est le propriétaire
            canaux = await Canal.find({ proprietaire: email });
            // Canaux dont l'utilisateur est membre ou propriétaire
            canaux = await Acces.find({
                $or: [
                    { 'acces.email': email, 'acces.statut': 'membre' },
                    { 'canal': { $in: canaux.map(canal => canal._id) } }
                ]
            }).populate('canal');
            // Mise en forme des informations
            canaux = canaux.map(infoCanal => ({
                'id': infoCanal.canal._id,
                'nom': infoCanal.canal.nom,
                'proprietaire': infoCanal.canal.proprietaire,
                'visibilite': infoCanal.canal.visibilite
            }));
        }
        // Portée : Utilisateur
        else {
            canaux = await Canal.find({ proprietaire: email });
        }

        this.envoyer(CODE.VALIDE.OK, canaux);
    }

    /**
     * Créer un nouveau canal.
     * 
     * Codes :
     * 
     *      201 : Le canal a été crée. ;
     *      400 : Le corps de la requête ne contient pas de champs 'nom' ou 'visibilite';
     *      409 : Un canal avec ce nom existe déjà ou le nombre de canal maximum de cet utilisateur est dépassée ;
     *      422 : Les types ou valeurs des champs ne sont pas conformes.
    */
    async postCanal() {

        // Vérification des données
        if (!this.verifierRequete()) {
            return;
        }
        if (!(this.verificationNom()
            && this.verificationVisibilite())) {
            return;
        }

        // Récupération des données
        const proprietaire = this.getEmail();
        const nom = this.getChamps('nom');
        const visibilite = this.getChamps('visibilite');

        // Vérification du droit d'ajout
        const canauxUtilisateur = await Canal.find({ proprietaire: proprietaire });
        if (canauxUtilisateur.length >= 4) {
            return this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
                'Vous avez dépassez le nombre maximum de canaux créable par un utilisateur.');
        }
        for (const canal of canauxUtilisateur) {
            if (canal.nom === nom) {
                return this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
                    'Vous possédez déjà un canal avec ce nom.'
                );
            }
        }

        // Création d'un nouveau canal
        const nouveauCanal = new Canal({
            proprietaire: proprietaire,
            nom: nom,
            visibilite: visibilite
        });
        await nouveauCanal.save();
        const nouveauAcces = new Acces({
            canal: nouveauCanal._id,
            acces: []
        });
        await nouveauAcces.save();

        // Averti de la création d'un nouveau canal
        redisClient.publish('canal', JSON.stringify({
            'type': 'nouveau',
            'canal': nouveauCanal._id,
            'proprietaire': this.getId()
        }));

        this.envoyer(CODE.VALIDE.CREE, {
            id: nouveauCanal._id
        });
    }

    /**
     * Met à jour les informations d'un canal.
     * 
     * L'utilisateur peut choisir de modifier le nom ou la visibilité
     * du canal, chacune étant optionnelle mais au moins une modification doit être présente.
     * 
     * Codes :
     * 
     *      204 : Le canal a été mis à jour. ;
     *      400 : Le corps de la requête ne contient pas de champs 'canal' et au minimum un champs 'nom' ou 'visibilite';
     *      403 : L'utilisateur n'est pas le propriétaire du canal ;
     *      409 : Un canal de l'utilisateur avec ce nom existe déjà ;
     *      422 : Les types ou valeurs des champs ne sont pas conformes.
    */
    async putCanal() {

        // Vérification des données
        if (!this.verifierRequete()) {
            return;
        }
        if (!(this.verificationNom(false)
            && this.verificationVisibilite(false)
            && this.verificationId())) {
            return;
        }

        // Récupération des données
        const canal = this.getChamps('canal');
        const nom = this.getChamps('nom');
        const visibilite = this.getChamps('visibilite');

        // Récupération des champs que l'utilisateur veut modifier
        const champsAModifier = {};
        if (nom !== undefined) {
            champsAModifier.nom = nom;
        }
        if (visibilite !== undefined) {
            champsAModifier.visibilite = visibilite;
        }

        // Vérification du nombre de modifications demandées
        if (Object.keys(champsAModifier).length === 0) {
            return this.erreur(CODE.ERREUR_CLIENT.REQUETE_MAUVAISE,
                `La requête ne contient aucune modification à effectuée.`
            );
        }

        // Vérification du droit de modification
        if (! await this.verifierDroitCanal(canal)) {
            return;
        }

        //Modification du canal
        await Canal.updateOne(
            { _id: new ObjectId(canal) },
            { $set: champsAModifier }
        );
        this.envoyer(CODE.VALIDE.MODIFIE);
    }

    /**
     * Supprime un canal.
     * 
     * Codes :
     * 
     *      204 : Le canal a été supprimé. ;
     *      400 : Le corps de la requête ne contient pas au minimum un champs 'canal';
     *      403 : L'utilisateur n'est pas le propriétaire du canal ;
     *      409 : Le canal n'existe pas ;
     *      422 : Le format du champs 'canal' n'est pas conforme.
    */
    async deleteCanal() {

        // Vérification des données
        if (!this.verifierRequete()) {
            return;
        }
        if (!this.verificationId()) {
            return;
        }

        // Récupération des données
        const canal = this.getChamps('canal');

        // Vérification du droit de suppression
        if (! await this.verifierDroitCanal(canal)) {
            return;
        }

        //Suppression du canal
        await Canal.findByIdAndDelete(canal);
        await Acces.deleteOne({ canal: new ObjectId(canal) });

        // Averti de la suppression d'un canal
        redisClient.publish('canal', JSON.stringify({
            'type': 'supprime',
            'canal': canal
        }));

        this.envoyer(CODE.VALIDE.SUPPRIME);
    }
}