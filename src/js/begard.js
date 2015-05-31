(function() {
    var begardFactory;

    begardFactory = function($, _) {
        return begard = {
            /**
             * Set configuration
             * @param {object} options
             */
            config: function(options) {

            },

            /**
             * Start begard normally
             * @param {string} element - Selector of begard DOM element
             */
            standolne: function(element) {

            },

            /**
             * Start begard as a modal
             * @param {string} element - Selector of begard DOM element
             */
            modal: function(element) {

            },

            /**
             * Close begard when started as a modal
             */
            close: function () {

            }
        };
    };


    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'underscore'], begardFactory);
    } else if (typeof exports === 'object') {
        module.exports = begardFactory(require('jquery', 'underscore'));
    } else {
        window.begard = begardFactory(window.jQuery, window._);
    }
}).call(this);
