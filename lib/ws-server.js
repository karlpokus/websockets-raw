const encode = require('./encode'),
			opcode = require('./opcode'),
			decode = require('./decode'),
			crypto = require('crypto'),
			util = require('util'),
			ee = require('events'),
			log = require('./log'),
			redis = require('redis'),
			sub = redis.createClient(),
			pub = redis.createClient(),
			store = redis.createClient();

var srv = function() {
  ee.call(this);
  this.connections = [];

	process.on('SIGINT', () => {
		// remove these users from redis
		store.srem('users', this.connections.map(socket => socket.user.id));

		this.killSockets(this.connections, () => {
			this.emit('log', 'done. exiting');
			process.exit(0);
			// no need to removeSocket from connections - is in mem will die regardless
			// let new connections publish (new) userlist
		});
	});

  setInterval(this.heartbeat.bind(this), 10000);

	sub
		.on('ready', () => {
			this.emit('log', 'redis sub is ready');
		})
		.on('message', (channel, data) => {
			if (channel === 'events') {
				const { event, payload, from } = JSON.parse(data);
				this.emit(event, payload, from);
			}
			if (channel === 'userlist') {
				this.replyAll('userlist', { userlist: JSON.parse(data) });
			}
		});

	sub.subscribe('events', 'userlist');
}

util.inherits(srv, ee);

srv.prototype.killSockets = function(sockets, cb) {
	if (!sockets.length) {
		return cb();
	}

	this.emit('log', `closing ${ sockets.length } sockets`);

	const payload = sockets.map(socket => new Promise(resolve => {
		socket.end();
		resolve();
	}));
	Promise.all(payload).then(cb);
}

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
	store.srem('users', id);
}

srv.prototype.addSocket = function(socket) {
	// add socket to array
	// user keys: id, idle
	const id = crypto.randomBytes(4).toString('hex');

  socket.user = { id };
  this.connections.push(socket);

	// add user to redis
	store.sadd('users', id);
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

srv.prototype.upgrade = function(req, socket, head) { // req.end() is already called
  var self = this;

  socket
    .on('error', function(err) {
      self.emit('error', err, socket);
    })
    .on('data', function(chunk) {
			var op = opcode(chunk);

			if (op === 1) { // text
				const { event, payload } = JSON.parse(decode(chunk)); // chunk should be valid json

				if (event === 'connection') {
          self.addSocket(socket);
          var logString = `${socket.user.id} connected. ${self.connections.length} connections`
          self.emit('log',  logString);

					// emit directly
					self.emit(event, payload, socket);

					// and publish new userlist TODO: add this to addSocket?
					store.smembers('users', (err, users) => {
						pub.publish('userlist', JSON.stringify(users));
					});

        } else {

					// publish to all workers
					pub.publish('events', JSON.stringify({
						event, payload, from: socket.user.id
					}));

				}

			} else if (op === 8) { // connection close
				socket.end();

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
    })
    .on('close', function(hadErr){
			if (hadErr) {
				self.emit('log', `${socket.user.id} closed with transmission error ${hadErr}`);
			}
    })
    .on('timeout', function(){
      self.emit('log', `${ (socket.user && socket.user.id)? socket.user.id : 'someone'} timed out`);
			socket.end();
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
