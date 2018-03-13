const procs = [
	'server'
];

const singleConfig = proc => ({
	name: proc,
	script: `./${ proc }.js`,
	//watch: `./${ proc }.js`,
	log_date_format: 'YYYY-MM-DD HH:mm Z',
	max_memory_restart: '500M',
	max_restarts: 10,
	instances: 1,
	exec_mode: 'cluster',
	instance_var: 'WORKER_ID',
	mergeLogs: true,
	kill_timeout: 2000
});

module.exports = {
	apps: procs.map(singleConfig)
};
