print("Initialisation des base de données...")

db = db.getSiblingDB("FeuDeJoie_Utilisateurs");
db.createCollection("Utilisateurs");

db = db.getSiblingDB("FeuDeJoie_Canaux");
db.createCollection("Canaux");
db.createCollection("Acces");

db = db.getSiblingDB("FeuDeJoie_Messages");
db.createCollection("Messages");