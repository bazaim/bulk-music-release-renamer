const fs = require('fs'),
	axios = require('axios').default;


function Job(datas, force = false) {
	this.datas = datas;
	this.force = force;
	this.inited = false;

	this.queue = [];
	this.lastQueueTime = 0;
	this.debounce = 1000;
	
	this.regexFormated = new RegExp("^([0-9]{4}) - (.*)$");

	this.init = (callback) => {
		fs.stat(this.datas.path, (err, pathStat) => {
			if (err || !pathStat.isDirectory()) {
				throw new exception(`'${this.datas.path}' is not a directory`);
			}
			else {
				this.inited = true;
				callback && callback(this);
			}
		});
	};

	this.start = () => {
		if (!this.inited) {
			throw new exception('Job not inited');
		}

		fs.readdir(`./${this.datas.path}`, (err, artists) => {
			if(!err && artists) {
				artists.forEach(artist => {
					fs.stat(`./${this.datas.path}/${artist}`, (err, statsArtist) => {
						if (statsArtist.isDirectory()) {
							fs.readdir(`./${this.datas.path}/${artist}`, (err, albums) => {
								if(!err && albums) {
									albums.forEach(album => {
										fs.stat(`./${this.datas.path}/${artist}/${album}`, (err, statsAlbum) => {
											this.queue.push({
												path: `./${this.datas.path}/${artist}/${album}`,
												artist,
												album: statsAlbum.isDirectory()
													? album
													: album.split('.').slice(0, -1).join('.'),
												isDirectory: statsAlbum.isDirectory()
											});
											this.doQueue();
										});
									});
								}
							});
						}
					});
				});
			}
		});
	}

	this.doQueue = () => {
		if (!this.doingQueue && this.queue.length > 0) {
			this.doingQueue = true;

			const now = new Date().getTime();
			if (now < this.lastQueueTime + this.debounce) {
				setTimeout(() => {
					this.doingQueue = false;
					this.doQueue();
				}, this.debounce);
			} else {
				this.lastQueueTime = now;
				const item = this.queue.pop();
				// console.log(item);
				if (this.regexFormated.exec(item.album) === null) {
					console.log(`GET : ${item.artist} - ${item.album}`);
					axios.get(`https://musicbrainz.org/ws/2/release?limit=1&fmt=json&query=artistname:${item.artist} release:${item.album}`)
						.then((response) => {
							if (response.data.releases.length) {
								const year = new Date(response.data.releases[0].date).getFullYear();
								let newPath = item.path.split(/[\\/]+/);
								newPath[newPath.length-1] = `${year} - ${response.data.releases[0].title}`;
								
								fs.rename(item.path, newPath.join('/'), () => {
									this.doingQueue = false;
									this.doQueue();
								});
							} else {
								this.doingQueue = false;
								this.doQueue();
							}
						})
						.catch((error) => {
							this.doingQueue = false;
							this.doQueue();
						});
					// 
				} else {
					this.doingQueue = false;
					this.doQueue();
				}
			}
		}
	}
}

module.exports = Job;