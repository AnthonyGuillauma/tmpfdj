/*
 *  Service : Redis
*/

import { Redis } from 'ioredis';
import { io } from '../index.js';
import { Message } from '../modeles/messages.modele.js';
import mongoose from 'mongoose';


/** @type {Redis} Le client Redis pour sauvegarder des données. */
export const redisClient = new Redis({ host: 'localhost', port: 6379 });

/** @type {Redis} Le client Redis pour écouter les évènements. */
const redisClientPubSub = new Redis({ host: 'localhost', port: 6379 });

// Abonnement au channel pub/sub canal
redisClientPubSub.subscribe('canal');

// Pour chaque publication sur ce channel...
redisClientPubSub.on('message', async (_channel, message) => {
    try {

        //...récupération des données
        const informations = JSON.parse(message);
    
        //...si la publication concerne un nouveau canal crée
        if (informations.type === 'nouveau') {
            // Mis à jour des acces
            await redisClient.sadd(`canal:${informations.canal}`, informations.proprietaire);
            await redisClient.sadd(`utilisateur:${informations.proprietaire}`, informations.canal);
            // Ajout de toutes les sessions du propriétaire sur ce canal
            const sockets = await redisClient.smembers(`session:${informations.proprietaire}`);
            for (const socket of sockets) {
                io.of('/').sockets.get(socket).join(informations.canal);
            }
        }
    
        //...si la publication concerne un canal supprimé
        else if (informations.type === 'supprime') {
            // Mis à jour des acces
            const membresCanal = await redisClient.smembers(`canal:${informations.canal}`);
            for (const membre of membresCanal) {
                await redisClient.srem(`utilisateur:${membre}`, informations.canal);
            }
            await redisClient.del(`canal:${informations.canal}`);
            // Retire les utilisateurs sur ce canal
            const sockets = await redisClient.smembers(`session:${informations.utilisateur}`);
            for (const socket of sockets) {
                io.of('/').sockets.get(socket).leave(informations.canal);
            }
            // Suppression des messages de ce canal
            await Message.deleteMany({
                canal: new mongoose.Types.ObjectId(informations.canal)
            });
        }
    
        //...si la publication concerne un nouvel acces sur un canal
        else if (informations.type === 'acces-rejoint') {
            // Mis à jour des acces
            await redisClient.sadd(`canal:${informations.canal}`, informations.utilisateur);
            await redisClient.sadd(`utilisateur:${informations.utilisateur}`, informations.canal);
            // Ajout de toutes les sessions de l'utilisateur concerné sur ce canal
            const sockets = await redisClient.smembers(`session:${informations.utilisateur}`);
            for (const socket of sockets) {
                io.of('/').sockets.get(socket).join(informations.canal);
            }
        }
    
        //...si la publication concerne un acces supprimé sur un canal
        else if (informations.type === 'acces-supprime') {
            // Mis à jour des acces
            await redisClient.srem(`canal:${informations.canal}`, informations.utilisateur);
            await redisClient.srem(`utilisateur:${informations.utilisateur}`, informations.canal);
            // Retire les utilisateurs sur ce canal
            const sockets = await redisClient.smembers(`session:${informations.utilisateur}`);
            for (const socket of sockets) {
                io.of('/').sockets.get(socket).leave(informations.canal);
            }
        }
    }
    catch (err) {
        console.error(`Erreur dans le Pub/Sub : ${err}.`)
    }
});