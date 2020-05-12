# n4m-handpose
Wraps [MediaPipe Handpose](https://github.com/tensorflow/tfjs-models/tree/master/handpose) inside electron and serves the detected parts via MaxAPI.

![handpose](https://user-images.githubusercontent.com/43569216/81646758-261df680-946f-11ea-825a-81d8d81abe4e.gif)

Based around [Yuichi Yogo](https://github.com/yuichkun)'s great work porting Electron + Tensorflow models into [Node For Max](https://github.com/Cycling74/n4m-examples)


# Steps
1. Install npm dependencies by clicking the indicated button. Since Electron's kind of big in size, this make take a while depending on your network environment. When the message object says it's 'completed' you'll never have to do this step again.
2. Click on the toggle button to launch MediaPipe Handpose. 
3. The node.script emits the detected results as a dict - retrieve values using the dictionary keys (objects on the right) 
