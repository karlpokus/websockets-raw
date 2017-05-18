# websockets-raw
Fiddling with the websocket protocol. No dependencies. A work in progress.

### api
Eventemitter pattern for server and client i.e register event listeners with `on` and `emit` them with data.

# todos
- [x] ws handshake (Note: the server handshake response requires an empty line in the end. Only 4+ hours debugging. Good times!)
- [x] decode data frames from client
- [x] encode data frames to client
- [x] unified eventemitter pattern api
- [x] vueJS client
- [x] global log
- [x] remove all app parts from lib
- [x] userlist and messages on new connection
- [x] addMessage
- [x] updateUser
- [ ] decode connection ended from client
- [ ] monitor `socket.bufferSize`
- [ ] consistent payloads

# usage
```bash
$ node server.js
```

# refs
- [good src on data frames](http://lucumr.pocoo.org/2012/9/24/websockets-101/)
- js implementation of data frame encoding/decoding taken from [here](http://stackoverflow.com/questions/8125507/how-can-i-send-and-receive-websocket-messages-on-the-server-side)
- [ws client](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
- [ws server](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers)

# license
MIT
