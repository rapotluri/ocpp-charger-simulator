"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
exports.log = {
    info: (s, ...rest) => console.log(`[info] ${s}`, ...rest),
    debug: (s, ...rest) => console.log(`[debug] ${s}`, ...rest),
    error: (s, ...rest) => console.log(`[error] ${s}`, ...rest),
};
