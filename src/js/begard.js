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
                    directory: '<div class="begard-directory" data-path="{data-path}"><a href="#">{folder-name}</a></div>',
                    file: '<div class="begard-file {file-extension}-ext"><ul><li>{file-name}</li><li>{file-size}</li><li>{file-extension}</li></ul></div>'
                }
            },

            /**
             * All data about files and folders
             */
            data: [],

            /**
             * Keep current path
             */
            currentPath: '',

            /**
             * Initialize begard
             */
            init: function() {
                b.handleEvents();
                b.openFolder('/');
            },

            /**
             * Handle events
             */
            handleEvents: function() {
                $(document).on('click', '.begard-directory', function(e) { var self = $(this); b.openFolderEvent(e, self); });
                $(document).on('click', '#begard-up', function(e) { var self = $(this); b.upDirectoryEvent(e, self); });
            },

            /**
             * Get data for specific path
             * @param {string} path
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

                    b.refreshVars(path);
                    b.refreshView(path);
                });
            },

            rename: function() {

            },

            delete: function() {

            },

            /**
             * Refresh variables
             * @param {string} path
             */
            refreshVars: function(path) {
                b.currentPath = path;
            },

            /**
             * Refresh view
             * @param {string} path
             */
            refreshView: function(path) {
                b.refreshFolders(path);
                b.refreshFiles(path);
                b.checkUpDirectory(path);
            },

            /**
             * Open a folder by given path
             * @param {string} path
             */
            openFolder: function(path) {
                //If data is already taken, Do not take again
                if (typeof b.data[path] != "undefined") {
                    b.refreshVars(path);
                    b.refreshView(path);
                } else {
                    b.getData(path);
                }
            },

            /**
             * Open a folder event when user click on a directory
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            openFolderEvent: function(e, self) {
                var path = self.attr('data-path');

                b.openFolder(path);
            },

            /**
             * Open a folder and refresh view
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            upDirectoryEvent: function(e, self) {
                if (b.currentPath !== '/') {

                    //Remove last folder from path
                    encodedPath = encodeURIComponent(b.currentPath);
                    slashLastIndex = encodedPath.lastIndexOf('%2F');
                    decodedPath = encodedPath.substr(0, slashLastIndex);
                    upPath = decodeURIComponent(decodedPath);

                    //If upPath is empty so this is root
                    if (upPath === "") upPath = "/";

                    b.openFolder(upPath);
                }
            },

            /**
             * Define status of up button
             * @param {string} path
             */
            checkUpDirectory: function(path) {
                if (b.currentPath === '/') {
                    $('#begard-up').attr('disabled', 'disabled').addClass('disabled');
                } else {
                    $('#begard-up').removeAttr('disabled').removeClass('disabled');
                }
            },

            /**
             * Refresh file list by given path
             * @param {string} path
             */
            refreshFiles: function(path) {
                $('#begard-files .begard-file').remove();
                $.each(b.data[path].files, function(index, file) {

                    //Add file to html
                    var template = b.options.templates.file;
                    template = template.replace(new RegExp('{file-name}', 'g'), file.name);
                    template = template.replace(new RegExp('{file-size}', 'g'), file.size);
                    template = template.replace(new RegExp('{file-extension}', 'g'), file.extension);
                    $('#begard-files').append(template);
                });
            },

            /**
             * Refresh directory list by given path
             * @param {string} path
             */
            refreshFolders: function(path) {
                $('#begard-directories .begard-directory').remove();
                $.each(b.data[path].directories, function(index, folderName) {

                    //Do not add extra slash when path is root
                    if (path !== '/')   basePath = path + '/' + folderName;
                    else                basePath = path + folderName;

                    //Add directory to html
                    var template = b.options.templates.directory;
                    template = template.replace(new RegExp('{data-path}', 'g'), basePath);
                    template = template.replace(new RegExp('{folder-name}', 'g'), folderName);
                    $('#begard-directories').append(template);
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
