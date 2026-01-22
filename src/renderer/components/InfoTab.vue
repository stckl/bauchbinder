<template>
  <div class="row" style="margin-top: 20px;">
    <div class="col">
      <h2>infos</h2>
      <div class="ui inverted segment">
        <h3>Bauchbinder einbinden</h3>
        <p>Link für OBS Browser Quelle: <a href="http://127.0.0.1:5001" @click.prevent="openExternal('http://127.0.0.1:5001')">http://127.0.0.1:5001</a></p>
        <h3>Key and Fill per HDMI</h3>
        <p>Vollbild für Key und Fill Fenster: Doppelclick ins Fenster</p>
        <h3>Shortcuts und Companion Einbindung</h3>
        <p>Shortcuts: [STRG/CTRL]+[ALT/OPTION]+[0-9] wobei 0 ausblenden, und 1-9 einblenden nach ID ist</p>
        
        <div class="ui divider inverted"></div>
        
        <h4>Bitfocus Companion v4 (Empfohlen)</h4>
        <p>Für die beste Integration nutze unser natives Companion Modul. Du hast zwei Möglichkeiten zur Installation:</p>
        <div class="ui bulleted list inverted">
          <div class="item"><b>Entwicklermodus:</b> Entpacke das Modul in einen Ordner deiner Wahl und gib diesen Pfad in den Companion-Einstellungen unter "Developer modules path" an.</div>
          <div class="item"><b>Direkt-Import (v4):</b> Nutze die "Import from file" Funktion in Companion und wähle die .companionbundle Datei aus.</div>
        </div>
        <br>
        <div class="ui buttons">
          <a href="downloads/bauchbinder.tgz" class="ui icon label labeled purple button" download>
            <i class="download icon"></i>
            Modul (.tgz)
          </a>
          <a href="downloads/bauchbinder-companion.zip" class="ui icon label labeled basic purple button" download>
            <i class="file archive icon"></i>
            ZIP-Archiv
          </a>
        </div>
        
        <h4 style="margin-top: 20px;">Legacy: Generic HTTP</h4>
        <p>Anbindung über das "Generic HTTP Modul":<br>BaseURL: http://localhost:5001/v1/<br>Button Action anzeigen: [POST] "show/X" wobei X die ID des Eintrags ist z.B. "show/1"<br>Button Action ausblenden: [POST] "hide"</p>
        
        <h3>Bleibe auf dem neuesten Stand</h3>
        <p>Bauchbinder auf GitHub:  <a @click.prevent="openExternal('https://github.com/stckl/bauchbinder')">https://github.com/stckl/bauchbinder</a></p>
        
        <h4 style="margin-top: 20px;">Elgato Stream Deck</h4>
        <p>Für die Nutzung mit einem Elgato Stream Deck (nativ) gibt es ein spezielles Plugin:</p>
        <a @click.prevent="openExternal('https://github.com/stckl/bauchbinder-streamdeck-plugin')" class="ui icon label labeled blue button">
          <i class="external alternate icon"></i>
          Stream Deck Plugin auf GitHub
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
const isElectron = typeof window !== 'undefined' && window.process && window.process.versions?.electron;
const shell = isElectron ? window.require('electron').shell : null;

const openExternal = (url) => {
  if (shell) shell.openExternal(url);
  else window.open(url, '_blank');
};
</script>