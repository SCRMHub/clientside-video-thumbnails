(function(window, document, undefined) {
    /**
     * Class creation
     * @param  {array} opts  Any overriding options
     */
    function VideoThumbnails(opts) {
        this.video;
        this.videoHtml;
        this.videoHeight;
        this.videoWidth;
        this.videoDuration;
        this.videoInterval;
        this.videoStart;
        this.completed = 0;
        this.captures = [];
        this.capturesDetailed = {};
        this.events = {};
        this.currentShot = 0;
        this.startTime  = null;
        this.lastTime   = null;

        //Default options
        this.defaults = {
            maxWidth        : 1280,
            maxHeight       : 1280,
            count           : 8
        }

        /**
         * Current options
         * @type {Object}
         */
        this.opts = {};

        /**
         * Current options
         * @type {Object}
         */
        this.opts = VideoThumbnails.extend({}, this.defaults, opts || {});
    };

    VideoThumbnails.prototype = {
        /**
         * Register events
         * @param  {name}       event    Function to hook onto
         * @param  {Function}   callback What to call
         */
        on: function (event, callback) {
          event = event.toLowerCase();
          if (!this.events.hasOwnProperty(event)) {
            this.events[event] = [];
          }
          this.events[event].push(callback);
        },

        /**
         * Remove event callback
         * @function
         * @param {string} [event] removes all events if not specified
         * @param {Function} [fn] removes all callbacks of event if not specified
         */
        off: function (event, fn) {
          if (event !== undefined) {
            event = event.toLowerCase();
            if (fn !== undefined) {
              if (this.events.hasOwnProperty(event)) {
                arrayRemove(this.events[event], fn);
              }
            } else {
              delete this.events[event];
            }
          } else {
            this.events = {};
          }
        },

        /**
         * Fire an event
         * @function
         * @param {string} event event name
         * @param {...} args arguments of a callback
         * @return {bool} value is false if at least one of the event handlers which handled this event
         * returned false. Otherwise it returns true.
         */
        fire: function (event, args) {
          // `arguments` is an object, not array, in FF, so:
          args = Array.prototype.slice.call(arguments);
          event = event.toLowerCase();
          var preventDefault = false;
          if (this.events.hasOwnProperty(event)) {
            each(this.events[event], function (callback) {
              preventDefault = callback.apply(this, args.slice(1)) === false || preventDefault;
            }, this);
          }
          if (event != 'catchall') {
            args.unshift('catchAll');
            preventDefault = this.fire.apply(this, args) === false || preventDefault;
          }
          return !preventDefault;
        },

        /**
         * Start capturing
         * @param  {file} file   The local filename to work with
         */
        capture(file) {
            //Need this in the events
            var thisClass = this;

            this.fire('beforeCapture');

            this.lastTime = this.startTime   = (new Date()).getTime();

            var data = new FormData();
                data.append("file", file, file.name);

            var url = window.URL || window.webkitURL;
            var fileURL = url.createObjectURL(file);

            var videoHtml = $('<video></video>');
                videoHtml.attr('id', 'videoHtmlCapture');
                videoHtml.attr('controls', true);
                videoHtml.attr('preload', 'metadata');
                videoHtml.attr('crossorigin', '*');
                videoHtml.attr('width', 600);
                videoHtml.attr('src', fileURL);

            var theVideo = $('<source></source>');
                theVideo.attr('src', fileURL);
                theVideo.attr('type', file.type);

            videoHtml.html(theVideo);
            this.videoHtml = videoHtml;

            this.video = this.videoHtml[0];            

            //As soon as the meta is ready, trigger that capture is ready
            this.video.onloadedmetadata = function() {
                thisClass.fire('startCapture', this.captures);
                thisClass.video.play();
            };

            //Trigger the capture here because the video is ready
            this.video.onplay = function() {
                thisClass.initScreenshot();
            };

            //Can't play this video
            this.video.onerror = function() {
                thisClass.fire('unsupported');
            };

            this.video.addEventListener('seeked', function() {
                //Check we still have a video (might have been cancelled)
                if(thisClass.video) {
                    thisClass.video.pause()
                    thisClass.captureScreenShot();
                }
            });
        },

        /**
         * Setup the screenshot
         */
        initScreenshot() {
            this.thumbWidth      = this.video.videoWidth;
            this.thumbHeight     = this.video.videoHeight; 

            //Wide video
            if(this.thumbWidth > this.thumbHeight) {
                var ratio           = this.opts.maxWidth / this.thumbWidth;

                this.thumbWidth     = this.opts.maxWidth;
                this.thumbHeight    = parseInt(this.thumbHeight * ratio);

            //square video
            } else if(this.thumbWidth === this.thumbHeight) {
                this.thumbWidth     = this.opts.maxWidth;
                this.thumbHeight    = this.opts.maxHeight;

            //tall video
            } else {
                var ratio = this.opts.maxHeight / this.thumbHeight;
                this.thumbHeight    = this.opts.maxHeight;
                this.thumbWidth     = parseInt(this.thumbWidth * ratio);
            }

            this.videoHtml.width(this.thumbWidth);
            this.videoHtml.height(this.thumbHeight);

            this.videoDuration = this.video.duration;
            this.videoInterval = this.videoDuration / (this.opts.count + 1); //this will ensure credits are ignored
            this.videoStart    = this.videoInterval / 2;

            //Prepare the next shot
            this.prepareScreenshot();
        },

        /**
         * This will work out what the next shot is, and move the video to that point (doesn't take the shot)
         * Doesn't return anything. The video seek will capture the shot
         */
        prepareScreenshot() {
            this.currentShot++;

            var newTime = Math.floor(this.videoStart + (this.currentShot * this.videoInterval) - this.videoInterval);
            var statTime = this.getTime();

            this.capturesDetailed[this.currentShot] = {
                capture     : this.currentShot,
                width       : this.thumbWidth,
                height      : this.thumbHeight,
                timeindex   : newTime,
                startTime   : statTime.fromStart,
                captureTime : null
            };

            this.video.currentTime = newTime;
        },

        /**
         * Capture the shot by using a canvas element
         */
        captureScreenShot() {
            var canvas = document.createElement('canvas');
                canvas.width  = this.thumbWidth;
                canvas.height = this.thumbHeight;

            var ctx = canvas.getContext('2d');
                ctx.drawImage(this.video, 0, 0, this.thumbWidth, this.thumbHeight); 

            //and save
            this.save(canvas);
        },

        /**
         * Save the captire
         * @param  {canvas} canvas The captured thumb
         */
        save(canvas) {
            //Get the shot
            var theCapture = canvas.toDataURL("image/jpeg", 0.7);

            //done
            this.grabComplete(theCapture);
        },

        /**
         * Complete the 
         * @param  {image} image   The image captured
         */
        grabComplete(image) {
            var counter = this.currentShot;
            this.completed += 1;

            //Stats are nice
            var statTime = this.getTime();

            //Save it to the array
            this.captures.push(image);
            this.capturesDetailed[counter].url = image;
            this.capturesDetailed[counter].captureTime = statTime.diff;

            //Fire the event incase anyone is listening
            this.fire('capture', image);

            //All done so remove the elements
            if(this.completed >= this.opts.count) {
                this.cleanUp();
                this.fire('complete', this.captures);

                var stats = this.getTime();

                this.fire('completeDetail', {
                    thumbs          : this.capturesDetailed,
                    totalTime       : stats.fromStart,
                    details  : {
                        thumbnailCount  : this.opts.count,
                        videoDuration   : this.videoDuration,
                        videoInterval   : this.videoInterval,
                        thumbWidth      : this.thumbWidth,
                        thumbHeight     : this.thumbHeight,
                        videoStart      : this.videoStart
                    }
                });
            } else {
                //Prepare the next shot
                this.prepareScreenshot();
            }
        },
        /**
         * Clean up our files etc. Gets expensive on the CPU if it's all still running
         */
        cleanUp() {
            this.video       = null;
            delete this.video;

            this.videoHtml   = null;
            delete this.videoHtml;
        },
        /**
         * Force and abort of the capture
         */
        abort() {
            //already finished
            if(this.completed >= this.opts.count) {
                return;
            }

            //crude but effective
            this.completed = this.opts.count + 1;

            //Do some tidying
            this.cleanUp();

            this.fire('aborted', this.captures);
        },
        /**
         * time tracking for our inner stats geek
         * @return {array} The stats
         */
        getTime() {
            var thisTime    = (new Date()).getTime(); 
            var diff        = thisTime - this.lastTime;
            var fromStart   = thisTime - this.startTime;
            this.lastTime   = thisTime;

            return {
                diff        : diff,
                fromStart   : fromStart
            }
        }
    };

    /**
     * Useful function for remove something from and array
     * @param  {array} array    array object to modify
     * @param  {string} value   value to find
     */
    function arrayRemove(array, value) {
        var index = array.indexOf(value);
        if (index > -1) {
            array.splice(index, 1);
        }
    }

    /**
    * If option is a function, evaluate it with given params
    * @param {*} data
    * @param {...} args arguments of a callback
    * @returns {*}
    */
    function evalOpts(data, args) {
        if (typeof data === "function") {
            // `arguments` is an object, not array, in FF, so:
            args = Array.prototype.slice.call(arguments);
            data = data.apply(null, args.slice(1));
        }
        return data;
    }
    VideoThumbnails.evalOpts = evalOpts;

    /**
    * Extends the destination object `dst` by copying all of the properties from
    * the `src` object(s) to `dst`. You can specify multiple `src` objects.
    * @function
    * @param {Object} dst Destination object.
    * @param {...Object} src Source object(s).
    * @returns {Object} Reference to `dst`.
    */
    function extend(dst, src) {
        each(arguments, function(obj) {
            if (obj !== dst) {
                each(obj, function(value, key){
                    dst[key] = value;
                });
            }
        });
        return dst;
    }
    VideoThumbnails.extend = extend;

    /**
    * Iterate each element of an object
    * @function
    * @param {Array|Object} obj object or an array to iterate
    * @param {Function} callback first argument is a value and second is a key.
    * @param {Object=} context Object to become context (`this`) for the iterator function.
    */
    function each(obj, callback, context) {
        if (!obj) {
            return ;
        }
        var key;
        // Is Array?
        if (typeof(obj.length) !== 'undefined') {
          for (key = 0; key < obj.length; key++) {
            if (callback.call(context, obj[key], key) === false) {
              return ;
            }
          }
        } else {
          for (key in obj) {
            if (obj.hasOwnProperty(key) && callback.call(context, obj[key], key) === false) {
              return ;
            }
          }
        }
    }
    VideoThumbnails.each = each;

    if ( typeof module === "object" && module && typeof module.exports === "object" ) {
        // Expose as module.exports in loaders that implement the Node
        // module pattern (including browserify). Do not create the global, since
        // the user will be storing it themselves locally, and globals are frowned
        // upon in the Node module world.
        module.exports = VideoThumbnails;
    } else {
        // Otherwise expose to the global object as usual
        window.VideoThumbnails = VideoThumbnails;
    }    
})(window, document);