// ... Twój kod bez zmian aż do switch ...

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
      time: new Date().toLocaleTimeString(),
    };

    // Jeśli przychodzi tekst
    if (typeof data.text === 'string') {
      msg.text = data.text;
    }
    // Jeśli przychodzi obraz Base64 w polu image
    else if (typeof data.image === 'string') {
      msg.image = data.image;
    } else {
      return; // nieobsługiwany format
    }

    messages.push(msg);

    // Zapisz wiadomości
    fs.writeFile(MESSAGE_FILE, JSON.stringify(messages, null, 2), () => {});

    // Wyślij do wszystkich
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'message', ...msg }));
      }
    });
    break;
}
