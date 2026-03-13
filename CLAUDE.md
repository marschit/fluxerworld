# Fluxerworld (RedFlux)

Self-hosted Fluxer fork. Repo: `marschit/redflux`, Branch: `feature/guild-soundboard`

## Server
- SSH: `root@65.108.56.146` (key auth)
- Domain: `flux.mamallow.net`
- Deploy: pull → `docker build -t fluxer-server:local -f fluxer_server/Dockerfile .` → `cd /opt/fluxer-selfhost && docker compose up -d fluxer`

## Desktop Client (RedFlux)
- Build: `cd fluxer_desktop && node scripts/set-build-channel.mjs && node scripts/build.mjs`
- Package Mac: `npx electron-builder --mac dmg --config electron-builder.config.cjs`
- App-ID: `net.mamallow.redflux`, zeigt auf `flux.mamallow.net`
- Auto-Updater deaktiviert
- Linux + Windows Builds noch ausstehend

## Status
- Soundboard: fertig (Backend, Frontend, Settings, Voice Broadcasting, Emoji-Support)
- Instance Selector: in Login-Page integriert
- RedFlux macOS: fertig, installiert in /Applications
