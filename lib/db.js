const redis = require('redis'),
			sub = redis.createClient(),
			pub = redis.createClient(),
			store = redis.createClient(),
			capture = require('./capture');

const db = {
	remove(k, v) {
		const { trx, exit } = capture.start('/removeUser');
		store.srem(k, v, () => { capture.endExit(trx, exit) });
	},
	save(k, v) {
		const { trx, exit } = capture.start('/saveUser');
		store.sadd(k, v, () => { capture.endExit(trx, exit) });
	},
	publishUserlist() {
		const { trx, exit, cinfo } = capture.start('/publishUserlist');
		store.smembers('users', (err, users) => {
			pub.publish('userlist', JSON.stringify({ users, cinfo }), () => { capture.endExit(trx, exit) });
		});
	},
	publish(event, payload, id) {
		const { trx, exit, cinfo } = capture.start('/publish');
		pub.publish('events', JSON.stringify({
			event, payload, from: id, cinfo
		}), () => { capture.endExit(trx, exit) });
	},
	listen(ws) {
		sub
			.on('ready', () => {
				ws.emit('log', 'redis sub is ready');
			})
			.on('message', (channel, data) => {
				if (channel === 'events') {
					const { event, payload, from, cinfo } = JSON.parse(data);
					capture.endEntry(cinfo);
					ws.emit(event, payload, from);
				}
				if (channel === 'userlist') {
					const { users, cinfo } = JSON.parse(data);
					capture.endEntry(cinfo);
					ws.replyAll('userlist', { userlist: users });
				}
			});

		sub.subscribe('events', 'userlist');
	}
};

module.exports = db;
