import { BehaviorSubject, map, Observable } from "rxjs";
import { Message } from "./message.model";

export class EtatMessagesCanal {

    public messages: BehaviorSubject<Message[]>;
    public plusDeMessages: boolean;
    private nombreLu = new BehaviorSubject<number>(0);
    public nombreMessageNonLu$ = this.nombreLu.asObservable();

    constructor() {
        this.messages = new BehaviorSubject<Message[]>([]);
        this.plusDeMessages = true;
    }

    public nouveauMessageNonLu() {
        this.nombreLu.next(this.nombreLu.value + 1);
    }

    public setMessagesLus() {
        this.nombreLu.next(0);
    }
}