"use strict";
// SOAP bindings for OCPP 1.5
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCentralSystemClient = exports.createChargePointServer = void 0;
const path = __importStar(require("path"));
const uuid_js_1 = __importDefault(require("uuid-js"));
const nodeSoapUtils_1 = require("./nodeSoapUtils");
const serverUtils_1 = require("./serverUtils");
function createChargePointServer(target, port) {
    const keys = Object.keys(target);
    const a = (0, nodeSoapUtils_1.promisifyServer)(target, keys);
    const soapService = {
        ChargePointService: {
            ChargePointServiceSoap12: a,
        },
    };
    return (0, nodeSoapUtils_1.createServer)({
        wsdlFile: path.resolve(__dirname, "wsdl", "15", "ocpp_chargepointservice_1.5_final.wsdl"),
        path: "/",
        port,
        soapService,
    });
}
exports.createChargePointServer = createChargePointServer;
function createCentralSystemClient(endpoint, chargeBoxIdentity, chargeBoxEndpoint) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield (0, nodeSoapUtils_1.createClient)(chargeBoxIdentity, path.resolve(__dirname, "wsdl", "15", "ocpp_centralsystemservice_1.5_final.wsdl"), endpoint);
        return withSetWsAddressingHeaders(client, chargeBoxIdentity, chargeBoxEndpoint, endpoint, (0, nodeSoapUtils_1.getClientKeys)(client), "urn://Ocpp/Cs/2012/06/");
    });
}
exports.createCentralSystemClient = createCentralSystemClient;
function withSetWsAddressingHeaders(target, chargeBoxIdentity, fromEndPoint, toEndPoint, keys, idNs) {
    const wsa = `xmlns:a="http://www.w3.org/2005/08/addressing"`;
    return (0, serverUtils_1.proxy)(target, (impl, key, ...args) => {
        target.clearSoapHeaders();
        const action = "/" + key;
        const uuid = uuid_js_1.default.create();
        target.addSoapHeader(`<chargeBoxIdentity xmlns="${idNs}">${chargeBoxIdentity}</chargeBoxIdentity>`);
        target.addSoapHeader(`<a:MessageID ${wsa}>urn:uuid:${uuid}</a:MessageID>`);
        target.addSoapHeader(`<a:From ${wsa}><a:Address>${fromEndPoint}</a:Address></a:From>`);
        target.addSoapHeader(`<a:ReplyTo ${wsa}><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>`);
        target.addSoapHeader(`<a:To ${wsa}>${toEndPoint}</a:To>`);
        target.addSoapHeader(`<a:Action ${wsa} soap:mustUnderstand="1">${action}</a:Action>`);
        return impl(...args);
    }, keys);
}
