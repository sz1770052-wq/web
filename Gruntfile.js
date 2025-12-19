module.exports = function (grunt) {

    grunt.initConfig({
        // Компиляция Less
        less: {
            development: {
                options: {
                    compress: false,
                    optimization: 2,
                    sourceMap: true,
                    sourceMapFilename: 'style.css.map'
                },
                files: {
                    "style.css": "style.less"
                }
            },
            production: {
                options: {
                    compress: true,
                    optimization: 2,
                    cleancss: true
                },
                files: {
                    "style.min.css": "style.less"
                }
            }
        },

        // Наблюдение за изменениями
        watch: {
            less: {
                files: ["*.less", "**/*.less"],
                tasks: ["less:development"],
                options: {
                    livereload: true,
                    spawn: false
                }
            },
            html: {
                files: ["*.html"],
                options: {
                    livereload: true
                }
            },
            js: {
                files: ["*.js"],
                options: {
                    livereload: true
                }
            },
            json: {
                files: ["*.json"],
                options: {
                    livereload: true
                }
            }
        },

        // Запуск локального сервера
        connect: {
            server: {
                options: {
                    port: 3000,
                    hostname: 'localhost',
                    base: '.',
                    livereload: true,
                    open: {
                        target: 'http://localhost:3000',
                        appName: 'chrome'
                    },
                    middleware: function (connect, options, middlewares) {
                        middlewares.unshift(function (req, res, next) {
                            res.setHeader('Access-Control-Allow-Origin', '*');
                            res.setHeader('Access-Control-Allow-Methods', '*');
                            next();
                        });
                        return middlewares;
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.registerTask('default', ['less:development', 'connect', 'watch']);
    grunt.registerTask('build', ['less:production']);
    grunt.registerTask('dev', ['less:development', 'watch']);
    grunt.registerTask('server', ['connect', 'watch']);
};