/*
    Controlleur : Méthodes globales
*/

import { CODE_RETOUR } from '../configs/codes.js';
import { Canal } from '../modeles/canaux.modele.js';

const CODE_ERREURS = CODE_RETOUR.ERREUR_CLIENT;

/**
 * Représente les méthodes globales pour les controlleurs.
*/
export class Controlleur {

    req;
    res;
    methode;

    CHAMPS_NON_VALIDE = 0;
    CHAMPS_VALIDE = 1;
    CHAMPS_NON_TROUVEE = 2;

    /**
     * Initialise un controlleur.
     * @param {Request} req 
     * @param {Response} res 
     */
    constructor(req, res) {
        this.req = req;
        this.res = res;
        this.methode = req.method;
    }

    /**
     * Vérifie que le format de la requête est valide.
     * @returns {boolean}
     */
    verifierRequete() {
        // Méthode GET
        if (this.methode === 'GET') {
            // Vérification que des paramètres dans la requête sont définis
            if (this.req.query === undefined) {
                this.erreur(CODE_ERREURS.REQUETE_MAUVAISE,
                    `Aucun paramètre dans l'URL fourni.`
                );
                return false;
            }
        }
        // Autres méthodes
        else {
            // Vérification que un corps dans la requête est défini
            if (this.req.body === undefined) {
                this.erreur(CODE_ERREURS.REQUETE_MAUVAISE,
                    `Aucun champs dans le corps fourni.`
                );
                return false;
            }
        }
        return true;
    }

    /**
     * Vérifie la validité d'un champs.
     * @param {string} nom Nom du champs
     * @param {string} type Type du champs
     * @param {ValeurVerification} valeur Règles de la valeur
     * @param {boolean} obligatoire Le champs est obligatoire ?
     * @returns {Number} 0 si non valide, 1 si valide, 2 si non trouvé mais optionnel.
     */
    verifierChamps(nom, type, valeur, obligatoire = true) {
        // Conteneur du champs
        const conteneurChamps = this.methode === 'GET' ? this.req.query : this.req.body;

        // Vérification de son existance
        if (!Object.hasOwn(conteneurChamps, nom)) {
            if (!obligatoire) {
                return this.CHAMPS_NON_TROUVEE;
            }
            this.erreur(CODE_ERREURS.REQUETE_MAUVAISE, `Le champs ${nom} n'a pas été fourni.`);
            return this.CHAMPS_NON_VALIDE;
        }

        // Vérification de son type
        if (typeof (conteneurChamps[nom]) !== type) {
            this.erreur(CODE_ERREURS.CHAMPS_NON_VALIDE, `Le champs ${nom} doit être de type ${type}.`);
            return this.CHAMPS_NON_VALIDE;
        }

        // Vérification de sa valeur
        const verificationValeur = valeur.verifier(nom, conteneurChamps[nom]);
        if (verificationValeur !== true) {
            this.erreur(CODE_ERREURS.CHAMPS_NON_VALIDE, verificationValeur);
            return this.CHAMPS_NON_VALIDE;
        }
        return this.CHAMPS_VALIDE;
    }

    /**
     * Vérifie que l'ID du canal est bien fourni et valide dans la requête.
     * @returns {Number}
     */
    verificationId() {
        const valeurId = new ValeurVerification({ format: /^[a-f0-9]{24}$/ });
        return this.verifierChamps('canal', 'string', valeurId);
    }

    /**
     * Vérifie si l'email de l'utilisateur dont l'accès va être vérifié ou modifié est valide.
     * @returns {Number}
     */
    verificationEmailCible() {
        if (this.getEmail() === this.getChamps('utilisateur')) {
            this.erreur(CODE.ERREUR_CLIENT.CHAMPS_NON_VALIDE,
                `Vous ne pouvez pas modifier votre propre accès.`
            )
            return 0;
        }
        const valeurEmail = new ValeurVerification({ format: /^.+@.+\..+$/ });
        return this.verifierChamps('utilisateur', 'string', valeurEmail);
    }

    /**
     * Vérifie que l'utilisateur a le droit de récupérer des informations ou modifier un canal.
     * @param {string} canal L'identifiant du canal.
     * @returns {boolean} True s'il a le droit, false sinon.
     */
    async verifierDroitCanal(canal) {
        // Vérification du droit de suppression
        const informationsCanal = await Canal.findById(canal);
        if (!informationsCanal) {
            this.erreur(CODE_ERREURS.CONFLIT_SERVEUR,
                `Le canal n'existe pas.`
            );
            return false;
        }
        if (informationsCanal.proprietaire !== this.getEmail()) {
            this.erreur(CODE_ERREURS.NON_AUTORISE,
                `Vous n'êtes pas le propriétaire de ce canal.`
            );
            return false;
        }
        return true;
    }

    /**
     * Retourne le paramètre d'un requête GET.
     * @param {string} parametre Le nom du paramètre.
     * @returns {string | undefined} La valeur du paramètre.
     */
    getParametre(parametre) {
        return this.req.query[parametre];
    }

    /**
     * Retourne le champs d'un requête avec un corps.
     * @param {string} champs Le nom du champs.
     * @returns {string | undefined} La valeur du champs.
     */
    getChamps(champs) {
        return this.req.body[champs];
    }

    /**
     * Retourne l'ID de l'utilisateur connecté.
     * @returns {string} L'ID de l'utilisateur.
     */
    getId() {
        return this.req.utilisateur.id;
    }

    /**
     * Retourne l'email de l'utilisateur connecté.
     * @returns {string} L'email de l'utilisateur.
     */
    getEmail() {
        return this.req.utilisateur.email;
    }

    /**
     * Renvoie une erreur au client.
     * @param {Number} code Le code HTTP de l'erreur.
     * @param {string} message Le message expliquant l'erreur.
     */
    erreur(code, message) {
        this.res.status(code).json({ message: message });
    }

    /**
     * Renvoie une réponse au client.
     * @param {Number} code Le code de la réponse.
     * @param {object} json Le JSON de la réponse.
     */
    envoyer(code, json = {}) {
        this.res.status(code).json(json);
    }
}

/**
 * Représente les vérifications à effectuées sur la valeur d'un champs.
 */
export class ValeurVerification {

    format;
    tailleMinMax;
    valeursMinMax;
    valeursPossibles;

    /**
     * Initialise les vérifications.
     * @param {Object} options
     * @param {RegExp|undefined} options.format L'expression régulière pour valider le format.
     * @param {{min: number, max: number}|undefined} options.tailleMinMax Les limites minimales et maximales pour la longueur d'un champ (pour les chaînes de caractères).
     * @param {{min: number, max: number}|undefined} options.valeursMinMax Les limites minimales et maximales pour la valeur numérique (pour les numériques).
     * @param {Array|undefined} options.valeursPossibles Liste des valeurs possibles.
     */
    constructor({ format, tailleMinMax, valeursMinMax, valeursPossibles }) {
        this.format = format;
        this.tailleMinMax = tailleMinMax;
        this.valeursMinMax = valeursMinMax;
        this.valeursPossibles = valeursPossibles;
    }

    /**
     * Vérifie si la valeur passe les filtres.
     * @param {string} nom 
     * @param {*} valeur 
     * @returns {string|boolean} Retourne true si valide, sinon le message d'erreur.
     */
    verifier(nom, valeur) {
        // Vérifier si la valeur respecte l'expression régulière
        if (this.format !== undefined && !this.format.test(valeur)) {
            return `Le champs ${nom} ne respecte pas le format ${this.format}.`;
        }

        // Vérifier si la valeur est dans la plage spécifiée
        if (this.valeursMinMax !== undefined && (this.valeursMinMax['min'] > valeur || this.valeursMinMax['max'] < valeur)) {
            return `Le champs ${nom} doit être entre ${this.valeursMinMax['min']} et ${this.valeursMinMax['max']}.`;
        }

        // Vérifier si la valeur est de la taille spécifiée
        if (this.tailleMinMax !== undefined && (this.tailleMinMax['min'] > valeur.length || this.tailleMinMax['max'] < valeur.length)) {
            return `La taille du champs ${nom} doit être de ${this.tailleMinMax['min']} à ${this.tailleMinMax['max']} caractère(s).`;
        }

        // Vérifier si la valeur fait partie des valeurs autorisées
        if (this.valeursPossibles !== undefined && !this.valeursPossibles.includes(valeur)) {
            return `La champs ${nom} doit être égal à l'une des valeurs suivantes : ${this.valeursPossibles.join(", ")}.`;
        }

        return true;
    }

}
