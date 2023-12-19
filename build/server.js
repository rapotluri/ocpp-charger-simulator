"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const ChargerSimulator_1 = require("./src/ChargerSimulator"); // Assuming the path is correct
const app = (0, express_1.default)();
const port = 3000; // You can choose any port
// Middlewares
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
// Store our chargers in a simple object for now
const chargers = {};
// API to create a new virtual charger
app.post('/chargers', (req, res) => {
    const config = req.body;
    const chargerId = config.chargerIdentity;
    if (chargers[chargerId]) {
        return res.status(400).send('Charger already exists');
    }
    const newCharger = new ChargerSimulator_1.ChargerSimulator(config);
    chargers[chargerId] = newCharger;
    res.status(201).send(`Charger ${chargerId} created`);
});
// API to update charger configuration
app.put('/chargers/:chargerId', (req, res) => {
    const chargerId = req.params.chargerId;
    const config = req.body;
    if (!chargers[chargerId]) {
        return res.status(404).send('Charger not found');
    }
    // Here, add logic to update the charger configuration
    // For now, we'll just replace it
    chargers[chargerId] = new ChargerSimulator_1.ChargerSimulator(config);
    res.send(`Charger ${chargerId} updated`);
});
// API to simulate charger actions (e.g., start charge)
// Extend this as per your requirements
app.post('/chargers/:chargerId/actions', (req, res) => {
    const chargerId = req.params.chargerId;
    const action = req.body.action; // 'startCharge', 'stopCharge', etc.
    if (!chargers[chargerId]) {
        return res.status(404).send('Charger not found');
    }
    // Based on the action, call the appropriate method of ChargerSimulator
    // For now, we'll just log the action
    console.log(`Action ${action} for charger ${chargerId}`);
    res.send(`Action ${action} performed on charger ${chargerId}`);
});
// Start the server
app.listen(port, () => {
    console.log(`OCPP Simulator Server running at http://localhost:${port}`);
});
