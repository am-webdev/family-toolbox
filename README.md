## Lokale Entwicklungsinstallation
### MongoDB installieren
Da die Applikation eine MongoDB voraussetzt muss diese verfügbar sein.
Im Standard werden folgenden Parameter ohne Authentifizierung erwartet:
* Host: localhost
* Port: 27017
* Datenbankname: familytoolbox

Diese Einstellungen können in der Datei ~/model/db.js angepasst werden falls nötig. Alternativ kann beim Starten der Applikation der Parameter „MONGOLAB_URI“ übergeben werden. Ist dieser gesetzt, wird die angegebene URL zum Verbinden mit einem MongoDB Server genutzt. 

### Projekt klonen
	git clone https://github.com/am-webdev/family-toolbox.git

### Node Packages Installieren und starten
	// Installieren aller Abhängigkeiten
	npm install

	// Starten der Anwendung
	npm start

Server läuft unter: http://localhost:3000