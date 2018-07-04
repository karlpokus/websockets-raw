let appd;

const capture = {
	start(bt) {
		const trx = appd.startTransaction(bt);
		let exit = trx.startExitCall({
			exitType: 'EXIT_CACHE',
			label: 'Redis',
			backendName: 'Redis',
			identifyingProperties: {
				"HOST": 'localhost',
				"PORT": 6379
			}
		});
		let cinfo = trx.createCorrelationInfo(exit);
		return { trx, exit, cinfo };
	},
	endExit(trx, exit, cb) {
		trx.endExitCall(exit);
		trx.end();
		if (cb) cb();
	},
	endEntry(cinfo) {
		const ch = appd.parseCorrelationInfo(cinfo);
		const trx = appd.startTransaction(ch);
		trx.end();
	}
};

const noop = () => {};
const disableMonitoring = obj => Object.keys(obj).reduce((base, key) => { base[key] = noop; return base }, {});

if (process.env.MONITOR === "1") {
	appd = require('./agent').start('server');
	module.exports = capture;
} else {
	module.exports = disableMonitoring(capture);
}
