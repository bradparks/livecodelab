// init the scene


buildPostprocessingChain = function() {
  renderTargetParameters = {
    format: THREE.RGBAFormat,
    stencilBuffer: true
  };

  renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParameters);
  effectSaveTarget = new THREE.SavePass(new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParameters));
  effectSaveTarget.clear = false;

  fxaaPass = new THREE.ShaderPass(THREE.ShaderExtras["fxaa"]);
  fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);

  effectBlend = new THREE.ShaderPass(THREE.ShaderExtras["blend"], "tDiffuse1");
  screenPass = new THREE.ShaderPass(THREE.ShaderExtras["screen"]);

  // motion blur
  effectBlend.uniforms['tDiffuse2'].texture = effectSaveTarget.renderTarget;
  effectBlend.uniforms['mixRatio'].value = 0;

  var renderModel = new THREE.RenderPass(scene, camera);

  composer = new THREE.EffectComposer(renderer, renderTarget);

  composer.addPass(renderModel);
  //composer.addPass( fxaaPass );
  composer.addPass(effectBlend);
  composer.addPass(effectSaveTarget);
  composer.addPass(screenPass);
  screenPass.renderToScreen = true;
}



function render() {


  /*
      // need a light for the meshlambert material
      var light = new THREE.PointLight( 0xFFFFFF );
      light.position.set( 10, 0, 10 );
      scene.add( light );
      */



  ////////////////////////
  if (isWebGLUsed) {
    composer.render();
    //renderer.render(scene,camera);
  } else {


    // the renderer draws into an offscreen canvas called sceneRenderingCanvas
    renderer.render(scene, camera);

    // clear the final render context
    finalRenderWithSceneAndBlendContext.globalAlpha = 1.0;
    finalRenderWithSceneAndBlendContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // draw the rendering of the scene on the final render
    // clear the final render context
    finalRenderWithSceneAndBlendContext.globalAlpha = blendAmount;
    finalRenderWithSceneAndBlendContext.drawImage(previousRenderForBlending, 0, 0);

    finalRenderWithSceneAndBlendContext.globalAlpha = 1.0;
    finalRenderWithSceneAndBlendContext.drawImage(sceneRenderingCanvas, 0, 0);

    //previousRenderForBlendingContext.clearRect(0, 0, window.innerWidth,window.innerHeight)
    previousRenderForBlendingContext.globalCompositeOperation = 'copy';
    previousRenderForBlendingContext.drawImage(finalRenderWithSceneAndBlend, 0, 0);

    // clear the renderer's canvas to transparent black
    sceneRenderingCanvasContext.clearRect(0, 0, window.innerWidth, window.innerHeight);



  }


}


var drawLoopTimer = null;
var frame = 0;
var doLNOnce = [];


// By doing some profiling it is apparent that
// adding and removing objects has a big cost.
// So instead of adding/removing objects every frame,
// objects are only added at creation and they are
// never removed from the scene. They are
// only made invisible. This routine combs the
// scene and finds the objects that.
// TODO a way to shrink the scene if it's been a
// long time that only a handful of lines/meshes
// have been used.

function combDisplayList() {

  for (var i = 0; i < scene.objects.length; ++i) {
    var sceneObject = scene.objects[i];
    if (sceneObject.isLine) {
      if (usedLines > 0) {
        sceneObject.visible = true;
        usedLines--;
      } else {
        sceneObject.visible = false;
      }
    } else if (sceneObject.isRectangle) {
      if (usedRectangles > 0) {
        sceneObject.visible = true;
        usedRectangles--;
      } else {
        sceneObject.visible = false;
      }
    } else if (sceneObject.isBox) {
      if (usedBoxes > 0) {
        sceneObject.visible = true;
        usedBoxes--;
      } else {
        sceneObject.visible = false;
      }
    } else if (sceneObject.isCylinder) {
      if (usedCylinders > 0) {
        sceneObject.visible = true;
        usedCylinders--;
      } else {
        sceneObject.visible = false;
      }
    } else if (sceneObject.isAmbientLight) {
      if (usedAmbientLights > 0) {
        sceneObject.visible = true;
        usedAmbientLights--;
      } else {
        sceneObject.visible = false;
      }
    } else if (sceneObject.isSphere !== 0) {
      if (usedSpheres['' + sceneObject.isSphere] > 0) {
        sceneObject.visible = true;
        usedSpheres['' + sceneObject.isSphere] = usedSpheres['' + sceneObject.isSphere] - 1;
      } else {
        sceneObject.visible = false;
      }
    }
  }
}


function clearDisplayList() {
  /*
  for(var i = 0; i < scene.objects.length; ++i) {
      scene.remove(scene.objects[i]);
      i--;
  }
  */
}



//var chromeHackUncaughtReferenceName = '';
//var chromeHackUncaughtReferenceNames = [];

// swap the two lines below in case one needs to
// debug the environment, otherwise all errors are
// caught and not bubbled up to the browser debugging tool.
// var foo = function(msg, url, linenumber) {
window.onerror = function(msg, url, linenumber) {

  if (autocodeOn) {
    editor.undo();
    //alert("did an undo");
    return;
  }

  if (msg.indexOf("Uncaught ReferenceError: ") > -1) {
    msg = msg.substring(25);
  }

  $('#dangerSignText').css('color', 'red');
  $('#errorMessageText').text(msg);

  // ok so this is kind of a hack that we need to put
  // in place for Chrome (both Windows and Mac)
  // what Chrome does is: when there is a function call,
  // it evaluates the arguments
  // of a function even if the function is undefined
  // so for example
  // doO alert "miao"
  // alerts a miao, because it's translated into
  // doO(alert("miao))
  // and even if doO is undefined, the argumen is evaluated
  // This is a problem because doOnce would encourage
  // the following use: misspell doOnce until the rest of the
  // line is finished, then correct the mispell to actually
  // run the line once.
  // But unfortunately because of the quirk described above,
  // that wouldn't work in Chrome.
  /*
 if (msg.indexOf("Uncaught ReferenceError") > -1) {
  chromeHackUncaughtReferenceName = msg.split(' ')[2];

  var lengthToCheck = chromeHackUncaughtReferenceNames.length;
  if (lengthToCheck == 0){
    chromeHackUncaughtReferenceNames.push(chromeHackUncaughtReferenceName);
  }
  else {
    for (var iteratingOverSource = 0; iteratingOverSource < lengthToCheck; iteratingOverSource++) {
      if (chromeHackUncaughtReferenceNames[iteratingOverSource].indexOf(chromeHackUncaughtReferenceName) > -1) {
        break;
      }
      else if (iteratingOverSource == lengthToCheck-1) {
       // if we are here it means that the variable is not in the array
       chromeHackUncaughtReferenceNames.push(chromeHackUncaughtReferenceName);
      }
    }
  }
 }
 */

  // we set this to 6 because we save it as stable
  // when it's 5, so we avoid re-saving.
  consecutiveFramesWithoutRunTimeError = 6;
  window.eval(lastStableProgram);

  return true;
}


// animation loop
var loopInterval;
var time;
var timeAtStart;

function animate() {

  // loop on request animation loop
  // - it has to be at the begining of the function
  // - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
  // requestAnimationFrame seems to only do 60 fps, which in my case is too much,
  // I rather prefer to have a slower framerate but steadier.
  if (useRequestAnimationFrame) {
    if (wantedFramesPerSecond === -1) {
      requestAnimationFrame(animate);
    } else {
      //setTimeout("window.requestAnimationFrame(animate)",
      //       1000 / wantedFramesPerSecond);
      if (loopInterval === undefined) {
        loopInterval = setInterval("window.requestAnimationFrame(animate)", 1000 / wantedFramesPerSecond);
      }
    }
  } else {
    setTimeout('animate();', 1000 / wantedFramesPerSecond);
  }

  //clearDisplayList();
  matrixStack = [];
  worldMatrix.identity();

  // the sound list needs to be cleaned
  // and the beatsPerMinute set to zero
  // so that the user program can create its own from scratch
  beatsPerMinute = 0;
  soundLoops.soundIDs = [];
  soundLoops.beatStrings = [];


  //rootObject = new THREE.Object3D();
  //scene.add(rootObject);
  //parentObject = rootObject;
  if (typeof(draw) != "undefined") {
    var d = new Date();
    if (frame === 0) {
      timeAtStart = d.getTime();
      time = 0;
    } else {
      time = d.getTime() - timeAtStart;
    }
    doLNOnce = [];
    fill(0xFFFFFFFF);
    stroke(0xFF000000);
    currentStrokeSize = 1;
    defaultNormalFill = true;
    defaultNormalStroke = true;
    ballDetLevel = ballDefaultDetLevel;
    noLights();
    usedLines = 0;
    usedRectangles = 0;
    usedBoxes = 0;
    usedAmbientLights = 0;
    usedPointLights = 0;
    // In theory there is no need to chuck away the
    // counter altogether, you could go through
    // the existing counters contained in this object
    // (one for each ball detail ever used)
    // and set it to zero. That would maybe save
    // some garbage collection time.
    // But it's probably not worth it...
    usedSpheres = {};
    animationStyleValue = normal;
    resetGradientStack();
    //bpm(0);
    draw();
    // we have to repeat this check because in the case
    // the user has set frame = 0,
    // then we have to catch that case here
    // after the program has executed
    if (frame === 0) {
      timeAtStart = d.getTime();
      time = 0;
    }
    animationStyleUpdateIfChanged();
    simpleGradientUpdateIfChanged();
    updateBpmIfChanged();
    frame++;
    consecutiveFramesWithoutRunTimeError++;
    if (consecutiveFramesWithoutRunTimeError == 5) {
      lastStableProgram = out;
      //chromeHackUncaughtReferenceName = '';
    }
  }

  // do the render
  combDisplayList();
  render();
  //clearDisplayList();
  // update stats
  stats.update();


  if (doLNOnce.length !== 0) {
    //alert("a doOnce has been ran");
    elaboratedSource = editor.getValue();

    if (frenchVersion) {
      elaboratedSource = elaboratedSource.replace(/uneFois/g, "doOnce");
    }

    elaboratedSourceByLine = elaboratedSource.split("\n");
    //alert('splitting: ' + elaboratedSourceByLine.length );
    for (var iteratingOverSource = 0; iteratingOverSource < doLNOnce.length; iteratingOverSource++) {
      //alert('iterating: ' + iteratingOverSource );
      elaboratedSourceByLine[doLNOnce[iteratingOverSource]] = elaboratedSourceByLine[doLNOnce[iteratingOverSource]].replace(/^(\s*)doOnce([ ]*\->[ ]*.+)$/gm, "$1\u2713doOnce$2");
      elaboratedSourceByLine[doLNOnce[iteratingOverSource]] = elaboratedSourceByLine[doLNOnce[iteratingOverSource]].replace(/^(\s*)doOnce([ ]*\->[ ]*)$/gm, "$1\u2713doOnce$2");
    }
    elaboratedSource = elaboratedSourceByLine.join("\n");

    var cursorPositionBeforeAddingCheckMark = editor.getCursor();
    cursorPositionBeforeAddingCheckMark.ch = cursorPositionBeforeAddingCheckMark.ch + 1;

    if (frenchVersion) {
      elaboratedSource = elaboratedSource.replace(/doOnce/g, "uneFois");
    }

    editor.setValue(elaboratedSource);
    editor.setCursor(cursorPositionBeforeAddingCheckMark);

    // we want to avoid that another frame is run with the old
    // code, as this would mean that the
    // runOnce code is run more than once,
    // so we need to register the new code.
    // TODO: ideally we don't want to register the
    // new code by getting the code from codemirror again
    // because we don't know what that entails. We should
    // just pass the code we already have.
    // Also registerCode() may split the source code by line, so we can
    // avoid that since we've just split it, we could pass
    // the already split code.
    registerCode();
  }


}

var lastkey = 0;
var fakeText = true;
document.onkeypress = function(e) {

  if (fakeText && editor.getValue() !== "") shrinkFakeText(e);

}

var shrinkFakeText = function(e) {

    if (e !== undefined) {
      var theEvent = e || window.event;
      var key = theEvent.keyCode || theEvent.which;
      key = String.fromCharCode(key);
    } else key = '';

    var currentCaption = $('#caption').html();
    var shorterCaption = currentCaption.substring(0, currentCaption.length - 1);
    $('#caption').html(shorterCaption + key + "|");
    $('#fakeStartingBlinkingCursor').html('');

    $("#toMove").animate({
      opacity: 0,
      margin: -100,
      fontSize: 300,
      left: 0
    }, "fast");

    setTimeout('$("#formCode").animate({opacity: 1}, "fast");', 120);
    setTimeout('$("#justForFakeCursor").hide();', 200);
    setTimeout('$("#toMove").hide();', 200);
    //setTimeout('clearTimeout(fakeCursorInterval);',200);
    fakeText = false;

  }



// ambientColor is always white
// because it needs to reflect what the
// ambient light color is
// I tried to set the ambientColor directly
// but it doesn't work. It needs to be white so
// that the tint of the ambientLight is shown. 
var ambientColor = color(255, 255, 255);
//ambient = function(a) {
//ambientColor = a;
//}
var reflectValue = 1;
//reflect = function(a) {
//  reflectValue = a;
//}
var refractValue = 0.98;
//refract = function(a) {
//  refractValue = a;
//}
var lightsAreOn = false;
lights = function() {
  lightsAreOn = true;
}
noLights = function() {
  lightsAreOn = false;
}


ambientLight = function() {

  var colorToBeUsed;
  if (arguments[0] === undefined) {
    // empty arguments gives some sort
    // of grey ambient light.
    // black is too stark and white
    // doesn't show the effect with the
    // default white fill
    colorToBeUsed = color$1(125);
  } else {
    colorToBeUsed = color(arguments[0], arguments[1], arguments[2], arguments[3]);
  }

  var newLightCreated = false;
  lightsAreOn = true;
  defaultNormalFill = false;
  defaultNormalStroke = false;

  var pooledAmbientLight = ambientLightsPool[usedAmbientLights];
  if (pooledAmbientLight === undefined) {
    console.log('no ambientLight in pool, creating one');
    pooledAmbientLight = new THREE.AmbientLight(colorToBeUsed);
    newLightCreated = true;
    ambientLightsPool.push(pooledAmbientLight);
  } else {
    pooledAmbientLight.color.setHex(colorToBeUsed);
    console.log('existing ambientLight in pool, setting color: ' + pooledAmbientLight.color.r + ' ' + pooledAmbientLight.color.g + ' ' + pooledAmbientLight.color.b);
  }


  pooledAmbientLight.isLine = false;
  pooledAmbientLight.isRectangle = false;
  pooledAmbientLight.isBox = false;
  pooledAmbientLight.isCylinder = false;
  pooledAmbientLight.isAmbientLight = true;
  pooledAmbientLight.isPointLight = false;
  pooledAmbientLight.isSphere = 0;


  usedAmbientLights++;
  pooledAmbientLight.matrixAutoUpdate = false;
  pooledAmbientLight.matrix.copy(worldMatrix);
  pooledAmbientLight.matrixWorldNeedsUpdate = true;

  if (newLightCreated) scene.add(pooledAmbientLight);


}

animationStyle = function(a) {
  // turns out when you type normal that the first two letters "no"
  // are sent as "false"
  if (a === false) return;
  if (a === undefined) return;
  animationStyleValue = a;
}


animationStyleUpdateIfChanged = function() {
  //alert("actual called " + a);
  if ((animationStyleValue !== previousanimationStyleValue)) {
    //alert("actual changed!");
  } else {
    //alert("no change");
    return;
  }

  previousanimationStyleValue = animationStyleValue;

  if (isWebGLUsed && animationStyleValue === motionBlur) {
    effectBlend.uniforms['mixRatio'].value = 0.7;
  } else if (!isWebGLUsed && animationStyleValue === motionBlur) {
    blendAmount = 0.6;
    //alert('motion blur canvas');
  }

  if (isWebGLUsed && animationStyleValue === paintOver) {
    effectBlend.uniforms['mixRatio'].value = 1;
  } else if (!isWebGLUsed && animationStyleValue === paintOver) {
    blendAmount = 1;
    //alert('paintOver canvas');
  }

  if (isWebGLUsed && animationStyleValue === normal) {
    effectBlend.uniforms['mixRatio'].value = 0;
  } else if (!isWebGLUsed && animationStyleValue === normal) {
    blendAmount = 0;
    //alert('normal canvas');
  }

}






/**
 * extend the Number prototype
 * @param func
 * @param scope [optional]
 */
Number.prototype.times = function(func, scope) {
  var v = this.valueOf();
  for (var i = 0; i < v; i++) {
    func.call(scope || window, i);
  }
};


var autocodeOn = false;
var blinkingAutocoderTimeout;
var blinkingAutocoderStatus = false;
var dimcodeOn = false;


function blinkAutocodeIndicator() {
  blinkingAutocoderStatus = !blinkingAutocoderStatus;
  if (blinkingAutocoderStatus) {
    $("#autocodeIndicatorContainer").css("background-color", '');
  } else {
    $("#autocodeIndicatorContainer").css("background-color", '#FF0000');
    mutate();
  }
}

function toggleAutocode() {
  autocodeOn = !autocodeOn;

  if (!autocodeOn) {
    if (frenchVersion) {
      $("#autocodeIndicator").html("Autocode: inactif");
    } else {
      $("#autocodeIndicator").html("Autocode: off");
    }
    clearInterval(blinkingAutocoderTimeout);
    $("#autocodeIndicatorContainer").css("background-color", '');
  } else {
    if (frenchVersion) {
      $("#autocodeIndicator").html("Autocode: actif");
    } else {
      $("#autocodeIndicator").html("Autocode: on");
    }
    blinkingAutocoderTimeout = setInterval('blinkAutocodeIndicator();', 500);
    $("#autocodeIndicatorContainer").css("background-color", '#FF0000');
    if (editor.getValue() === '' || (
    (window.location.hash.indexOf("bookmark") !== -1) && (window.location.hash.indexOf("autocodeTutorial") !== -1))

    ) loadDemoOrTutorial('cubesAndSpikes');
  }
}


function mutate() {
  var whichMutation = Math.floor(Math.random() * 5);
  if (whichMutation === 0) replaceAFloat();
  else if (whichMutation == 1) replaceAnInteger();
  else if (whichMutation == 2) replaceABoxWithABall();
  else if (whichMutation == 3) replaceABallWithABox();
  //else if (whichMutation == 4)
  //replacetimeWithAConstant();
}

function replaceAFloat() {
  var editorContent = editor.getValue();
  var rePattern = /([-+]?[0-9]*\.[0-9]+)/gi;

  var allMatches = editorContent.match(rePattern);
  if (allMatches === null) numberOfResults = 0;
  else numberOfResults = allMatches.length;
  whichOneToChange = Math.floor(Math.random() * numberOfResults) + 1;

  var countWhichOneToSwap = 0;
  editorContent = editorContent.replace(rePattern, function(match, text, urlId) {
    countWhichOneToSwap++;
    if (countWhichOneToSwap === whichOneToChange) {
      var whichOp = Math.floor(Math.random() * 12);
      if (whichOp === 0) return parseFloat(match) * 2;
      else if (whichOp == 1) return parseFloat(match) / 2;
      else if (whichOp == 2) return parseFloat(match) + 1;
      else if (whichOp == 3) return parseFloat(match) - 1;
      else if (whichOp == 4) return parseFloat(match) * 5;
      else if (whichOp == 5) return parseFloat(match) / 5;
      else if (whichOp == 6) return parseFloat(match) + 0.1;
      else if (whichOp == 7) return parseFloat(match) - 0.1;
      else if (whichOp == 8) return parseFloat(match) + 0.5;
      else if (whichOp == 9) return parseFloat(match) - 0.5;
      else if (whichOp == 10) return Math.floor(parseFloat(match));
      else if (whichOp == 11) if (!frenchVersion) {
        return 'time/1000';
      } else {
        return 'temps/1000';
      }
    }
    return match;
  });
  editor.setValue(editorContent);
}

function replaceABoxWithABall() {
  var editorContent = editor.getValue();
  var rePattern;
  if (!frenchVersion) {
    rePattern = /(box)/gi;
  } else {
    rePattern = /(boite)/gi;
  }

  var allMatches = editorContent.match(rePattern);
  if (allMatches === null) numberOfResults = 0;
  else numberOfResults = allMatches.length;
  whichOneToChange = Math.floor(Math.random() * numberOfResults) + 1;

  var countWhichOneToSwap = 0;
  editorContent = editorContent.replace(rePattern, function(match, text, urlId) {
    countWhichOneToSwap++;
    if (countWhichOneToSwap === whichOneToChange) {
      if (!frenchVersion) {
        return "ball";
      } else {
        return "balle";
      }
    }
    return match;
  });
  editor.setValue(editorContent);
}

function replaceTimeWithAConstant() {
  var editorContent = editor.getValue();
  var rePattern;
  if (!frenchVersion) {
    rePattern = /(time)/gi;
  } else {
    rePattern = /(temps)/gi;
  }

  var allMatches = editorContent.match(rePattern);
  if (allMatches === null) numberOfResults = 0;
  else numberOfResults = allMatches.length;
  whichOneToChange = Math.floor(Math.random() * numberOfResults) + 1;

  var countWhichOneToSwap = 0;
  editorContent = editorContent.replace(rePattern, function(match, text, urlId) {
    countWhichOneToSwap++;
    if (countWhichOneToSwap === whichOneToChange) {
      return '' + Math.floor(Math.random() * 20) + 1;
    }
    return match;
  });
  editor.setValue(editorContent);
}

function replaceABallWithABox() {
  var editorContent = editor.getValue();
  var rePattern;
  if (!frenchVersion) {
    rePattern = /(ball)/gi;
  } else {
    rePattern = /(balle)/gi;
  }

  var allMatches = editorContent.match(rePattern);
  if (allMatches === null) numberOfResults = 0;
  else numberOfResults = allMatches.length;
  whichOneToChange = Math.floor(Math.random() * numberOfResults) + 1;

  var countWhichOneToSwap = 0;
  editorContent = editorContent.replace(rePattern, function(match, text, urlId) {
    countWhichOneToSwap++;
    if (countWhichOneToSwap === whichOneToChange) {
      if (!frenchVersion) {
        return "box";
      } else {
        return "boite";
      }
    }
    return match;
  });
  editor.setValue(editorContent);
}

function replaceAnInteger() {
  var editorContent = editor.getValue();
  var rePattern = /([-+]?[0-9]+)/gi;

  var allMatches = editorContent.match(rePattern);
  if (allMatches === null) numberOfResults = 0;
  else numberOfResults = allMatches.length;
  whichOneToChange = Math.floor(Math.random() * numberOfResults) + 1;

  var countWhichOneToSwap = 0;
  editorContent = editorContent.replace(rePattern, function(match, text, urlId) {
    countWhichOneToSwap++;
    if (countWhichOneToSwap === whichOneToChange) {
      var whichOp = Math.floor(Math.random() * 7);
      if (whichOp === 0) return Math.floor(parseFloat(match) * 2);
      else if (whichOp == 1) return Math.floor(parseFloat(match) / 2);
      else if (whichOp == 2) return Math.floor(parseFloat(match) + 1);
      else if (whichOp == 3) return Math.floor(parseFloat(match) - 1);
      else if (whichOp == 4) return Math.floor(parseFloat(match) * 5);
      else if (whichOp == 5) return Math.floor(parseFloat(match) / 5);
      else if (whichOp == 6) if (!frenchVersion) {
        return 'Math.floor(1+time/1000)';
      } else {
        return 'Math.floor(1+temps/1000)';
      }
    }
    return match;
  });
  editor.setValue(editorContent);

}

function triggerReset() {
  pickRandomDefaultGradient();
  if (autocodeOn) toggleAutocode();
  editor.setValue('');
  $("#resetButtonContainer").css("background-color", '#FF0000');
  setTimeout('$("#resetButtonContainer").css("background-color","");', 200);
}

function loadDemoOrTutorial(whichDemo) {

  if ((!Detector.webgl || forceCanvasRenderer) && !userWarnedAboutWebglExamples && whichDemo.indexOf('webgl') === 0) {
    userWarnedAboutWebglExamples = true;
    $('#exampleNeedsWebgl').modal();
    $('#simplemodal-container').height(200);
  }


  // set the demo as a hash state
  // so that ideally people can link directly to
  // a specific demo they like.
  // (in the document.ready function we check for
  // this hash value and load the correct demo)
  window.location.hash = 'bookmark=' + whichDemo;

  if (fakeText) shrinkFakeText();
  undimEditor();

  doTheSpinThingy = false;

  var prependMessage = "";
  if ((!Detector.webgl || forceCanvasRenderer) && whichDemo.indexOf('webgl') === 0) {
    prependMessage = "" + "// this drawing makes much more sense\n" + "// in a WebGL-enabled browser\n" + "\n";
  }

  switch (whichDemo) {
  case 'simpleCubeDemo':
    editor.setValue(prependMessage + simpleCubeDemo);
    break;
  case 'webgltwocubesDemo':
    editor.setValue(prependMessage + webgltwocubesDemo);
    break;
  case 'cubesAndSpikes':
    editor.setValue(prependMessage + cubesAndSpikes);
    break;
  case 'webglturbineDemo':
    editor.setValue(prependMessage + webglturbineDemo);
    break;
  case 'webglzfightartDemo':
    editor.setValue(prependMessage + webglzfightartDemo);
    break;
  case 'littleSpiralOfCubes':
    editor.setValue(prependMessage + littleSpiralOfCubes);
    break;
  case 'tentacleDemo':
    editor.setValue(prependMessage + tentacleDemo);
    break;
  case 'lampDemo':
    editor.setValue(prependMessage + lampDemo);
    break;
  case 'trillionfeathersDemo':
    editor.setValue(prependMessage + trillionfeathersDemo);
    break;
  case 'monsterblobDemo':
    editor.setValue(prependMessage + monsterblobDemo);
    break;
  case 'industrialMusicDemo':
    editor.setValue(prependMessage + industrialMusicDemo);
    break;
  case 'trySoundsDemo':
    editor.setValue(prependMessage + trySoundsDemo);
    break;
  case 'springysquaresDemo':
    editor.setValue(prependMessage + springysquaresDemo);
    break;
  case 'diceDemo':
    editor.setValue(prependMessage + diceDemo);
    break;
  case 'webglalmostvoronoiDemo':
    editor.setValue(prependMessage + webglalmostvoronoiDemo);
    break;
  case 'webglshardsDemo':
    editor.setValue(prependMessage + webglshardsDemo);
    break;
  case 'webglredthreadsDemo':
    editor.setValue(prependMessage + webglredthreadsDemo);
    break;
  case 'webglnuclearOctopusDemo':
    editor.setValue(prependMessage + webglnuclearOctopusDemo);
    break;
  case 'introTutorial':
    editor.setValue(prependMessage + introTutorial);
    break;
  case 'helloworldTutorial':
    editor.setValue(prependMessage + helloworldTutorial);
    break;
  case 'somenotesTutorial':
    editor.setValue(prependMessage + somenotesTutorial);
    break;
  case 'rotateTutorial':
    editor.setValue(prependMessage + rotateTutorial);
    break;
  case 'frameTutorial':
    editor.setValue(prependMessage + frameTutorial);
    break;
  case 'timeTutorial':
    editor.setValue(prependMessage + timeTutorial);
    break;
  case 'moveTutorial':
    editor.setValue(prependMessage + moveTutorial);
    break;
  case 'scaleTutorial':
    editor.setValue(prependMessage + scaleTutorial);
    break;
  case 'timesTutorial':
    editor.setValue(prependMessage + timesTutorial);
    break;
  case 'fillTutorial':
    editor.setValue(prependMessage + fillTutorial);
    break;
  case 'strokeTutorial':
    editor.setValue(prependMessage + strokeTutorial);
    break;
  case 'colornamesTutorial':
    editor.setValue(prependMessage + colornamesTutorial);
    break;
  case 'lightsTutorial':
    editor.setValue(prependMessage + lightsTutorial);
    break;
  case 'backgroundTutorial':
    editor.setValue(prependMessage + backgroundTutorial);
    break;
  case 'gradientTutorial':
    editor.setValue(prependMessage + gradientTutorial);
    break;
  case 'lineTutorial':
    editor.setValue(prependMessage + lineTutorial);
    break;
  case 'ballTutorial':
    editor.setValue(prependMessage + ballTutorial);
    break;
  case 'pushpopMatrixTutorial':
    editor.setValue(prependMessage + pushpopMatrixTutorial);
    break;
  case 'animationstyleTutorial':
    editor.setValue(prependMessage + animationstyleTutorial);
    break;
  case 'doonceTutorial':
    editor.setValue(prependMessage + doonceTutorial);
    break;
  case 'autocodeTutorial':
    editor.setValue(prependMessage + autocodeTutorial);
    break;

    // bring the cursor to the top
  editor.setCursor(0, 0);
  }

  // setting the value of the editor triggers the
  // codeMirror onChange callback, and that runs
  // the demo.
}


var changesHappened = false;

var cursorActivity = true;

function selectTheme(node) {
  var theme = node.options[node.selectedIndex].innerHTML;
  editor.setOption("theme", theme);
}

// resizing the text area is necessary otherwise
// as the user types to the end of it, instead of just scrolling
// the content leaving all the other parts of the page where
// they are, it expands and it pushes down
// the view of the page, meaning that the canvas goes up and
// the menu disappears
// so we have to resize it at launch and also every time the window
// is resized.

function adjustCodeMirrorHeight() {
  //alert("code height:" + $('#code').height());
  //alert("window height:" + window.innerHeight);
  //alert("code height:" + $('.CodeMirror-scroll').css('height'));
  //alert("menu height:" + $('#theMenu').height());
  $('.CodeMirror-scroll').css('height', window.innerHeight - $('#theMenu').height());
}

var fakeCursorInterval;

function fakeCursorBlinking() {
  $("#fakeStartingBlinkingCursor").animate({
    opacity: 0.2
  }, "fast", "swing").animate({
    opacity: 1
  }, "fast", "swing");
}

///////////// START OF MOUSEWHEEL HANDLER CODE
// I couldn't quote get the exact Javascript plugin below to
// work in its original form, so I only took the
// "calculation" routine.


function wheel(event) {

  /*! Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
   * Licensed under the MIT License (LICENSE.txt).
   *
   * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
   * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
   * Thanks to: Seamus Leahy for adding deltaX and deltaY
   *
   * Version: 3.0.6
   *
   * Requires: 1.2.2+
   */

  var orgEvent = event || window.event,
    args = [].slice.call(arguments, 1),
    delta = 0,
    returnValue = true,
    deltaX = 0,
    deltaY = 0;
  event = $.event.fix(orgEvent);
  event.type = "mousewheel";

  // Old school scrollwheel delta
  if (orgEvent.wheelDelta) {
    delta = orgEvent.wheelDelta / 120;
  }
  if (orgEvent.detail) {
    delta = -orgEvent.detail / 3;
  }

  // New school multidimensional scroll (touchpads) deltas
  deltaY = delta;

  // Gecko
  if (orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
    deltaY = 0;
    deltaX = -1 * delta;
  }

  // Webkit
  if (orgEvent.wheelDeltaY !== undefined) {
    deltaY = orgEvent.wheelDeltaY / 120;
  }
  if (orgEvent.wheelDeltaX !== undefined) {
    deltaX = -1 * orgEvent.wheelDeltaX / 120;
  }

  console.log(""+deltaX+" "+deltaY);
  if (deltaY > 0.2) {
    var cursorPositio = editor.getCursor(true);
    // this is to prevent that when the cursor reaches the
    // last line, then it goes to the END of the line
    // we avoid that because of a nasty workaround
    // where we check whether the cursor is in the
    // first few characters of the line to avoid
    // following a "next-tutorial" link.
    console.log(cursorPositio.line+" "+editor.lineCount())
    if (cursorPositio.line !== editor.lineCount() - 1) {
      editor.setCursor(cursorPositio.line + 1, cursorPositio.ch);
    }
  } else if (deltaY < -0.2) {
    var cursorPositio = editor.getCursor(true);
    editor.setCursor(cursorPositio.line - 1, cursorPositio.ch);
  }
}

/* Initialization code. */
if (window.addEventListener) window.addEventListener('DOMMouseScroll', wheel, false);
window.onmousewheel = document.onmousewheel = wheel;

///////////// END OF MOUSEWHEEL HANDLER CODE
// this function is called when the cursor moves
// and we handle this in two ways
// 1) we suspend the dimming countdown
// 2) we undim the editor if it is dimmed
// 3) we check whether the user moved the cursor over a link


function suspendDimmingAndCheckIfLink() {

  // Now this is kind of a nasty hack: we check where the
  // cursor is, and if it's over a line containing the
  // link then we follow it.
  // There was no better way, for some reason some onClick
  // events are lost, so what happened is that one would click on
  // the link and nothing would happen.
  var cursorP = editor.getCursor(true);
  if (cursorP.ch > 2) {
    var currentLineContent = editor.getLine(cursorP.line);
    if (currentLineContent.indexOf('// next-tutorial:') === 0) {
      currentLineContent = currentLineContent.substring(17);
      currentLineContent = currentLineContent.replace("_", "");
      //alert(""+url);
      setTimeout('loadDemoOrTutorial("' + currentLineContent + 'Tutorial");', 200);
    }
  }

  if (fakeText || editor.getValue() === '') return;
  console.log('cursor activity! opacity: ' + $("#formCode").css('opacity'));
  cursorActivity = true;
  undimEditor();
}

function undimEditor() {
  if (fakeText || editor.getValue() === '') $("#formCode").css('opacity', 0);
  if ($("#formCode").css('opacity') < 0.99) {
    console.log('undimming the editor');
    $("#formCode").animate({
      opacity: 1
    }, "fast");
  }
}

// Now that there is a manual switch to toggle it off and on
// the dimming goes to full INvisibility
// see toggleDimCode() 
// not sure about that, want to try it on people -- julien 

function dimEditor() {
  // TODO there is a chance that the animation library
  // doesn't bring the opacity completely to zero
  // but rather to a value close to it.
  // Make the animation step to print something
  // just to make sure that this is not the case.
  if ($("#formCode").css('opacity') > 0) {
    console.log('starting fadeout animation');
    $("#formCode").animate({
      opacity: 0
    }, "slow");
  }
}

function dimIfNoCursorActivity() {
  if (fakeText || editor.getValue() === '') return;
  if (cursorActivity) {
    console.log('marking cursor activity = false. Will check again in the next interval');
    cursorActivity = false;
    return;
  } else {
    console.log('no activity in the last interval. Dimming now, starting opacity is: ' + $("#formCode").css('opacity') );
    dimEditor();
  }
}


// a function to toggle code diming on and off -- julien 

function toggleDimCode() {
  dimcodeOn = !dimcodeOn;

  if (!dimcodeOn) {
    clearInterval(dimIntervalID);
    undimEditor();
    if (frenchVersion) {
      $("#dimCodeIndicator").html("Code Caché: inactif");
    } else {
      $("#dimCodeIndicator").html("Hide Code: off");
    }

  } else {
    // we restart a setInterval
    dimIntervalID = setInterval("dimIfNoCursorActivity()", 5000);
    if (frenchVersion) {
      $("#dimCodeIndicator").html("Code Caché: actif");
    } else {
      $("#dimCodeIndicator").html("Hide Code: on");
    }

  }
}




///////////////////////////////////////////////

function fullscreenify(canvas) {
  var style = canvas.getAttribute('style') || '';
  //alert('style: ' +  style);
  window.addEventListener('resize', function() {
    adjustCodeMirrorHeight();
    resize(canvas);
  }, false);

  resize(canvas);

  function resize(canvas) {
    var scale = {
      x: 1,
      y: 1
    };
    scale.x = (window.innerWidth + 40) / canvas.width;
    scale.y = (window.innerHeight + 40) / canvas.height;

    scale = scale.x + ', ' + scale.y;

    // this code below is if one wants to keep the aspect ratio
    // but I mean one doesn't necessarily resize the window
    // keeping the same aspect ratio.
    /*
        if (scale.x < 1 || scale.y < 1) {
            scale = '1, 1';
        } else if (scale.x < scale.y) {
            scale = scale.x + ', ' + scale.x;
        } else {
            scale = scale.y + ', ' + scale.y;
        }
        */

    canvas.setAttribute('style', style + ' ' + '-ms-transform-origin: left top; -webkit-transform-origin: left top; -moz-transform-origin: left top; -o-transform-origin: left top; transform-origin: left top; -ms-transform: scale(' + scale + '); -webkit-transform: scale3d(' + scale + ', 1); -moz-transform: scale(' + scale + '); -o-transform: scale(' + scale + '); transform: scale(' + scale + ');');

    // TODO In theory we want to re-draw the background because the
    // aspect ration might have changed.
    // But for the time being we only have vertical
    // gradients so that's not going to be a problem.
  }
}