/*
    Microservice : Gestion du chat en ligne
*/

import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from 'dotenv';
import { authSocket } from './sockets/auth.socket.js';
import { canauxSocket } from './sockets/canaux.socket.js';
import { messagesSocket } from './sockets/messages.socket.js';
import { redisClient } from './services/redis.service.js';


// Chargement des variables de configuration
config({ path: './configs/serveur.env' });
config({ path: './configs/db.env' });
const mode = process.env['MODE'];

console.log('Lancement du microservice pour la gestion des chats...');
console.log(`Mode: ${mode}`);

// Connexion à la base de données MongoDB
mongoose.connect(process.env['DB_URI']);

// Initialisation du serveur
const app = express();
const serveur = createServer(app);
export const io = new Server(serveur, {
    cors: {
        origin: process.env['DOMAINE_WEB'],
        credentials: true
    }
});

// Configuration du serveur
app.use(cors({
    origin: process.env['DOMAINE_WEB'],
    credentials: true
}));


// Lancement du websocket
io.use(authSocket);
io.on('connection', async (socket) => {

    redisClient.sadd(`session:${socket.utilisateur.id}`, socket.id);
    messagesSocket(io, socket);
    canauxSocket(socket);

    socket.on('disconnect', async () => {

        const idUtilisateur = socket.utilisateur.id;
        // Supprime sa connexion
        redisClient.srem(`session:${idUtilisateur}`, socket.id);

        // Vérifie que d'autres sockets sur ce compte sont connectées
        const sessionRestantes = await redisClient.scard(`session:${idUtilisateur}`);

        if (sessionRestantes === 0) {
            // Canaux de l'utilisateur
            const canaux = await redisClient.smembers(`utilisateur:${idUtilisateur}`);

            for (const canal of canaux) {
                await redisClient.srem(`canal:${canal}`, idUtilisateur);

                // Utilisateur encore connecté dans le canal
                const sessionCanal = await redisClient.scard(`canal:${canal}`);
                if (sessionCanal === 0) {
                    await redisClient.del(`canal:${canal}`);
                }
            }

            // Suppression des informations du compte
            await redisClient.del(`session:${idUtilisateur}`);
            await redisClient.del(`utilisateur:${idUtilisateur}`);
        }
    });
});

// Gestion des erreurs 404
app.use((_req, res) => {
    res.status(404).send();
});

// Port
serveur.listen(8083, () => {
    console.log('Le microservice écoute sur le port 8083.');
});

