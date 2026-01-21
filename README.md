# Bauchbinder

**Bauchbinder** ist eine professionelle Electron-Anwendung zur Erstellung und Ausspielung von dynamischen Bauchbinden (Lower Thirds) für Live-Streams und Broadcasts. 

Die Anwendung bietet ein modernes Web-Interface zur Steuerung, unterstützt Key & Fill Ausgänge für SDI-Workflows sowie HTML5-Browser-Quellen für OBS, vMix oder ATEM Mini.

![Icon](assets/icons/128x128.png)

## 🚀 Features

*   **Cross-Platform:** Native Unterstützung für macOS (Apple Silicon & Intel) und Windows.
*   **Dual-Output:** Separate Fenster für **Key** (Alpha) und **Fill** (Farbe) für professionelle Video-Mischer.
*   **HTML5 Integration:** Einfache Einbindung als Browser-Source (z.B. in OBS).
*   **Echtzeit-Steuerung:** Änderungen an Texten und Styles werden sofort per WebSocket übertragen.
*   **Animation Engine:** Basiert auf `anime.js` mit anpassbaren Ein- und Ausblendungen.
*   **REST API:** Fernsteuerung über HTTP-Requests (z.B. via Bitfocus Companion).
*   **Globale Hotkeys:** Steuerung der Anwendung auch wenn sie im Hintergrund läuft.
*   **Custom Styling:** Volle CSS-Kontrolle über das Aussehen der Bauchbinden.

## 📥 Installation

Lade die neueste Version für dein Betriebssystem von der [Releases-Seite](https://github.com/mstoeckle/bauchbinder/releases) herunter.

*   **macOS:** Entpacke die `.zip` und verschiebe die App in den Programme-Ordner.
*   **Windows:** Entpacke die `.zip` und starte die `.exe`.

## 🎮 Verwendung

### 1. Ausspielwege

Die Anwendung stellt einen lokalen Webserver auf Port `5001` bereit.

#### Option A: OBS / vMix (Browser Source)
Füge eine neue Browser-Quelle hinzu und nutze folgende URL:
`http://localhost:5001/bauchbinde_h5.html`

Dies liefert eine transparente Version der Bauchbinde (ideal für Software-Mischer).

#### Option B: Hardware Mischer (Key & Fill)
Für Mischer wie Blackmagic ATEM, die getrennte Signale für Fill (Grafik) und Key (Maske) benötigen:
1.  Starte die App.
2.  Öffne über das Menü oder Buttons die Fenster **Key** und **Fill**.
3.  Ziehe diese Fenster auf die entsprechenden HDMI/SDI-Ausgänge deiner Grafikkarte und schalte sie auf Vollbild.

### 2. Steuerung

Im Hauptfenster können Texte bearbeitet, Designs angepasst und Animationen gewählt werden.

**Globale Hotkeys:**
*   `Strg + Alt + 1-9`: Zeigt die Bauchbinde mit der entsprechenden ID (1-9) aus der Liste.
*   `Strg + Alt + 0`: Blendet die aktuelle Bauchbinde aus.

### 3. REST API

Die Anwendung kann über einfache HTTP-POST-Requests gesteuert werden (ideal für Elgato Stream Deck / Bitfocus Companion).

| Methode | Endpunkt | Beschreibung |
| :--- | :--- | :--- |
| `POST` | `/v1/show/:id` | Zeigt die Bauchbinde mit der ID (Index startet bei 1).<br>Beispiel: `http://localhost:5001/v1/show/1` |
| `POST` | `/v1/hide` | Blendet die aktuelle Bauchbinde aus.<br>Beispiel: `http://localhost:5001/v1/hide` |

## 🛠 Entwicklung

Voraussetzungen: Node.js (v20 empfohlen).

```bash
# Repository klonen
git clone https://github.com/mstoeckle/bauchbinder.git
cd bauchbinder

# Abhängigkeiten installieren
npm install

# Development Server starten (Vite + Electron)
npm run dev:exe
```