# keyframes
A little bit of javascript that makes animated scrolly websites a breeze

## setup
link to the script in your html
if you want to use the scroll thumb, you'll need to add an element (style it how you want) like so:

<div id="some-id-here" onMouseUp="releaseScrollThumb(event)" onMouseDown="grabScrollThumb(event, this)" onMouseMove="dragScrollThumb(event, this)"></div>

Then you'll want to add some event handling to the <body> like this:

<body onMouseMove="dragScrollThumb(event, document.getElementById('some-id-here'))" onMouseUp="releaseScrollThumb(event)">

## usage
In any element you can simply add a keyframes attribute to utilize this awesome thing.

<div keyframes="0{fadeIn(50)}">
  hello, world
</div>

The syntax is _frameNumber_{ _methodName_(_[argument1][,argument2][,duration]_) _[,methodName2([argument1][,argument2][,duration])]_ }

### valid methods
hide()
show()
fadeIn(_duration_)
fadeOut(_duration_)
moveTo(_x_, _y_, _duration_)
scale(_sx_, _sy_, _duration_)
rotate(_amt_, _duration_)
blur(_amt_, _duration_)

