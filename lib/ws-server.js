var encode = require('./encode'),
    decode = require('./decode'),
    crypto = require('crypto'),
    util = require('util'),
    ee = require('events');

// ctor
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
          this.replyOne(socket, 'ping', null);
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
        
        // event: connection
        if (data.event === 'connection') {
          self.addSocket(socket);

          var logString = `${socket.user.id} connected. ${self.connections.length} connections`
          self.emit('log',  logString);
          
          // event: pong
        } else if (data.event === 'pong') {
          socket.user.idle = false;
          return
        }
        
        self.emit(data.event, data.payload, socket);

      } catch(e) {
        console.error('socket data catch err', e.message); // >_<
      }
    })
    .on('end', function() {
      if (socket.user && socket.user.id) {
        // need to end manually too? Otherwise they timeout
        // https://nodejs.org/api/net.html#net_event_end
        self.removeSocket(socket.user.id);
        self.emit('log', `${socket.user.id} disconnected. ${self.connections.length} connections`);
      } else {
        self.emit('log', 'unknown connection ended');
      }
    })
    .on('close', function(hadErr){
      self.emit('log', `${socket.user.id} closed. transmission error ${hadErr}`);
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
