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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_line_args_1 = __importDefault(require("command-line-args"));
const command_line_usage_1 = __importDefault(require("command-line-usage"));
const readline = __importStar(require("readline"));
const log_1 = require("./log");
const ChargerSimulator_1 = require("./ChargerSimulator");
const optionList = [
    {
        name: "csURL",
        type: String,
        description: "URL of the Central System server to connect to, ws://server.name/path.\nThis is also a default option.",
        typeLabel: "{underline URL}",
        alias: "s",
        defaultOption: true,
    },
    {
        name: "cpPort",
        type: Number,
        description: "Port number to bind ChargePoint SOAP service. If specified, emulator will use SOAP protocol to connect to Central System, otherwise, WebSocket will be used",
        typeLabel: "{underline Number}",
        alias: "p",
    },
    {
        name: "chargerId",
        type: String,
        description: "OCPP ID to be used for simulating charger.\nDefault is 'test'.",
        typeLabel: "{underline ChargerId}",
        alias: "i",
        defaultValue: "test",
    },
    {
        name: "connectorId",
        type: String,
        description: "ID of the connector to send status when pressing keys.\nDefaults to 1.",
        typeLabel: "{underline ConnectorId}",
        alias: "c",
        defaultValue: 1,
    },
    {
        name: "idTag",
        type: String,
        description: "ID Tag to start transaction.\nDefaults to 123456.",
        typeLabel: "{underline idTag}",
        alias: "t",
        defaultValue: "12345678",
    },
];
const usageSections = [
    {
        header: "charger-simulator",
        content: "Start OCPP charging station simulator, connect simulator to Central System server.",
    },
    {
        header: "Options",
        optionList,
    },
];
(() => __awaiter(void 0, void 0, void 0, function* () {
    const { connectorId, csURL, cpPort, chargerId, idTag } = (0, command_line_args_1.default)(optionList);
    if (!connectorId || !csURL || !chargerId) {
        const usage = (0, command_line_usage_1.default)(usageSections);
        console.log(usage);
        return;
    }
    log_1.log.info("Starting charger simulator", {
        csURL,
        connectorId,
        chargerId,
        idTag,
    });
    const simulator = new ChargerSimulator_1.ChargerSimulator({
        centralSystemEndpoint: csURL,
        chargerIdentity: chargerId,
        chargePointPort: cpPort,
    });
    yield simulator.start();
    log_1.log.info(`Supported keys:
    Ctrl+C:   quit
    
    --
    b:        send BootNotification
    d:        send DataTransfer
    i:        disconnect from Central System
    
    Connector ${connectorId} status
    ---
    a:        send Available status 
    p:        send Preparing status
    c:        send Charging status
    e:        send SuspendedEV status
    f:        send Finishing status
    
    Transaction on connector ${connectorId}, tag ${idTag}
    --
    u:        Authorize
    s:        StartTransaction
    t:        StopTransaction
  `);
    function sendStatus(status) {
        return __awaiter(this, void 0, void 0, function* () {
            yield simulator.centralSystem.StatusNotification({
                connectorId: connectorId,
                errorCode: "NoError",
                status,
            });
        });
    }
    const commands = {
        b: () => simulator.centralSystem.BootNotification({
            chargePointVendor: "OC",
            chargePointModel: "OCX",
        }),
        d: () => simulator.centralSystem.DataTransfer({
            vendorId: "Emulator",
            messageId: "MessageID",
            data: "Data",
        }),
        i: () => simulator.disconnect(),
        a: () => sendStatus("Available"),
        p: () => sendStatus("Preparing"),
        c: () => sendStatus("Charging"),
        e: () => sendStatus("SuspendedEV"),
        f: () => sendStatus("Finishing"),
        u: () => simulator.centralSystem.Authorize({ idTag }),
        s: () => simulator.startTransaction({ idTag, connectorId }, false),
        t: () => simulator.stopTransaction(false),
    };
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on("keypress", (ch, key) => {
        if (key.ctrl && key.name === "c") {
            process.exit();
        }
        if (ch) {
            const command = commands[ch];
            command && command();
        }
    });
}))();
