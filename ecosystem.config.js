module.exports = {
  apps: [{
    name:        'pouchcare-api',
    script:      'node_modules/.bin/tsx',
    args:        'src/server.ts',
    cwd:         '/home/pouchcare/Developments/PouchCare/apps/api',
    exec_mode:   'fork',
    instances:   1,
    autorestart: true,
    watch:       false,
    max_memory_restart: '512M',
    min_uptime:  '10s',
    max_restarts: 10,
    env: {
      NODE_ENV:   'production',
      PORT:       '7000',
    },
    out_file:   '/home/pouchcare/logs/api-out.log',
    error_file: '/home/pouchcare/logs/api-err.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }]
}
