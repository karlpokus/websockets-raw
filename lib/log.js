module.exports = (type, msg) => {
	const id = process.env.WORKER_ID;

	if (!msg) {
		msg = type;
		type = 'log';
	}

	console[type](`worker ${ id }: ${ msg }`);
}
