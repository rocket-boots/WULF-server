const path = require('path');
const package = require('./package.json');
// import path from 'path';
// import package from './package.json';

const dirPath = path.resolve(__dirname, 'dist');
const filename = `${package.name}-${package.version}.js`;

console.log(
	'\n------------------------------------------------------------------------------\n',
	`Building ${package.name} into ${dirPath}/${filename}`,
	'\n------------------------------------------------------------------------------\n'
);

const ex = {
	mode: 'production',
	entry: `./${package.main}`,
	output: { filename, path: dirPath },
	devtool: 'inline-source-map',
	optimization: { minimize: false }, // TODO: remove when not testing
};
module.exports = ex;
// export default ex;
