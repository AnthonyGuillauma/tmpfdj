import jsonwebtoken from 'jsonwebtoken';
import { config } from 'dotenv';

config({path: './configs/serveur.env'})

const payload = {
  sub: 'chats',
  service: 'chats',
  scope: 'interne',
};

const token = jsonwebtoken.sign(payload, process.env.CLE_SERVICE);

console.log(token);