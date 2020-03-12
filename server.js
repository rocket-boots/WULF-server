const serveramo = require('./src/serveramo.js');
const serveramoUsers = require('./src/serveramo-users.js');

const { io } = serveramo;
serveramo.start('/static');
serveramoUsers.start(serveramo, '/users');

// serveramo.on(serveramoUsers.events.USER_JOINED, () => { console.log('JOINED!'); });
