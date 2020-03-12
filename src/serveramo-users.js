const users = {};
const CONNECTION = 'connection';
const SYSTEM = 'System';
const events = Object.freeze({
	DISCONNECT: 'disconnect',
	CHAT: 'chat',
	RENAME: 'rename',
	REGISTER: 'register',
	USERS: 'users',
	USER_JOINED: 'user-joined',
	USER_LEFT: 'user-left'
});
const serveramoUsers = { start, users, events }
let serveramo;
let usersNamespace;

function start(serveramoParam, namespaceEndpoint = '/users') {
	serveramo = serveramoParam; // sync
	const { io } = serveramo;
	usersNamespace = io.of(namespaceEndpoint);
	usersNamespace.on(CONNECTION, onConnectNewSocket);
	return serveramoUsers;
}

function onConnectNewSocket(socket) {
	const user = createNewUser(socket);
	sendNewUserAnnouncements(user);

	socket.on(events.DISCONNECT, (reason) => { handleUserDisconnect(user, reason); });
	socket.on(events.CHAT, (message) => { handleChatReived(user, message); });
	socket.on(events.RENAME, (name) => { renameUser(user, newName); });
}

function handleChatReived(user, message) {
	// TODO: Strip html
	message = message.replace('<', '').replace('>', '');
	console.log('Chat:', user.name, ':', message);
	// const { io } = serveramo;
	usersNamespace.emit(events.CHAT, message, user.name); // TODO: Do we have to use io.sockets for this?

	if (message.startsWith('/')) {
		const messageWords = message.split(' ');
		if (messageWords.length <= 0) {
			return;
		}
		if (messageWords[0] === '/rename') {
			if (messageWords.length >= 2) {
				renameUser(user, messageWords[1]);
			}
		}
	}
}

function handleUserDisconnect(user, reason) {
	user.socket.broadcast.emit(events.CHAT, user.name + ' has left.', SYSTEM);
	removeUser(user.userId);
	sendUsers();
}

function sendNewUserAnnouncements(user) {
	console.log('New user connected:', user.userId);
	user.socket.emit(events.REGISTER, cloneUser(user));
	sendPersonalSystemMessage('You have joined as ' + user.name, user);
	user.socket.broadcast.emit(events.CHAT, user.name + ' has joined.', SYSTEM);
	sendUsers();
}

function sendUsers() {
	usersNamespace.emit(events.USERS, getUsers());
}

function sendPersonalSystemMessage(message, user) {
	user.socket.emit(events.CHAT, message, SYSTEM);
}

function renameUser(user, newName) {
	let userWithName;
	for (let key in users) {
		const userChecked = users[key];
		if (newName === userChecked.name) {
			userWithName = userChecked;
			break;
		}
	}
	if (userWithName) {
		sendPersonalSystemMessage('A user with the name ' + newName + ' already exists.', user);
		return false;
	}
	const reservedNames = [SYSTEM];
	if (reservedNames.indexOf(newName) !== -1) {
		sendPersonalSystemMessage('The name ' + newName + ' is invalid.', user);
		return false;		
	}
	user.name = newName;
	sendUsers();
	return true;
}

function createNewUser(socket) {
	const userName = getQuasiUniqueUserName(socket.id);
	const userId = userName + '-' + socket.id;
	const user = {
		userId: userId,
		name: userName,  // + '-' + socket.id.substr(0,1),
		console: null,
		socketId: socket.id,
		socket: socket
	};
	users[userId] = user;
	serveramo.trigger(events.USER_JOINED);
	return user;
}

function removeUser(userId) {
	delete users[userId];
	console.log('Removing user:', userId);
	serveramo.trigger(events.USER_LEFT);
}

function cloneUser(user) {
	return {
		userId: user.userId,
		name: user.name,
		socketId: user.socketId
	};
}

function getQuasiUniqueUserName() {
	const nameOptions = [
		// 'Explorer', 'Astronaut', 'Cosmonaut', 'Traveler', 'Adventurer',
		'Asteroid',	'Aster', 'Alyssum', 'Aardvark',
		'Box', 'Badger', 'Bat', 'Balsam',
		'Clover', 'Camel', 'Caterpillar', 'Coyote',
		'Daffodil', 'Deer', 'Dragonfly',
		'Elderberry', 'Emu', 'Electron',
		'Fjord', 'Falcon', 'Frog',
		'Galaxy', 'Gecko', 'Gopher',
		'Hollyhocks', 'Hedgehog', 'Hyena',
		'Ice', 'Iguana',
		'Jasmine', 'Jellyfish', 'Jackal',
		'Kalmia', 'Koala', 'Kudu',
		'Lavender', 'Lilac', 'Lotus', 'Lunaria', 'Liger', 'Lemming',
		'Magnolia', 'Mallow', 'Meerkat',
		'Narcissus', 'Newt',
		'Oriole', 'Orchid', 'Ostrich',
		'Planet', 'Petunia', 'Panther', 'Platypus', 'Proton',
		'Quince', 'Quetzal',
		'Raspberry', 'Rudbeckia', 'Raccoon', 'Rhinoceros',
		'Snapdragon', 'Sparrow', 'Seahorse',
		'Trillium', 'Tulip', 'Tortoise', 'Tapir',
		'Ursinia', 'Uguisu',
		'Viburnum', 'Violet', 'Vulture',
		'Waterlily', 'Wildebeest', 'Warthog',
		'Xeranthemum', 'Xylobium',
		'Yarrow', 'Yak',
		'Zenobia', 'Zebra',
	];
	const i = Math.floor(Math.random() * (nameOptions.length - 1));
	let name = nameOptions[i];
	return name + '-' + Math.round(Math.random() * 1000);
}

function getUsers() {
	const crew = [];
	for (let key in users) {
		crew.push(cloneUser(users[key]));
	}
	return crew;
}

module.exports = serveramoUsers;
