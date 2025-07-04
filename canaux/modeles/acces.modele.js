/*
    Modèle : Accès
*/

import { Schema, model, Model } from 'mongoose';


// Schéma des documents

/** @type {Schema} Format d'un document dans la collection Acces. */
const schemaAcces = Schema({
    canal: {
        type: Schema.Types.ObjectId, 
        require: true,
        unique: true,
        ref: 'Canal'
    },
    acces: {
        type: [Schema({email: String, statut: String})]
    }
}, {versionKey: false});

// Modèle de la collection

/** @type {Model} Modèle pour intéragir avec la collection Acces. */
export const Acces = model('Acces', schemaAcces, 'Acces');
