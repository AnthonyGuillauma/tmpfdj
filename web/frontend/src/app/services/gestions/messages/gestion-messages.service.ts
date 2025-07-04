import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message } from '../../../modeles/message.model';
import { EtatMessagesCanal } from '../../../modeles/etat-messages.model';
import { GestionCanauxService } from '../canaux/gestion-canaux.service';

@Injectable({
  providedIn: 'root'
})
export class GestionMessagesService {

  private messagesCanal = new Map<string, EtatMessagesCanal>();

  constructor(private gestionnaireCanaux: GestionCanauxService) { }

  private nouveauSuiviSiInexistant(canal: string): void {
    if (!this.messagesCanal.has(canal)){
      this.messagesCanal.set(canal, new EtatMessagesCanal());
    }
  }

  public getMessagesCanalObservable(canal: string): Observable<Message[]> {
    this.nouveauSuiviSiInexistant(canal);
    return this.messagesCanal.get(canal)!.messages.asObservable();
  }

  public nouveauMessage(message: Message) {
    const canal = message.canal;
    this.nouveauSuiviSiInexistant(canal);
    const suiviMessagesCanal = this.messagesCanal.get(canal)!;
    const canalMessagesActuels = suiviMessagesCanal.messages.value;
    suiviMessagesCanal.messages.next([...canalMessagesActuels, message]);
    if (this.gestionnaireCanaux.canalActif !== canal) {
      this.messagesCanal.get(canal)!.nouveauMessageNonLu();
    }
  }

  public miseAJourDerniersMessages(canal: string, messages: Message[]): void {
    this.nouveauSuiviSiInexistant(canal);
    if (!this.messagesCanal.get(canal)!.plusDeMessages) {
      return;
    }
    if (messages.length < 50) {
      this.messagesCanal.get(canal)!.plusDeMessages = false;
    }
    const suiviMessagesCanal = this.messagesCanal.get(canal)!;
    const canalMessagesActuels = suiviMessagesCanal.messages.value;
    suiviMessagesCanal.messages.next([...messages, ...canalMessagesActuels]);
  }

  public getMessagesCanal(canal: string) : EtatMessagesCanal {
    this.nouveauSuiviSiInexistant(canal);
    return this.messagesCanal.get(canal)!;
  }
}
