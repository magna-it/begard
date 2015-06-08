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
                multiSelect: false,
                defaultErrorMessage: 'An error occurred',
                templates: {
                    directory: '<div class="begard-directory" data-path="{data-path}"><a href="javascript:void(0)"><ul><li class="icon"><i class="fa fa-folder"></i></li><li>{folder-name}</li></ul></a></div>',
                    file: '<div class="begard-file" data-path="{data-path}" data-index="{data-index}"><ul><li class="icon"><i class="fa {file-extension}-ext"></i></li><li>{file-name}</li></ul></div>',
                    breadcrumb: '<li class="begard-crumb"><a href="#" class="begard-crumb-to" data-path="{data-path}">{directory-name}</a></li>',
                    fileDetails: '<h4>Selected file details</h4><ul><li>Name: {data-name}</li><li>Extension: {data-extension}</li><li>Size: {data-size}</li></ul>',
                    uploadList: '<div class="begard-upload-item" data-id="{data-id}"><ul><i class="begard-upload-close fa fa-times disabled"></i><li class="begard-upload-error disabled">An error occurred.</li><li class="begard-upload-name">{data-name}</li><li><div class="progress"><div class="progress-bar progress-bar-warning" role="progressbar" data-change-percent-width data-change-percent-text aria-valuemin="0" aria-valuemax="100" style="width: 0%;">0%</div></div></li></ul></div>'
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
             * Keep current operation
             */
            currentOperation: null,

            /**
             * Give a id to every file upload action
             */
            lastFileId: 0,

            /**
             * List of files and directories selected for operate such as delete, move, copy and paste
             */
            willOperate: [],

            /**
             * Initialize begard
             */
            init: function() {
                b.handleEvents();
                b.openFolder('/');

                b.disableOperations();
                $('#begard-error').addClass('disabled');
            },

            /**
             * Handle events
             */
            handleEvents: function() {
                $(document).on('dblclick', '.begard-directory',    function(e) { b.openFolderEvent(e, $(this)); });
                $(document).on('click',    '.begard-crumb-to',     function(e) { b.openFolderEvent(e, $(this)); });
                $(document).on('click',    '#begard-need-refresh', function(e) { b.needRefreshEvent(e, $(this)); });
                $(document).on('click',    '.begard-directory',    function(e) { b.selectDirectoryEvent(e, $(this)); });
                $(document).on('click',    '.begard-file',         function(e) { b.selectFileEvent(e, $(this)); });
                $(document).on('click',    '#begard-up',           function(e) { b.upDirectoryEvent(e, $(this)); });
                $(document).on('click',    '.begard-upload-close', function(e) { b.uploadCloseEvent(e, $(this)); });
                $(document).on('change',   '#begard-upload-input', function(e) { b.uploadInputChangeEvent(e, $(this)); });
                $(document).on('click',    '#begard-error-close',  function(e) { b.closeErrorEvent(e, $(this)); });

                //Rename
                $(document).on('click',   '#begard-operation-rename-link',   function(e) { b.renameEvent(e, $(this)); });
                $(document).on('click',   '#begard-operation-rename-cancel', function(e) { b.renameCancelEvent(e, $(this)); });
                $(document).on('click',   '#begard-operation-rename-go',     function(e) { b.renameGoEvent(e, $(this)); });

                //Delete
                $(document).on('click',   '#begard-operation-delete-link',   function(e) { b.deleteEvent(e, $(this)); });
                $(document).on('click',   '#begard-operation-delete-cancel', function(e) { b.deleteCancelEvent(e, $(this)); });
                $(document).on('click',   '#begard-operation-delete-go',     function(e) { b.deleteGoEvent(e, $(this)); });

            },

            /**
             * Get data for specific path
             * @param {string} path
             */
            getData: function(path) {
                $.ajax({
                    url: b.options.remote,
                    data: {
                        path: path,
                        requestType: 'info'
                    },
                    method: b.options.method,
                    dataType: "json",
                    cache: false
                }).done(function(data) {
                    var path = data.path;
                    delete data.path;

                    b.data[path] = data;

                    b.refreshVars(path);
                    b.refreshView(path);
                });
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
                b.disableOperations();

                $('#begard-need-refresh').addClass('disabled');
            },

            /**
             * Run when select a directory
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            selectDirectoryEvent: function(e, self) {
                b.select(e, self, 'directory');
            },

            /**
             * Run when select a file
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            selectFileEvent: function(e, self) {
                b.select(e, self, 'file');
            },

            /**
             * Select a directory or file
             * @param {object} e
             * @param {object} self $(this) in fact
             * @param {string} type [file|directory]
             */
            select: function(e, self, type) {
                if (self.hasClass('begard-selected')) {
                    self.removeClass('begard-selected');
                } else{
                    if (b.options.multiSelect) {
                        self.addClass('begard-selected');
                    } else {
                        b.unSelectEveryThing();
                        self.addClass('begard-selected');
                    }
                }
                b.refreshFileDetails();
                b.refreshOperations();
            },

            /**
             * Toggle operations button
             */
            refreshOperations: function() {
                var filesSelected = $('#begard-files .begard-selected');
                var directoriesSelected = $('#begard-directories .begard-selected');

                if (filesSelected.length === 0 && directoriesSelected.length === 0) {
                    $('#begard-operations').addClass('disabled');
                } else {
                    $('#begard-operations').removeClass('disabled');
                    $('#begard-operations-links').removeClass('disabled');

                    $('#begard-operation-rename').addClass('disabled');
                    $('#begard-operation-delete').addClass('disabled');

                    //Toggle rename button
                    if ((filesSelected.length === 1 && directoriesSelected.length === 0) ||
                        (filesSelected.length === 0 && directoriesSelected.length === 1)) {
                        $('#begard-operation-rename-link').removeClass('disabled');
                    } else {
                        $('#begard-operation-rename-link').addClass('disabled');
                    }

                    //Toggle copy, move, delete and cut buttons
                    if (filesSelected.length > 0 || directoriesSelected.length > 0) {
                        $('#begard-operation-copy-link').removeClass('disabled');
                        $('#begard-operation-move-link').removeClass('disabled');
                        $('#begard-operation-delete-link').removeClass('disabled');
                        $('#begard-operation-cut-link').removeClass('disabled');

                    }
                }
            },

            /**
             * Refresh file details
             */
            refreshFileDetails: function() {
                var directoriesSelected = $('#begard-directories .begard-selected');
                var filesSelected = $('#begard-files .begard-selected');

                if (directoriesSelected.length === 0 && filesSelected.length === 1) {
                    $('#begard-file-details').children().remove();

                    var fileSelected = $('#begard-files .begard-selected');
                    var filePath = fileSelected.attr('data-path');
                    var fileIndex = fileSelected.attr('data-index');

                    var file = b.data[filePath]['files'][fileIndex];

                    var template = b.options.templates.fileDetails;
                    template = template.replace(new RegExp('{data-name}', 'g'), file.name);
                    template = template.replace(new RegExp('{data-size}', 'g'), file.size);
                    template = template.replace(new RegExp('{data-extension}', 'g'), file.extension);
                    $('#begard-file-details').append(template);

                    $('#begard-file-details').removeClass('disabled');
                } else {
                    $('#begard-file-details').addClass('disabled');
                }
            },

            /**
             * Disable operations when view refreshed
             */
            disableOperations: function() {
                $('#begard-operations').addClass('disabled');
                $('#begard-operation-paste-link').addClass('disabled');
                $('#begard-operation-copy-link').addClass('disabled');
                $('#begard-operation-rename-link').addClass('disabled');
                $('#begard-operation-move-link').addClass('disabled');
                $('#begard-operation-delete-link').addClass('disabled');

                $('#begard-operation-rename').addClass('disabled');
                $('#begard-operation-delete').addClass('disabled');
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
             * Enable need refresh button
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            needRefreshEvent: function(e, self) {
                var path = self.attr('data-path');
                self.addClass('disabled');

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
             * Unselect every directory and file
             */
            unSelectEveryThing: function() {
                $('#begard-files .begard-selected').removeClass('begard-selected');
                $('#begard-directories .begard-selected').removeClass('begard-selected');
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
                    template = template.replace(new RegExp('{data-path}', 'g'), path);
                    template = template.replace(new RegExp('{data-index}', 'g'), index);
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

            /**
             * Refresh breadcrumb
             */
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
            },

            /**
             * Select a file for upload
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            uploadInputChangeEvent: function(e, self) {
                var file = e.target.files[0];
                file.percent = 0;
                file.id = ++b.lastFileId;
                b.upload(file);
            },

            /**
             * Upload file
             * @param {object} file File, file.percent and file.id also need.
             */
            upload: function(file) {
                b.createUploadItem(file);

                var formData = new FormData;
                formData.append('file', file);
                formData.append('path', b.currentPath);
                formData.append('requestType', 'upload');

                $('#begard-upload-form')[0].reset();

                var jqxhr = $.ajax({
                    url: b.options.remote,
                    method: b.options.method,
                    data: formData,
                    cache: false,
                    dataType: 'json',
                    processData: false,
                    contentType: false,
                    cache: false,
                    xhr: function() {
                        var xhr = $.ajaxSettings.xhr();
                        if (xhr.upload) {
                            xhr.upload.addEventListener('progress', function(e) {
                                var percent = 0;
                                var position = e.loaded || e.position;
                                var total = e.total;
                                if (e.lengthComputable) {
                                    percent = Math.ceil(position / total * 100);
                                }
                                file.percent = percent;
                                b.refreshUploadItem(file);
                            }, false);
                        }
                        return xhr;
                    }
                }).done(function(data) {
                    if (data.status !== 1) {
                        b.failedUploadItem(file);
                    } else {
                        var uploadItem = $('.begard-upload-item[data-id="' + file.id + '"]');
                        uploadItem.addClass('begard-upload-item-succeed');

                        b.needRefresh(data.path);
                    }
                }).fail(function(xhr, text) {
                    b.failedUploadItem(file);
                }).complete(function() {
                    var uploadItem = $('.begard-upload-item[data-id="' + file.id + '"]');
                    uploadItem.find('.begard-upload-close').removeClass('disabled');
                });
            },

            /**
             * Run when a upload item failed in upload
             * @param {object} file File
             */
            failedUploadItem: function(file) {
                var uploadItem = $('.begard-upload-item[data-id="' + file.id + '"]');
                uploadItem.addClass('begard-upload-item-failed').find('.begard-upload-error').removeClass('disabled');
            },

            /**
             * Create html of upload item
             * @param {object} file File
             */
            createUploadItem: function(file) {
                $('.begard-upload-item[data-id="' + file.id + '"]').remove();

                var template = b.options.templates.uploadList;
                template = template.replace(new RegExp('{data-id}', 'g'), file.id);
                template = template.replace(new RegExp('{data-percent}', 'g'), file.percent);
                template = template.replace(new RegExp('{data-name}', 'g'), file.name);
                $('#begard-upload-list').append(template);
            },

            /**
             * Refresh percent of upload item in html
             * @param {object} file File
             */
            refreshUploadItem: function(file) {
                var uploadItem = $('.begard-upload-item[data-id="' + file.id + '"]');

                uploadItem.find('[data-change-percent-width]').css({'width': file.percent + '%'});
                uploadItem.find('[data-change-percent-text]').text(file.percent + '%');
            },

            /**
             * Close button event in upload item
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            uploadCloseEvent: function(e, self) {
                self.closest('.begard-upload-item').remove();
            },

            /**
             * Rename event
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            renameEvent: function(e, self) {
                b.currentOperation = 'rename';

                $('#begard-operations-links').addClass('disabled');
                $('#begard-operation-rename').removeClass('disabled');

                var fileSelected = $('#begard-files .begard-selected');
                var directorySelected = $('#begard-directories .begard-selected');

                b.willOperate = {requestType: 'operation', operation: 'rename'};

                if (fileSelected.length === 1) {
                    var path = fileSelected.attr('data-path');
                    b.willOperate.type = 'file';
                    b.willOperate.path = path;
                    b.willOperate.name = b.data[path]['files'][fileSelected.attr('data-index')].name;
                } else {
                    b.willOperate.type = 'directory';
                    b.willOperate.path = directorySelected.attr('data-path');
                }
            },

            /**
             * Rename a file or directory
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            renameGoEvent: function(e, self) {
                b.willOperate.renameTo = $('#begard-operation-rename-input').val();
                $.ajax({
                    url: b.options.remote,
                    data: b.willOperate,
                    method: b.options.method,
                    dataType: "json",
                    cache: false
                }).done(function(data) {
                    if (data.status !== 1) {
                        b.showError(data.message);
                    } else {
                        b.needRefresh(data.path);
                    }
                }).fail(function() {
                    b.showError(b.options.defaultErrorMessage);
                }).complete(function() {
                    $('#begard-operations-links').removeClass('disabled');
                    $('#begard-operation-rename').addClass('disabled');

                    b.currentOperation = null;
                });
            },

            /**
             * Cancel for rename
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            renameCancelEvent: function(e, self) {
                $('#begard-operations-links').removeClass('disabled');
                $('#begard-operation-rename').addClass('disabled');

                b.currentOperation = null;
            },

            /**
             * Delete event
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            deleteEvent: function(e, self) {
                b.currentOperation = 'delete';

                $('#begard-operations-links').addClass('disabled');
                $('#begard-operation-delete').removeClass('disabled');

                var filesSelected = $('#begard-files .begard-selected');
                var directoriesSelected = $('#begard-directories .begard-selected');

                b.willOperate = {requestType: 'operation', operation: 'delete', path: b.currentPath, files: [], directories: []};

                filesSelected.each(function() {
                    var path = $(this).attr('data-path');
                    b.willOperate.files.push({path: path, name: b.data[path]['files'][$(this).attr('data-index')].name});
                });

                directoriesSelected.each(function() {
                    b.willOperate.directories.push({path: $(this).attr('data-path')});
                });
            },

            /**
             * Delete files or directories
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            deleteGoEvent: function(e, self) {
                $.ajax({
                    url: b.options.remote,
                    data: b.willOperate,
                    method: b.options.method,
                    dataType: "json",
                    cache: false
                }).done(function(data) {
                    if (data.status !== 1) {
                        b.showError(data.message);
                    } else {
                        b.needRefresh(data.path);
                    }
                }).fail(function() {
                    b.showError(b.options.defaultErrorMessage);
                }).complete(function() {
                    $('#begard-operations-links').removeClass('disabled');
                    $('#begard-operation-delete').addClass('disabled');

                    b.currentOperation = null;
                });
            },

            /**
             * Cancel delete
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            deleteCancelEvent: function(e, self) {
                $('#begard-operations-links').removeClass('disabled');
                $('#begard-operation-delete').addClass('disabled');

                b.currentOperation = null;
            },

            /**
             * Current path need to refresh
             * @param {string} path
             */
            needRefresh: function(path) {
                delete b.data[path];
                if (path === b.currentPath) {
                    $('#begard-need-refresh').attr('data-path', b.currentPath).removeClass('disabled');
                }
            },

            /**
             * Show a error
             * @param {string} message
             */
            showError: function(message) {
                $('#begard-error').removeClass('disabled');
                $('#begard-error-text').text(message);
            },

            /**
             * Close error message
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            closeErrorEvent: function(e, self) {
                $('#begard-error').addClass('disabled');
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

                $('#begard-close').addClass('disabled');

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
