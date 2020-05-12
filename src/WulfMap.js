import Characters from './Characters.js';
import cuid from 'cuid';
import rocketBootsCoords from 'rocket-boots-coords';
const { Coords } = rocketBootsCoords;

const METER_SCALE = 1000; // i.e., `1` is 1 millimeter
const TILE_METERS = 1; // one tile is 1 meter square
const TILE_SCALE = METER_SCALE * TILE_METERS;
const TERRAIN_TYPE = 'terrain';
const ITEM_TYPE = 'item';
const BLOCK_TYPE = 'block';
const CHARACTER_TYPE = 'character';

class WulfMap {
	constructor(mapData, tileTypes) {
		this.tileTypes = tileTypes;
		this.mapKey = mapData.mapKey;
		this.terrain = mapData.terrain || [];
		this.characters = new Characters();
		this.blocks = mapData.blocks || {};
		this.items = mapData.items || {};
		// this._mapData = mapData;
		this.size = {
			x: this.calculateWidth(),
			y: this.calculateHeight()
		};
		this.tiles = mapData.tiles;
		this.defaultTile = mapData.default;
		this.passable = null; // 2-dim array
		this.load();
	}

	getData() {
		const characters = this.characters.arr;
		const { mapKey, terrain, blocks, items, size, tiles, tileTypes } = this;
		return { mapKey, terrain, characters, blocks, items, size, tiles, tileTypes };
	}

	getDeltaData(lastTick) {
		// TODO: this will need work...
		const characters = this.characters.arr;
		const { mapKey, blocks, items } = this;
		return { mapKey, characters, blocks, items };
	}

	load() {
		// TODO: read from file
		WulfMap.populateFromTerrain(
			this.terrain, this.blocks, this.items,
			this.tiles, this.tileTypes, this.defaultTile
		);
		this.passable = WulfMap.buildPassableArray(
			this.terrain, this.blocks, this.items, this.characters,
			this.tiles, this.tileTypes
		);
		console.log('Loading...', this.terrain, this.blocks, this.items);
	}

	static populateFromTerrain(
		terrain = [], blocks = {}, items = {}, // mutate these
		tiles = {}, tileTypes = {}, defaultTile = '.' // informational
	) {
		function parseTerrain(letter, x, y, tileTypeKey) {
			const tileType = tileTypes[tileTypeKey];
			if (!tileType) {
				console.warn('Unknown tile type', tileType, 'at', x, ',', y, `>${letter}<`, tiles);
			}
			const isBlock = (tileType.type === BLOCK_TYPE);
			const isItem = (tileType.type === ITEM_TYPE)
			if (!isBlock && !isItem) { return; }
			// Remove items and blocks from the terrain data
			WulfMap.replaceTerrainCharacterAt(terrain, x, y, defaultTile);
			const uniqueKey = cuid();
			const thing = Object.assign({ x, y }, tileType);
			// add item or block to appropriate obj
			if (isBlock) {
				blocks[uniqueKey] = thing;
			} else if (isItem) {
				items[uniqueKey] = thing;
			}
		}
		WulfMap.loopOverTerrain(terrain, parseTerrain, tiles);
	}

	static replaceTerrainCharacterAt(terrain, x, y, letter) {
		const row = terrain[y];
		terrain[y] = row.substring(0, x) + letter + row.substring(x + 1);
	}

	static loopOverTerrain(terrain = [], fn, tiles = {}) {
		terrain.forEach((row, y) => {
			const rowLen = row.length;
			for(let x = 0; x < rowLen; x++) {
				const letter = row.charAt(x);
				const tileTypeKey = tiles[letter];
				fn(letter, x, y, tileTypeKey);
			}
		});
	}

	static buildPassableArray(terrain, blocks, items, characters, tiles, tileTypes) {
		const passableArray = [];
		WulfMap.loopOverTerrain(terrain, (letter, x, y, tileTypeKey) => {
			if (!(passableArray[y] instanceof Array)) {
				passableArray[y] = [];
			}
			if (!tileTypes[tileTypeKey]) {
				console.error('tile not found', letter, tileTypeKey);
			} else {
				passableArray[y][x] = tileTypes[tileTypeKey].passable;
			}
		}, tiles);
		function updateIfLessPassable(thing) {
			const { x, y, passable } = thing;
			if (x === undefined || y === undefined || passable === undefined) {
				console.log('Unknown x, y, or passable for thing:', thing);
				return;
			}
			const currentPassableValue = passableArray[y][x];
			if (passable < currentPassableValue) {
				passableArray[y][x] = passable;
			}
		}
		for(const blockKey in blocks) {
			updateIfLessPassable(blocks[blockKey]);
		}
		for(const itemKey in items) {
			updateIfLessPassable(items[itemKey]);
		}
		// TODO: Calculate for characters
		return passableArray;
	}

	getPassable({ x, y }) {
		return this.passable[y][x];
	}

	isTilePassable({ x, y }) {
		return this.passable[y][x] > 0;
	}


	calculateWidth() {
		return this.terrain.reduce((max, row) => {
			return Math.max(row.length, max);
		}, 0);
	}

	calculateHeight() {
		return this.terrain.length;
	}

	static convertBaseCoordsToTileCoords({ x, y }) {
		return (new Coords(
			Math.round(x / TILE_SCALE),
			Math.round(y / TILE_SCALE)
		));
	}

	static convertTileCoordsToBaseCoords(coords) {
		return (new Coords(coords.x, coords.y)).multiply(TILE_SCALE);
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
			const movementDistance = 600; // TODO: calculate this based on time and speed
			const reached = this.moveCharacter(char, topAction.where, movementDistance);
			if (reached) {
				actionsQueue.shift();
			}
		}
		// console.log(actionsQueue);
		this.characters.setActionsQueue(char.characterKey, actionsQueue);
	}

	moveCharacter(char, where, distance = 0) {
		const destination = WulfMap.convertTileCoordsToBaseCoords(where);
		const position = new Coords(char.pos.x, char.pos.y);
		const initialDistance = destination.getDistance(position);
		if (initialDistance <= distance) {
			char.pos.x = destination.x;
			char.pos.y = destination.y;
			// console.log('At position');
			return true;
		}
		const movement = position.getUnitVector(destination).multiply(distance);
		const newPosition = position.clone().add(movement);
		const newPositionTileCoords = WulfMap.convertBaseCoordsToTileCoords(newPosition);
		const tilePassable = this.getPassable(newPositionTileCoords);
		// console.log(movement.x, movement.y, newPositionTileCoords, tilePassable);
		if (tilePassable <= 0) {
			return true;
		} else if (tilePassable !== 1) {
			movement.multiply(tilePassable);
		}
		position.add(movement);
		char.pos.x = position.x;
		char.pos.y = position.y;
		return false;
	}

	simulate(t, tick) {
		this.characters.simulate(t, tick);
		this.characters.forEach((char) => {
			this.processActionsQueue(char, t);
		});
	}
}

export default WulfMap;
// module.exports = WulfMap;
