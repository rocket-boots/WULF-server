import serveramo from './src/serveramo.js';
import serveramoUsers from './src/serveramo-users.js';
import WulfMap from './src/WulfMap.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

import rocketBootsLoop from 'rocket-boots-loop';
const { IntervalLoop } = rocketBootsLoop;

// Data
import homeMapData from './data/maps/home.json';
import typesData from './data/types.json';

// Constants
const LOOP_INTERVAL_TIME = 100; // milliseconds
const FULL_REFRESH_TICK = 40;
const SPRITE_INFO_KEY_JOINER = '/';

// Objects
const tileTypes = addTileTypeEntityDefault(typesData.tileTypes, typesData.entityTypes);
const homeMap = new WulfMap(homeMapData, tileTypes);
const loop = new IntervalLoop(gameLoop, { intervalTime: LOOP_INTERVAL_TIME });

// Server
serveramo.start(__dirname, '/static');
serveramoUsers.start(serveramo, '/users');

serveramo.on(serveramoUsers.events.USER_JOINED, () => {
	console.log('JOINED!');
	console.log(homeMap);
	refreshMapFull();
});

serveramo.on(serveramoUsers.events.USER_CREATED, (data) => {
	homeMap.createCharacter(data.userKey);
	refreshMapFull();
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

function refreshMapDelta() {
	mapsNamespace.to(homeMap.mapKey).emit('delta', homeMap.getDeltaData());
}

function refreshMapFull() {
	mapsNamespace.to(homeMap.mapKey).emit('refresh', homeMap.getData());	
}

function gameLoop(t, tick) {
	// console.log('.', t, tick);
	if (tick % FULL_REFRESH_TICK === 0) {
		refreshMapFull();
	} else if (tick % 2 === 0) {
		refreshMapDelta();
	}
	const gameT = t * 5;
	homeMap.simulate(gameT, tick);
}

loop.start();

// const mapsNamespace = serveramo.createNamespace('pc', '/wulf/pc', connectMaps);

function addTileTypeEntityDefault(tileTypes, entityTypes) { // mutates tileTypes
	const newTileTypes = {};
	Object.keys(tileTypes).forEach((tileTypeKey) => {
		const tileType = tileTypes[tileTypeKey];
		const entityType = entityTypes[tileType.type];
		// TODO: make this a deep copy
		const newTileType = Object.assign({}, entityType, tileType, { tileTypeKey });
		newTileType.sprite = convertSpriteInfo(newTileType.sprite);
		if (!newTileType.sprite) {
			console.warn('sprite not found for', tileType);
		}
		newTileTypes[tileTypeKey] = newTileType;
	});
	console.log(newTileTypes);
	return newTileTypes;
}

// TODO: move this and SPRITE_INFO somewhere where it can be accessed by the client also (shared code)

function convertSpriteInfo(spriteInfoParam) {
	if (typeof spriteInfoParam === 'string') { return spriteInfoParam; }
	if (spriteInfoParam instanceof Array) {
		return spriteInfoParam.join(SPRITE_INFO_KEY_JOINER);
	}
	console.log('Error converting sprite info!', spriteInfoParam);
	return 'sos/dragon/brown';
}
