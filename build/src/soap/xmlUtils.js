"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prettyPrintXml = void 0;
const xml2js_1 = require("xml2js");
function prettyPrintXml(xml) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            (0, xml2js_1.parseString)(xml, (err, parsed) => {
                if (err) {
                    reject(err);
                    return;
                }
                try {
                    const formatted = new xml2js_1.Builder({ headless: true }).buildObject(parsed);
                    resolve("\n" + formatted.replace(/n\/  \n/g, ''));
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    });
}
exports.prettyPrintXml = prettyPrintXml;
