var encode = require('./encode'),
    decode = require('./decode'),
    uuid = require('./uuid'),
    crypto = require('crypto'),
    util = require('util'),
    ee = require('events');

// ctor
var srv = function() {
  ee.call(this);
  this.connections = [];

  this
    .on('error', function(err, socket){
      console.error('err', socket.id || 'no id', err.message);
    })
}
util.inherits(srv, ee);

srv.prototype.removeSocket = function(id) {
  this.connections = this.connections.filter(socket => socket.id !== id);
}

srv.prototype.addSocket = function(socket) {
  socket.id = uuid();
  socket.user = 'john doe';
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

srv.prototype.upgrade = function(req, socket, head) {
  // fyi req.end() is already called
  var self = this;

  socket
    .on('error', function(err) {
      self.emit('error', err, socket);
    })
    .on('data', function(chunk) {
      try {
        var data = JSON.parse(decode(chunk));
        if (data.event === 'connection') {
          self.addSocket(socket);
          self.emit('log', self.connections.length + ' connections');
        }
        self.emit(data.event, data.payload, socket);

      } catch(e) {
        console.error('socket data catch err', e.message); // >_<
      }
    })
    .on('end', function() {
      if (socket.id) {
        // need to end manually too?
        // https://nodejs.org/api/net.html#net_event_end
        self.removeSocket(socket.id);
        self.emit('log', `${socket.id} disconnected`);
      } else {
        self.emit('log', 'unknown connection ended');
      }
    })
    .on('close', function(hadErr){
      self.emit('log', 'socket closed. transmission error ', hadErr);
    })
    .on('timeout', function(){
      self.emit('log', `${socket.id} timed out`);
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
