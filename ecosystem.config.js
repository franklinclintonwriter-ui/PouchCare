module.exports = {
  apps: [{
    name:        'pouchcare-api',
    script:      'src/server.ts',
    cwd:         '/home/pouchcare/Developments/PouchCare/apps/api',
    interpreter: 'node',
    interpreter_args: '--import tsx',
    exec_mode:   'fork',
    instances:   1,
    autorestart: true,
    watch:       false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV:   'production',
      PORT:       '7000',
    },
    out_file:   '/home/pouchcare/logs/api-out.log',
    error_file: '/home/pouchcare/logs/api-err.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
}
