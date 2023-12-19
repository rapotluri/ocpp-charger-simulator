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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChargerSimulator = void 0;
const core_1 = require("@push-rpc/core");
const server_1 = require("@push-rpc/websocket/dist/server");
const ws_1 = __importDefault(require("ws"));
const log_1 = require("./log");
const ocppSoap_1 = require("./soap/ocppSoap");
const defaultConfig = {
    defaultHeartbeatIntervalSec: 30,
    chargePointVendor: "Test",
    chargePointModel: "1",
    startDelayMs: 8 * 1000,
    stopDelayMs: 8 * 1000,
    keepAliveTimeoutMs: 50 * 1000,
    meterValuesIntervalSec: 20,
};
let ws;
class ChargerSimulator {
    constructor(config) {
        this.centralSystem = null;
        this.config = null;
        this.meterTimer = null;
        this.charged = 0;
        this.configurationKeys = [];
        this.transactionId = null;
        this.chargePoint = {
            RemoteStartTransaction: (req) => __awaiter(this, void 0, void 0, function* () {
                return {
                    status: this.startTransaction(req, true) ? "Accepted" : "Rejected",
                    // status: "Rejected",
                };
            }),
            RemoteStopTransaction: (req) => __awaiter(this, void 0, void 0, function* () {
                return {
                    status: this.stopTransaction(true) ? "Accepted" : "Rejected",
                };
            }),
            GetConfiguration: (req) => __awaiter(this, void 0, void 0, function* () {
                yield new Promise((r) => setTimeout(r, 2000));
                return { configurationKey: this.configurationKeys };
            }),
            ChangeConfiguration: (req) => __awaiter(this, void 0, void 0, function* () {
                for (let i = 0; i < this.configurationKeys.length; i++) {
                    if (this.configurationKeys[i].key == req.key) {
                        this.configurationKeys[i].value = "" + req.value;
                    }
                }
                return { status: "Accepted" };
            }),
            ReserveNow: (req) => __awaiter(this, void 0, void 0, function* () {
                return { status: "Accepted" };
            }),
            CancelReservation: (req) => __awaiter(this, void 0, void 0, function* () {
                return { status: "Accepted" };
            }),
            Reset: (req) => __awaiter(this, void 0, void 0, function* () {
                return { status: "Accepted" };
            }),
            TriggerMessage: (req) => __awaiter(this, void 0, void 0, function* () {
                return { status: "Accepted" };
            }),
            UpdateFirmware: (req) => __awaiter(this, void 0, void 0, function* () {
                return { status: "Accepted" };
            }),
        };
        this.config = Object.assign(Object.assign({}, defaultConfig), config);
        this.configurationKeys = [
            { key: "HeartBeatInterval", readonly: false, value: "" + config.defaultHeartbeatIntervalSec },
            { key: "ResetRetries", readonly: false, value: "1" },
            { key: "MeterValueSampleInterval", readonly: false, value: config.meterValuesIntervalSec },
        ];
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config.chargePointPort) {
                yield (0, ocppSoap_1.createChargePointServer)(this.chargePoint, this.config.chargePointPort);
                log_1.log.info(`Started SOAP Charge Point server at http://localhost:${this.config.chargePointPort}/`);
                this.centralSystem = yield (0, ocppSoap_1.createCentralSystemClient)(this.config.centralSystemEndpoint, this.config.chargerIdentity, `http://localhost:${this.config.chargePointPort}/`);
                log_1.log.info(`Will send messages to Central System at ${this.config.centralSystemEndpoint}`);
            }
            else {
                const { remote } = yield (0, core_1.createRpcClient)(() => __awaiter(this, void 0, void 0, function* () {
                    ws = new ws_1.default(this.config.centralSystemEndpoint + "/" + this.config.chargerIdentity, "ocpp1.6");
                    return (0, server_1.wrapWebsocket)(ws);
                }), {
                    local: this.chargePoint,
                    reconnect: true,
                    keepAliveTimeout: this.config.keepAliveTimeoutMs,
                    listeners: {
                        messageIn: (data) => {
                            log_1.log.debug("OCPP in", data);
                        },
                        messageOut: (data) => {
                            log_1.log.debug("OCPP out", data);
                        },
                        connected() {
                            log_1.log.debug("OCPP connected");
                        },
                        disconnected({ code, reason }) {
                            log_1.log.debug("OCPP disconnected", { code, reason });
                        },
                        subscribed(subscriptions) { },
                        unsubscribed(subscriptions) { },
                    },
                });
                log_1.log.info(`Connected to Central System at ${this.config.centralSystemEndpoint} using WebSocket`);
                this.centralSystem = remote;
            }
            if (this.config.defaultHeartbeatIntervalSec) {
                setInterval(() => {
                    this.centralSystem.Heartbeat();
                }, this.config.defaultHeartbeatIntervalSec * 1000);
            }
        });
    }
    startTransaction({ connectorId, idTag }, delay) {
        if (this.meterTimer) {
            return false;
        }
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            this.transactionId = (yield this.centralSystem.StartTransaction({
                connectorId,
                idTag,
                timestamp: new Date(),
                meterStart: 0,
            })).transactionId;
            this.charged = 0;
            this.meterTimer = setInterval(() => {
                this.charged += Math.random() > 0.66 ? 30 : 20; // 26.6 W / 10s avg = 9.36 Kw
                this.centralSystem.MeterValues({
                    connectorId,
                    transactionId: this.transactionId,
                    meterValue: [
                        {
                            timestamp: new Date(),
                            sampledValue: [
                                {
                                    value: "" + this.charged,
                                    measurand: "Energy.Active.Import.Register",
                                    unit: "Wh",
                                },
                                {
                                    value: "38",
                                    measurand: "SoC",
                                    unit: "Percent",
                                },
                            ],
                        },
                    ],
                });
            }, this.config.meterValuesIntervalSec * 1000);
        }), delay ? this.config.startDelayMs : 0);
        return true;
    }
    stopTransaction(delay) {
        if (!this.meterTimer) {
            return false;
        }
        clearInterval(this.meterTimer);
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            yield this.centralSystem.StopTransaction({
                transactionId: this.transactionId,
                timestamp: new Date(),
                meterStop: this.charged,
            });
            this.meterTimer = null;
            this.transactionId = null;
        }), delay ? this.config.stopDelayMs : 0);
        return true;
    }
    disconnect() {
        ws.close();
    }
}
exports.ChargerSimulator = ChargerSimulator;
