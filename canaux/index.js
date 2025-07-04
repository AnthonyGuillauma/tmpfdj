/*
    Microservice : Gestion des canaux de communication
*/

import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { internesRoutes } from './routes/interne.routes.js';
import { canauxRoutes } from './routes/canaux.routes.js';
import { accesRoutes } from './routes/acces.routes.js';
import { CODE_RETOUR } from './configs/codes.js';


// Chargement des variables de configuration
config({ path: './configs/serveur.env' });
config({ path: './configs/db.env' });
const mode = process.env['MODE'];

console.log('Lancement du microservice pour la gestion des canaux...');
console.log(`Mode: ${mode}`);

// Connexion à la base de données
mongoose.connect(process.env['DB_URI']);

// Initialisation du serveur
const app = express();

// Paramètres du serveur
app.use(cors({
    origin: process.env['DOMAINE_WEB'],
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/interne', internesRoutes);
app.use('/api/canal', canauxRoutes);
app.use('/api/acces', accesRoutes);

// Gestion des codes 404
app.use((_req, res) => {
    res.status(CODE_RETOUR.ERREUR_CLIENT.RESSOURCE_NON_TROUVEE).send();
})

// Gestion des erreurs internes
app.use((err, _req, res, _next) => {
    res.status(CODE_RETOUR.ERREUR_SERVEUR.ERREUR_INTERNE);
    if (mode === 'prod') {
        res.send();
    }
    else if (mode === 'dev') {
        console.error(err);
        res.send(err);
    }
});

// Port
app.listen(8082, () => {
    console.log('Le microservice écoute sur le port 8082.');
});