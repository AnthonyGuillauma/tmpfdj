/*
    Modèle : Utilisateur
*/

import { Schema, model, Model } from 'mongoose';
import { hash } from 'bcrypt';


// Schéma des documents

/** @type {Schema} Format d'un document dans la collection Utilisateurs. */
const schemaUtilisateur = Schema({
    email: { type: String, require: true, unique: true},
    pseudo: { type: String, require: true },
    mot_de_passe: { type: String, require: false, select: false },
    creation: { type: Date, require: false, default: Date.now },
    derniere_connexion: { type: Date, require: false, default: Date.now }
}, { versionKey: false });

// Hashage des mots de passe avant de les sauvegarder en base
schemaUtilisateur.pre('save', async function (next) {
    if (!this.isModified('mot_de_passe')){
        return next();
    }
    this.mot_de_passe = await hash(this.mot_de_passe, 10);
    return next();
});

// Modèle de la collection

/** @type {Model} Modèle pour intéragir avec la collection Utilisateurs. */
export const Utilisateur = model('utilisateur', schemaUtilisateur, 'Utilisateurs');