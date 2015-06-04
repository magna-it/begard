(function() {
    var begardFactory;

    begardFactory = function($) {

        /**
         * Keep private methods and variables
         */
        var b = {

            /**
             * Default options
             */
            options: {
                remote: '',
                method: 'POST',
                templates: {
                    directory: '<li><a href="#" class="begard-directory" data-path="{data-path}">{folder-name}</a></li>'
                }
            },

            /**
             * All data about files and folders
             */
            data: [],

            /**
             * Initialize begard
             */
            init: function() {
                b.handleEvents();
                b.getData('/');
            },

            /**
             * Handle events
             */
            handleEvents: function() {
                $(document).on('click', '.begard-directory', function(e) { var self = $(this); b.openFolder(e, self); });
            },

            /**
             * Get data for specific path
             */
            getData: function(path) {
                $.ajax({
                    url: b.options.remote,
                    data: {
                        path: path
                    },
                    method: b.options.method,
                    dataType: "json"
                }).done(function(data) {
                    var path = data.path;
                    delete data.path;

                    b.data[path] = data;
                    b.refreshView(path);
                });
            },

            rename: function() {

            },

            delete: function() {

            },

            refreshView: function(path) {
                b.refreshFolders(path);
            },

            openFolder: function(e, self) {
                var path = self.attr('data-path');

                b.getData(path);
            },

            /**
             * Refresh directory list by given path
             * @param {string} path
             */
            refreshFolders: function(path) {
                $('#begard-directories ul li').remove();
                $.each(b.data[path].directories, function(index, folderName) {

                    //Do not add extra slash when path is root
                    if (path !== '/')   basePath = path + '/' + folderName;
                    else                basePath = path + folderName;

                    //Add directory to html
                    var template = b.options.templates.directory;
                    template = template.replace('{data-path}', basePath);
                    template = template.replace('{folder-name}', folderName);
                    $('#begard-directories ul').append(template);
                });
            },
        };

        return begard = {

            /**
             * Set configuration
             * @param {object} options
             */
            config: function(options) {
                $.extend(true, b.options, options);
            },

            /**
             * Start begard normally
             * @param {string} template - Selector of underscore template
             * @param {string} appendTo - Selector of element
             */
            standalone: function(begardTemplate, appendTo) {
                //Initialize
                b.init();


            },

            /**
             * Start begard as a modal
             * @param {string} template - Selector of underscore template
             */
            modal: function(template) {
                //Initialize
                b.init();
            },

            /**
             * Close begard when started as a modal
             */
            close: function () {

            }
        };
    };


    if (typeof define === 'function' && define.amd) {
        define(['jquery'], begardFactory);
    } else if (typeof exports === 'object') {
        module.exports = begardFactory(require('jquery'));
    } else {
        window.begard = begardFactory(window.jQuery);
    }
}).call(this);
