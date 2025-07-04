/*
    Socket : Gestion des authentifications
*/

import axios from "axios";
import cookie from 'cookie';


export const authSocket = async (socket, next) => {

    // Récupération des cookies
    const cookies = socket.handshake.headers.cookie;
    if (!cookies){
        next(`Aucun cookie n'a été fourni, authentification impossible.`);
        return;
    }
    
    // Récupération du cookie de session
    const cookieSession = cookie.parse(cookies)['sid'];
    if (!cookieSession){
        next(`Le cookie de session n'a pas été fourni.`);
    }
    
    // Vérifie que le cookie de session est valide
    // Demande au microservice d'authentification
    await axios.get(`${process.env['DOMAINE_AUTH']}/interne/auth/session`,
        {
            headers: {
                Authorization: `Bearer ${process.env['CLE_AUTH']}`,
                Cookie: `sid=${cookieSession}`
            }
        })
    // Si le cookie est valide, acceptation de la connexion
    .then(reponse => {
        socket.utilisateur = {
            id: reponse.data.id,
            email: reponse.data.email
        }
        next();
    })
    // S'il est invalide, refus de la connexion
    .catch(() => {
        next(new Error(`Authentification invalide.`));
    });
}
