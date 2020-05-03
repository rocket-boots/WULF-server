const cuid = require('cuid');

const NOUNS = {
	common: [
		'Air',
		'Box', 'Book', 'Boot',
		'Clock', 'Coat', 'Coin',
		'Door', 'Dirt',
		'Fire', 'Fork',
		'Hat',
		'Ice',
		'Pencil', 'Pen', 'Paper',
		'Shoe', 'Spoon',
		'Thing', 'Time', 'Table',
		'Window', 'Water', 'Wind',
	],
	body: [
		'Arm', 'Eye', 'Ear', 'Foot', 'Hand', 'Leg', 'Mouth', 'Nose',
	],
	shapes: [
		'Cube', 'Circle',
		'Decagon', 'Dodecahedron',
		'Hypercube', 'Hexagon', 'Heptagon',
		'Icosahedron',
		'Octagon', 'Octahedron',
		'Megagon',
		'Nonagon',
		'Polygon', 'Pentagon', 'Polyhedron',
		'Rectangle',
		'Square', 'Sphere',
		'Triangle', 'Tetragon', 'Tetrahedron',
	],
	astro: [
		'Asteroid', 'Astronaut',
		'Cosmonaut',
		'Electron', 'Eclipse',
		'Galaxy', 'Gravity',
		'Moon', 'Meteor',
		'Neutron', 'Nebula',
		'Planet', 'Proton', 'Pulsar',
		'Star', 'Supernova',
		'Quasar',
	],
	exploration: [
		'Adventurer',
		'Compass',
		'Explorer',
		'Traveler',
		'World',
	],
	monsters: [
		'Automaton',
		'Bugbear', 'Basilisk',
		'Chupacabra', 'Chimera', 'Cyclops',
		'Dragon', 'Demon',
		'Griffin', 'Golem', 'Goblin', 'Gremlin', 'Ghost',
		'Harpy', 'Hippogriff', 'Hydra',
		'Jackalope',
		'Kraken', 'Kobold',
		'Lich',
		'Orc',
		'Redcap',
		'Skeleton', 'Spirit',
		'Unicorn',
		'Werewolf', 'Werebear',
		'Vampire',
	],
	fantasy: [
		'Dwarf',
		'Elf',
		'Halfling',
		'Knight',
		'Sage',
		'Wizard',
	],
	flowers: [
		'Aster', 'Alyssum',
		'Balsam',
		'Clover', 
		'Daffodil',
		'Elderberry', 
		'Fjord', 
		// G
		'Hollyhocks', 
		// I
		'Jasmine',
		'Kalmia',
		'Lavender', 'Lilac', 'Lotus', 'Lunaria',
		'Magnolia', 'Mallow',
		'Narcissus',
		'Orchid',
		'Petunia',
		'Quince',
		'Raspberry', 'Rudbeckia',
		'Snapdragon',
		'Trillium', 'Tulip',
		'Ursinia', 'Uguisu',
		'Viburnum', 'Violet',
		'Waterlily',
		'Xeranthemum', 'Xylobium',
		'Yarrow',
		'Zenobia',
	],
	animals: [
		'Aardvark',
		'Badger', 'Bat',
		'Camel', 'Caterpillar', 'Coyote',
		'Deer', 'Dragonfly',
		'Emu',
		'Falcon', 'Frog',
		'Gecko', 'Gopher',
		'Hedgehog', 'Hyena',
		'Iguana',
		'Jellyfish', 'Jackal',
		'Koala', 'Kudu',
		'Liger', 'Lemming',
		'Meerkat',
		'Newt',
		'Ostrich', 'Oriole', 'Otter',
		'Panther', 'Platypus',
		'Quetzal',
		'Raccoon', 'Rhinoceros',
		'Sparrow', 'Seahorse', 'Swan',
		'Tortoise', 'Tapir',
		'Vulture',
		'Wildebeest', 'Warthog',
		// X
		'Yak',
		'Zebra',
	]
};

function getQuasiUniqueUserName(options = {}) {
	const nameOptions = getNameList(options);
	const i = Math.floor(Math.random() * (nameOptions.length - 1));
	let name = nameOptions[i];
	return name + '-' + Math.round(Math.random() * 1000);
}

function getNameList(options = {}) {
	const allCategories = Object.keys(NOUNS);
	let names = [];
	allCategories.forEach((category) => {
		// Keep in list if options is truthy or undefined (i.e., the default is to keep all)
		if (options[category] == true || options[category] === undefined) {
			names = names.concat(NOUNS[category]);
		}
	});
	return names;
}

function getUserCuid(username) {
	const id = cuid();
	return (username) ? username + '-' + id : id;
}

module.exports = {
	getQuasiUniqueUserName,
	getUserCuid
};
