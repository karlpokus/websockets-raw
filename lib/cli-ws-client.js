#!/usr/bin/env node

// TODO
// is handshake done?
// x send connection event
// try piping socket to stdout
// x add mask
// x pipe to dataFrame
// validate sec-websocket-accept
// https://github.com/websockets/ws/blob/master/lib/websocket.js#L604
// x mask for all payload lenghts

const	encode = require('./encode'),
			opcode = require('./opcode'),
			decode = require('./decode'),
			crypto = require('crypto'),
			http = require('http'),
			{ Transform } = require('stream'),
			key = crypto.randomBytes(16).toString('base64');

const encoder = new Transform({
	transform(chunk, enc, cb) {
		const payload = JSON.stringify({
			event: 'addMessage',
			payload: {
				msg: chunk.toString()
			}
		});

		this.push(Buffer.from(encode(payload, true)));
		cb();
	}
});

/*
const decoder = new Transform({
	transform(chunk, enc, cb) {
});
*/

function reply(socket, event, data) {
	const payload = JSON.stringify({ event, payload: data });
	socket.write(Buffer.from(encode(payload, true)));
}

function logByEvent(event, payload) {
	let out;

	if (event === 'initialData') {
		out = `you are ${ payload.username }`;
	}

	if (event === 'messageAdded') {
		out = `${ payload.user } : ${ payload.msg }`;
	}

	if (event === 'userlist') {
		out = `users: ${ payload.userlist }`;
	}

	console.log(out);
}

function start() {
	const opts = {
		port: 3000,
		headers: {
			'Connection': 'Upgrade',
			'Upgrade': 'websocket',
			'Sec-WebSocket-Key': key
		}
	}

	http.request(opts)
		.on('upgrade', (req, socket, head) => {

			process.on('SIGINT', () => { socket.end(); process.exit(); });

			process.stdin.pipe(encoder).pipe(socket);
			// socket.pipe(decoder).pipe(process.stdout);

			socket
				.on('data', chunk => {
					const op = opcode(chunk);

					if (op === 1) { // text
						try {
							const { event, payload = {} } = JSON.parse(decode(chunk, true));
							logByEvent(event, payload);

						} catch(err) {
							out = 'json parsing error probably';
						}

					} else if (op === 8) { // connection close
						console.log('connection closed from server');

					} else if (op === 9) { // ping
						socket.write(Buffer.from('8a00', 'hex')); // pong

					} else {
						console.log('unknown opcode');
					}

				})
				.on('end', () => {
					console.log('server ended socket. exiting..');
					process.exit(0);
				});

			reply(socket, 'connection', null);

		})
		.on('response', socket => {
			console.log('response called');
		})
		.end();
}

start();
