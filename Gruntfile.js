/* jshint node:true */

'use strict';

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  // Default task.
  grunt.registerTask('default', ['test']);
  grunt.registerTask('test', ['jshint:src']);
  grunt.registerTask('dist', ['surround:main', 'uglify', 'surround:banner']);
  grunt.registerTask('coverage', ['jshint']);
  grunt.registerTask('junit', ['jshint']);
  //

  // HACK TO MAKE TRAVIS WORK
  var testConfig = function(configFile, customOptions) {
    var options = { configFile: configFile, singleRun: true };
    var travisOptions = process.env.TRAVIS && {
      browsers: ['Chrome', 'Firefox'],
      reporters: ['dots', 'coverage', 'coveralls'],
      preprocessors: { 'src/*.js': ['coverage'] },
      coverageReporter: {
        reporters: [
          {
            type: 'text'
          },
          {
            type: 'lcov',
            dir: 'coverage/'
          }
        ]
      }
    };
    return grunt.util._.extend(options, customOptions, travisOptions);
  };
  //

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: [
        '/**',
        ' * <%= pkg.name %> - <%= pkg.description %>',
        ' * @version v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>',
        ' * @link <%= pkg.homepage %>',
        ' * @license <%= pkg.license %>',
        ' */',
        ''
      ].join('\n')
    },

    coveralls: {
      options: {
        coverage_dir: 'coverage/'
        // debug: true
        // dryRun: true,
        // force: true,
        // recursive: true
      }
    },

    jshint: {
      src: {
        files: { src: ['src/**/*.js', 'demo/**/*.js'] },
        options: { jshintrc: '.jshintrc' }
      },
      test: {
        files: { src: ['test/*.js', 'GruntFile.js'] },
        options: grunt.util._.extend(
          {},
          grunt.file.readJSON('.jshintrc'),
          grunt.file.readJSON('test/.jshintrc')
        )
      }
    },

    uglify: {
      build: {
        files: [
          {
            expand: true,
            src: ['src/**/*.js', '!*.min.js'],
            ext: '.min.js',
            dest: 'dist'
          }
        ]
      }
    },

    surround: {
      main: {
        expand: true,
        cwd: 'src',
        src: ['*.js'],
        dest: 'dist',
        options: {
          prepend: ['(function(global, modulazer) {', "'use strict';"].join(
            '\n'
          ),
          append: '})(this, modulazer);'
        }
      },
      banner: {
        expand: true,
        cwd: 'dist',
        src: ['*.js'],
        dest: 'dist',
        options: {
          prepend: '<%= meta.banner %>'
        }
      }
    },

    changelog: {
      options: {
        dest: 'CHANGELOG.md'
      }
    },

    watch: {
      src: {
        files: ['src/*'],
        tasks: ['jshint:src', 'karma:unit:run', 'dist', 'build:gh-pages']
      },
      test: {
        files: ['test/*.js'],
        tasks: ['jshint:test', 'karma:unit:run']
      },
      demo: {
        files: ['demo/*', 'publish.js'],
        tasks: ['jshint', 'build:gh-pages']
      },
      livereload: {
        files: ['out/built/gh-pages/**/*'],
        options: { livereload: true }
      }
    }
  });
};
