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
    .on('error', function(err, id){
      console.error('err', id, err.message);
    })
    .on('data', function(chunk, id){
      var data = JSON.parse(decode(chunk));
      this.emit(data.event, data.payload, id);
    })
}
util.inherits(srv, ee);

srv.prototype.getSocketById = function(id) {
  return this.connections
    .filter(function(socket){
      return socket.id === id;
    })[0];
}

srv.prototype.replyOne = function(id, event, payload) {
  var socket = this.getSocketById(id),
      payload = JSON.stringify({
        event: event,
        payload: payload
      });

  socket.write(Buffer.from(encode(payload)));
}

srv.prototype.replyAll = function(e, data) {

}

srv.prototype.upgrade = function(req, socket, head) {
  // fyi req.end() is already called

  var self = this;
  self.connections.push(socket);
  socket.id = uuid();

  socket
    .on('error', function(err) {
      self.emit('error', err, this.id);
    })
    .on('data', function(chunk) {
      self.emit('data', chunk, this.id);
    })
    .on('end', () => {

      // fix!
      console.log('end event fired');
    })

  this._sendHandshake(socket, req.headers['sec-websocket-key']);
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
