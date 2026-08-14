<div align="center">

<img src="../assets/banner.png" alt="Isenax - Strumento per diagrammi isometrici" width="100%" />

</div>

<p align="center">
 <a href="../README.md">English</a> | <a href="README.cn.md">简体中文</a> | <a href="README.es.md">Español</a> | <a href="README.pt.md">Português</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.bn.md">বাংলা</a> | <a href="README.ru.md">Русский</a> | <a href="README.id.md">Bahasa Indonesia</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ko.md">한국어</a> | <a href="README.ja.md">日本語</a> | <a href="README.it.md">Italiano</a> | <a href="README.pl.md">Polski</a> | <a href="README.tr.md">Türkçe</a>
</p>

## Nota:

Questo repository (Isenax) è un derivato di [Abrar74774/FossFLOW](https://github.com/Abrar74774/FossFLOW), a sua volta un fork di stan-smith/FossFLOW (che era a sua volta un fork di [markmanx/isoflow](https://github.com/markmanx/isoflow)), creato originariamente per contribuire al repository originale tramite PR. Tuttavia il nome utente dell'autore sembra essere stato cambiato in [mug-book-droid](https://github.com/mug-book-droid) e la sua attività resa privata (forse l'account è stato sospeso?), rendendo il repository originale inaccessibile.

Per ora intendo portare avanti questo repository (ora chiamato Isenax) come continuazione dello sviluppo di FossFLOW, e ogni contributo tramite PR è benvenuto.

Puoi consultare l'ultimo stato del repository originale che ho recuperato nel branch `backup/stan-smith-FossFLOW`.

---

Isenax è una potente Progressive Web App (PWA) open source per creare bellissimi diagrammi isometrici. Costruita con React e la libreria <a href="https://github.com/markmanx/isoflow">Isoflow</a> (forkata e pubblicata su npm come fossflow, poi flowvia e ora come isenax in questo fork), funziona interamente nel browser con supporto offline.

---
<p align="center">
<b>Provala online --> https://nyangko.github.io/Isenax/ <-- </b>
</p>

<img width="100%" alt="Isenax-Isometric-Diagramming-Tool" src="https://github.com/user-attachments/assets/15956888-991a-4b5e-9849-dbd82d6f9308" />

---------

## 🐳 Deploy rapido con Docker

```bash
# Con Docker Compose (consigliato - include archiviazione persistente)
docker compose up

# Oppure direttamente da Docker Hub con archiviazione persistente
docker run -p 80:80 -v $(pwd)/diagrams:/data/diagrams nyangko/isenax:latest
```

L'archiviazione lato server è abilitata per impostazione predefinita in Docker. I diagrammi vengono salvati (come root per impostazione predefinita) in `./diagrams` sull'host. Per cambiare l'utente o il gruppo con cui salvare, imposta le variabili d'ambiente `PUID` e `PGID`.

Per disabilitare l'archiviazione lato server, imposta `ENABLE_SERVER_STORAGE=false`:
```bash
docker run -p 80:80 -e ENABLE_SERVER_STORAGE=false nyangko/isenax:latest
```

### Autenticazione HTTP Basic (opzionale)

Proteggi la tua istanza di Isenax con HTTP Basic Auth:

```bash
# Con Docker Compose
HTTP_AUTH_USER=admin HTTP_AUTH_PASSWORD=secret docker compose up

# Oppure con docker run
docker run -p 80:80 \
  -e HTTP_AUTH_USER=admin \
  -e HTTP_AUTH_PASSWORD=secret \
  nyangko/isenax:latest
```

> **Nota**: entrambe le variabili devono essere impostate per attivare l'autenticazione. Se una delle due è vuota, l'app è accessibile senza login.

## Avvio rapido (sviluppo locale)

```bash
# Clona il repository
git clone https://github.com/nyangko/Isenax
cd Isenax

# Installa le dipendenze
npm install

# Compila la libreria (necessario la prima volta)
npm run build:lib

# Avvia il server di sviluppo
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

## Struttura del monorepo

Questo è un monorepo che contiene quattro pacchetti:

- `packages/isenax-lib` - Libreria di componenti React per disegnare diagrammi di rete (compilata con Rslib/Rspack)
- `packages/isenax-app` - Progressive Web App che avvolge e presenta la libreria (compilata con RSBuild)
- `packages/isenax-backend` - Server Express che fornisce archiviazione self-hosted opzionale per i diagrammi (usato nel deploy Docker)
- `packages/isenax-mcp` - Server MCP (Model Context Protocol) che permette a un agente IA esterno di leggere, creare e modificare i tuoi diagrammi direttamente (stdio o Streamable HTTP)

### Comandi di sviluppo

```bash
# Sviluppo
npm run dev          # Avvia il server di sviluppo dell'app
npm run dev:lib      # Modalità watch per lo sviluppo della libreria

# Compilazione
npm run build        # Compila libreria e app
npm run build:lib    # Compila solo la libreria
npm run build:app    # Compila solo l'app

# Test e linting
npm test             # Esegue i test unitari
npm run lint         # Controlla gli errori di lint

# Test E2E (Selenium)
cd e2e-tests
./run-tests.sh       # Esegue i test end-to-end (richiede Docker e Python)

# Pubblicazione
npm run publish:lib  # Pubblica la libreria su npm
```

## Come si usa

### Creare diagrammi

1. **Aggiungere elementi**:
   - Premi il pulsante "+" nel menu in alto a destra: la libreria dei componenti apparirà a sinistra
   - Trascina i componenti dalla libreria sulla tela
   - Oppure fai clic con il tasto destro sulla griglia e scegli "Aggiungi nodo"

2. **Collegare gli elementi**:
   - Seleziona lo strumento Connettore (premi 'C' o clicca sull'icona del connettore)
   - **Modalità clic** (predefinita): clicca il primo nodo, poi il secondo
   - **Modalità trascinamento** (opzionale): clicca e trascina dal primo al secondo nodo
   - Cambia modalità in Impostazioni → Connettori

3. **Salvare il lavoro**:
   - **Salvataggio rapido** - Salva nella sessione del browser
   - **Esporta** - Scarica come file JSON
   - **Importa** - Carica da file JSON

4. **Organizzare con il pannello Livelli**:
   - Apri Livelli dalla barra degli strumenti per vedere in un unico elenco tutti i nodi, connettori, aree e caselle di testo
   - Seleziona un elemento dall'elenco per modificarlo nella scheda "Modifica" dello stesso pannello
   - Su schermi stretti si apre come pannello inferiore dal pulsante in basso a destra della tela

### Opzioni di archiviazione

- **Archiviazione di sessione**: salvataggi temporanei cancellati alla chiusura del browser
- **Esporta/Importa**: archiviazione permanente come file JSON
- **Salvataggio automatico**: salva le modifiche nella sessione ogni 5 secondi

### Integrazione MCP (Agenti IA)

Isenax include un server MCP che permette a un agente IA esterno (Claude, ecc.) di leggere, creare e modificare i tuoi diagrammi direttamente:

1. Apri **Impostazioni → MCP** e attivalo — verranno mostrati un URL di connessione e un token Bearer.
2. Collega il tuo client MCP a quell'URL/token (`packages/isenax-mcp` supporta sia il trasporto stdio che Streamable HTTP).
3. Le modifiche dell'agente appaiono in tempo reale in qualsiasi scheda aperta che mostra quel diagramma, senza bisogno di ricaricare — durante il lavoro viene mostrato un indicatore "MCP sta scrivendo...".

Le icone integrate viaggiano solo tramite id (nessun dato base64 inviato all'agente), e `update_diagram_patch` permette a un agente di inviare solo i campi modificati invece di reinviare l'intero modello.

## Aggiunto di recente

### Multiplexing dei connettori
<img src="../demos/connectors.gif" alt="Multiplexed connectors demo" />

### Copia e incolla degli elementi
<img src="../demos/copy-paste-demo.gif" alt="Copy pasting demo" />

## Contribuire

I contributi sono benvenuti! Consulta [CONTRIBUTING.md](../CONTRIBUTING.md) per le linee guida.

## Documentazione

- [ISENAX_ENCYCLOPEDIA.md](ISENAX_ENCYCLOPEDIA.md) - Guida completa al codice
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Linee guida per contribuire

## Licenza

MIT
