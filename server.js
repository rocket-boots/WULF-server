const serveramo = require('./src/serveramo.js');
const serveramoUsers = require('./src/serveramo-users.js');
const Map = require('./src/Map.js');
// import serveramo from './src/serveramo.js';
// import serveramoUsers from './src/serveramo-users.js';
// import Map from './src/Map.js';

// const { Loop } = require('rocket-boots-loop');
const { IntervalLoop } = require('./node_modules/rocket-boots-loop/index.cjs');
// import Loop from './node_modules/loop/Loop.js';


// Data
const homeMapData = require('./maps/home.json');

// Objects
const homeMap = new Map(homeMapData);
const loop = new IntervalLoop(gameLoop, { intervalTime: 500 });

// Server
serveramo.start(__dirname, '/static');
serveramoUsers.start(serveramo, '/users');

serveramo.on(serveramoUsers.events.USER_JOINED, () => {
	console.log('JOINED!');
	console.log(homeMap);
	refreshMap();
});

serveramo.on(serveramoUsers.events.USER_CREATED, (data) => {
	homeMap.createCharacter(data.userKey);
	console.log(homeMap);
	refreshMap();
});

// Maps Namespace
function connectMapsSocket(socket) {
	socket.join(homeMap.mapKey); // Join room for this map; listen for emits
	socket.on('command', (message) => { handleCommand(socket, message); });
};
function handleCommand(socket, message) {
	// TODO: connect command to character/user
	const { who, what, where, auth } = message;
	const authorized = authorizeCommand(who, auth.userSessionKey);
	if (authorized) {
		homeMap.giveCommand(who, what, where);
	}
	console.log('Incoming command:', message, 'authorized?', authorized);
}
function authorizeCommand(characterKey, userSessionKey) {
	const c = homeMap.findCharacterByKey(characterKey);
	if (!c) { console.log('no character with key', characterKey, 'found'); return false; }
	const { userKey } = c;
	const user = serveramoUsers.users[userKey];
	if (!user) { console.log('no user with key', userKey, 'found'); return false; }
	console.log(user.userKey, user.sessionKey, userSessionKey);
	return (user.sessionKey === userSessionKey);
}

const mapsNamespace = serveramo.createNamespace('maps', '/wulf/maps', connectMapsSocket);

function refreshMap() {
	mapsNamespace.to(homeMap.mapKey).emit('refresh', homeMap);
}

function gameLoop(t, tick) {
	// console.log('.', t, tick);
	if (tick % 2 === 0) {
		refreshMap();
	}
	const gameT = t * 5;
	homeMap.simulate(gameT, tick);
}

loop.start();

// const mapsNamespace = serveramo.createNamespace('pc', '/wulf/pc', connectMaps);

