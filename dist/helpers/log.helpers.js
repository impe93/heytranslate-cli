"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redLog = redLog;
exports.greenLog = greenLog;
function redLog(str) {
    console.error("\x1b[31m%s\x1b[0m", str);
}
function greenLog(str) {
    console.error("\x1b[32m%s\x1b[0m", str);
}
//# sourceMappingURL=log.helpers.js.map