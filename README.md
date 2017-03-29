# ClientSide Video Thumbnail Creator
This library attempts to make thumbnails in the browser before the user has uploaded it to the server. The idea being that it is one less thing for the user to wait for (especially if it's a large file), but also to save some processing time on the server.

We designed it to support our content publishing suite and work with our **AWS-S3-Multipart-JS-Uploader**
https://github.com/SCRMHub/AWS-S3-Multipart-JS-Uploader

The primary goals were:
- Use the native HTML5 video client
- Make the thumbnail creation non-blocking for the user
- Try not to play or load too much of the file to keep speeds down
- Zero dependencies (and no flash fallback)
- Leverage the user's browser (as with everything we do)

In the SCRM Hub content creation flow, the thumbnail is created as soon as possible so the user gets a choice of images quickly (a sub 300mb takes seconds). We are also leveraging the user's browser to remove server load (especially important for large files)

You can see a demo here:
http://htmlpreview.github.io/?https://github.com/SCRMHub/clientside-video-thumbnails/blob/develop/index.htm

## Getting Started ###

### Step 1: Download the files ###
Download the ClientSide Video Thumbnail Creator here:
https://github.com/SCRMHub/clientside-video-thumbnails/master.zip

The project is structured everything in the root for demostration but you can structure it however you like.

### Step 2: Try it ###
The included demonstration shows:
- Event subscription
- Event callbacks
- Output from the class
- A possible implementation
- Tracking progress of uploads

## The Javascript ##
The library itself doesn't have any dependencies, but the demo we use jQuery purely for DOM events. For the creation, it will create a video object from the file upload input using  **new FormData()** to mock an upload, and the output is a Base64 image so you'll need to handle encoding that on your server when you upload it.

### Options ##
There are a few options you can adjust when invoking the JavaScript class:
```php
var thumbnails = new VideoThumbnails({
  count : 8,
  maxWidth : 1280,
  maxHeight : 1280
});
```

- **count**         : How many thumbnails to create
- **maxWidth**      : The width of the canvas you want to create. This is used as the maximum and the video is scaled accordingly. The default is 1280
- **maxHeight**     : The height of the canvas you want to create. This is used as the maximum and the video is scaled accordingly. The default is 1280

The created image checks the size of the video and will adjust it accordingly to make the video thumbnails.

### Cancelling / Aborting creation ###
The upload can be cancelled at any time by calling the **thumbnails.abort()** function. This will stop all progress and trigger the **aborted** event.

### Available events ###
- **beforeCapture** : Called before any server calls are made.
Useful for resetting previous upload information

- **startCapture** : Once the video is ready to start capturing, this is called. Useful for any interface changes such as showing progress bars, etc.

- **capture** : Triggered after each thumbnail is created. The event will return the thumbnail in base64. This event allows you to continue to give the user feedback, either by adding each thumb as it's created, or updating a progress bar as in the demo.

- **aborted** : Triggered when the user has click **abort()**. 

- **unsupported** : If the video cannot be played natively in the browser, this is called.

- **complete** : Once all the thumbnails are created, this event is called. It returns a one dimensional array of all the images. This is useful if you don't want to bother adding them individually as part of the capture event

- **completeDetail** : This event is also fired at the same time as complete, but will return you more details:
  - @array **thumbs** : All of the created thumbs with additional information
    - @array **captures** : Each capture
      -  @int **capture** : The count of this capture
      -  @data **url** : Base64 encoded image
      -  @int **width** : Width of the shot
      -  @int **height** : The height of the capture
      -  @int **timeindex** : The video frame at which the capture was taken
      -  @int **startTime** : When the capture started
      -  @int **captureTime** : How long it took to generate
  - @array **details** : This is for stats nerds
    - @int **thumbnailCount** : How many thumbs were created
    - @float **videoDuration** : The length of the video chosen
    - @float **videoInterval** : The time gap between shots
    - @float **videoStart** : Where the first frame was takem
    - @int **thumbWidth** : The height of the thumbs that were created
    - @int **thumbHeight** : The height of the thumbs that were created
  - @string **totalTime** : The total upload time in milliseconds




---
## We're hiring ##
We are an Artificial intelligence Marketing Technology startup that is growing quickly and working globally to deliver the next generation of tools and services. Our platform is pushing into new bigger markets and we’re looking for Engineers who are after their next challenge building a multi-lingual, multi-regional real-time platform built on big data and machine learning.

To find out more about your next company and see the current opportunities, visit our careers page
https://u.scrmhub.com/joinus

SCRM Hub, Bringing Artificial Intelligence to Marketing
