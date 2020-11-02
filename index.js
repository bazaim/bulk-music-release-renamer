const Config = require('./Config.class'),
	Job = require('./Job.class');

new Config(
	'config.json',
	'Settings BulkMusicReleaseRenamer',
	['path'],
	true,
	{ path: 'musics' }
).load(datas => {
	new Job(datas).init(job => job.start());
});