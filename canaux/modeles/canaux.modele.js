/*
    Modèle : Canaux
*/

import { Schema, model, Model } from 'mongoose';


// Schéma des documents

/** @type {Schema} Format d'un document dans la collection Canaux. */
const schemaCanal = Schema({
    proprietaire: {
        type: String, 
        require: true
    },
    nom: {
        type: String, 
        require: true
    },
    visibilite: {
        type: String,
        require: true
    }
}, {versionKey: false});

// Modèle de la collection

/** @type {Model} Modèle pour intéragir avec la collection Canaux. */
export const Canal = model('Canal', schemaCanal, 'Canaux');