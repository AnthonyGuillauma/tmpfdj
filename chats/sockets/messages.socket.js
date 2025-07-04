/*
    Socket : Gestion des échanges de message
*/

import { Server, Socket } from "socket.io";
import { Message } from "../modeles/messages.modele.js";
import { redisClient } from "../services/redis.service.js";
import mongoose from "mongoose";

/**
 * Gère les messages dans un canal
 * 
 * Evènements :
 * 
 *      'envoi_message' (client -> serveur): L'utilisateur envoi un message sur un canal
 *      'message_recu' (serveur -> client): L'utilisateur a reçu un message sur un de ses canaux
 *      'recuperer_derniers_messages' (client -> serveur): L'utilisateur souhaite récupèrer plus d'anciens messages
 *      'derniers_messages' (serveur -> client): L'utilisateur reçoit d'anciens messages
 * 
 * @param {Server} io
 * @param {Socket} socket 
 */
export const messagesSocket = (io, socket) => {

    socket.on('envoi_message', async ({ canal, contenu, date_envoi }) => {

        // Vérification des données
        if (!canal || !/^[a-fA-F0-9]{24}$/.test(canal)) {
            socket.emit('erreur_interne', `Canal invalide ou non fourni.`);
            return;
        }
        if (!(await redisClient.sismember(`canal:${canal}`, socket.utilisateur.id))) {
            socket.emit('erreur_interne', `Canal non autorisé.`);
            return;
        }
        if (!contenu || typeof(contenu) !== 'string') {
            socket.emit('erreur_interne', `Contenu invalide ou non fourni.`);
            return;
        }
        if (!date_envoi || !dateValide(date_envoi)){
            socket.emit('erreur_interne', `Date invalide ou non fournie.`);
            return;
        }

        // Sauvegarde du message
        const nouveauMessage = new Message({
            canal: canal,
            auteur: socket.utilisateur.email,
            date_envoi: new Date(date_envoi),
            contenu: contenu
        });
        await nouveauMessage.save();

        // Socket dans le canal
        io.in(canal).emit('message_recu', { 
            id: nouveauMessage._id.toString(),
            canal: canal,
            contenu: contenu, 
            auteur: socket.utilisateur.email, 
            date_envoi: date_envoi 
        },);
    });

    socket.on('recuperer_derniers_messages', async ({ canal, dernierMessage }) => {
        // Vérification des données
        if (!canal || !/^[a-fA-F0-9]{24}$/.test(canal)) {
            socket.emit('erreur_interne', `Canal invalide ou non fourni.`);
            return;
        }
        if (!(await redisClient.sismember(`canal:${canal}`, socket.utilisateur.id))) {
            socket.emit('erreur_interne', `Canal non autorisé.`);
            return;
        }

        // Récupération des 50 derniers messages
        let derniersMessages;
        if (dernierMessage === null) {
            derniersMessages = await Message.find(
                { canal: canal }
            )
            .sort({ _id: 1 })
            .limit(50);
        }
        else if (/^[a-fA-F0-9]{24}$/.test(dernierMessage)) {
            derniersMessages = await Message.find(
                { canal: canal, _id: { $lt: new mongoose.Types.ObjectId(dernierMessage) } }
            )
            .sort({ _id: 1 })
            .limit(50);
        }
        else {
            socket.emit('erreur_interne', `Dernier message invalide ou non fourni.`);
            return;
        }

        socket.emit('derniers_messages', { canal: canal, messages: derniersMessages});

    });
}

/**
 * Indique si une date est valide ou non.
 * @param {string} date 
 * @returns {boolean}
 */
function dateValide(date) {
    const d = new Date(date);
    return !isNaN(d) && date === d.toISOString();
}