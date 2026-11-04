# Kanban Board

Applicazione web per organizzare progetti e attività con una board Kanban. Include un backend REST basato su Express e MongoDB e un frontend in HTML, CSS e JavaScript.

## Funzionalità

### Frontend

- **Accesso e registrazione:** creazione di un account con nome, username, email e password; accesso con username e password. La sessione usa un token JWT salvato nel browser; le pagine protette reindirizzano all'accesso quando non è presente un token e la sessione viene chiusa se il server restituisce un errore `401`.
- **Board del progetto:** selezione del progetto e tre viste: riepilogo, lista e board. La board organizza le task nelle colonne `Inbox`, `To Do`, `In Progress`, `In Review` e `Done`; le task si possono spostare tra colonne trascinandole.
- **Riepilogo e lista:** conteggio delle task per stato e grafici di distribuzione per priorità e tipo di lavoro; la lista mostra tipo, riepilogo, stato, priorità, assegnatario e scadenza.
- **Ricerca e filtri delle task:** ricerca per riepilogo, filtro per priorità e tipo di lavoro e opzione per mostrare solo le task assegnate all'utente corrente. Le task scadute non completate sono evidenziate.
- **Gestione delle task:** creazione e modifica di riepilogo, descrizione, stato, tipo, priorità, assegnatario e scadenza; assegnazione a sé stessi o a un membro del team; eliminazione. Ogni task mostra anche chi l'ha creata.
- **Commenti, issue e log di lavoro:** aggiunta di commenti e issue alle task, riapertura o risoluzione di un'issue, eliminazione dei commenti consentiti e registrazione o eliminazione dei propri log di lavoro.
- **Progetti:** elenco dei progetti personali e del team, ricerca per nome e filtro per stato (`Pianificato`, `In corso`, `Completato`). È possibile creare, modificare ed eliminare i propri progetti; l'eliminazione rimuove anche le relative task.
- **Team:** creazione di un team o ingresso tramite codice d'invito; visualizzazione e ricerca dei membri; copia del codice d'invito; modifica e rimozione dei membri da parte dell'amministratore; uscita dal team da parte dei membri e cancellazione del team da parte dell'amministratore.
- **Account e preferenze:** modifica di nome, username, ruolo e biografia (massimo 500 caratteri), attivazione del tema scuro e uscita dalla sessione. L'email è visualizzata ma non modificabile.
- **Interfaccia adattabile:** layout con navigazione tra board, progetti, team e account; preferenza del tema e progetto selezionato conservati nel browser.

### Backend

- **API REST versionata** sotto `/api/v1`, realizzata con Express.
- **Autenticazione:** registrazione e accesso; password protette con hash bcryptjs e token JWT con scadenza configurabile.
- **Accesso autenticato:** tutte le API di utenti, team, progetti e task richiedono un token `Bearer`. I progetti e le task sono accessibili al proprietario e, quando associati, ai membri del team autorizzato.
- **Gestione utenti:** recupero e aggiornamento del proprio profilo e consultazione dei profili visibili nello stesso team.
- **Gestione progetti:** creazione, elenco, filtro per stato, lettura, modifica e cancellazione. Solo il proprietario può modificare o cancellare un progetto.
- **Gestione team:** creazione, consultazione, modifica e cancellazione; ingresso con codice d'invito, elenco dei membri e rimozione di un membro. Le modifiche e la cancellazione del team sono riservate all'amministratore.
- **Gestione task:** creazione nel contesto di un progetto, elenco con filtri e ordinamento, consultazione, modifica e cancellazione. Le assegnazioni sono limitate al proprietario del progetto o ai membri del team associato.
- **Collaborazione sulle task:** API per commenti, issue con stato di risoluzione e log di lavoro, con controlli per limitare modifica e cancellazione ai rispettivi autori o, nei casi previsti, al proprietario del progetto.
- **Persistenza e validazione:** modelli Mongoose con campi obbligatori, valori ammessi e limiti di lunghezza. Il middleware centralizza la gestione degli errori HTTP, di validazione, degli identificativi e dei conflitti per valori univoci.
- **File statici:** Express serve le pagine, gli script, gli stili e le immagini contenuti in `public/`.

## Pagine dell'applicazione

| Pagina | Percorso | Contenuto |
|---|---|---|
| Board | `/index.html` | Viste e gestione delle task del progetto selezionato |
| Accesso | `/pages/login.html` | Accesso e registrazione |
| Progetti | `/pages/projects.html` | Ricerca, filtro e gestione dei progetti |
| Team | `/pages/team.html` | Membri, inviti e gestione del team |
| Account | `/pages/account.html` | Profilo, tema e sessione |

## API

Le risposte sono in JSON. Gli endpoint sotto `/api/v1/auth` sono pubblici; tutti gli altri richiedono l'intestazione:

```http
Authorization: Bearer <token>
```

### Autenticazione — `/api/v1/auth`

| Metodo | Percorso | Operazione |
|---|---|---|
| `POST` | `/register` | Registra un utente e restituisce utente e token; la password deve contenere almeno 8 caratteri |
| `POST` | `/login` | Autentica con username e password e restituisce utente e token |

### Utenti — `/api/v1/users`

| Metodo | Percorso | Operazione |
|---|---|---|
| `GET` | `/me` | Recupera l'utente autenticato |
| `PATCH` | `/me` | Aggiorna nome, username, ruolo (`job_title`) e biografia |
| `GET` | `/:id` | Recupera un profilo visibile all'utente autenticato |

### Progetti — `/api/v1/projects`

| Metodo | Percorso | Operazione |
|---|---|---|
| `GET` | `/` | Elenca i progetti accessibili; supporta il filtro `status` |
| `POST` | `/` | Crea un progetto con titolo, descrizione, obiettivo e stato |
| `GET` | `/:id` | Recupera un progetto accessibile |
| `PATCH` | `/:id` | Aggiorna titolo, descrizione, obiettivo o stato (solo proprietario) |
| `DELETE` | `/:id` | Elimina il progetto e le sue task (solo proprietario) |
| `GET` | `/:id/tasks` | Elenca le task del progetto |
| `POST` | `/:id/tasks` | Crea una task nel progetto |

L'elenco delle task supporta i parametri `status`, `priority`, `work_type`, `assignee`, `search` e `sort`. Per filtrare le task assegnate all'utente autenticato, usare `assignee=me`. Gli ordinamenti ammessi sono `due_date`, `-due_date`, `createdAt` e `-createdAt`.

### Team — `/api/v1/teams`

| Metodo | Percorso | Operazione |
|---|---|---|
| `POST` | `/` | Crea un team; il creatore ne diventa amministratore e riceve un codice d'invito |
| `PATCH` | `/join` | Entra in un team usando `inviteCode` |
| `GET` | `/:id` | Recupera il team di appartenenza |
| `PATCH` | `/:id` | Modifica nome, descrizione e obiettivo (solo amministratore) |
| `DELETE` | `/:id` | Elimina il team e scollega membri e progetti (solo amministratore) |
| `GET` | `/:id/members` | Elenca i membri del team |
| `DELETE` | `/:teamId/members/:userId` | Abbandona il team o rimuove un membro (quest'ultima operazione è riservata all'amministratore) |

L'amministratore non può abbandonare il team: deve eliminarlo.

### Task — `/api/v1/tasks`

| Metodo | Percorso | Operazione |
|---|---|---|
| `GET` | `/:id` | Recupera una task con assegnatario, autore, commenti e log di lavoro |
| `PATCH` | `/:id` | Aggiorna riepilogo, descrizione, stato, tipo, priorità, scadenza o assegnatario |
| `DELETE` | `/:id` | Elimina una task (solo autore della task o proprietario del progetto) |
| `POST` | `/:id/comments` | Aggiunge un commento; `isIssue: true` lo contrassegna come issue |
| `PATCH` | `/:id/comments/:commentId` | Modifica un commento (solo autore) o aggiorna lo stato di risoluzione di un'issue |
| `DELETE` | `/:id/comments/:commentId` | Elimina un commento (autore o proprietario del progetto) |
| `POST` | `/:id/worklogs` | Registra un log di lavoro |
| `DELETE` | `/:id/worklogs/:worklogId` | Elimina un log di lavoro (solo autore) |

## Modelli e valori

- **Utente (`User`):** nome, username, email, password con hash, ruolo, biografia e riferimento al team. Username ed email sono univoci.
- **Progetto (`Project`):** titolo (massimo 30 caratteri), descrizione (massimo 500), obiettivo, stato, proprietario e team. Gli stati ammessi sono `planned`, `active` e `completed`.
- **Team (`Team`):** nome, descrizione, obiettivo, amministratore, membri e codice d'invito univoco.
- **Task (`Task`):** riepilogo (massimo 100 caratteri), descrizione (massimo 500), stato, tipo di lavoro, priorità, scadenza, assegnatario, autore, progetto, commenti e log di lavoro.
  - Stati: `inbox`, `todo`, `in_progress`, `in_review`, `done`.
  - Tipi di lavoro: `frontend`, `backend`, `deploy`, `design`, `other`.
  - Priorità: `urgent`, `important`, `medium`, `low`, `lowest`.
  - Commenti e log di lavoro supportano testo fino a 1000 caratteri; i commenti possono essere issue e le issue hanno un indicatore di risoluzione.

## Tecnologie

- **Backend:** Node.js, Express 5, Mongoose, MongoDB, bcryptjs, JSON Web Token e dotenv.
- **Frontend:** HTML, CSS e JavaScript; Axios per le richieste API.
- **Avvio in sviluppo:** Nodemon.

## Avvio in locale

Prerequisiti: Node.js/npm e un'istanza MongoDB raggiungibile (locale o MongoDB Atlas).

1. Installa le dipendenze:

   ```bash
   npm install
   ```

2. Crea un file `.env` nella cartella principale. Configura la stringa di connessione e un segreto JWT; le altre variabili sono facoltative:

   ```dotenv
   MONGO_URI=mongodb://127.0.0.1:27017/kanban-board
   JWT_SECRET=sostituisci-con-un-segreto-lungo-e-casuale
   JWT_EXPIRES=7d
   PORT=3000
   ```

   `JWT_EXPIRES` imposta la durata del token (predefinita: `7d`); `PORT` imposta la porta HTTP (predefinita: `3000`). Non condividere né versionare il file `.env`.

3. Avvia il server:

   ```bash
   npm start
   ```

4. Apri `http://localhost:3000`.
