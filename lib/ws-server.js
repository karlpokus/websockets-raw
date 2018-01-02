var encode = require('./encode'),
		opcode = require('./opcode'),
    decode = require('./decode'),
    crypto = require('crypto'),
    util = require('util'),
    ee = require('events');

var srv = function() {
  ee.call(this);
  this.connections = [];

  this
    .on('error', function(err, socket){
      console.error('err', socket.user.id || 'no id', err.message);
    })

  setInterval(this.heartbeat.bind(this), 10000);
}

util.inherits(srv, ee);

srv.prototype.heartbeat = function() {
  if (this.connections.length) {
    this.connections
      .forEach(socket => {

        if (socket.user.idle) {
          socket.end();
        } else {
          socket.user.idle = true;
          //this.replyOne(socket, 'ping', null);
					socket.write(Buffer.from('8900', 'hex')); // send ping
        }
      });
  }
}

srv.prototype.removeSocket = function(id) {
  this.connections = this.connections.filter(socket => socket.user.id !== id);
}

srv.prototype.addSocket = function(socket) {
  socket.user = {
    id: crypto.randomBytes(4).toString('hex'),
    name: 'john doe'
  };

  this.connections.push(socket); // todo: check if already exist this might be a reconnect
}

srv.prototype.replyOne = function(socket, event, data) {
  var payload = JSON.stringify({
        event: event,
        payload: data
      });

  socket.write(Buffer.from(encode(payload)));
}

srv.prototype.replyAll = function(event, data) {
  this.connections
    .forEach(socket => {
      var payload = JSON.stringify({
        event: event,
        payload: data
      });
      socket.write(Buffer.from(encode(payload)));
    });
}

srv.prototype.upgrade = function(req, socket, head) { // fyi req.end() is already called
  var self = this;

  socket
    .on('error', function(err) {
      self.emit('error', err, socket);
    })
    .on('data', function(chunk) {
			var op = opcode(chunk);

			if (op === 1) { // opcode: text
				const { event, payload } = JSON.parse(decode(chunk)); // chunk should be valid json

				if (event === 'connection') { // event: connection
          self.addSocket(socket);
          var logString = `${socket.user.id} connected. ${self.connections.length} connections`
          self.emit('log',  logString);
        }
        self.emit(event, payload, socket);

			} else if (op === 8) { // connection close
				socket.end(); // needed?

			} else if (op === 10) { // pong
				socket.user.idle = false;

			} else {
				self.emit('log', `Error: Unknown opcode: ${ opcode }`);
			}
    })
    .on('end', function() {
      if (socket.user && socket.user.id) {
        self.removeSocket(socket.user.id);
        self.emit('log', `${socket.user.id} disconnected. ${self.connections.length} connections left`);
      } else {
        self.emit('log', 'unknown connection ended');
      }
      socket.end(); // https://nodejs.org/api/net.html#net_event_end
    })
    .on('close', function(hadErr){
			if (hadErr) {
				self.emit('log', `${socket.user.id} closed with transmission error ${hadErr}`);
			}
    })
    .on('timeout', function(){
      self.emit('log', `${socket.user.id} timed out`);
    })

  this._sendHandshake(socket, req.headers['sec-websocket-key']); // option to add cb run after socket.write
}

srv.prototype._sendHandshake = function(socket, key) {
  var acceptHeader = this._computeAcceptHeader(key);

  socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
  //socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
         'Upgrade: WebSocket\r\n' +
         'Connection: Upgrade\r\n' +
         'Sec-WebSocket-Accept: ' + acceptHeader + '\r\n' +
         '\r\n');
}

srv.prototype._computeAcceptHeader = function(key) {
  const magicString = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
        shasum = crypto.createHash('sha1');

  shasum.update(key + magicString);
  return shasum.digest('base64');
}

module.exports = srv;
