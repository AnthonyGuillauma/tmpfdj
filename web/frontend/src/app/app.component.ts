import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuCoteComponent } from './composants/layout/menu-cote/menu-cote.component';
import { AuthService } from './services/apis/auth/auth.service';
import { ChatsService } from './services/websockets/chats/chats.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MenuCoteComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{

  constructor(private authentification: AuthService, chatService: ChatsService){ }
  public test = [1, 2, 3]

  ngOnInit(): void {
    this.authentification.verifierSession().subscribe();
  }
  
}
