/*
    Controlleur : Authentification
*/

import { compare } from "bcrypt";
import { Controlleur, ValeurVerification } from "./controlleur.js";
import { CODE_RETOUR as CODE } from "../configs/codes.js";
import { Utilisateur } from '../modeles/utilisateur.modele.js';


/**
 * Représente un controlleur pour la gestion des authentifications.
 */
export class AuthentificationsControlleur extends Controlleur {

    constructor(req, res) {
        super(req, res);
    }

    /**
     * Vérifie que l'email passé par le client existe et possède un format correct.
     * @returns {Number}
     */
    verificationEmail() {
        const valeurEmail = new ValeurVerification({ format: /^.+@.+\..+$/ });
        return this.verifierChamps('email', 'string', valeurEmail);
    }

    /**
     * Vérifie que le mot de passe passé par le client existe et possède un format correct.
     * @returns {Number}
     */
    verificationMotDePasse() {
        const valeurMotDePasse = new ValeurVerification({ tailleMinMax: { min: 8, max: 100 } });
        return this.verifierChamps('motdepasse', 'string', valeurMotDePasse);
    }

    /**
     * Vérifie que le pseudo passé par le client existe et possède un format correct.
     * @returns {Number}
     */
    verificationPseudo() {
        const valeurPseudo = new ValeurVerification({ tailleMinMax: { min: 2, max: 64 } });
        return this.verifierChamps('pseudo', 'string', valeurPseudo);
    }

    /**
     * Met à jour la session courante.
     * @param {string} id
     * @param {string} email 
     * @param {string} pseudo 
     */
    majSession(id, email, pseudo) {
        this.req.session.idUtilisateur = id;
        this.req.session.email = email;
        this.req.session.pseudo = pseudo;
    }

    /**
     * Indique au client s'il est connecté.
     * 
     * Utilisé lors de l'ouverture du site internet pour initialiser la page.
     * 
     * Codes:
     *      200 : L'utilisateur est connecté ;
     *      401 : L'utilisateur n'est pas connecté.
     */
    async getEstConnecte() {
        // Récupération des données
        const email = this.getEmail();

        // Vérifie si une session est active
        if (!email) {
            this.envoyer(CODE.ERREUR_CLIENT.NON_CONNECTE);
        }
        else {
            this.envoyer(CODE.VALIDE.OK, {
                email: email,
                pseudo: this.req.session.pseudo
            });
        }
    }

    /**
     * Inscrit un nouvel utilisateur.
     * 
     * Codes:
     *      201 : Inscription réussie ;
     *      400 : Les champs 'email', 'pseudo' et 'motdepasse' ne sont pas tous présents ;
     *      409 : Un compte avec cet email existe déjà.
     *      422 : La valeur des champs est invalide.
     */
    async postInscription() {
        // Vérification des données
        if (!this.verifierRequete()) {
            return;
        }
        if (!(this.verificationEmail()
            && this.verificationMotDePasse()
            && this.verificationPseudo())) {
            return;
        }

        // Récupération des données
        const email = this.req.body.email;
        const pseudo = this.req.body.pseudo;
        const motdepasse = this.req.body.motdepasse;

        //Vérification que l'utilisateur n'existe pas déjà
        const utilisateurExiste = await Utilisateur.findOne({ email: email }).countDocuments() > 0;
        if (utilisateurExiste) {
            return this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
                `Un compte avec cette adresse mail existe déjà.`
            );
        }

        // Inscription de l'utilisateur
        const nouvelUtilisateur = new Utilisateur({ email: email, pseudo: pseudo, mot_de_passe: motdepasse });
        nouvelUtilisateur.save();

        // Connexion de l'utilisateur
        this.majSession(nouvelUtilisateur._id, email, pseudo);
        this.envoyer(CODE.VALIDE.CREE, {
            email: email, pseudo: pseudo
        });
    }

    /**
     * Connecte un utilisateur.
     * 
     * Codes:
     *      200 : Connexion réussie ;
     *      400 : Les champs 'email' et 'motdepasse' ne sont pas tous présents ;
     *      409 : Le compte n'existe pas ou le mot de passe est invalide.
     *      422 : La valeur des champs est invalide.
     */
    async postConnexion() {
        // Vérification des données
        if (!this.verifierRequete()) {
            return;
        }
        if (!(this.verificationEmail()
            && this.verificationMotDePasse())) {
            return;
        }

        // Récupération des données
        const email = this.req.body.email;
        const motdepasse = this.req.body.motdepasse;

        // Vérification de la connexion
        const compte = await Utilisateur.findOne({ email: email }).select('+mot_de_passe');
        // Vérification que le compte existe
        if (!compte) {
            return this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
                `Le compte n'existe pas.`
            );
        }
        // Vérification du mot de passe
        const motDePasseValide = await compare(motdepasse, compte.mot_de_passe);
        if (!motDePasseValide) {
            return this.erreur(CODE.ERREUR_CLIENT.CONFLIT_SERVEUR,
                `Le mot de passe est invalide.`
            );
        }

        // Sauvegarde de sa dernière connexion
        await Utilisateur.updateOne({ email: email },
            { derniere_connexion: Date.now() }
        );

        // Connexion de l'utilisateur
        const pseudo = compte.pseudo;
        this.majSession(compte._id, email, pseudo);
        this.envoyer(CODE.VALIDE.OK, {
            email: email, pseudo: pseudo
        });
    }

    /**
     * Déconnecte un utilisateur.
     * 
     * Codes:
     *      204 : Déconnexion réussie ;
     *      500 : Echec lors de la tentative de déconnexion.
     */
    async postDeconnexion() {
        // Destruction de la session
        this.req.session.destroy((err) => {
            if (err) {
                return this.erreur(CODE.ERREUR_SERVEUR.ERREUR_INTERNE,
                    `Erreur interne lors de la tentative de déconnexion.`
                );
            }
            this.envoyer(CODE.VALIDE.SUPPRIME);
        });
    }

}