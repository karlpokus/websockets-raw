# websockets-raw
Fiddling with the websocket protocol. Interface is an event emitter pattern for server and client passing json. No dependencies. A constant work in progress. Clustering requires redis pub/sub.

# usage
### client
browser

```js
// assuming the server is listening on port 3000
ws = new wsClient('ws://localhost:3000');
```
Add event listeners for events from server or client built-ins with a chainable `on`. Listeners will be passed server data and have the ws instance as `this`.

client built-in events
- `ready` emitted on client after connection to server is made. A `connection` event is triggered before this.
- `reconnecting` emitted before client reconnection attempt.
- `reconnectionFail` emitted after reconnection failure. The client is dead at this point. Reload.
- `userlist` a complete userlist. Emitted from server on each new user

```js
ws.on('ready', () => app.status = 'connected') // built-in
	.on('initialData', data => { // custom
		app.userlist = data.userlist;
		app.messages = data.messages;
	});
// emit arbitrary events and pass some data
ws.emit('updateUser', {user: 'user'});
```

client cli

```bash
$ ./lib/cli-ws-client.js
```

### server
```js
const httpServer = http.createServer();
const wsServer = require('./lib/ws-server');
const ws = new wsServer();
```
Like on the client - add event listeners for client events or server built-ins. Listeners will be passed client data and the client socket and have the ws instance as `this`. All sockets are stored in memory in the connections array on the instance. Each socket object also has the properties `name` and `id`. Reply one client with `replyOne` and all of them with `replyAll`.

server built-in events
- `connection` fired after client connected
- `log` emitted here and there. Listen if your curious.

```js
ws.on('connection', function(data, socket){ // built-in
	this.replyOne(socket, 'initialData', {
		userlist: getUserlist(this.connections),
		messages: messages
	});
})
// listen on the upgrade event
httpServer.on('upgrade', ws.upgrade.bind(ws));
```
note: it's entirely optional to for client or server to listen for events. They will be emitted regardless.

start server
```bash
# run standard
$ npm start
# run with appdynamics monitoring enabled. requires a license
$ npm run startmonit
```
### client reconnection
The server will send an `end` event for all connected clients on `SIGINT`. This enables client to reconnect on the end event. Default is 3 reconnection attempts.

### persistance
- `messages` are transient and not queued
- `users` are stored in redis.

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
- [x] heartbeats via pings and pongs in opcode as opposed to payload event
- [ ] monitor `socket.bufferSize`
- [x] call end on socket on event end
- [x]	option to end connection on client
- [ ] send binary data in control frame
- [ ] check FIN for continuation frame
- [x] add client reconnect on socket end
- [ ] add new sockets by id as key in connections object
- [x] try cluster and pm2 reloads
- [ ] webpack?
- [ ] add dm

# refs
- [the websockets protocol rfc6455](https://tools.ietf.org/html/rfc6455)
- [data frames for dummies](http://lucumr.pocoo.org/2012/9/24/websockets-101/)
- js implementation of data frame encoding/decoding taken from [here](http://stackoverflow.com/questions/8125507/how-can-i-send-and-receive-websocket-messages-on-the-server-side)
- [ws client](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
- [ws server](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers)
- [npm ws tests](https://github.com/karlpokus/ws/blob/master/test/Receiver.test.js)

# license
MIT
