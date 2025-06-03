const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const ACCESS_CODE = 'ZAQ!2wsx';

const USERS = {
  yung: '1234',
  czarny: '1234',
};

const MESSAGE_FILE = path.join(__dirname, 'messages.json');
let messages = [];

// Wczytaj poprzednie wiadomości
try {
  if (fs.existsSync(MESSAGE_FILE)) {
    const raw = fs.readFileSync(MESSAGE_FILE);
    messages = JSON.parse(raw);
  }
} catch (err) {
  console.error('Nie można wczytać wiadomości:', err);
}

wss.on('connection', (ws) => {
  let loggedInUser = null;

  // Wyślij wszystkie zapisane wiadomości po połączeniu
  ws.send(JSON.stringify({ type: 'history', messages }));

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      return;
    }

    switch (data.type) {
      case 'access_code':
        if (data.code === ACCESS_CODE) {
          ws.send(JSON.stringify({ type: 'access_code', status: 'ok' }));
        } else {
          ws.send(JSON.stringify({ type: 'access_code', status: 'fail' }));
        }
        break;

      case 'login':
        if (USERS[data.username] === data.password) {
          loggedInUser = data.username;
          ws.send(JSON.stringify({ type: 'login', status: 'ok' }));
        } else {
          ws.send(JSON.stringify({ type: 'login', status: 'fail' }));
        }
        break;

      case 'message':
        if (!loggedInUser) return;
        const msg = {
          username: loggedInUser,
          text: data.text,
          time: new Date().toLocaleTimeString(),
        };
        messages.push(msg);

        // Zapisz wiadomości do pliku
        fs.writeFile(MESSAGE_FILE, JSON.stringify(messages, null, 2), () => {});

        // Wyślij do wszystkich klientów
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'message', ...msg }));
          }
        });
        break;
    }
  });
});

app.get('/', (req, res) => {
  res.send('Działa!');
});

server.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
