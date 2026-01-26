# DeckLink SDK Header Files

Dieser Ordner enthält die DeckLink SDK Header-Dateien für den Build.

## Automatisch (GitHub Actions)

Die Header werden automatisch aus GitHub Secrets entpackt wenn `DECKLINK_SDK_MAC` / `DECKLINK_SDK_WIN` konfiguriert sind.

Siehe `sdk-download/README.md` für Setup-Anleitung.

## Manuell (lokaler Build)

Falls du lokal bauen möchtest:

1. Kopiere die Header aus dem SDK:
   - macOS: `/Library/Application Support/Blackmagic Design/DeckLink/`
   - Windows: `C:\Program Files\Blackmagic Design\DeckLink\` oder SDK ZIP `Win/include/`

2. Benötigte Dateien:
   - `DeckLinkAPI.h`
   - `DeckLinkAPIConfiguration.h`
   - `DeckLinkAPIDeckControl.h`
   - `DeckLinkAPIDiscovery.h`
   - `DeckLinkAPIModes.h`
   - `DeckLinkAPITypes.h`
   - `DeckLinkAPIVersion.h`
   - `DeckLinkAPIDispatch.cpp`

3. Build:
   ```bash
   npm run build-decklink
   npm run rebuild-decklink
   ```
