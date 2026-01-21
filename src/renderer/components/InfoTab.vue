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
        
        <h4>Bitfocus Companion (Empfohlen)</h4>
        <p>Für die beste Integration nutze unser natives Companion Modul. Einfach herunterladen und in den Developer-Ordner von Companion entpacken.</p>
        <a href="downloads/bauchbinder-companion.zip" class="ui icon label labeled purple button" download>
          <i class="download icon"></i>
          Companion Modul herunterladen
        </a>
        
        <h4 style="margin-top: 20px;">Legacy: Generic HTTP</h4>
        <p>Compagnion Anbindung über "Generic HTTP Modul":<br>BaseURL: http://localhost:5001/v1/<br>Button Action anzeigen: [POST] "show/X" wobei X die ID des Eintrags ist z.B. "show/1"<br>Button Action ausblenden: [POST] "hide"</p>
        <p></p>
        <h3>Bleibe auf dem neuesten Stand</h3>
        <p>Bauchbinder auf GitHub:  <a @click.prevent="openExternal('https://github.com/stckl/bauchbinder')">https://github.com/stckl/bauchbinder</a></p>
        
        <h4 style="margin-top: 20px;">Elgato Stream Deck</h4>
        <p>Für die Nutzung mit einem Elgato Stream Deck gibt es ein spezielles Plugin:</p>
        <a @click.prevent="openExternal('https://github.com/stckl/bauchbinder-streamdeck-plugin')" class="ui icon label labeled blue button">
          <i class="external alternate icon"></i>
          Stream Deck Plugin auf GitHub
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
const openExternal = (url) => {
  require('electron').shell.openExternal(url);
};
</script>
