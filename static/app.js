var inputs = {
	template: `
		<div>
			<input type="text" placeholder="name" v-model="user" @keyup.enter="updateUser">
			<input type="text" placeholder="msg" v-model="msg" @keyup.enter="addMessage">
			<button v-on:click="death">End session</button>
		</div>
	`,
	data: function() {
		return {
			msg: '',
			user: ''
		}
	},
	methods: {
		updateUser: function(e) {
			this.$emit('updateUser', e.target.value);
		},
		addMessage: function(e) {
			this.$emit('addMessage', e.target.value);
			this.msg = '';
		},
		death: function(e) {
			this.$emit('death');
		}
	}
};

var users = {
	props: ['userlist'],
	template: `
		<div>
			<p class="text-bold">users {{userlist.length}}</p>
			<ul>
				<li v-for="user in userlist">{{user}}</li>
			</ul>
		</div>
	`
};

var msgs = {
	props: ['messages'],
	template: `
		<div>
			<p class="text-bold">msgs</p>
			<ul>
				<li v-for="msg in messages">{{msg.user}}: {{msg.msg}}</li>
			</ul>
		</div>
	`
};

var app = new Vue({
	el: '#app',
	template: `<div>
		<h1>/chat</h1>
		<p class="robotext">status: {{status}}</p>
		<inputs @updateUser="updateUser" @addMessage="addMessage" @death="death"></inputs>
		<users :userlist="userlist"></users>
		<msgs :messages="messages"></msgs>
	</div>`,
	components: {
		inputs: inputs,
		users: users,
		msgs: msgs
	},
	data: function(){
		return {
			status: '',
			userlist: [],
			messages: []
		}
	},
	methods: {
		updateUser: function(user) {
			this.ws.emit('updateUser', {user: user});
		},
		addMessage: function(msg) {
			this.ws.emit('addMessage', {msg: msg});
		},
		death: function() {
			this.ws.die();
		}
	},
	created: function() {
		this.status = 'connecting';
		this.ws = new wsClient('ws://localhost:3000');

		this.ws
			.on('ready', () => app.status = 'connected') // built-in
			.on('reconnecting', () => app.status = 'reconnecting') // built-in
			.on('reconnectionFail', () => app.status = 'failed') // built-in
			.on('initialData', onInitialData) // custom
			.on('messageAdded', onMessageAdded) // custom
			.on('userlist', onUserList) // custom
	}
});

function onInitialData(data) {
	app.userlist = data.userlist;
	app.messages = data.messages;
}

function onMessageAdded(data) {
	app.messages.push(data);
}

function onUserList(data) {
	app.userlist = data.userlist;
}
