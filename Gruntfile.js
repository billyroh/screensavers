module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    connect: {
      server: {
        options: {
          port: 9000,
          livereload: true,
          middleware(connect, options, middlewares) {
            middlewares.unshift(require('connect-livereload')());
            return middlewares;
          }
        }
      }
    },
    pug: {
      compile: {
        options: {
          data: {
            debug: true
          }
        },
        files: {
          'index.html': 'src/index.pug',
          'pipes/index.html': 'src/pipes.pug',
          'maze/index.html': 'src/maze.pug',
          'matrix/index.html': 'src/matrix.pug',
        }
      }
    },
    sass: {
      dist: {
        files: {
          'style.css': 'src/style.css'
        }
      }
    },
    watch: {
      options: {
        livereload: true
      },
      scripts: {
        files: [
          'src/*',
          'pipes/scripts.js',
          'maze/scripts.js',
          'matrix/scripts.js',
        ],
        tasks: ['updateDom']
      },
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-pug');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('updateDom', ['pug', 'sass']);
  grunt.registerTask('default', ['connect', 'watch']);

};
