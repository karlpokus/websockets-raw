const http = require('http'),
      PORT = process.env.PORT || 3000,
      fs = require('fs'),
      server = http.createServer(),
      wsServer = require('./lib/ws-server'),
      sendClient = (req, res) => {
        fs.createReadStream('./client.html').pipe(res);
      },
      ws = new wsServer(),
      messages = [],
      getUserlist = function(arr) {
        return arr.map(socket => socket.user);
      };

ws
  .on('connection', function(data, socket){ // data is null
    this.emit('log', `${socket.id} connected`);
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
      user: socket.user,
      msg: data.msg
    };

    messages.push(payload);
    this.replyAll('messageAdded', payload);
  })
  .on('updateUser', function(data, socket){
    socket.user = data.user;
    this.replyAll('userlist', {userlist: getUserlist(this.connections)});
  });

server
  .on('request', sendClient)
  .on('upgrade', ws.upgrade.bind(ws))
  .listen(PORT, () => {console.log('listening..')});
