function encodeWebSocket(bytesRaw){
    var bytesFormatted = new Array();
    bytesFormatted[0] = 129;
    if (bytesRaw.length <= 125) {
        bytesFormatted[1] = bytesRaw.length;
    } else if (bytesRaw.length >= 126 && bytesRaw.length <= 65535) {
        bytesFormatted[1] = 126;
        bytesFormatted[2] = ( bytesRaw.length >> 8 ) & 255;
        bytesFormatted[3] = ( bytesRaw.length      ) & 255;
    } else {
        bytesFormatted[1] = 127;
        bytesFormatted[2] = ( bytesRaw.length >> 56 ) & 255;
        bytesFormatted[3] = ( bytesRaw.length >> 48 ) & 255;
        bytesFormatted[4] = ( bytesRaw.length >> 40 ) & 255;
        bytesFormatted[5] = ( bytesRaw.length >> 32 ) & 255;
        bytesFormatted[6] = ( bytesRaw.length >> 24 ) & 255;
        bytesFormatted[7] = ( bytesRaw.length >> 16 ) & 255;
        bytesFormatted[8] = ( bytesRaw.length >>  8 ) & 255;
        bytesFormatted[9] = ( bytesRaw.length       ) & 255;
    }
    for (var i = 0; i < bytesRaw.length; i++){
        bytesFormatted.push(bytesRaw.charCodeAt(i));
    }
    return bytesFormatted;
}

function decodeWebSocket(data){
    var datalength = data[1] & 127;
    var indexFirstMask = 2;
    if (datalength == 126) {
        indexFirstMask = 4;
    } else if (datalength == 127) {
        indexFirstMask = 10;
    }
    var masks = data.slice(indexFirstMask,indexFirstMask + 4);
    var i = indexFirstMask + 4;
    var index = 0;
    var output = "";
    while (i < data.length) {
        output += String.fromCharCode(data[i++] ^ masks[index++ % 4]);
    }
    return output;
}

const http = require('http'),
      PORT = process.env.PORT || 1234,
      fs = require('fs'),
      crypto = require('crypto'),
      server = http.createServer(),
      sendClient = (req, res) => {
        fs.createReadStream('./client.html').pipe(res);
      },
      computeAcceptHeader = (clientKey) => {
        const magicString = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
              shasum = crypto.createHash('sha1');
        
        shasum.update(clientKey + magicString);
        return shasum.digest('base64');
      },
      createWS = (req, socket, head) => {
        // fyi
        // socket.pipe(socket); -> A server must not mask any frames that it sends to the client
        // req.end() is called here
        
        var acceptHeader = computeAcceptHeader(req.headers['sec-websocket-key']);
        
        socket // 'connect'
          .on('error', (err) => {
            console.error(err.message);
          })
          .on('data', (x) => {
            console.log(decodeWebSocket(x));
            
            socket.write(Buffer.from(encodeWebSocket('hi from server!')));
          })
          .on('end', () => {
            console.log('end event fired');
          })
        
        
        socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
        //socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
               'Upgrade: WebSocket\r\n' +
               'Connection: Upgrade\r\n' +
               'Sec-WebSocket-Accept: ' + acceptHeader + '\r\n' +
               '\r\n');
      };
      
server
  .on('request', sendClient)
  .on('upgrade', createWS)
  .listen(PORT, () => {console.log('listening..')});