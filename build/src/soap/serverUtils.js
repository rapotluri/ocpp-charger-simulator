"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ISO8601_date = exports.ISO8601_secs = exports.ISO8601 = exports.convertStringToDate = exports.convertDateToString = exports.proxify = exports.proxy = void 0;
function proxy(target, invoker, keys) {
    const r = Object.assign({}, target);
    keys.forEach((key) => {
        r[key] = function (...args) {
            const impl = target[key];
            return invoker(impl, key, ...args);
        };
    });
    return r;
}
exports.proxy = proxy;
function proxify(target, invoker, keys) {
    keys.forEach((key) => {
        const impl = target[key];
        target[key] = function (...args) {
            return invoker(impl, key, ...args);
        };
    });
}
exports.proxify = proxify;
function convertDateToString(message, format) {
    if (!message)
        return message;
    Object.keys(message).forEach((key) => {
        const prop = message[key];
        if (typeof prop != "object")
            return;
        if (prop instanceof Date) {
            message[key] = format(prop);
            return;
        }
        if (!Array.isArray(prop))
            return convertDateToString(prop, format);
        for (let i = 0; i < prop.length; i++) {
            convertDateToString(prop[i], format);
        }
    });
    return message;
}
exports.convertDateToString = convertDateToString;
function convertStringToDate(message, match, parse) {
    if (!message)
        return message;
    Object.keys(message).forEach((key) => {
        const prop = message[key];
        if (!prop)
            return;
        if (typeof prop == "string") {
            if (match(prop))
                message[key] = parse(prop);
            return;
        }
        if (typeof prop != "object")
            return;
        if (!Array.isArray(prop))
            return convertStringToDate(prop, match, parse);
        for (let i = 0; i < prop.length; i++) {
            convertStringToDate(prop[i], match, parse);
        }
    });
    return message;
}
exports.convertStringToDate = convertStringToDate;
exports.ISO8601 = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/;
exports.ISO8601_secs = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\dZ$/;
exports.ISO8601_date = /^\d\d\d\d-\d\d-\d\d$/;
