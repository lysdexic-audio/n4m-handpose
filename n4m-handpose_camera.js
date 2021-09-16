/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

const SocketIOClient = require("socket.io-client");
const io = new SocketIOClient("http://localhost:3000");
//const statsShow = (windowWidth >= 360) ? true : false;
const statsShow = true;

const socket = io.connect();
socket.on("connect", () => {
	console.log("Connected to Max 8");
//socket.emit("dispatch", "Socket is connected, Ready");
});

socket.on("connect", () => {
	console.log("Connected to Max 8");
});

const Store = require('electron-store');

const schema = {
	storemaxContinuousChecks: {
		type: 'number',
		maximum: 960,
		minimum: 1,
		default: 960
	},
	storedetectionConfidence: {
		type: 'number',
    maximum: 1.0,
    minimum: 0.2,
    default: 0.2
	},
  storeiouThreshold: {
    type: 'number',
    maximum: 1.0,
    minimum: 0.2,
    default: 0.93
  },
  storescoreThreshold: {
    type: 'number',
    maximum: 1.0,
    minimum: 0.2,
    default: 0.55
  },
  storehand_fillColour: {
    type: 'string',
    default: "#00FF77"
  },
  storehand_strokeColour: {
    type: 'string',
    default: "#002DFF"
  },
};

const store = new Store({schema});

var palette =
{
  fillColour: store.get("storehand_fillColour"), // CSS string
  strokeColour: store.get("storehand_strokeColour") // CSS string
};

const handpose = require("@tensorflow-models/handpose");
const dat = require("dat.gui");
const Stats = require("stats.js");

//const _color = "#32EEDB"; // cyan
var _fillColour = store.get("storehand_fillColour"); // green
var _strokeColour = store.get("storehand_strokeColour"); // red

const videoWidth = 600;
const videoHeight = 500;
const stats = new Stats();

function isAndroid() {
	return /Android/i.test(navigator.userAgent);
}

function isiOS() {
	return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isMobile() {
	return isAndroid() || isiOS();
}

function sendToMaxPatch(predictions) {
	socket.emit("dispatch", predictions);
}

//------------------------------------

let fingerLookupIndices =
{
    thumb: [0, 1, 2, 3, 4],
    indexFinger: [0, 5, 6, 7, 8],
    middleFinger: [0, 9, 10, 11, 12],
    ringFinger: [0, 13, 14, 15, 16],
    pinky: [0, 17, 18, 19, 20]
}; // for rendering each finger as a polyline

function drawPoint(ctx, y, x, r)
{
	ctx.beginPath();
	ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = _fillColour;
  ctx.strokeStyle = _strokeColour;
	ctx.fill();
}

function drawKeypoints(ctx, keypoints)
{
   const keypointsArray = keypoints;

   for (let i = 0; i < keypointsArray.length; i++)
   {
     const y = keypointsArray[i][0];
     const x = keypointsArray[i][1];
     drawPoint(ctx, x - 2, y - 2, 3);
   }
   const fingers = Object.keys(fingerLookupIndices);
   for (let i = 0; i < fingers.length; i++)
   {
     const finger = fingers[i];
     const points = fingerLookupIndices[finger].map(idx => keypoints[idx]);
     drawPath(ctx, points, false);
   }
}

function drawPath(ctx, points, closePath)
{
  const region = new Path2D();
  region.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++)
  {
    const point = points[i];
    region.lineTo(point[0], point[1]);
  }

  if (closePath)
  {
    region.closePath();
  }
  ctx.stroke(region);
}

/**
 * Loads a the camera to be used in the demo
 *
 */
async function setupCamera()
{
	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		throw new Error(
			"Browser API navigator.mediaDevices.getUserMedia not available");
	}

	const video = document.getElementById("video");
	video.width = videoWidth;
	video.height = videoHeight;

	const mobile = isMobile();
	const stream = await navigator.mediaDevices.getUserMedia({
		"audio": false,
		"video": {
			facingMode: "user",
			width: mobile ? undefined : videoWidth,
			height: mobile ? undefined : videoHeight
		}
	});
	video.srcObject = stream;

	return new Promise((resolve) => {
		video.onloadedmetadata = () => {
			resolve(video);
		};
	});
}

async function changeVideoSource(newDevice)
{
	const video = document.getElementById("video");
	video.srcObject = null;
	const mobile = isMobile();
	const stream = await navigator.mediaDevices.getUserMedia({
		"audio": false,
		"video": {
			facingMode: "user",
			width: mobile ? undefined : videoWidth,
			height: mobile ? undefined : videoHeight,
			deviceId: newDevice
		}
	});
	video.srcObject = stream;
}

async function loadVideo()
{
	const video = await setupCamera();
	video.play();

	return video;
}

async function listVideoDevices()
{
	const allDevices = await navigator.mediaDevices.enumerateDevices();
	const videoDevices = allDevices.filter(device => device.kind === "videoinput").map(device => device.label);
	return videoDevices;
}

const guiState =
{
	devices: {
		videoDevices: []
	},

	input: {
    maxContinuousChecks: store.get("storemaxContinuousChecks"),
    detectionConfidence: store.get("storedetectionConfidence"),
    iouThreshold: store.get("storeiouThreshold"),
    scoreThreshold: store.get("storescoreThreshold")
	},

	output: {
    outputConfidence: true,
    outputBoundingBox: true,
    outputLandmarks: false,
    outputAnnotations: true,
		showVideo: true,

	},
	net: null
};

/**
 * Sets up dat.gui controller on the top-right of the window
 */
async function setupGui(cameras, net)
{
	guiState.net = net;
	if (cameras.length > 0) {
		guiState.camera = cameras[0].deviceId;
	}

	const gui = new dat.GUI({width: 300});


	let devices = gui.addFolder("Devices");
	const videoDevices = await listVideoDevices();
	const videoDeviceController = devices.add(guiState.devices, "videoDevices", videoDevices);

	videoDeviceController.onChange(async function (selectedDevice)
  {
		const allDevices = await navigator.mediaDevices.enumerateDevices();
		const matchedDeviceId = allDevices.filter(device => device.label === selectedDevice).map(device => device.deviceId);
		changeVideoSource(matchedDeviceId);
	});

  //add params to GUI
  let input = gui.addFolder("Input");
  // Params from https://github.com/tensorflow/tfjs-models/tree/master/handpose
  // - maxContinuousChecks
  // - How many frames to go without running the bounding box detector. Defaults to infinity.
  // - Set to a lower value if you want a safety net in case the mesh detector produces consistently flawed predictions.
  input.add(guiState.input, "maxContinuousChecks", [60, 120, 240, 480, 960]).onChange(async val => {
    //guiState.net.dispose();
    store.set("storemaxContinuousChecks", Number(val));
    guiState.net = await handpose.load({maxContinuousChecks: Number(val)});
  });
  // - detectionConfidence
  // - Threshold for discarding a prediction. Defaults to 0.8.
  input.add(guiState.input, "detectionConfidence").min(0.2).max(1.0).onChange(async val => {
    //guiState.net.dispose();
    store.set("storedetectionConfidence", val);
    guiState.net = await handpose.load({detectionConfidence: val});
  });
  // - iouThreshold
  // - A float representing the threshold for deciding whether boxes overlap too much in non-maximum suppression.
  // - Must be between [0, 1]. Defaults to 0.3.
  input.add(guiState.input, "iouThreshold").min(0.2).max(1.0).onChange(async val => {
    //guiState.net.dispose();
    store.set("storeiouThreshold", val);
    guiState.net = await handpose.load({iouThreshold: val});
  });
  // - scoreThreshold
  // - A threshold for deciding when to remove boxes based on score in non-maximum suppression. Defaults to 0.75.
  input.add(guiState.input, "scoreThreshold").min(0.2).max(1.0).onChange(async val => {
    //guiState.net.dispose();
    store.set("storescoreThreshold", val);
    guiState.net = await handpose.load({scoreThreshold: val});
  });
  input.close();

	let output = gui.addFolder("Output");
  output.addColor(palette, 'fillColour').onChange(async val => {
    _fillColour = val;
    store.set("storehand_fillColour", val);
  });
  output.addColor(palette, 'strokeColour').onChange(async val => {
    _strokeColour = val;
    store.set("storehand_strokeColour", val);
  });
  output.add(guiState.output, "outputConfidence");
  output.add(guiState.output, "outputBoundingBox");
  output.add(guiState.output, "outputAnnotations");
  output.add(guiState.output, "outputLandmarks");
	output.add(guiState.output, "showVideo");
	output.close();

  //gui.open();
  gui.close();
}

/**
 * Sets up a frames per second panel on the top-left of the window
 */
function setupFPS()
{
	stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
	document.body.appendChild(stats.dom);
}


function detectHands(video, net)
{
  video.addEventListener('loadeddata', function() {
  	const canvas = document.getElementById("output");
  	const ctx = canvas.getContext("2d");
  	// since images are being fed from a webcam
  	const flipHorizontal = true;

  	canvas.width = videoWidth;
  	canvas.height = videoHeight;

    async function handDetectionFrame()
    {
  		// Begin monitoring code for frames per second
  		if (statsShow) stats.begin();

  		ctx.clearRect(0, 0, videoWidth, videoHeight);

  		if (guiState.output.showVideo)
      {
  			ctx.save();
  			ctx.scale(-1, 1);
  			ctx.translate(-videoWidth, 0);
  			ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
  			ctx.restore();
  		}

      const predictions = await guiState.net.estimateHands(video, true);
      let handposeDict = {};

      if (predictions.length > 0)
      {
        if(guiState.output.outputConfidence) handposeDict["handInViewConfidence"] = predictions[0].handInViewConfidence;
        if(guiState.output.outputBoundingBox) handposeDict["boundingBox"] = predictions[0].boundingBox;
        if(guiState.output.outputAnnotations) handposeDict["annotations"] = {};
        for (let i = 0; i < predictions.length; i++)
        {
          const keypoints = predictions[i].annotations;
          // Log hand keypoints.
          if(guiState.output.outputAnnotations)
          {
            for (var key in keypoints)
            {
              // check if the property/key is defined in the object itself, not in parent
              if (keypoints.hasOwnProperty(key))
              {
                handposeDict["annotations"][key] = {};
                keypoints[key].forEach(([value1, value2, value3], idx) => handposeDict["annotations"][key][idx] = [value1, value2, value3]);
              }
            }
          }
        }

        if(guiState.output.outputLandmarks)
        {
          handposeDict["landmarks"] = {};
          predictions[0].landmarks.forEach(([value1, value2, value3], idx) => handposeDict["landmarks"][idx] = [value1, value2, value3]);
        }

        const result = predictions[0].landmarks;
        //drawKeypoints(ctx, result, predictions[0].annotations);
        drawKeypoints(ctx, result);

        //send raw arrays to MaxMSP
        //sendToMaxPatch(predictions[0]);

        //send formatted vals to MaxMSP
        sendToMaxPatch(handposeDict);
      }

  		if (statsShow) stats.end();

  		requestAnimationFrame(handDetectionFrame);
  	}

  	handDetectionFrame();
  }, false);
}

/**
 * Kicks off the demo by loading the handpose model, finding and loading
 * available camera devices, and setting off the detectHands function.
 */
async function bindPage()
{
  const net = await handpose.load();

	document.getElementById("loading").style.display = "none";
	document.getElementById("main").style.display = "block";

	let video;

	try {
		video = await loadVideo();
	} catch (e) {
		let info = document.getElementById("info");
		info.textContent = "this browser does not support video capture," +
        "or this device does not have a camera";
		info.style.display = "block";
		throw e;
	}

	setupGui([], net);
	if (statsShow) setupFPS();
  detectHands(video, net);
}

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
// kick off the demo
bindPage();
