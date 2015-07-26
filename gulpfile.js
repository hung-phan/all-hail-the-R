'use strict';

var _                = require('lodash');
var fs               = require('fs');
var del              = require('del');
var gulp             = require('gulp');
var gutil            = require('gulp-util');
var webpack          = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var notifier         = require('node-notifier');
var shell            = require('shelljs');
var pm2              = require('pm2');
var config           = require('./config/config.json');

gulp.task('frontend:watch', function(done) {
  shell.exec('npm run client-watch', function() {
    done();
  });
});

gulp.task('frontend:build', function(done) {
  var bundler = webpack(require('./config/client/production')),
      handler = function (err, stats) {
                  if (err) {
                    notifier.notify({ message: 'Error: ' + err.message });
                    throw new gutil.PluginError('webpack', err);
                  }

                  gutil.log('[webpack]', stats.toString({colors: true}));
                  done();
                };

  bundler.run(handler);
});

gulp.task('backend:watch', function(cb) {
  var started = false;

  webpack(require('./config/server/development')).watch(100, function(err, stats) {
    if(!started) {
      started = true;
      cb();
    }

    gutil.log('[webpack]', stats.toString({colors: true}));
  });
});

gulp.task('backend:build', function(done) {
  var bundler = webpack(require('./config/server/production')),
      handler = function (err, stats) {
        if (err) {
          notifier.notify({ message: 'Error: ' + err.message });
          throw new gutil.PluginError('webpack', err);
        }
        gutil.log('[webpack]', stats.toString({colors: true}));
      };

  bundler.run(handler);
});

gulp.task('clean', cleanTask(['.' + config.path.dist]));
gulp.task('watch', ['clean', 'frontend:watch', 'backend:watch']);
gulp.task('build', ['clean', 'frontend:build', 'backend:build']);

gulp.task('start-server', function() {
  shell.exec('pm2 start dist/server.js --name local-dev-server --watch');
});

gulp.task('stop-server', function() {
  shell.exec('pm2 delete local-dev-server');
});

// clean task
function cleanTask(files) {
  return function() {
    del(files, function (err, paths) {
      gutil.log('Deleted files/folders:\n', gutil.colors.cyan(paths.join('\n')));
    });
  };
}
