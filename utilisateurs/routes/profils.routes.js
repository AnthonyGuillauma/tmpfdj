/*
    Routes : Profils utilisateurs
*/

import { Router } from "express";
import { estConnecte } from "../middlewares/connecte.middleware.js";


export const profilsRoutes = new Router();