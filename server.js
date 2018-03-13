const http = require('http'),
      PORT = process.env.PORT || 3000,
      fs = require('fs'),
      server = http.createServer(),
      wsServer = require('./lib/ws-server'),
      ws = new wsServer(),
			log = require('./lib/log'),
			sendFile = (filepath, res) => {
				fs.createReadStream('.' + filepath).pipe(res);
			};

ws
  .on('connection', function(data, socket){ // data is null
		this.replyOne(socket, 'initialData', {
			username: socket.user.id
		});
  })
  .on('log', function(...args){
    log(args.join(' '));
  })
	.on('error', function(err, socket){
		log(`error ${ err } on ${ socket.user.id }`);
	})
  .on('addMessage', function(data, from) {
		this.replyAll('messageAdded', {
			user: from,
			msg: data.msg
		});
  });

server
  .on('request', (req, res) => {
		if (req.url === '/') { // root html
			sendFile('/static/client.html', res);

		} else if (/static/.test(req.url)) { // static files
			sendFile(req.url, res);

		} else {
			res.writeHead(404);
			res.end();
		}
	})
  .on('upgrade', ws.upgrade.bind(ws))
  .listen(PORT, () => { log('http running')});
