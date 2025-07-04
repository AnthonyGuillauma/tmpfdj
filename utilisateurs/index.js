/*
    Microservices : Gestion des utilisateurs et des authentifications
*/

import express from 'express';
import session from 'express-session';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import { internesRoutes } from './routes/interne.routes.js';
import { authsRoutes } from './routes/authentification.routes.js';
import { profilsRoutes } from './routes/profils.routes.js';
import { CODE_RETOUR } from './configs/codes.js';


// Chargement des variables de configuration
config({ path: './configs/serveur.env' });
config({ path: './configs/db.env' });
const mode = process.env['MODE'];

console.log('Lancement du microservice pour la gestion des utilisateurs...');
console.log(`Mode: ${mode}`);

// Connexion à la base de données
mongoose.connect(process.env['DB_URI']);

// Initialisation du serveur
const app = express();

// Configuration du serveur
app.use(cors({
    origin: process.env['DOMAINE_WEB'],
    credentials: true
}));
app.use(express.json());
app.use(session({
    name: 'sid',
    secret: process.env.CLE_SESSION,
    resave: false,
    saveUninitialized: false,
    cookie: {secure: false, httpOnly: true}
}));

// Routes
app.use('/interne', internesRoutes);
app.use('/api/auth', authsRoutes);
app.use('/api/profil', profilsRoutes);

// Gestion des erreurs 404
app.use((_req, res) => {
    res.status(CODE_RETOUR.ERREUR_CLIENT.RESSOURCE_NON_TROUVEE).send();
});

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
app.listen(8081, () => {
    console.log('Le microservice écoute sur le port 8081.');
});
