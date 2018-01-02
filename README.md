# websockets-raw
Fiddling with the websocket protocol. No dependencies. A work in progress.

### api
Event emitter pattern for server and client i.e register event listeners with `on` and `emit` them with data.

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
- [ ] check FIN for continuation

# usage
```bash
$ node server.js
```

# refs
- [the websockets protocol rfc6455](https://tools.ietf.org/html/rfc6455)
- [data frames for dummies](http://lucumr.pocoo.org/2012/9/24/websockets-101/)
- js implementation of data frame encoding/decoding taken from [here](http://stackoverflow.com/questions/8125507/how-can-i-send-and-receive-websocket-messages-on-the-server-side)
- [ws client](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
- [ws server](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers)
- [npm ws tests](https://github.com/karlpokus/ws/blob/master/test/Receiver.test.js)

# license
MIT
