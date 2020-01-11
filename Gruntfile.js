module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    //use the copy with source and destination
    npmcopy: {
      jquery: {
        options: {
          srcPrefix: 'node_modules/jquery/dist',
          destPrefix: 'public'
        },
        files: {
          "js": "jquery.min.js"
        }
      },
      materializecss: {
        options: {
          srcPrefix: 'node_modules/materialize-css/dist',
          destPrefix: 'public'
        },
        files: {
          "css": "css/materialize.min.css",
          "js": "js/materialize.min.js"
        }
      },
      materializeslider: {
        options: {
          srcPrefix: 'node_modules/materialize-css/extras/noUISlider',
          destPrefix: 'public'
        },
        files: {
          "css": "noUISlider.css",
          "js": "noUISlider.min.js"
        }
      },
      wnumb: {
        options: {
          srcPrefix: 'node_modules/wnumb',
          destPrefix: 'public'
        },
        files: {
          "js": "wNumb.js"
        }
      },
      datatables: {
        options: {
          srcPrefix: 'node_modules',
          destPrefix: 'public'
        },
        files: {
          "js": "datatables.net/js/jquery.dataTables.js",
          "css": "datatables.net-dt/css",
          "images": "datatables.net-dt/images"
        }
      },
      datatablesButtons: {
        options: {
          srcPrefix: 'node_modules',
          destPrefix: 'public'
        },
        files: {
          "js": "datatables.net-buttons/js",
          "css": "datatables.net-buttons-dt/css"
        }
      },
      floatthead: {
        options: {
          srcPrefix: 'node_modules/floatthead',
          destPrefix: 'public'
        },
        files: {
          "js": "dist/jquery.floatthead.min.js"
        }
      },
      hideseek: {
        options: {
          srcPrefix: 'node_modules/hideseek',
          destPrefix: 'public'
        },
        files: {
          "js": "jquery.hideseek.min.js"
        }
      },
      toastr: {
        options: {
          srcPrefix: 'node_modules/toastr',
          destPrefix: 'public'
        },
        files: {
          "js": "build/toastr.min.js",
          "css": "build/toastr.css"
        }
      },
      sigma: {
        options: {
          srcPrefix: 'node_modules/sigma',
          destPrefix: 'public'
        },
        files: {
          "js/sigma.min.js": "build/sigma.min.js",
          "js/sigma.parsers.json.min.js": "build/plugins/sigma.parsers.json.min.js",
        }
      },
      clipboard: {
        options: {
          srcPrefix: 'node_modules/clipboard',
          destPrefix: 'public'
        },
        files: {
          "js/clipboard.min.js": "dist/clipboard.min.js"
        }
      },
      jscookie: {
        options: {
          srcPrefix: 'node_modules/js-cookie',
          destPrefix: 'public'
        },
        files: {
          "js/js.cookie.js": "src/js.cookie.js"
        }
      },
    }
  });

  //load the copy module
  grunt.loadNpmTasks('grunt-npmcopy');

  //register the build task
  grunt.registerTask('build', [
    'npmcopy:jquery',
    'npmcopy:materializecss',
    'npmcopy:materializeslider',
    'npmcopy:wnumb',
    'npmcopy:datatables',
    'npmcopy:datatablesButtons',
    'npmcopy:floatthead',
    'npmcopy:hideseek',
    'npmcopy:toastr',
    'npmcopy:sigma',
    'npmcopy:clipboard',
    'npmcopy:jscookie',
  ]);

  grunt.registerTask('default', ['build']);
};
