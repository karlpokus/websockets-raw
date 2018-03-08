function wsClient(url) {
	this.router = {};
	this.ws = new WebSocket(url);
	this.ws.onopen = this._emitEventByType.bind(this);
	this.ws.onerror = this._emitEventByType.bind(this);
	this.ws.onclose = this._emitEventByType.bind(this);
	this.ws.onmessage = this._onmessage.bind(this);
}

wsClient.prototype._emitEventByType = function(e) {
	if (this.router[e.type]) {
		this.router[e.type](e);
	}
}

wsClient.prototype._onmessage = function (e) {
	var data = JSON.parse(e.data);

	if (this.router[data.event]) {
		this.router[data.event](data.payload); // already bound to ws in `on`
	}
}

wsClient.prototype.on = function(e, cb) {
	this.router[e] = cb.bind(this);
	return this;
}

wsClient.prototype.emit = function(e, payload) {
	this.ws.send(JSON.stringify({
		event: e,
		payload: payload
	}));
	return this;
}

wsClient.prototype.die = function() {
	this.ws.close();
}
