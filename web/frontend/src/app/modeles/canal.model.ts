export class Canal {

    public id: string;
    public nom: string;
    public proprietaire: string;
    public visibilite: string;

    constructor (id: string, nom: string, proprietaire: string, visibilite: string) {
        this.id = id;
        this.nom = nom;
        this.proprietaire = proprietaire;
        this.visibilite = visibilite;
    }
}