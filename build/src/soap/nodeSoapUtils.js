"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.logOcppResponse = exports.logOcppRequest = exports.promisifyServer = exports.getClientKeys = exports.createClient = exports.createServer = void 0;
const fs = __importStar(require("fs"));
const http = __importStar(require("http"));
const strong_soap_1 = require("strong-soap");
const serverUtils_1 = require("./serverUtils");
const xmlUtils_1 = require("./xmlUtils");
const log_1 = require("../log");
let server = null;
function createServer({ wsdlFile, soapService, path, port, }) {
    const wsdl = fs.readFileSync(wsdlFile, "utf8");
    return new Promise((resolve, reject) => {
        const createServer = () => {
            server = http.createServer((request, response) => {
                response.end(`404: Not Found: ${request.url}`);
            });
            server.listen(port, () => {
                log_1.log.info(`OCPP Server is listening on port ${port}`);
                resolve(server);
            });
            const soapServer = strong_soap_1.soap.listen(server, path, soapService, wsdl);
            soapServer.log = soapServerLog;
        };
        if (server) {
            server.close(createServer);
        }
        else {
            createServer();
        }
    });
}
exports.createServer = createServer;
function createClient(chargeBoxId, wsdlFile, endpoint) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            strong_soap_1.soap.createClient(wsdlFile, { endpoint, attributesKey: "attributes" }, (err, client) => {
                if (err)
                    reject(err);
                else {
                    const keys = getClientKeys(client);
                    promisifyClient(chargeBoxId, client, keys);
                    resolve(client);
                }
            });
        });
    });
}
exports.createClient = createClient;
function getClientKeys(client) {
    const d = client.describe();
    const service = d[Object.keys(d)[0]];
    const binding = service[Object.keys(service)[0]];
    return Object.keys(binding);
}
exports.getClientKeys = getClientKeys;
function uncap(s) {
    return s[0].toLowerCase() + s.substring(1);
}
function promisifyClient(chargeBoxId, target, keys) {
    target.on("request", (envelope) => {
        logOcppRequest(chargeBoxId, envelope);
    });
    (0, serverUtils_1.proxify)(target, (impl, key, message) => {
        return new Promise((resolve, reject) => {
            const inputMessage = wrapMessage(key, soapDateToString(message), "Request");
            impl(inputMessage, (err, result, envelope) => {
                logOcppResponse(chargeBoxId, envelope);
                if (err) {
                    const e = err.Fault ? err.Fault : err;
                    log_1.log.error(`Failed to call ${key}`, e);
                    reject(e);
                }
                else {
                    resolve(result);
                }
            });
        });
    }, keys);
}
// see https://github.com/strongloop/strong-soap/issues/49
// see https://github.com/strongloop/strong-soap/issues/113
function wrapMessage(operationName, message, wrapperName) {
    return {
        [uncap(operationName) + wrapperName]: message,
    };
}
function soapDateToString(message) {
    return (0, serverUtils_1.convertDateToString)(message, (d) => d.toISOString());
}
function soapStringToDate(message) {
    return (0, serverUtils_1.convertStringToDate)(message, (s) => serverUtils_1.ISO8601.test(s) || serverUtils_1.ISO8601_secs.test(s), (s) => new Date(s));
}
/** Convert promise-based WS impl to node-soap compat, also date fixes */
function promisifyServer(target, keys) {
    return (0, serverUtils_1.proxy)(target, (impl, key, args, callback, headers, req) => {
        const promise = impl(soapStringToDate(args), headers, req);
        promise
            .then((r) => {
            callback(wrapMessage(key, soapDateToString(r), "Response"));
        })
            .catch((e) => {
            log_1.log.error(`Failed to serve ${key}`, e.Fault ? e.Fault : e);
            callback(null, {
                Fault: {
                    Code: {
                        Value: "soap:Sender",
                        Subcode: { value: "rpc:BadArguments" },
                    },
                    Reason: { Text: "Processing Error" },
                },
            });
        });
    }, keys);
}
exports.promisifyServer = promisifyServer;
function soapServerLog(type, data) {
    if (type == "error")
        log_1.log.error(data);
}
function logOcppRequest(chargeBoxId, envelope) {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.noRequestLogging)
            return;
        const details = yield (0, xmlUtils_1.prettyPrintXml)(envelope);
        log_1.log.debug("OCPP out", details);
    });
}
exports.logOcppRequest = logOcppRequest;
function logOcppResponse(chargeBoxId, envelope) {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.noRequestLogging)
            return;
        const details = yield (0, xmlUtils_1.prettyPrintXml)(envelope);
        log_1.log.debug("OCPP in", details);
    });
}
exports.logOcppResponse = logOcppResponse;
