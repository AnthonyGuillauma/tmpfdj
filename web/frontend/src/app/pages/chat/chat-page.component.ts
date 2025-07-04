import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatsService } from '../../services/websockets/chats/chats.service';
import { Observable } from 'rxjs';
import { Message } from '../../modeles/message.model';
import { GestionMessagesService } from '../../services/gestions/messages/gestion-messages.service';
import { CommonModule } from '@angular/common';
import { GestionCanauxService } from '../../services/gestions/canaux/gestion-canaux.service';

@Component({
  selector: 'app-chat-page',
  imports: [CommonModule],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.scss'
})
export class ChatPageComponent implements OnDestroy {

  private canal!: string;
  protected suiviMessages!: Observable<Message[]>;
  @ViewChild('listeMessages') listeMessages!: ElementRef;
  @ViewChild('nouveauMessage') nouveauMessage!: ElementRef;

  constructor(
    private gestionnaireCanaux: GestionCanauxService,
    private gestionnaireMessages: GestionMessagesService, 
    private wsChat: ChatsService, 
    route: ActivatedRoute,
    routeur: Router) {
    if (!route.snapshot.paramMap.get('id')) {
      routeur.navigateByUrl('/canaux');
    }
    route.paramMap.subscribe(params => {
      this.canal = params.get('id')!;
      if (!this.gestionnaireCanaux.getCanalInscrit(this.canal)) {
        routeur.navigateByUrl('/canaux');
      }
      this.gestionnaireCanaux.canalActif = this.canal;
      this.suiviMessages = this.gestionnaireMessages.getMessagesCanalObservable(this.canal);
      const suiviMessagesCanal = this.gestionnaireMessages.getMessagesCanal(this.canal);
      suiviMessagesCanal.setMessagesLus();
      if (!suiviMessagesCanal.plusDeMessages) return;
      if (suiviMessagesCanal.messages.value.length < 50) {
        this.demanderAnciensMessages();
      }
    });
  }

  ngOnDestroy(): void {
    this.gestionnaireCanaux.canalActif = null;
  }

  protected envoyerMessage() {
    const message = this.nouveauMessage.nativeElement.value;
    if (!message) return;
    this.wsChat.envoyerMessage(this.canal, message);
    this.nouveauMessage.nativeElement.value = '';
  }

  protected scrollMessages() {
    if (this.listeMessages.nativeElement.scrollTop === 0) {
      this.demanderAnciensMessages();
    }
  }

  private demanderAnciensMessages() {
    const suiviMessagesCanal = this.gestionnaireMessages.getMessagesCanal(this.canal);
    if (!suiviMessagesCanal.plusDeMessages) return;
    const messages = suiviMessagesCanal.messages.value;
    const idDernierMessage = messages.length > 0 ? messages[0].id : null;
    this.wsChat.remonterCanal(this.canal, idDernierMessage);
  }
}
