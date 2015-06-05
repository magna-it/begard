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
                    directory: '<div class="begard-directory" data-path="{data-path}"><a href="#"><ul><li class="icon"><i class="fa fa-folder"></i></li><li>{folder-name}</li></ul></a></div>',
                    file: '<div class="begard-file"><ul><li class="icon"><i class="fa {file-extension}-ext"></i></li><li>{file-name}</li><li>{file-size}</li></ul></div>',
                    breadcrumb: '<li class="begard-crumb"><a href="#" class="begard-crumb-to" data-path="{data-path}">{directory-name}</a></li>'
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
                $(document).on('click', '.begard-crumb-to', function(e) { var self = $(this); b.openFolderEvent(e, self); });
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
                b.refreshBreadcrumb();
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
                    lastIndexSlash = b.currentPath.lastIndexOf('/');
                    upPath = b.currentPath.substr(0, lastIndexSlash);

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
                $.each(b.data[path].directories, function(index, directoryName) {

                    //Do not add extra slash when path is root
                    if (path !== '/')   basePath = path + '/' + directoryName;
                    else                basePath = path + directoryName;

                    //Add directory to html
                    var template = b.options.templates.directory;
                    template = template.replace(new RegExp('{data-path}', 'g'), basePath);
                    template = template.replace(new RegExp('{folder-name}', 'g'), directoryName);
                    $('#begard-directories').append(template);
                });
            },

            refreshBreadcrumb: function() {
                var directories = b.currentPath.split('/');
                var sDirectories = [];
                $.each(directories, function(index, directoryName) {
                    if (directoryName !== "") sDirectories.push(directoryName);
                });

                $('#begard-breadcrumb .begard-crumb').remove();

                var path = '/';

                //Add root breadcrumb
                var template = b.options.templates.breadcrumb;
                template = template.replace(new RegExp('{directory-name}', 'g'), '/');
                template = template.replace(new RegExp('{data-path}', 'g'), path);
                $('#begard-breadcrumb').append(template);

                //Add other part of path to breadcrumb
                $.each(sDirectories, function(index, directoryName) {

                    path += directoryName;

                    //Add breadcrumb to html
                    var template = b.options.templates.breadcrumb;
                    template = template.replace(new RegExp('{directory-name}', 'g'), directoryName);
                    template = template.replace(new RegExp('{data-path}', 'g'), path);
                    $('#begard-breadcrumb').append(template);
                    path += '/';
                });
                $('#begard-breadcrumb .begard-crumb').last().addClass('active');
            }
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
