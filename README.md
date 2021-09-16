# n4m-handpose v1.0.1
Wraps [MediaPipe Handpose](https://github.com/tensorflow/tfjs-models/tree/master/handpose) inside electron and serves the detected parts via MaxAPI.

![handpose](https://user-images.githubusercontent.com/43569216/81646758-261df680-946f-11ea-825a-81d8d81abe4e.gif)

Based around [Yuichi Yogo](https://github.com/yuichkun)'s great work porting Electron + Tensorflow models into [Node For Max](https://github.com/Cycling74/n4m-examples)

- Handpose is being used in Arthur Parmentier's [Soundpainting](https://github.com/arthur-parmentier/soundpainting-signs-gestures-recognition) Project
- *Are you using n4m-handpose in your project? Let me know*


# Steps (MaxMSP)
1. Install npm dependencies by clicking the indicated button. Since Electron's kind of big in size, this make take a while depending on your network environment. When the message object says it's 'completed' you'll never have to do this step again.
2. Click on the toggle button to launch n4m-handpose. 
3. The node.script emits the detected results as a dictionary, which has been parsed into (x,y,z) lists of each finger's tip positions & palmbase
4. All landmarks are also aggregated to a list to send to [Wekinator](http://www.wekinator.org/) if you'd like to perform gesture recognition with the data (sending to port 11000)

# Steps (MaxForLive)
- n4m-handposeM4L (Max For Live Device) AMXD coming in 1.1

### Changelog
- Skeleton color can be changed using GUI
- Settings are persisted using electron-store
- Handpose model controls now available in electron window UI
- Skeleton fill and stroke colour available in electron window UI
- Handpose model control settings and skeleton fill and stroke colour save automatically and persist/reload 
- Render window on or offscreen using arguments to node.script
- Hand landmarks are scaled and rendered to a jitter window (m4l + maxmsp)
