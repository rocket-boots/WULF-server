const Characters = require('./Characters.js');

const METER_SCALE = 1000; // i.e., `1` is 1 millimeter
const TILE_METERS = 1; // one tile is 1 meter square

class Map {
	constructor(mapData) {
		this.mapKey = mapData.mapKey;
		this.terrain = mapData.terrain;
		this._mapData = mapData;
		this.size = {
			x: this.calculateWidth(),
			y: this.calculateHeight()
		};
		this.characters = new Characters();
	}

	calculateWidth() {
		return this.terrain.reduce((max, row) => {
			return Math.max(row.length, max);
		}, 0);
	}

	calculateHeight() {
		return this.terrain.length;
	}

	getRandomPosition() {
		return {
			x: this.getRandomDimension('x') * METER_SCALE,
			y: this.getRandomDimension('y') * METER_SCALE,
		};
	}

	getRandomDimension(axis = 'x') {
		return Math.floor(Math.random() * this.size[axis]);
	}

	createCharacter(userKey) {
		const pos = this.getRandomPosition();
		return this.characters.create(userKey, this.mapKey, pos);
	}

	findCharacterByKey(characterKey) {
		return this.characters.findByKey(characterKey);
	}

	giveCommand(who, what, where) {
		this.characters.giveAction(who, what, where);
	}

	processActionsQueue(char, t) {
		const actionsQueue = this.characters.getActionsQueue(char.characterKey);
		if (actionsQueue.length <= 0) { return false; }
		const topAction = actionsQueue[0]; 
		const hasWhereCoords = topAction.where && topAction.where.x && topAction.where.y;
		if (topAction.what === 'move' && hasWhereCoords) {
			const destination = {
				x: topAction.where.x * METER_SCALE,
				y: topAction.where.y * METER_SCALE
			};
			const diff = {
				x: destination.x - char.pos.x,
				y: destination.y - char.pos.y
			};
			char.pos.x += Math.round(diff.x / 10);
			char.pos.y += Math.round(diff.y / 10);
			if (diff.x < 1 || diff.y < 1) {
				actionsQueue.shift();
			}
		}
		console.log(actionsQueue);
		this.characters.setActionsQueue(char.characterKey, actionsQueue);
	}

	simulate(t, tick) {
		this.characters.simulate(t, tick);
		this.characters.forEach((char) => {
			this.processActionsQueue(char, t);
		});
		
	}
}

// export default Map;
module.exports = Map;
