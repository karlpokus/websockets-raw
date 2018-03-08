const http = require('http'),
      PORT = process.env.PORT || 3000,
      fs = require('fs'),
      server = http.createServer(),
      wsServer = require('./lib/ws-server'),
      ws = new wsServer(),
      messages = [],
			sendFile = (filepath, res) => {
				fs.createReadStream('.' + filepath).pipe(res);
			}
      getUserlist = sockets => sockets.map(socket => socket.user.name);

ws
  .on('connection', function(data, socket){ // data is null
    this.replyOne(socket, 'initialData', {
      userlist: getUserlist(this.connections),
      messages: messages
    });
  })
  .on('log', function(...args){
    console.log(args.join(' '));
  })
  .on('addMessage', function(data, socket) {
    var payload = {
      user: socket.user.name,
      msg: data.msg
    };

    messages.push(payload);
    this.replyAll('messageAdded', payload);
  })
  .on('updateUser', function(data, socket){
    socket.user.name = data.user;
    this.replyAll('userlist', {userlist: getUserlist(this.connections)});
  });

server
  .on('request', (req, res) => {
		if (req.url === '/') {
			sendFile('/static/client.html', res);

		} else if (/static/.test(req.url)) {
			sendFile(req.url, res);

		} else {
			res.writeHead(404);
			res.end();
		}
	})
  .on('upgrade', ws.upgrade.bind(ws))
  .listen(PORT, () => {console.log('listening..')});
