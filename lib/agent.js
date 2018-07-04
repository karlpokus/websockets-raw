const appd = require('appdynamics');

const {
	controllerHostName,
	accountAccessKey,
	accountName,
	applicationName
} = require('../secrets');

const start = tierName => {
	appd.profile({
		controllerHostName,
	  controllerPort: 443,
	  controllerSslEnabled: true,
	  accountName,
	  accountAccessKey,
	  applicationName,
	  tierName,
		nodeName: tierName,
		libagent: true
	});
	return appd;
}

module.exports = { start };
