# Begard

Begard is a file manager for web clients.

Begard has two view: ```standalone``` and ```modal```. In ```standalone``` begard displayed to user normally, and user can delete, remove, rename, copy and move files and directories. In ```modal``` view begard displayed as a modal, and user can delete, remove, rename, copy and move files and directories, also can select files or directories for your purposes, when user select a file or directory in modal view, begard closed automatically.

![](http://aparnet.ir/wp-content/uploads/2015/06/Begard.png)
## How to use

* Install Begrad:

        bower install begard

* Include html and css of theme:

    Default theme is in begrad repository itself. If you want use another theme or create one, use [begard-themes](https://github.com/magnagroup/begard-themes) repository.

    Every theme has a file with ```structure.html``` name. You must include this html codes to your page, and also css files of theme.
    In default theme, you must include bootstrap and font-awesome libraries.

        //Load theme style
        <link rel="stylesheet" href="bower_components/begard/dist/css/themes/default/bootstrap.min.css">
        <link rel="stylesheet" href="bower_components/begard/dist/css/themes/default/font-awesome.min.css">
        <link rel="stylesheet" href="bower_components/begard/dist/css/themes/default/style.min.css">

* Include scripts:

        //Load scripts
        <script src="bower_components/jquery/dist/jquery.min.js"></script>
        <script src="bower_components/begard/dist/js/begard.min.js"></script>

* Create server response maker for Begard. examples in below languages:

    * [PHP](https://gist.github.com/mohsen-shafiee/de63ca8cf4c1f2a9b0b5)

* Start

        begard.init();

        begard.standalone({
            remote: 'http://localhost/tests/path.php'
        });

        // OR

        begard.modal({
            remote: 'http://localhost/tests/path.php'
        });

## Configuration

### Settings

#### General settings

| Setting name              | Description                                                       | Default           | Type       |
| -------------             |-------------                                                      | ---------         | ----------
| ```remote```              | Url of server [Required]                                          | null              | ```string```
| ```method```              | Method of ajax requests                                           | ```POST```        | ```string```
| ```defaultErrorMessage``` | Default error message                                             | An error occurred | ```string```
| ```multiSelect```         | User allow to select multi files or directories and do operation? | ```false```       | ```boolean```
| ```autoRefresh```         | Auto refresh list of files and directories                        | ```false```       | ```boolean```

#### Send with settings

If you want send extra data with any ajax request, you can specify in this setting. In ```sendWith``` object.

| Setting name | Description             | Default   | Type       |
| -------------|-------------            | --------- | ----------
| ```all```    | Send with all requests  | {}        | ```object```
| ```info```   | Send with info request  | {}        | ```object```
| ```copy```   | Send with copy request  | {}        | ```object```
| ```move```   | Send with move request  | {}        | ```object```
| ```delete``` | Send with delete request| {}        | ```object```

#### Select rules settings

In modal view you can specify what type of file you want user select, like a validation. In ```selectRules``` object.

| Setting name            | Description                                                                   | Default   | Type       |
| -------------           |-------------                                                                  | --------- | ----------
| ```select```            | If ability select enable?                                                     | true      | ```boolean```
| ```fileSelect```        | Select file allowed?                                                          | true      | ```boolean```
| ```fileAcceptedMimes``` | What type of file allowed? if you want images just set it to ```['images']``` | 'all'     | ```array```
| ```directorySelect```   | Select directory allowed?                                                     | false     | ```boolean```

#### Template settings

This settings different per themes, and specify by theme. In ```templates``` object.

| Setting name      | Description                        | Default                    | Type       |
| -------------     |-------------                       | ---------                  | ----------
| ```directory```   | Template of directory items        | suitable for default theme | ```string```
| ```file```        | Template of file items             | suitable for default theme | ```string```
| ```fileDetails``` | Template of file detail in sidebar | suitable for default theme | ```string```
| ```breadcrumb```  | Template of breadcrumb             | suitable for default theme | ```boolean```
| ```uploadList```  | Template of upload list            | suitable for default theme | ```boolean```

### Events

- ```afterSelect: function(path, files, directories, customField)```

    This event call when begrad displayed as modal and user select files or directories.

- ```addCustomField: function()```

    This event used for add custom html and fields to sidebar.

        addCustomField: function() {
            return '<label><input id="begardp-delete-from-gallery" type="checkbox" name="deleteAfter" value="true" /> Delete from gallery after selected.</label>';
        },

- ```processCustomField: function()```

    This event used for process custom fields added to begard. Everythings returned this fucntion pass to ```afterSelect``` event.

### Example

```
begard.init();

begard.modal({
    remote: 'http://localhost/tests/path.php',
    multiSelect: false,
    autoRefresh: true,
    selectRules: {
        fileAcceptedMimes: 'all'
    },
    sendWith: {
        all: {
            type: 'option'
        }
    }
}, {
    afterSelect: function(path, files, directories, customField) {
        console.log(path, files, directories, customField);
    },
    addCustomField: function() {
        return '<label><input id="check1" type="checkbox" name="deleteAfter" value="true" /> Delete from gallery after selected.</label>';
    },
    processCustomField: function() {
        if ($('#check1').is(':checked')) {
            return { deleteFromGallery: true };
        }
        return { deleteFromGallery: false };
    }
});
```

## Operations and Requests

Every request response must have a status, if status equal to 1, means response is correct and if equal to 0 means response is incorrect.

### info

This request for get list of files and directories. Path of root directory in begard must be '/'.

Example request of info:

```
{
    requestType: 'info',
    path: '/'
}
```

```name``` and ```mime``` of files in info response is required, other data you send, passed to ```afterSelect``` event. Also you can send other info about file and use it in theme.

Example of response:

```
{
    path: '/',
    files: [{name: 'file 1.txt', mime: 'text-x/php'}, {...}, {...}],
    directories: ['directory 1', 'directory 2'],
    status: 1
}
```

### upload

Example of upload request:

```
{
    requestType: 'upload',
    path: '/',
    file: FILE,
}
```

Example of response:

```
{
    status: 1,
    fileName: 'file 1',
    path: '/',
}
```

### rename

Example of rename request:

```
{
    requestType: "operation"
    operation: "rename",
    type: "directory"
    path: "/",
    name: "Old name",
    renameTo: "New name",
}
```
Type can be directory or file

Example of response:

```
{
    status: 1,
    path: '/',
}
```

### delete

Example of delete request:

```
{
    requestType: "operation"
    operation: "delete",
    path: "/",
    files: ['file 1', 'file 2'],
    directories: ['directory 1', 'directory 2']
}
```

```files``` or ```directories``` maybe not send.

Example of response:

```
{
    status: 1,
    path: '/',
}
```
### copy

Example of copy request:

```
{
    requestType: "operation"
    operation: "copy",
    path: "/",
    pathTo: "/another path",
    files: ['file 1', 'file 2'],
    directories: ['directory 1', 'directory 2']
}
```

```file``` or ```directories``` maybe not send.

Example of response:

```
{
    status: 1,
    path: '/',
    pathTo: '/another path',
}
```

### move

Example of move request:

```
{
    requestType: "operation"
    operation: "move",
    path: "/",
    pathTo: "/another path",
    files: ['file 1', 'file 2'],
    directories: ['directory 1', 'directory 2']
}
```

```file``` or ```directories``` maybe not send.

Example of response:

```
{
    status: 1,
    path: '/',
    pathTo: '/another path',
}
```

## Create a theme

Documentation for creating theme is not started, but you can contribute in default theme, or other themes in [begard-themes](https://github.com/magnagroup/begard-themes) repository.
