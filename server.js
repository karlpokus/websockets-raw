const http = require('http'),
      PORT = process.env.PORT || 3000,
      fs = require('fs'),
      server = http.createServer(),
      wsServer = require('./lib/ws-server'),
      sendClient = (req, res) => {
        fs.createReadStream('./client.html').pipe(res);
      },
      ws = new wsServer();

ws
  .on('clientCall', function(data, id){
    console.log(data.msg);

    this.replyOne(id, 'serverCall', {msg: 'hi from server'});
    // this.replyAll(event, data);
  })

server
  .on('request', sendClient)
  .on('upgrade', ws.upgrade.bind(ws))
  .listen(PORT, () => {console.log('listening..')});
