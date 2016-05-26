var __KEYFRAMES = [];
var __maxKeyframe = 0;
var __scrollValue = 0;
var __keyframeRegex = /(\d+)\s*{([\-0-9\.,\s%a-z\(\)]*)}/gi;
var __keyframeFunctionRegex = /(fadeIn|fadeOut|moveTo|move|scale|rotate|blur|hide|show)\s*\(\s*([\-0-9\.,\s%]*)\s*\)/gi;

window.addEventListener("load", function() {
  // parse all elements with keyframes
  var elements = document.getElementsByTagName("*");
  for (var i=0; i < elements.length; i++) {
    var keyframeAttribute = elements[i].getAttribute("keyframes");
    if (keyframeAttribute !== null) {
      while (keyframeMatch = __keyframeRegex.exec(keyframeAttribute)) {
        var keyframe = Number(keyframeMatch[1]);
        while (functionMatch = __keyframeFunctionRegex.exec(keyframeMatch[2])) {
          var transition = functionMatch[1].toLowerCase();
          var arguments = [];
          var duration = 0;
          if (functionMatch[2].replace(/^\s+/, "").replace(/\s+$/)) {
            arguments = functionMatch[2].split(",").map(function(m) { return m.replace(/^\s+/, "").replace(/\s+$/) });
            switch (transition) {
              case "moveto":
              case "move":
              case "scale":
                duration = arguments.length > 2 ? Number.parseInt(arguments[2]) : 0;
                break;
              case "rotate":
              case "blur":
                duration = arguments.length > 1 ? Number.parseInt(arguments[1]) : 0;
                break;
              case "fadein":
              case "fadeout":
                duration = arguments.length > 0 ? Number.parseInt(arguments[0]) : 0;
                break;
              case "hide":
              case "show":
                duration = 0;
                break;
              default:
                break;
            }
          }
          __KEYFRAMES.push({
            keyframe: keyframe,
            element: elements[i],
            transition: transition,
            arguments: arguments,
            duration: duration
          });
        }
      }
    }
  }

  // sort keyframes
  __KEYFRAMES.sort(function(a, b) {
    var difference = a.keyframe - b.keyframe;
    if (difference == 0) {
      return a.duration - b.duration;
    }
    return difference;
  });

  // console.log(__KEYFRAMES);
  // calculate previous locations for any move() functions
  for (var i=0; i < __KEYFRAMES.length; i++) {
    var transition = __KEYFRAMES[i].transition;
    if (transition == "move" || transition == "moveto") {
      // go backwards trying to calculate a previous position for the element
      __KEYFRAMES[i].element.style.position = "absolute";
      for (var j=i-1; j>=0; j--) {
        if (__KEYFRAMES[j].element == __KEYFRAMES[i].element && __KEYFRAMES[j].transition == "moveto") {
          if (!__KEYFRAMES[i].from) {
            __KEYFRAMES[i].from = __KEYFRAMES[j].arguments.slice(0);
            break;
          }
          else {
            __KEYFRAMES[i].from[0] = add(__KEYFRAMES[i].from[0], __KEYFRAMES[j].arguments[0]);
            __KEYFRAMES[i].from[1] = add(__KEYFRAMES[i].from[1], __KEYFRAMES[j].arguments[1]);
          }
        }
        else if (__KEYFRAMES[j].element == __KEYFRAMES[i].element && __KEYFRAMES[j].transition == "move") {
          if (!__KEYFRAMES[i].from) {
            __KEYFRAMES[i].from = [0, 0];
          }
          __KEYFRAMES[i].from[0] = add(__KEYFRAMES[i].from[0], __KEYFRAMES[j].arguments[0]);
          __KEYFRAMES[i].from[1] = add(__KEYFRAMES[i].from[1], __KEYFRAMES[j].arguments[1]);
        }
      }
    }
    else if (transition == "scale" || transition == "rotate" || transition == "blur" || transition == "fadein" || transition == "fadeout") {
      for (var j=i-1; j>=0; j--) {
        if (__KEYFRAMES[j].element == __KEYFRAMES[i].element && __KEYFRAMES[j].transition == transition) {
          if (!__KEYFRAMES[i].from && __KEYFRAMES[j].arguments && __KEYFRAMES[j].arguments.length) {
            __KEYFRAMES[i].from = __KEYFRAMES[j].arguments.slice(0);
            break;
          }
        }
      }
    }
  }

  // calculate max keyframe
  for (var i=0; i < __KEYFRAMES.length; i++) {
    var max = __KEYFRAMES[i].keyframe + __KEYFRAMES[i].duration;
    if (max > __maxKeyframe) {
      __maxKeyframe = max;
    }
  }

  // render any scenes that start at keyframe 0 and have a duration of 0
  for (var i=0; i < __KEYFRAMES.length; i++) {
    if (__KEYFRAMES[i].keyframe == 0 && __KEYFRAMES[i].duration == 0) {
      renderScene(__KEYFRAMES[i]);
    }
  }

  console.log(__KEYFRAMES);
});

function onMouseWheel(e, scrollThumb) {
  scrollPage(e.deltaY, scrollThumb);
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.stopPropagation();
  e.returnValue = false;
  return false;
}

function add(value1, value2) {
  return Number(value1) + Number(value2);
}

function scrollPage(scrollAmount, scrollThumb) {
  // console.log(scrollAmount);
  __scrollValue += scrollAmount;
  if (__scrollValue < 0) {
    __scrollValue = 0;
  }
  if (__scrollValue > __maxKeyframe) {
    __scrollValue = __maxKeyframe;
  }
  console.log(__scrollValue);
  calculateView();
  moveScrollThumb(__scrollValue, scrollThumb);
}

function scrollTo(absoluteScrollValue, scrollThumb) {
  __scrollValue = absoluteScrollValue;
  if (__scrollValue < 0) {
    __scrollValue = 0;
  }
  if (__scrollValue > __maxKeyframe) {
    __scrollValue = __maxKeyframe;
  }
  console.log(__scrollValue);
  calculateView();
  moveScrollThumb(__scrollValue, scrollThumb);
}

function calculateView() {
  var currentScenes = getCurrentScenes();
  // console.log("currentScenes", currentScenes);
  var recentScenes = getRecentlyCompletedScenes();
  // console.log("recentScenes", recentScenes);
  var futureScenes = getUpcomingScenes();
  // console.log("futureScenes", futureScenes);
  var allScenes = currentScenes.concat(recentScenes, futureScenes);
  
  allScenes.forEach(function(scene) {
    var transitionPct = (__scrollValue - scene.keyframe) / scene.duration;
    if (transitionPct > 1) {
      transitionPct = 1;
    }
    if (transitionPct < 0) {
      transitionPct = 0;
    }
    renderScene(scene, transitionPct);
  });
}

function renderScene(scene, transitionPct) {
  if (transitionPct === undefined || transitionPct === null) {
    transitionPct = 1;
  }
  // console.log("renderNextScene", scene);
  switch (scene.transition) {
    case "moveto":
      var fromKeyframeArguments = scene.from ? scene.from : [0, 0];
      scene.element.style.left = Number.parseFloat(fromKeyframeArguments[0]) + (Number.parseFloat(scene.arguments[0]) - Number.parseFloat(fromKeyframeArguments[0])) * transitionPct + "%";
      scene.element.style.top = Number.parseFloat(fromKeyframeArguments[1]) + (Number.parseFloat(scene.arguments[1]) - Number.parseFloat(fromKeyframeArguments[1])) * transitionPct + "%";
      break;
    case "fadeout":
      scene.element.style.opacity = 1 - transitionPct;
      if (1 - transitionPct < 0.01) {
        scene.element.style.display = "none";
      }
      else {
        scene.element.style.display = "block";
      }
      break;
    case "fadein":
      scene.element.style.opacity = transitionPct;
      scene.element.style.display = "block";
      break;
    case "show":
      scene.element.style.display = "block";
      break;
    case "hide":
      scene.element.style.display = "none";
      break;
    case "scale":
      var fromKeyframeArguments = scene.from ? scene.from : [1, 1];
      var scaleX = Number(fromKeyframeArguments[0]) + (Number(scene.arguments[0]) - Number(fromKeyframeArguments[0])) * transitionPct;
      var scaleY = Number(fromKeyframeArguments[1]) + (Number(scene.arguments[1]) - Number(fromKeyframeArguments[1])) * transitionPct;
      scene.element.style.transform = "scale(" + scaleX + "," + scaleY + ")";
      break;
    case "rotate":
      var fromKeyframeArguments = scene.from ? scene.from : [0];
      var rotation = (Number(scene.arguments[0]) - Number(fromKeyframeArguments[0])) * transitionPct
      scene.element.style.transform = "rotate(" + rotation + "deg)";
      break;
    case "blur":
      var fromKeyframeArguments = scene.from ? scene.from : [0];
      var blur = (Number(scene.arguments[0]) - Number(fromKeyframeArguments[0])) * transitionPct
      scene.element.style.webkitFilter = "blur(" + blur + "px)";
      break;
    default:
      break;
  }
}

function getCurrentScenes() {
  var currentScenes = [];
  for (var i=0; i < __KEYFRAMES.length; i++) {
    if (__scrollValue >= __KEYFRAMES[i].keyframe && __scrollValue <= __KEYFRAMES[i].keyframe + __KEYFRAMES[i].duration) {
      currentScenes.push(__KEYFRAMES[i]);
    }
  }
  return currentScenes;
}

function getRecentlyCompletedScenes() {
  var recentScenes = [];
  for (var i=0; i < __KEYFRAMES.length; i++) {
    if (__scrollValue >= __KEYFRAMES[i].keyframe + __KEYFRAMES[i].duration && __scrollValue <= __KEYFRAMES[i].keyframe + __KEYFRAMES[i].duration + 50 && __KEYFRAMES[i].duration != 0) {
      recentScenes.push(__KEYFRAMES[i]);
    }
  }
  return recentScenes;
}

function getUpcomingScenes() {
  var upcomingScenes = [];
  for (var i=0; i < __KEYFRAMES.length; i++) {
    if (__scrollValue < __KEYFRAMES[i].keyframe && __scrollValue + 50 >= __KEYFRAMES[i].keyframe) {
      upcomingScenes.push(__KEYFRAMES[i]);
    }
  }
  return upcomingScenes;
}


var __thumbIsGrabbed = false;
var __yGrabOffset = 0;
function grabScrollThumb(e, element) {
  __thumbIsGrabbed = true;
  __yGrabOffset = (e.clientY - element.parentNode.offsetTop) - element.offsetTop;
}

function releaseScrollThumb(e) {
  __thumbIsGrabbed = false;
}

function dragScrollThumb(e, element) {
  if (__thumbIsGrabbed) {
    var newY = e.clientY - element.parentNode.offsetTop - __yGrabOffset;
    var percentComplete = newY / (element.parentNode.offsetHeight - element.offsetHeight);
    if (percentComplete < 0) {
      percentComplete = 0;
    }
    if (percentComplete > 1) {
      percentComplete = 1;
    }
    var newScrollValue = Math.round(percentComplete * __maxKeyframe);
    scrollTo(newScrollValue, element);
  }
  e.stopPropagation();
  e.preventDefault();
  return false;
}

function moveScrollThumb(__scrollValue, scrollThumbElement) {
  var percentComplete = __scrollValue / __maxKeyframe;
  var newTop = Math.round(percentComplete * (scrollThumbElement.parentNode.offsetHeight - scrollThumbElement.offsetHeight));
  if (newTop < 0) {
    newTop = 0;
  }
  if (newTop > scrollThumbElement.parentNode.offsetHeight - scrollThumbElement.offsetHeight) {
    newTop = scrollThumbElement.parentNode.offsetHeight - scrollThumbElement.offsetHeight;
  }
  scrollThumbElement.style.position = "absolute";
  scrollThumbElement.style.top = newTop + "px";
  scrollThumbElement.style.right = "2px";
}
