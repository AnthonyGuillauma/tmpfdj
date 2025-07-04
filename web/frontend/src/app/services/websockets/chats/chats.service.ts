import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '../../apis/auth/auth.service';
import { Message } from '../../../modeles/message.model';
import { GestionMessagesService } from '../../gestions/messages/gestion-messages.service';

@Injectable({
  providedIn: 'root'
})
export class ChatsService {

  private api: string = 'http://localhost:8083';
  private socket: Socket | null = null;

  constructor(private apiAuth: AuthService, private gestionnaireMessages: GestionMessagesService) { 
    this.apiAuth.sessionActiveObserveur$.subscribe(estConnecte => {
      if (estConnecte) this.connexion();
      else this.deconnexion();
    });
  }

  private connexion() {
    this.socket = io(this.api, { withCredentials: true, reconnection: false });

    this.socket.on('connect_error', (err) => {
      console.error(err);
    });

    this.socket.on('message_recu', (message: Message) => {
      this.gestionnaireMessages.nouveauMessage(message);
    });

    this.socket.on('derniers_messages', ({canal, messages} : {canal: string, messages: Message[]}) => {
      this.gestionnaireMessages.miseAJourDerniersMessages(canal, messages);
    });

    this.socket.on('erreur_interne', (message) => console.error(message));
  }

  private deconnexion() {
    this.socket?.disconnect();
    this.socket = null;
  }

  public envoyerMessage(canal: string, contenu: string) {
    if (!this.socket) {
      throw Error(`La connexion n'a pas été initialisée.`);
    }
    this.socket.emit('envoi_message', {
      canal: canal, contenu: contenu, date_envoi: new Date().toISOString()
    });
  }

  public remonterCanal(canal: string, idDernierMessage: string | null = null) {
    if (!this.socket) {
      throw Error(`La connexion n'a pas été initialisée.`);
    }
    this.socket.emit('recuperer_derniers_messages', { canal: canal, dernierMessage: idDernierMessage});
  }
}
