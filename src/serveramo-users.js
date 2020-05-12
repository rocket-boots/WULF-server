import usernaming from './usernaming.js';

const users = {};
const SYSTEM = 'System';
const events = Object.freeze({
	DISCONNECT: 'disconnect',
	CHAT: 'chat',
	RENAME: 'rename',
	REGISTER: 'register',
	USERS: 'users',
	USER_JOINED: 'user-joined',
	USER_LEFT: 'user-left',
	USER_CREATED: 'user-created'
});
const serveramoUsers = { start, users, events }
let serveramo;
let usersNamespace;

function start(serveramoParam, namespaceEndpoint = '/users') {
	serveramo = serveramoParam; // sync
	const disconnectUser = (reason, user) => { handleUserDisconnect(user, reason) };
	usersNamespace = serveramo.createNamespace(
		'users',
		namespaceEndpoint,
		onConnectNewSocket,
		disconnectUser
	);
	return serveramoUsers;
}

function onConnectNewSocket(socket) {
	const user = createNewUser(socket);
	sendNewUserAnnouncements(user);

	// socket.on(events.DISCONNECT, (reason) => { handleUserDisconnect(user, reason); });
	socket.on(events.CHAT, (message) => { handleChatReived(user, message); });
	socket.on(events.RENAME, (name) => { renameUser(user, newName); });
	return user;
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
	removeUser(user.userKey);
	sendUsers();
}

function sendNewUserAnnouncements(user) {
	console.log('New user connected:', user.userKey);
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
	const name = usernaming.getQuasiUniqueUserName();
	const userKey = usernaming.getUserCuid(name);
	const sessionKey = usernaming.getUserCuid(`Session-${name}`);
	const user = {
		userKey,
		name,
		sessionKey,
		console: null,
		socketId: socket.id,
		socket: socket
	};
	users[userKey] = user;
	// TODO: separate these events apart when allowing to re-login
	serveramo.trigger(events.USER_CREATED, { userKey });
	serveramo.trigger(events.USER_JOINED, { userKey });
	return user;
}

function removeUser(userKey) {
	delete users[userKey];
	console.log('Removing user:', userKey);
	serveramo.trigger(events.USER_LEFT);
}

function cloneUser(user) {
	return {
		userKey: user.userKey,
		name: user.name,
		sessionKey: user.sessionKey,
		socketId: user.socketId
	};
}

function getUsers() {
	const crew = [];
	for (let key in users) {
		crew.push(cloneUser(users[key]));
	}
	return crew;
}

// module.exports = serveramoUsers;
export default serveramoUsers;
