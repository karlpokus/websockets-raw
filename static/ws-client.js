function wsClient(url) {
	this.router = {};
	this.url = url;

	this._connectWebsocket.call(this);
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

wsClient.prototype.die = function(){
	this.ws.close();
}

wsClient.prototype._internalEmit = function(event) {
	if (this.router[event]){
		this.router[event]();
	}
}

wsClient.prototype._makeConnection = function(success, fail) {
	this.ws = new WebSocket(this.url);
	this.ws.onopen = success.bind(this);
	this.ws.onerror = this._emitEventByType.bind(this);
	this.ws.onclose = fail.bind(this);
	this.ws.onmessage = this._onmessage.bind(this);
}

wsClient.prototype._fails = 0;

wsClient.prototype._connectWebsocket = function() {
	var maxFails = 3;

	var success = function() {
		this._fails = 0;
		this.emit.call(this, 'connection', null);
		this._internalEmit.call(this, 'ready');
	}

	var reconnect = function() {
		this._fails++;
		this._internalEmit.call(this, 'reconnecting');
		setTimeout(this._connectWebsocket.bind(this), 2000); // wait a bit
	}

	if (this._fails < maxFails) {
		this._makeConnection.call(this, success.bind(this), reconnect.bind(this));
	} else {
		this._internalEmit.call(this, 'reconnectionFail');
	}
}
