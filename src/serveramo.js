// Based on https://hackernoon.com/how-to-build-a-multiplayer-browser-game-4a793818c29b

// Library Dependencies
import express from 'express';
import socketIO from 'socket.io';
// import express from '../node_modules/express/index.js';
// import socketIO from '../node_modules/socket.io/lib/index.js';

// Node Dependencies
import http from 'http';
import path from 'path';
// import http from 'http';
// import path from 'path';

// Setup
const app = express();
const server = http.Server(app);
const io = socketIO(server);
const CONNECT = 'connect';
const DISCONNECT = 'disconnect';
const PORT = 5000;
const events = {};
const subscriptions = {};
const namespaces = {};

function start(basePath = './', staticDir = '/static') {
	const staticPath = path.normalize(path.join(basePath, staticDir));
	const indexPath = path.normalize(path.join(staticPath, `/index.html`));

	app.set('port', PORT);
	app.use('/static', express.static(staticPath));

	// Routing
	app.get('/', function(request, response) {
		response.sendFile(indexPath);
	});

	// Starts the server
	server.listen(PORT, function() {
		console.log(`Starting server on port ${PORT}. Open http://localhost:${PORT} in your browser.`);
	});
}

function createNamespace(name, namespaceEndpoint, onConnectNewSocket, onDisconnect) {
	if (!name) { return false; }
	namespaces[name] = io.of(namespaceEndpoint);
	namespaces[name].on(CONNECT, (socket) => {
		let data;
		if (onConnectNewSocket) {
			data = onConnectNewSocket(socket);
		}
		if (onDisconnect) {
			socket.on(DISCONNECT, (reason) => { onDisconnect(reason, data); });
		}
	});
	return namespaces[name];
}

function subscribe(eventName, callback) {
	if (!subscriptions[eventName]) {
		subscriptions[eventName] = [];
	}
	subscriptions[eventName].push(callback);
}

function publish(eventName, data) {
	if (!subscriptions[eventName]) { return false; }
	subscriptions[eventName].forEach((callback) => {
		if (typeof callback !== 'function') { return; }
		callback(data);
	});
}

// export default io;
// module.exports = {
export default {
	start, events, io,
	subscribe, publish,
	on: subscribe, trigger: publish,
	createNamespace,
};
