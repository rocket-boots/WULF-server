// Based on https://hackernoon.com/how-to-build-a-multiplayer-browser-game-4a793818c29b
// Dependencies
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const app = express();
const server = http.Server(app);
const io = socketIO(server);
const PORT = 5000;
const events = {};
const subscriptions = {};

function start(staticPath = '/static') {

	app.set('port', PORT);
	app.use('/static', express.static(__dirname + '...' + staticPath));

	// TODO: Why does normalize not work??
	const indexPath = path.normalize(path.join(__dirname, '...', staticPath, `/index.html`));
	// console.log(path.join(__dirname, staticPath, `/index.html`));
	console.log(indexPath);

	// Routing
	app.get('/', function(request, response) {
		response.sendFile(indexPath);
	});

	// Starts the server.
	server.listen(PORT, function() {
		console.log(`Starting server on port ${PORT}. Open http://localhost:${PORT} in your browser.`);
	});
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
module.exports = {
	start, events, io,
	subscribe, publish,
	on: subscribe, trigger: publish,
	
};
