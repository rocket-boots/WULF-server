import usernaming from './usernaming.js';

const DISPLAY_CLASSES = ['ranger', 'fighter', 'cleric', 'thief', 'wizard', 'druid', 'fat'];

function choose(arr = []) {
	const r = Math.floor(Math.random() * arr.length);
	return arr[r];
}

class Characters {
	constructor() {
		this.set = new Set();
		this.map = new Map();
		this.arr = [];
		this.actions = new Map();
	}
	
	create(userKey, mapKey, pos) {
		const characterKey = usernaming.getUserCuid('Dude');
		const char = {
			characterKey,
			userKey,
			mapKey,
			pos,
			gender: choose([0, 1]), // 0 = female, 1 = male
			displayClass: choose(DISPLAY_CLASSES)
		};
		this.map.set(characterKey, char);
		this.set.add(char);
		this.arr.push(char);
		return char;
	}

	forEach(fn) {
		this.arr.forEach(fn);
	}

	findByKey(characterKey) {
		return this.map.get(characterKey);
	}

	getActionsQueue(who) {
		let actionsQueue = this.actions.get(who);
		return (actionsQueue) ? actionsQueue : [];
	}

	setActionsQueue(who, actionsQueue = []) {
		this.actions.set(who, actionsQueue);
	}

	giveAction(who, what, where) {
		if (!this.map.has(who)) { return false; }
		const actionsQueue = this.getActionsQueue(who);
		actionsQueue.push({ what, where });
		this.actions.set(who, actionsQueue);
	}

	simulate(t, tick) {
		// this.arr.forEach((char) => {
		// 	this.processActionsQueue(char, t);
		// });
	}
}

export default Characters;
// module.exports = Characters;
