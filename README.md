# Begard

Begard is a file manager for web clients.
![](http://aparnet.ir/wp-content/uploads/2015/06/Begard.png)
## How to use

* Install Begrad:

        bower install begard

* Include files:

        //Load theme style
        <link rel="stylesheet" href="themes/default/style.min.css">

        //Load scripts
        <script src="jquery.min.js"></script>
        <script src="begard.min.js"></script>

* Create HTML structure base on theme you included. Usually from structure.html in theme path.

* Create server response maker for Begard. examples in below languages:

    * [PHP](https://gist.github.com/mohsen-shafiee/de63ca8cf4c1f2a9b0b5)

* Start

        begard.config({
            remote: 'http://localhost/response-maker.php',
            multiSelect: true,
            autoRefresh: true
        });

        begard.standalone();

This is just the start, please read wiki for more information.

## Themes

Default theme is installed with begard in ```dist/css/themes/default```.

Other themes in [begard-themes](https://github.com/magnagroup/begard-themes) repository.
