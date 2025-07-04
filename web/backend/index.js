//Dépendances
const express = require("express");
const path = require("path");

console.log('Lancement du microservice pour la gestion du site web...');

//Initialisation du serveur
const app = express();

//Chemin Angular
const cheminFrontend = __dirname + "/../frontend/dist/feu-de-joie/browser";

//Renvoie les ressources du dossier public d'Angular
app.use(express.static(cheminFrontend));

//Redirige les ressources vers Angular
app.use((req, res) => {
    res.sendFile(path.join(cheminFrontend, "index.html"));
})

//Ecoute du serveur sur un port
app.listen(8080);

console.log('Le microservice écoute sur le port 8080.');