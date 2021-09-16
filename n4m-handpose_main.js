const { app, BrowserWindow } = require("electron");
const Store = require('electron-store');
Store.initRenderer();

function createWindow() {
	console.log("Loading n4m-handpose..");
	// Create the browser window.
	const win = new BrowserWindow({
		width: 622, 
		height: 542, 
		webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        } 
	});
	
	// uncomment for debug console:
	// win.webContents.openDevTools();

	// and load the html of the app.
	win.loadFile("./n4m-handpose_camera.html");
}

app.on("ready", createWindow);

//---------todo:
// const { app, BrowserWindow, ipcMain } = require("electron");
// const path = require("path");
// const fs = require("fs");

// const SocketIOClient = require("socket.io-client");
// const io = new SocketIOClient("http://localhost:3000");

// const socket = io.connect();
// socket.on("connect", () => {
// 	console.log("Connected to Max 8");
// //socket.emit("dispatch", "Socket is connected, Ready");
// });

// const handpose = require("@tensorflow-models/handpose");
// const dat = require("dat.gui");
// const Stats = require("stats.js");
  
// // Keep a global reference of the window object, if you don't, the window will
// // be closed automatically when the JavaScript object is garbage collected.
// let win;

// async function createWindow() 
// {
// 	// Create the browser window.
// 	win = new BrowserWindow({
// 		width: 800,
// 		height: 600,
// 		webPreferences: {
// 		nodeIntegration: false, // is default value after Electron v5
// 		contextIsolation: true, // protect against prototype pollution
// 		enableRemoteModule: false, // turn off remote
// 		preload: path.join(__dirname, "n4m-handpose_preload.js") // use a preload script
// 		}
// 	});

// 	// uncomment for debug console:
// 	win.webContents.openDevTools();

// 	// load the html of the electron app.
// 	win.loadFile("./n4m-handpose_camera.html");
// }

// app.on("ready", createWindow);

// ipcMain.on("toMain", (event, args) => {
// fs.readFile("path/to/file", (error, data) => {
// 	// Do something with file contents

// 	// Send result back to renderer process
// 	win.webContents.send("fromMain", responseObj);
// });
// });

app.on('window-all-closed', () => {
if (process.platform !== 'darwin') {
	app.quit()
}
});
