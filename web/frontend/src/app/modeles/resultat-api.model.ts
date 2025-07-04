export class ResultatApi {
    public valide: boolean;
    public message?: string;

    constructor(valide: boolean, message?: string) {
        this.valide = valide;
        this.message = message;
    }
}