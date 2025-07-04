import { Schema, Model, model } from 'mongoose';


const schemaMessage = Schema({
    canal: { type: Schema.Types.ObjectId, require: true },
    auteur : { type: String, require: true },
    date_envoi : { type: Date, require: true },
    contenu: { type: String, require: true }
}, {versionKey: false});

/** @type {Model} */
export const Message = model('Message', schemaMessage, 'Messages');
