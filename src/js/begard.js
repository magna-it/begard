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
                autoRefresh: false,
                templates: {
                    directory: '<div class="begard-directory" data-path="{data-path}" data-index="{data-index}"><a href="javascript:void(0)"><ul><li class="icon"><i class="fa fa-folder"></i></li><li>{data-name}</li></ul></a></div>',
                    file: '<div class="begard-file" data-path="{data-path}" data-index="{data-index}"><ul><li class="icon"><i class="fa {data-extension}-ext"></i></li><li class="begard-file-image" class="disabled"><div class="centered"><img class="begard-file-image-src" src=""></div></li><li>{data-name}</li></ul></div>',
                    breadcrumb: '<li class="begard-crumb"><a href="#" class="begard-crumb-to" data-path="{data-path}">{data-name}</a></li>',
                    fileDetails: '<h4>Selected file details</h4><ul><li class="begard-file-details-image"><img class="begard-file-details-image-src" src=""></li><li>Name: {data-name}</li><li>Extension: {data-extension}</li><li>Size: {data-size}</li></ul>',
                    uploadList: '<div class="begard-upload-item" data-id="{data-id}"><ul><i class="begard-upload-close fa fa-times disabled"></i><li class="begard-upload-error disabled"></li><li class="begard-upload-name">{data-name}</li><li><div class="progress"><div class="progress-bar progress-bar-warning" role="progressbar" data-change-percent-width data-change-percent-text aria-valuemin="0" aria-valuemax="100" style="width: 0%;">0%</div></div></li></ul></div>'
                }
            },

            /**
             * Options for modal view
             */
            modalOptions: {
                select: true,
                fileSelect: true,
                directorySelect: false
            },

            /**
             * Event for modal view
             */
            modalEvents: {
                afterSelect: null
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
             * Is Begard started in modal view
             */
            isModal: false,

            /**
             * Initialize begard
             */
            init: function(isModal) {
                b.isModal = isModal;

                b.handleEvents();
                b.openDirectory('/');

                b.disableOperations();
                $('#begard-error').addClass('disabled');
            },

            /**
             * Handle events
             */
            handleEvents: function() {
                $(document).on('dblclick', '.begard-directory',    function(e) { b.openDirectoryEvent(e, $(this)); });
                $(document).on('click',    '.begard-crumb-to',     function(e) { b.openCrumbDirectoryEvent(e, $(this)); });
                $(document).on('click',    '#begard-need-refresh', function(e) { b.needRefreshEvent(e, $(this)); });
                $(document).on('click',    '.begard-directory',    function(e) { b.selectDirectoryEvent(e, $(this)); });
                $(document).on('click',    '.begard-file',         function(e) { b.selectFileEvent(e, $(this)); });
                $(document).on('click',    '#begard-up',           function(e) { b.upDirectoryEvent(e, $(this)); });
                $(document).on('click',    '.begard-upload-close', function(e) { b.uploadCloseEvent(e, $(this)); });
                $(document).on('change',   '#begard-upload-input', function(e) { b.uploadInputChangeEvent(e, $(this)); });
                $(document).on('click',    '#begard-error-close',  function(e) { b.closeErrorEvent(e, $(this)); });

                //Modal view
                $(document).on('click',    '#begard-close',       function(e) { b.closeBegard(); });
                $(document).on('click',    '#begard-select-link', function(e) { b.selectEvent(e, $(this)); });

                //Rename
                $(document).on('click',   '#begard-operation-rename-link',   function(e) { b.renameEvent(e, $(this)); });
                $(document).on('click',   '#begard-operation-rename-cancel', function(e) { b.renameCancelEvent(e, $(this)); });
                $(document).on('click',   '#begard-operation-rename-go',     function(e) { b.renameGoEvent(e, $(this)); });

                //Delete
                $(document).on('click',   '#begard-operation-delete-link',   function(e) { b.deleteEvent(e, $(this)); });
                $(document).on('click',   '#begard-operation-delete-cancel', function(e) { b.deleteCancelEvent(e, $(this)); });
                $(document).on('click',   '#begard-operation-delete-go',     function(e) { b.deleteGoEvent(e, $(this)); });

                //Copy, move and paste
                $(document).on('click',   '#begard-operation-copy-link',     function(e) { b.copyEvent(e, $(this)); });
                $(document).on('click',   '#begard-operation-move-link',     function(e) { b.moveEvent(e, $(this)); });
                $(document).on('click',   '#begard-operation-paste-cancel',  function(e) { b.pasteCancelEvent(e, $(this)); });
                $(document).on('click',   '#begard-operation-paste-go',      function(e) { b.pasteGoEvent(e, $(this)); });

            },

            /**
             * Get info of specific path and refresh view
             * Example request of info:
             *  {
             *      requestType: 'info',
             *      path: '/'
             *  }
             *
             * Example of response:
             *  {
             *      status: 1,
             *      path: '/',
             *      files: [{name: 'file 1.txt', extension: 'txt', size: 15409}],
             *      directories: ['directory 1', 'directory 2']
             *  }
             *
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
                    if (data.status !== 1) {
                        b.showError(b.message);
                    } else {
                        var path = data.path;
                        delete data.path;

                        b.data[path] = data;

                        b.refreshVars(path);
                        b.refreshView(path);
                    }
                }).fail(function() {
                    b.showError(b.options.defaultErrorMessage);
                });
            },

            /**
             * Refresh variables
             *
             * @param {string} path
             */
            refreshVars: function(path) {
                b.currentPath = path;
            },

            /**
             * Refresh view
             *
             * @param {string} path
             */
            refreshView: function(path) {
                b.refreshDirectories(path);
                b.refreshFiles(path);
                b.checkUpDirectory(path);
                b.refreshBreadcrumb();

                if (b.currentOperation === null)
                    b.disableOperations();
                else
                    b.updateOperations();

                $('#begard-need-refresh').addClass('disabled');
                $('#begard-file-details').addClass('disabled');
            },

            /**
             * Run when select a directory
             *
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            selectDirectoryEvent: function(e, self) {
                b.select(e, self, 'directory');
            },

            /**
             * Run when select a file
             *
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            selectFileEvent: function(e, self) {
                b.select(e, self, 'file');
            },

            /**
             * Select a directory or file
             *
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
                b.refreshModalView()
            },

            /**
             * Refresh elements that belongs to modal view
             */
            refreshModalView: function() {
                var filesSelected = $('#begard-files .begard-selected');
                var directoriesSelected = $('#begard-directories .begard-selected');

                if (b.isModal && b.modalOptions.select) {

                    //First enable select link if any file or directory selected
                    if (filesSelected.length > 0 || directoriesSelected.length > 0) {
                        $('#begard-select-link').removeClass('disabled').removeAttr('disabled');
                    } else {
                        $('#begard-select-link').addClass('disabled').attr('disabled');
                    }

                    // Then if file select is denied and user selected a file
                    // disable select link
                    if (filesSelected.length > 0 && !b.modalOptions.fileSelect) {
                        $('#begard-select-link').addClass('disabled').attr('disabled');
                    }

                    // and if directory select is denied and user selected a directory
                    // disable select link
                    if (directoriesSelected.length > 0 && !b.modalOptions.directorySelect) {
                        $('#begard-select-link').addClass('disabled').attr('disabled');
                    }
                }
            },

            /**
             * Toggle operations button when select or deselect file or directory
             */
            refreshOperations: function() {
                var filesSelected = $('#begard-files .begard-selected');
                var directoriesSelected = $('#begard-directories .begard-selected');

                if (b.currentOperation === null) {
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
                }
            },

            /**
             * Update operations button when view is refreshed
             */
            updateOperations: function() {
                if (b.currentOperation === 'copy' || b.currentOperation === 'move') {
                    //Enable paste button if copy or move path against to currentPath
                    if (b.willOperate.path !== b.currentPath)
                        $('#begard-operation-paste-go').removeClass('disabled').removeAttr('disabled');
                    else
                        $('#begard-operation-paste-go').addClass('disabled').addAttr('disabled');
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

                    // If file has a image for preview
                    if (file.hasOwnProperty('preview')) {
                        template = $(template).addClass('begard-file-details-has-image')
                            .find('.begard-file-details-image').removeClass('disabled')
                            .find('.begard-file-details-image-src').attr('src', file.preview)
                            .closest('.begard-file-details-has-image');
                    }

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
                $('#begard-operation-copy-link').addClass('disabled');
                $('#begard-operation-rename-link').addClass('disabled');
                $('#begard-operation-move-link').addClass('disabled');
                $('#begard-operation-delete-link').addClass('disabled');

                $('#begard-operation-rename').addClass('disabled');
                $('#begard-operation-delete').addClass('disabled');
                $('#begard-operation-paste').addClass('disabled');
            },

            /**
             * Open a folder by given path
             *
             * @param {string} path
             */
            openDirectory: function(path) {
                //If data is already taken, Do not take again
                if (typeof b.data[path] != "undefined") {
                    b.refreshVars(path);
                    b.refreshView(path);
                } else {
                    b.getData(path);
                }
            },

            /**
             * Open a folder when user click on a directory
             *
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            openDirectoryEvent: function(e, self) {
                var path = self.attr('data-path');
                var index = self.attr('data-index');

                b.openDirectory(b.createDirectoryPath(path, index));
            },

            /**
             * Open a folder when user click on a breadcrumb
             *
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            openCrumbDirectoryEvent: function(e, self) {
                var path = self.attr('data-path');

                b.openDirectory(path);
            },

            /**
             * Create directory path
             *
             * @param {string} path
             * @param {int} index
             */
            createDirectoryPath: function(path, index) {
                var directoryName = b.data[path]['directories'][index];

                //Do not add extra slash when path is root
                if (path !== '/')   basePath = path + '/' + directoryName;
                else                basePath = path + directoryName;

                return basePath;
            },

            /**
             * Enable need refresh button
             *
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            needRefreshEvent: function(e, self) {
                var path = self.attr('data-path');
                self.addClass('disabled');

                b.openDirectory(path);
            },

            /**
             * Open a folder and refresh view
             *
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

                    b.openDirectory(upPath);
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
             *
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
             *
             * @param {string} path
             */
            refreshFiles: function(path) {
                $('#begard-files .begard-file').remove();
                $.each(b.data[path].files, function(index, file) {

                    //Add file to html
                    var template = b.options.templates.file;
                    template = template.replace(new RegExp('{data-name}', 'g'), file.name);
                    template = template.replace(new RegExp('{data-size}', 'g'), file.size);
                    template = template.replace(new RegExp('{data-path}', 'g'), path);
                    template = template.replace(new RegExp('{data-index}', 'g'), index);
                    template = template.replace(new RegExp('{data-extension}', 'g'), file.extension);

                    // If file has a image for preview
                    if (file.hasOwnProperty('preview')) {
                        template = $(template).addClass('begard-file-has-image')
                            .find('.begard-file-image').removeClass('disabled')
                            .find('.begard-file-image-src').attr('src', file.preview)
                            .closest('.begard-file-has-image');
                    }

                    $('#begard-files').append(template);
                });
            },

            /**
             * Refresh directory list by given path
             *
             * @param {string} path
             */
            refreshDirectories: function(path) {
                $('#begard-directories .begard-directory').remove();
                $.each(b.data[path].directories, function(index, directoryName) {

                    //Add directory to html
                    var template = b.options.templates.directory;
                    template = template.replace(new RegExp('{data-path}', 'g'), path);
                    template = template.replace(new RegExp('{data-name}', 'g'), directoryName);
                    template = template.replace(new RegExp('{data-index}', 'g'), index);
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
                template = template.replace(new RegExp('{data-name}', 'g'), '/');
                template = template.replace(new RegExp('{data-path}', 'g'), path);
                $('#begard-breadcrumb').append(template);

                //Add other part of path to breadcrumb
                $.each(sDirectories, function(index, directoryName) {

                    path += directoryName;

                    //Add breadcrumb to html
                    var template = b.options.templates.breadcrumb;
                    template = template.replace(new RegExp('{data-name}', 'g'), directoryName);
                    template = template.replace(new RegExp('{data-path}', 'g'), path);
                    $('#begard-breadcrumb').append(template);
                    path += '/';
                });
                $('#begard-breadcrumb .begard-crumb').last().addClass('active');
            },

            /**
             * Select a file for upload
             *
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
             * Example of upload request:
             *  {
             *      requestType: 'upload',
             *      path: '/',
             *      file: FILE,
             *  }
             *
             * Example of response:
             *  {
             *      status: 1,
             *      fileName: 'file 1',
             *      path: '/',
             *  }
             *
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
                        b.failedUploadItem(file, data.message);
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
             *
             * @param {object} file File
             */
            failedUploadItem: function(file, message) {
                var uploadItem = $('.begard-upload-item[data-id="' + file.id + '"]');

                if (typeof message !== 'undefined')
                    uploadItem.addClass('begard-upload-item-failed').find('.begard-upload-error')
                        .text(message).removeClass('disabled');
                else
                    uploadItem.addClass('begard-upload-item-failed').find('.begard-upload-error')
                        .text(b.options.defaultErrorMessage).removeClass('disabled');
            },

            /**
             * Create html of upload item
             *
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
             *
             * @param {object} file File
             */
            refreshUploadItem: function(file) {
                var uploadItem = $('.begard-upload-item[data-id="' + file.id + '"]');

                uploadItem.find('[data-change-percent-width]').css({'width': file.percent + '%'});
                uploadItem.find('[data-change-percent-text]').text(file.percent + '%');
            },

            /**
             * Close button event in upload item
             *
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            uploadCloseEvent: function(e, self) {
                self.closest('.begard-upload-item').remove();
            },

            /**
             * Rename event
             * Example of rename request:
             *  {
             *      requestType: "operation"
             *      operation: "rename",
             *      type: "directory"
             *      path: "/",
             *      name: "Old name",
             *      renameTo: "New name",
             *  }
             *
             * Type can be directory or file
             *
             * Example of response:
             *  {
             *      status: 1,
             *      path: '/',
             *  }
             *
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
                    var path = directorySelected.attr('data-path');
                    b.willOperate.type = 'directory';
                    b.willOperate.path = path;
                    b.willOperate.name = b.data[path]['directories'][directorySelected.attr('data-index')];
                }
            },

            /**
             * Rename a file or directory
             *
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
             *
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
             * Example of delete request:
             *  {
             *      requestType: "operation"
             *      operation: "delete",
             *      path: "/",
             *      files: ['file 1', 'file 2'],
             *      directories: ['directory 1', 'directory 2']
             *  }
             *
             * file or directories maybe not send
             *
             * Example of response:
             *  {
             *      status: 1,
             *      path: '/',
             *  }
             *
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
                    b.willOperate.files.push(b.data[path]['files'][$(this).attr('data-index')].name);
                });

                directoriesSelected.each(function() {
                    var path = $(this).attr('data-path');
                    b.willOperate.directories.push(b.data[path]['directories'][$(this).attr('data-index')]);
                });
            },

            /**
             * Delete files or directories
             *
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
             *
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            deleteCancelEvent: function(e, self) {
                $('#begard-operations-links').removeClass('disabled');
                $('#begard-operation-delete').addClass('disabled');

                b.currentOperation = null;
            },

            /**
             * Copy event
             * Example of copy request:
             *  {
             *      requestType: "operation"
             *      operation: "copy",
             *      path: "/",
             *      pathTo: "/another path",
             *      files: ['file 1', 'file 2'],
             *      directories: ['directory 1', 'directory 2']
             *  }
             *
             * file or directories maybe not send
             *
             * Example of response:
             *  {
             *      status: 1,
             *      path: '/',
             *      pathTo: '/another path',
             *  }
             *
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            copyEvent: function(e, self) {
                b.currentOperation = 'copy';

                $('#begard-operations-links').addClass('disabled');
                $('#begard-operation-paste').removeClass('disabled');
                $('#begard-operation-paste-go').addClass('disabled').attr('disabled');

                var filesSelected = $('#begard-files .begard-selected');
                var directoriesSelected = $('#begard-directories .begard-selected');

                b.willOperate = {requestType: 'operation', operation: 'copy', path: b.currentPath, files: [], directories: []};

                filesSelected.each(function() {
                    var path = $(this).attr('data-path');
                    b.willOperate.files.push(b.data[path]['files'][$(this).attr('data-index')].name);
                });

                directoriesSelected.each(function() {
                    var path = $(this).attr('data-path');
                    b.willOperate.directories.push(b.data[path]['directories'][$(this).attr('data-index')]);
                });
            },

            /**
             * Move event
             * Example of move request:
             *  {
             *      requestType: "operation"
             *      operation: "move",
             *      path: "/",
             *      pathTo: "/another path",
             *      files: ['file 1', 'file 2'],
             *      directories: ['directory 1', 'directory 2']
             *  }
             *
             * file or directories maybe not send
             *
             * Example of response:
             *  {
             *      status: 1,
             *      path: '/',
             *      pathTo: '/another path',
             *  }
             *
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            moveEvent: function(e, self) {
                b.currentOperation = 'move';

                $('#begard-operations-links').addClass('disabled');
                $('#begard-operation-paste').removeClass('disabled');
                $('#begard-operation-paste-go').addClass('disabled').attr('disabled');

                var filesSelected = $('#begard-files .begard-selected');
                var directoriesSelected = $('#begard-directories .begard-selected');

                b.willOperate = {requestType: 'operation', operation: 'move', path: b.currentPath, files: [], directories: []};

                filesSelected.each(function() {
                    var path = $(this).attr('data-path');
                    b.willOperate.files.push(b.data[path]['files'][$(this).attr('data-index')].name);
                });

                directoriesSelected.each(function() {
                    var path = $(this).attr('data-path');
                    b.willOperate.directories.push(b.data[path]['directories'][$(this).attr('data-index')]);
                });
            },

            /**
             * Cancel paste copy or moved files and directories
             *
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            pasteCancelEvent: function(e, self) {
                $('#begard-operations-links').removeClass('disabled');
                $('#begard-operation-paste').addClass('disabled');
                $('#begard-operation-paste-go').removeClass('disabled').removeAttr('disabled');

                b.currentOperation = null;
            },

            /**
             * Paste
             *
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            pasteGoEvent: function(e, self) {
                b.willOperate.pathTo = b.currentPath;
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
                            b.needRefresh(data.pathTo);
                    }
                }).fail(function() {
                    b.showError(b.options.defaultErrorMessage);
                }).complete(function() {
                    $('#begard-operations-links').removeClass('disabled');
                    $('#begard-operation-paste').addClass('disabled');

                    b.currentOperation = null;
                });
            },

            /**
             * Current path need to refresh
             *
             * @param {string} path
             */
            needRefresh: function(path) {
                delete b.data[path];
                if (path === b.currentPath) {
                    if (b.options.autoRefresh)
                        b.openDirectory(b.currentPath);
                    else
                        $('#begard-need-refresh').attr('data-path', b.currentPath).removeClass('disabled');
                }
            },

            /**
             * Show a error
             *
             * @param {string} message
             */
            showError: function(message) {
                $('#begard-error').removeClass('disabled');
                $('#begard-error-text').text(message);
            },

            /**
             * Close error message
             *
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            closeErrorEvent: function(e, self) {
                $('#begard-error').addClass('disabled');
            },

            /**
             * Clsoe begard file manager when started as a modal
             */
            closeBegard: function() {
                $('#begard').removeClass('begard-modal');
                $('#begard-modal-back').addClass('disabled');
            },

            /**
             * Select link event
             *
             * @param {object} e
             * @param {object} self $(this) in fact
             */
            selectEvent: function(e, self) {
                if (b.modalEvents.afterSelect !== null) {
                    var filesSelected = $('#begard-files .begard-selected');
                    var directoriesSelected = $('#begard-directories .begard-selected');

                    var selected = {path: b.currentPath, files: [], directories: []};

                    filesSelected.each(function() {
                        var path = $(this).attr('data-path');
                        selected.files.push(b.data[path]['files'][$(this).attr('data-index')].name);
                    });

                    directoriesSelected.each(function() {
                        var path = $(this).attr('data-path');
                        selected.directories.push(b.data[path]['directories'][$(this).attr('data-index')]);
                    });
                    b.modalEvents.afterSelect(selected);
                }
                b.closeBegard();
            }
        };

        return begard = {

            /**
             * Set configuration
             *
             * @param {object} options
             */
            config: function(options) {
                $.extend(true, b.options, options);
            },

            /**
             * Start begard normally
             */
            standalone: function() {
                //Initialize
                b.init(false);

                $('#begard-close').addClass('disabled');
                $('#begard').addClass('begard-standalone').removeClass('begard-modal');
                $('#begard-modal-back').addClass('disabled');
                $('#begard-select').addClass('disabled');
            },

            /**
             * Start begard as a modal
             */
            modal: function(options, events) {
                $.extend(true, b.modalOptions, options);
                $.extend(true, b.modalEvents, events);

                //Initialize
                b.init(true);

                $('#begard').addClass('begard-modal').removeClass('begard-standalone');
                $('#begard-modal-back').removeClass('disabled');

                if (b.modalOptions.select) {
                    $('#begard-select-link').addClass('disabled').attr('disabled', 'disabled');
                } else {
                    $('#begard-select').addClass('disabled');
                }
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
