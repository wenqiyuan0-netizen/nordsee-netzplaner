<div align="center">

# Nordsee Netzplaner

> Interaktives Planungstool für Stromnetze in der Nordsee-Region mit automatischer Verbindungsoptimierung und Distanzberechnung.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat&logo=vite&logoColor=white)
![Stars](https://img.shields.io/github/stars/wenqiyuan0-netizen/nordsee-netzplaner?style=social)

</div>

Ein webbasiertes Tool zum Planen und Analysieren von Stromnetzen in der Nordsee. Platziere Netzknoten, Leitungen und Energie-Stationen auf einer interaktiven Karte, lass Anschlusspunkte automatisch optimieren und sieh dir Entfernungen sowie eine einfache Energie-Simulation an.

## Features

- **Interaktive Karte** (Leaflet) mit Fokus auf die Nordsee-Region
- **Netzplanung**: Knoten, Leitungen und Stationen hinzufügen / verschieben / löschen
- **Stationstypen**: Windpark, Photovoltaik, Wellenkraftwerk, Pumpspeicherkraftwerk, Wärmeenergiespeicher, Kältemaschine, Hauptstandort
- **Automatische Optimierung** der Anschlusspunkte und Berechnung von Luft- und Kabelstrecken zum Hauptstandort
- **Messwerkzeug** für manuelle Distanzmessungen
- **Export / Import** des geplanten Netzes (JSON)
- **HMI-Energieübersicht** mit Tagesverlaufs-Simulation (PV, Wind, Welle, Pumpspeicher)

## Quick Start

**Voraussetzungen:** Node.js 18+

```bash
git clone https://github.com/wenqiyuan0-netizen/nordsee-netzplaner.git
cd nordsee-netzplaner
npm install
npm run dev
```

Öffne [http://localhost:3002](http://localhost:3002) im Browser.

## Installation

```bash
npm install
```

Weitere Scripts:

| Befehl          | Beschreibung                  |
|-----------------|-------------------------------|
| `npm run dev`   | Entwicklungsserver (Port 3002)|
| `npm run build` | Produktions-Build             |
| `npm run preview` | Vorschau des Builds         |

## Usage

1. **Knoten & Leitungen** anlegen, um das Backbone-Netz zu definieren.
2. **Stationen** der gewünschten Typen platzieren — der Anschluss an die nächste Leitung wird automatisch optimiert.
3. **Messmodus** nutzen, um Distanzen zu prüfen.
4. Über die Sidebar das Netz **exportieren** oder **importieren**.
5. Die **HMI-Energieübersicht** öffnen, um einen simulierten Tagesverlauf (Erzeugung, Last, Pumpspeicher) zu sehen.

Alle Berechnungen laufen clientseitig im Browser.

## Contributing

Pull Requests und Issues sind willkommen. Bitte beschreibe Änderungen klar und halte den Code im bestehenden Stil (TypeScript + React).

## License

Dieses Repository enthält derzeit keine Lizenzdatei. Wenn du das Projekt nutzen, forken oder weiterverbreiten möchtest, kläre die Nutzungsbedingungen bitte direkt mit dem Autor.

## Acknowledgments

- Karte: [Leaflet](https://leafletjs.com/) + [react-leaflet](https://react-leaflet.js.org/)
- Charts: [Recharts](https://recharts.org/)
- Icons: [Lucide](https://lucide.dev/)
