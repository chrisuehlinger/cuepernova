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
    getLastProjectDirectory: () => electron_1.ipcRenderer.invoke('get-last-project-directory'),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUN2RSxDQUFDO0lBQ0QscUJBQXFCLEVBQUUsQ0FBQyxRQUFtQyxFQUFFLEVBQUU7UUFDN0Qsc0JBQVcsQ0FBQyxFQUFFLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNoRixDQUFDO0NBQ0YsQ0FBQyxDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY3VlcGVybm92YS93ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24iLCJ3ZWJwYWNrOi8vY3VlcGVybm92YS9leHRlcm5hbCBub2RlLWNvbW1vbmpzIFwiZWxlY3Ryb25cIiIsIndlYnBhY2s6Ly9jdWVwZXJub3ZhL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2N1ZXBlcm5vdmEvLi9zcmMvbWFpbi9wcmVsb2FkLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSB7XG5cdFx0dmFyIGEgPSBmYWN0b3J5KCk7XG5cdFx0Zm9yKHZhciBpIGluIGEpICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgPyBleHBvcnRzIDogcm9vdClbaV0gPSBhW2ldO1xuXHR9XG59KShnbG9iYWwsICgpID0+IHtcbnJldHVybiAiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJlbGVjdHJvblwiKTsiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiaW1wb3J0IHsgY29udGV4dEJyaWRnZSwgaXBjUmVuZGVyZXIgfSBmcm9tICdlbGVjdHJvbic7XG5cbi8vIEV4cG9zZSBwcm90ZWN0ZWQgbWV0aG9kcyB0aGF0IGFsbG93IHRoZSByZW5kZXJlciBwcm9jZXNzIHRvIHVzZVxuLy8gdGhlIGlwY1JlbmRlcmVyIHdpdGhvdXQgZXhwb3NpbmcgdGhlIGVudGlyZSBvYmplY3RcbmNvbnRleHRCcmlkZ2UuZXhwb3NlSW5NYWluV29ybGQoJ2VsZWN0cm9uQVBJJywge1xuICAvLyBEaXJlY3Rvcnkgb3BlcmF0aW9uc1xuICBzZWxlY3REaXJlY3Rvcnk6ICgpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnc2VsZWN0LWRpcmVjdG9yeScpLFxuICBpbml0aWFsaXplUHJvamVjdDogKGRpcmVjdG9yeTogc3RyaW5nKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ2luaXRpYWxpemUtcHJvamVjdCcsIGRpcmVjdG9yeSksXG4gIGdldExhc3RQcm9qZWN0RGlyZWN0b3J5OiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ2dldC1sYXN0LXByb2plY3QtZGlyZWN0b3J5JyksXG4gIFxuICAvLyBGaWxlIG9wZXJhdGlvbnNcbiAgcmVhZEZpbGU6IChmaWxlUGF0aDogc3RyaW5nKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ3JlYWQtZmlsZScsIGZpbGVQYXRoKSxcbiAgd3JpdGVGaWxlOiAoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ3dyaXRlLWZpbGUnLCBmaWxlUGF0aCwgY29udGVudCksXG4gIFxuICAvLyBDdWVzIG9wZXJhdGlvbnNcbiAgZ2V0Q3VlczogKCkgPT4gaXBjUmVuZGVyZXIuaW52b2tlKCdnZXQtY3VlcycpLFxuICBzYXZlQ3VlczogKGN1ZXM6IGFueVtdKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ3NhdmUtY3VlcycsIGN1ZXMpLFxuICBcbiAgLy8gQ3Vlc3RhdGlvbnMgb3BlcmF0aW9uc1xuICBnZXRDdWVzdGF0aW9uczogKCkgPT4gaXBjUmVuZGVyZXIuaW52b2tlKCdnZXQtY3Vlc3RhdGlvbnMnKSxcbiAgc2F2ZUN1ZXN0YXRpb25zOiAoY3Vlc3RhdGlvbnM6IGFueVtdKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ3NhdmUtY3Vlc3RhdGlvbnMnLCBjdWVzdGF0aW9ucyksXG4gIG9wZW5DdWVzdGF0aW9uOiAobmFtZTogc3RyaW5nKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ29wZW4tY3Vlc3RhdGlvbicsIG5hbWUpLFxuICBcbiAgLy8gQ29uZmlnIG9wZXJhdGlvbnNcbiAgZ2V0Q29uZmlnOiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ2dldC1jb25maWcnKSxcbiAgc2F2ZUNvbmZpZzogKGNvbmZpZzogYW55KSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ3NhdmUtY29uZmlnJywgY29uZmlnKSxcbiAgXG4gIC8vIFNlcnZlciBvcGVyYXRpb25zXG4gIHN0YXJ0U2VydmVyOiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ3N0YXJ0LXNlcnZlcicpLFxuICBzdG9wU2VydmVyOiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ3N0b3Atc2VydmVyJyksXG4gIGdldFNlcnZlclN0YXR1czogKCkgPT4gaXBjUmVuZGVyZXIuaW52b2tlKCdnZXQtc2VydmVyLXN0YXR1cycpLFxuICBcbiAgLy8gQ0EgQ2VydGlmaWNhdGUgb3BlcmF0aW9uc1xuICBkb3dubG9hZENBQ2VydDogKCkgPT4gaXBjUmVuZGVyZXIuaW52b2tlKCdkb3dubG9hZC1jYS1jZXJ0JyksXG4gIFxuICAvLyBDdWViYWxsIG9wZXJhdGlvbnNcbiAgY3JlYXRlQ3VlYmFsbDogKG5hbWU6IHN0cmluZykgPT4gaXBjUmVuZGVyZXIuaW52b2tlKCdjcmVhdGUtY3VlYmFsbCcsIG5hbWUpLFxuICBcbiAgLy8gRXZlbnQgbGlzdGVuZXJzXG4gIG9uRGlyZWN0b3J5U2VsZWN0ZWQ6IChjYWxsYmFjazogKGRpcjogc3RyaW5nKSA9PiB2b2lkKSA9PiB7XG4gICAgaXBjUmVuZGVyZXIub24oJ2RpcmVjdG9yeS1zZWxlY3RlZCcsIChfZXZlbnQsIGRpcikgPT4gY2FsbGJhY2soZGlyKSk7XG4gIH0sXG4gIG9uU2VydmVyU3RhdHVzQ2hhbmdlZDogKGNhbGxiYWNrOiAoc3RhdHVzOiBib29sZWFuKSA9PiB2b2lkKSA9PiB7XG4gICAgaXBjUmVuZGVyZXIub24oJ3NlcnZlci1zdGF0dXMtY2hhbmdlZCcsIChfZXZlbnQsIHN0YXR1cykgPT4gY2FsbGJhY2soc3RhdHVzKSk7XG4gIH0sXG59KTtcblxuLy8gVHlwZVNjcmlwdCBkZWZpbml0aW9ucyBmb3IgdGhlIHJlbmRlcmVyIHByb2Nlc3NcbmRlY2xhcmUgZ2xvYmFsIHtcbiAgaW50ZXJmYWNlIFdpbmRvdyB7XG4gICAgZWxlY3Ryb25BUEk6IHtcbiAgICAgIHNlbGVjdERpcmVjdG9yeTogKCkgPT4gUHJvbWlzZTxzdHJpbmcgfCBudWxsPjtcbiAgICAgIGluaXRpYWxpemVQcm9qZWN0OiAoZGlyZWN0b3J5OiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD47XG4gICAgICBnZXRMYXN0UHJvamVjdERpcmVjdG9yeTogKCkgPT4gUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+O1xuICAgICAgcmVhZEZpbGU6IChmaWxlUGF0aDogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz47XG4gICAgICB3cml0ZUZpbGU6IChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD47XG4gICAgICBnZXRDdWVzOiAoKSA9PiBQcm9taXNlPGFueVtdPjtcbiAgICAgIHNhdmVDdWVzOiAoY3VlczogYW55W10pID0+IFByb21pc2U8dm9pZD47XG4gICAgICBnZXRDdWVzdGF0aW9uczogKCkgPT4gUHJvbWlzZTxhbnlbXT47XG4gICAgICBzYXZlQ3Vlc3RhdGlvbnM6IChjdWVzdGF0aW9uczogYW55W10pID0+IFByb21pc2U8dm9pZD47XG4gICAgICBvcGVuQ3Vlc3RhdGlvbjogKG5hbWU6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPjtcbiAgICAgIGdldENvbmZpZzogKCkgPT4gUHJvbWlzZTxhbnk+O1xuICAgICAgc2F2ZUNvbmZpZzogKGNvbmZpZzogYW55KSA9PiBQcm9taXNlPHZvaWQ+O1xuICAgICAgc3RhcnRTZXJ2ZXI6ICgpID0+IFByb21pc2U8dm9pZD47XG4gICAgICBzdG9wU2VydmVyOiAoKSA9PiBQcm9taXNlPHZvaWQ+O1xuICAgICAgZ2V0U2VydmVyU3RhdHVzOiAoKSA9PiBQcm9taXNlPGJvb2xlYW4+O1xuICAgICAgZG93bmxvYWRDQUNlcnQ6ICgpID0+IFByb21pc2U8c3RyaW5nPjtcbiAgICAgIGNyZWF0ZUN1ZWJhbGw6IChuYW1lOiBzdHJpbmcpID0+IFByb21pc2U8eyBzdWNjZXNzOiBib29sZWFuOyBlcnJvcj86IHN0cmluZzsgZmlsZXM/OiBhbnk7IGtlYmFiTmFtZT86IHN0cmluZyB9PjtcbiAgICAgIG9uRGlyZWN0b3J5U2VsZWN0ZWQ6IChjYWxsYmFjazogKGRpcjogc3RyaW5nKSA9PiB2b2lkKSA9PiB2b2lkO1xuICAgICAgb25TZXJ2ZXJTdGF0dXNDaGFuZ2VkOiAoY2FsbGJhY2s6IChzdGF0dXM6IGJvb2xlYW4pID0+IHZvaWQpID0+IHZvaWQ7XG4gICAgfTtcbiAgfVxufSJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==