/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/03/26 01:59
 */
'use strict';
/**
 pm2 deploy <configuration_file> <environment> <command>

 Commands:
 setup                run remote setup commands
 update               update deploy to the latest release
 revert [n]           revert to [n]th last deployment or 1
 curr[ent]            output current release commit
 prev[ious]           output previous release commit
 exec|run <cmd>       execute the given <cmd>
 list                 list previous deploy commits
 [ref]                deploy to [ref], the "ref" setting, or latest tag
 @example pm2 [start|restart|stop|delete] ecosystem.config.js
 @example pm2 start ecosystem.config.js --only TG_SETU_BOT
 @example pm2 deploy ecosystem.config.js staging
 @example pm2 deploy ecosystem.config.js production setup && pm2 deploy ecosystem.config.js production
 * @see https://pm2.keymetrics.io/docs/usage/application-declaration/#ecosystem-file
 * @see https://pm2.keymetrics.io/docs/usage/deployment/
 */
module.exports = {
  apps: [{
    name: "PIC_ONLINE_BACK",
    script: 'App.js',
    watch: true,
    ignore_watch: [
      '.idea', '.vscode',
      '.vs', 'logs',
      'tmp', 'examples',
      '*.log', 'npm-debug.log*',
      'yarn-debug.log*', 'yarn-error.log*',
      'pids', '*.pid',
      '*.seed', '*.pid.lock',
      'lib-cov', 'coverage',
      '.nyc_output', '.grunt',
      'bower_components', '.lock-wscript',
      'build', 'node_modules',
      'jspm_packages', 'typings',
      '.npm', '.eslintcache',
      '.node_repl_history', '*.tgz',
      '.yarn-integrity', '.env',
      '.next', ' package-lock.json'
    ],
    instance: 1,
    cron_restart: "30 4 * * *",
    autorestart: false,
    node_args: '--max-http-header-size 80000',
    error_file: '',
    out_file: '',
    log_file: '',
    time: false,
    env: {
      "NODE_ENV": "development",
    },
    env_production: {
      "NODE_ENV": "production"
    }
  }],

  deploy: {}
};
