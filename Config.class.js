const fs = require('fs'),
	prompt = require('prompt');

function Config(path, title, keys, force = false, def = null) {
	prompt.start();

	this.path = path;
	this.title = title;
	this.keys = keys;
	this.force = force;
	this.def = def;

	this.load = (callback) => {
		fs.readFile(this.path, (err, configFile) => {
			if (err) {
				this.write(callback, this.def);
			}
			else if (configFile) {
				var configDatas = JSON.parse(configFile);
				
				let isValid = true;
				for (const key of this.keys) {
					if (typeof configDatas[key] === 'undefined') {
						isValid = false;
					}

				}

				isValid && !this.force
					? callback(configDatas)
					: this.write(callback, configDatas);
			}
		});
	}

	this.write = (callback, datas = {}) => {
		console.log(this.title);
		if (datas) {
			for (let key of this.keys) {
				if (datas[key]) {
					console.log(`default '${key}': ${datas[key]}`);
				}
			}
		}
		prompt.get(this.keys, (err, result) => {
			if (err) {
				this.write(callback, datas);
			}
			else {
				if (datas) {
					for (let key of this.keys) {
						if (datas[key] && !result[key].length) {
							result[key] = datas[key];
						}
					}
				}
				fs.writeFile(this.path, JSON.stringify(result), () => {
					callback && callback(result);
				});
			}
		});
	}
}

module.exports = Config;