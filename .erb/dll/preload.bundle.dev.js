(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(global, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("electron");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!*****************************!*\
  !*** ./src/main/preload.ts ***!
  \*****************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const electron_1 = __webpack_require__(/*! electron */ "electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Directory operations
    selectDirectory: () => electron_1.ipcRenderer.invoke('select-directory'),
    initializeProject: (directory) => electron_1.ipcRenderer.invoke('initialize-project', directory),
    // File operations
    readFile: (filePath) => electron_1.ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath, content) => electron_1.ipcRenderer.invoke('write-file', filePath, content),
    // Cues operations
    getCues: () => electron_1.ipcRenderer.invoke('get-cues'),
    saveCues: (cues) => electron_1.ipcRenderer.invoke('save-cues', cues),
    // Cuestations operations
    getCuestations: () => electron_1.ipcRenderer.invoke('get-cuestations'),
    saveCuestations: (cuestations) => electron_1.ipcRenderer.invoke('save-cuestations', cuestations),
    openCuestation: (name) => electron_1.ipcRenderer.invoke('open-cuestation', name),
    // Config operations
    getConfig: () => electron_1.ipcRenderer.invoke('get-config'),
    saveConfig: (config) => electron_1.ipcRenderer.invoke('save-config', config),
    // Server operations
    startServer: () => electron_1.ipcRenderer.invoke('start-server'),
    stopServer: () => electron_1.ipcRenderer.invoke('stop-server'),
    getServerStatus: () => electron_1.ipcRenderer.invoke('get-server-status'),
    // CA Certificate operations
    downloadCACert: () => electron_1.ipcRenderer.invoke('download-ca-cert'),
    // Cueball operations
    createCueball: (name) => electron_1.ipcRenderer.invoke('create-cueball', name),
    // Event listeners
    onDirectorySelected: (callback) => {
        electron_1.ipcRenderer.on('directory-selected', (_event, dir) => callback(dir));
    },
    onServerStatusChanged: (callback) => {
        electron_1.ipcRenderer.on('server-status-changed', (_event, status) => callback(status));
    },
});

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlbG9hZC5idW5kbGUuZGV2LmpzIiwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxPOzs7Ozs7Ozs7O0FDVkE7Ozs7OztVQ0FBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7Ozs7Ozs7OztBQ3RCQSxtRUFBc0Q7QUFFdEQsa0VBQWtFO0FBQ2xFLHFEQUFxRDtBQUNyRCx3QkFBYSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsRUFBRTtJQUM3Qyx1QkFBdUI7SUFDdkIsZUFBZSxFQUFFLEdBQUcsRUFBRSxDQUFDLHNCQUFXLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDO0lBQzdELGlCQUFpQixFQUFFLENBQUMsU0FBaUIsRUFBRSxFQUFFLENBQUMsc0JBQVcsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLEVBQUUsU0FBUyxDQUFDO0lBRTdGLGtCQUFrQjtJQUNsQixRQUFRLEVBQUUsQ0FBQyxRQUFnQixFQUFFLEVBQUUsQ0FBQyxzQkFBVyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDO0lBQ3pFLFNBQVMsRUFBRSxDQUFDLFFBQWdCLEVBQUUsT0FBZSxFQUFFLEVBQUUsQ0FBQyxzQkFBVyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQztJQUVyRyxrQkFBa0I7SUFDbEIsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLHNCQUFXLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztJQUM3QyxRQUFRLEVBQUUsQ0FBQyxJQUFXLEVBQUUsRUFBRSxDQUFDLHNCQUFXLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUM7SUFFaEUseUJBQXlCO0lBQ3pCLGNBQWMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxzQkFBVyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztJQUMzRCxlQUFlLEVBQUUsQ0FBQyxXQUFrQixFQUFFLEVBQUUsQ0FBQyxzQkFBVyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxXQUFXLENBQUM7SUFDNUYsY0FBYyxFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FBQyxzQkFBVyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUM7SUFFN0Usb0JBQW9CO0lBQ3BCLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxzQkFBVyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7SUFDakQsVUFBVSxFQUFFLENBQUMsTUFBVyxFQUFFLEVBQUUsQ0FBQyxzQkFBVyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDO0lBRXRFLG9CQUFvQjtJQUNwQixXQUFXLEVBQUUsR0FBRyxFQUFFLENBQUMsc0JBQVcsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDO0lBQ3JELFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxzQkFBVyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUM7SUFDbkQsZUFBZSxFQUFFLEdBQUcsRUFBRSxDQUFDLHNCQUFXLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDO0lBRTlELDRCQUE0QjtJQUM1QixjQUFjLEVBQUUsR0FBRyxFQUFFLENBQUMsc0JBQVcsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUM7SUFFNUQscUJBQXFCO0lBQ3JCLGFBQWEsRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsc0JBQVcsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDO0lBRTNFLGtCQUFrQjtJQUNsQixtQkFBbUIsRUFBRSxDQUFDLFFBQStCLEVBQUUsRUFBRTtRQUN2RCxzQkFBVyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFDRCxxQkFBcUIsRUFBRSxDQUFDLFFBQW1DLEVBQUUsRUFBRTtRQUM3RCxzQkFBVyxDQUFDLEVBQUUsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ2hGLENBQUM7Q0FDRixDQUFDLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jdWVwZXJub3ZhL3dlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbiIsIndlYnBhY2s6Ly9jdWVwZXJub3ZhL2V4dGVybmFsIG5vZGUtY29tbW9uanMgXCJlbGVjdHJvblwiIiwid2VicGFjazovL2N1ZXBlcm5vdmEvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vY3VlcGVybm92YS8uL3NyYy9tYWluL3ByZWxvYWQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRlbHNlIHtcblx0XHR2YXIgYSA9IGZhY3RvcnkoKTtcblx0XHRmb3IodmFyIGkgaW4gYSkgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyA/IGV4cG9ydHMgOiByb290KVtpXSA9IGFbaV07XG5cdH1cbn0pKGdsb2JhbCwgKCkgPT4ge1xucmV0dXJuICIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImVsZWN0cm9uXCIpOyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJpbXBvcnQgeyBjb250ZXh0QnJpZGdlLCBpcGNSZW5kZXJlciB9IGZyb20gJ2VsZWN0cm9uJztcblxuLy8gRXhwb3NlIHByb3RlY3RlZCBtZXRob2RzIHRoYXQgYWxsb3cgdGhlIHJlbmRlcmVyIHByb2Nlc3MgdG8gdXNlXG4vLyB0aGUgaXBjUmVuZGVyZXIgd2l0aG91dCBleHBvc2luZyB0aGUgZW50aXJlIG9iamVjdFxuY29udGV4dEJyaWRnZS5leHBvc2VJbk1haW5Xb3JsZCgnZWxlY3Ryb25BUEknLCB7XG4gIC8vIERpcmVjdG9yeSBvcGVyYXRpb25zXG4gIHNlbGVjdERpcmVjdG9yeTogKCkgPT4gaXBjUmVuZGVyZXIuaW52b2tlKCdzZWxlY3QtZGlyZWN0b3J5JyksXG4gIGluaXRpYWxpemVQcm9qZWN0OiAoZGlyZWN0b3J5OiBzdHJpbmcpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnaW5pdGlhbGl6ZS1wcm9qZWN0JywgZGlyZWN0b3J5KSxcbiAgXG4gIC8vIEZpbGUgb3BlcmF0aW9uc1xuICByZWFkRmlsZTogKGZpbGVQYXRoOiBzdHJpbmcpID0+IGlwY1JlbmRlcmVyLmludm9rZSgncmVhZC1maWxlJywgZmlsZVBhdGgpLFxuICB3cml0ZUZpbGU6IChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnd3JpdGUtZmlsZScsIGZpbGVQYXRoLCBjb250ZW50KSxcbiAgXG4gIC8vIEN1ZXMgb3BlcmF0aW9uc1xuICBnZXRDdWVzOiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ2dldC1jdWVzJyksXG4gIHNhdmVDdWVzOiAoY3VlczogYW55W10pID0+IGlwY1JlbmRlcmVyLmludm9rZSgnc2F2ZS1jdWVzJywgY3VlcyksXG4gIFxuICAvLyBDdWVzdGF0aW9ucyBvcGVyYXRpb25zXG4gIGdldEN1ZXN0YXRpb25zOiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ2dldC1jdWVzdGF0aW9ucycpLFxuICBzYXZlQ3Vlc3RhdGlvbnM6IChjdWVzdGF0aW9uczogYW55W10pID0+IGlwY1JlbmRlcmVyLmludm9rZSgnc2F2ZS1jdWVzdGF0aW9ucycsIGN1ZXN0YXRpb25zKSxcbiAgb3BlbkN1ZXN0YXRpb246IChuYW1lOiBzdHJpbmcpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnb3Blbi1jdWVzdGF0aW9uJywgbmFtZSksXG4gIFxuICAvLyBDb25maWcgb3BlcmF0aW9uc1xuICBnZXRDb25maWc6ICgpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnZ2V0LWNvbmZpZycpLFxuICBzYXZlQ29uZmlnOiAoY29uZmlnOiBhbnkpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnc2F2ZS1jb25maWcnLCBjb25maWcpLFxuICBcbiAgLy8gU2VydmVyIG9wZXJhdGlvbnNcbiAgc3RhcnRTZXJ2ZXI6ICgpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnc3RhcnQtc2VydmVyJyksXG4gIHN0b3BTZXJ2ZXI6ICgpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnc3RvcC1zZXJ2ZXInKSxcbiAgZ2V0U2VydmVyU3RhdHVzOiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ2dldC1zZXJ2ZXItc3RhdHVzJyksXG4gIFxuICAvLyBDQSBDZXJ0aWZpY2F0ZSBvcGVyYXRpb25zXG4gIGRvd25sb2FkQ0FDZXJ0OiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ2Rvd25sb2FkLWNhLWNlcnQnKSxcbiAgXG4gIC8vIEN1ZWJhbGwgb3BlcmF0aW9uc1xuICBjcmVhdGVDdWViYWxsOiAobmFtZTogc3RyaW5nKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ2NyZWF0ZS1jdWViYWxsJywgbmFtZSksXG4gIFxuICAvLyBFdmVudCBsaXN0ZW5lcnNcbiAgb25EaXJlY3RvcnlTZWxlY3RlZDogKGNhbGxiYWNrOiAoZGlyOiBzdHJpbmcpID0+IHZvaWQpID0+IHtcbiAgICBpcGNSZW5kZXJlci5vbignZGlyZWN0b3J5LXNlbGVjdGVkJywgKF9ldmVudCwgZGlyKSA9PiBjYWxsYmFjayhkaXIpKTtcbiAgfSxcbiAgb25TZXJ2ZXJTdGF0dXNDaGFuZ2VkOiAoY2FsbGJhY2s6IChzdGF0dXM6IGJvb2xlYW4pID0+IHZvaWQpID0+IHtcbiAgICBpcGNSZW5kZXJlci5vbignc2VydmVyLXN0YXR1cy1jaGFuZ2VkJywgKF9ldmVudCwgc3RhdHVzKSA9PiBjYWxsYmFjayhzdGF0dXMpKTtcbiAgfSxcbn0pO1xuXG4vLyBUeXBlU2NyaXB0IGRlZmluaXRpb25zIGZvciB0aGUgcmVuZGVyZXIgcHJvY2Vzc1xuZGVjbGFyZSBnbG9iYWwge1xuICBpbnRlcmZhY2UgV2luZG93IHtcbiAgICBlbGVjdHJvbkFQSToge1xuICAgICAgc2VsZWN0RGlyZWN0b3J5OiAoKSA9PiBQcm9taXNlPHN0cmluZyB8IG51bGw+O1xuICAgICAgaW5pdGlhbGl6ZVByb2plY3Q6IChkaXJlY3Rvcnk6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPjtcbiAgICAgIHJlYWRGaWxlOiAoZmlsZVBhdGg6IHN0cmluZykgPT4gUHJvbWlzZTxzdHJpbmc+O1xuICAgICAgd3JpdGVGaWxlOiAoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+O1xuICAgICAgZ2V0Q3VlczogKCkgPT4gUHJvbWlzZTxhbnlbXT47XG4gICAgICBzYXZlQ3VlczogKGN1ZXM6IGFueVtdKSA9PiBQcm9taXNlPHZvaWQ+O1xuICAgICAgZ2V0Q3Vlc3RhdGlvbnM6ICgpID0+IFByb21pc2U8YW55W10+O1xuICAgICAgc2F2ZUN1ZXN0YXRpb25zOiAoY3Vlc3RhdGlvbnM6IGFueVtdKSA9PiBQcm9taXNlPHZvaWQ+O1xuICAgICAgb3BlbkN1ZXN0YXRpb246IChuYW1lOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD47XG4gICAgICBnZXRDb25maWc6ICgpID0+IFByb21pc2U8YW55PjtcbiAgICAgIHNhdmVDb25maWc6IChjb25maWc6IGFueSkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgICAgIHN0YXJ0U2VydmVyOiAoKSA9PiBQcm9taXNlPHZvaWQ+O1xuICAgICAgc3RvcFNlcnZlcjogKCkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgICAgIGdldFNlcnZlclN0YXR1czogKCkgPT4gUHJvbWlzZTxib29sZWFuPjtcbiAgICAgIGRvd25sb2FkQ0FDZXJ0OiAoKSA9PiBQcm9taXNlPHN0cmluZz47XG4gICAgICBjcmVhdGVDdWViYWxsOiAobmFtZTogc3RyaW5nKSA9PiBQcm9taXNlPHsgc3VjY2VzczogYm9vbGVhbjsgZXJyb3I/OiBzdHJpbmc7IGZpbGVzPzogYW55OyBrZWJhYk5hbWU/OiBzdHJpbmcgfT47XG4gICAgICBvbkRpcmVjdG9yeVNlbGVjdGVkOiAoY2FsbGJhY2s6IChkaXI6IHN0cmluZykgPT4gdm9pZCkgPT4gdm9pZDtcbiAgICAgIG9uU2VydmVyU3RhdHVzQ2hhbmdlZDogKGNhbGxiYWNrOiAoc3RhdHVzOiBib29sZWFuKSA9PiB2b2lkKSA9PiB2b2lkO1xuICAgIH07XG4gIH1cbn0iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=