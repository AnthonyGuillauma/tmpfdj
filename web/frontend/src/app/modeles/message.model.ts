export class Message {

    public id: string;
    public canal: string;
    public auteur: string;
    public date_envoi: Date;
    public contenu: string;

    constructor (id: string, canal: string, auteur: string, dateEnvoi: string, contenu: string) {
        this.id = id;
        this.canal = canal;
        this.auteur = auteur;
        this.date_envoi = new Date(dateEnvoi);
        this.contenu = contenu;
    }
}