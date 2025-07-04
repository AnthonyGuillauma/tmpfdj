/*
    Socket : Gestion des connexions aux canaux
*/

import axios from "axios";
import { Socket } from "socket.io";
import { redisClient } from '../services/redis.service.js';

/**
 * Gestion des canaux lors de la communication
 * 
 * Evènements :
 * 
 *      'rejoindre_canal' (client -> serveur) : Le client va sur la page d'un canal.
 *      'canal_rejoint' (serveur -> client) : Le serveur informe qu'il va être informé par la page.
 *      'quitter_canal' (client -> serveur) : Le client informe qu'il quitte la page d'un canal.
 *      'canal_quitte' (serveur -> client) : Le serveur informe qu'il ne sera plus informé par la page.
 *      'erreur_interne' (serveur -> client) : Impossible d'effectuer une opération.
 * 
 * @param {Socket} socket 
 */
export const canauxSocket = async (socket) => {

    // Informations de l'utilisateur
    const idUtilisateur = socket.utilisateur.id;
    const sessionConnectees = await redisClient.scard(`session:${idUtilisateur}`);
    const dejaInformation = sessionConnectees > 1;

    if (!dejaInformation) {

        // Récupération des canaux de l'utilisateur
        const canaux = await getCanaux(socket);

        if (canaux === false) {
            socket.emit('erreur_interne', `Impossible de joindre l'autre microservice.`);
            socket.disconnect();
            return;
        }

        // Connexion de l'utilisateur à ses canaux
        initialisationCanaux(socket, canaux);
    }
};

/**
 * Retourne les canaux dont l'utilisateur fait parti.
 * @returns {Array|false} La liste des canaux ou false si erreur interne.
 */
async function getCanaux(socket) {
    try {
        const reponse = await axios.post(`${process.env['DOMAINE_CANAUX']}/interne/canal/inscrit`,
            {
                utilisateur: socket.utilisateur.email
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env['CLE_CANAUX']}`
                },
                timeout: 5000
            });
        return reponse.data;
    }
    catch {
        return false;
    }
}

/**
 * Initialise l'utilisateur et ses canaux dans Redis.
 * @param {Socket} socket 
 * @param {Array} canaux
 */
async function initialisationCanaux(socket, canaux) {
    const idUtilisateur = socket.utilisateur.id;

    for (const canal of canaux) {
        await redisClient.sadd(`canal:${canal.id}`, idUtilisateur);
        await redisClient.sadd(`utilisateur:${idUtilisateur}`, canal.id);
        await socket.join(canal.id);
    }
}