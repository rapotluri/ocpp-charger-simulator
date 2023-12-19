import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { ChargerSimulator, Config } from './src/ChargerSimulator'; // Assuming the path is correct

const app = express();
const port = 3000; // You can choose any port

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Store our chargers in a simple object for now
const chargers: { [key: string]: ChargerSimulator } = {};

// API to create a new virtual charger
app.post('/chargers', (req, res) => {
    const config: Config = req.body;
    const chargerId = config.chargerIdentity;
    
    if (chargers[chargerId]) {
        return res.status(400).send('Charger already exists');
    }

    const newCharger = new ChargerSimulator(config);
    chargers[chargerId] = newCharger;

    res.status(201).send(`Charger ${chargerId} created`);
});

// API to update charger configuration
app.put('/chargers/:chargerId', (req, res) => {
    const chargerId = req.params.chargerId;
    const config: Config = req.body;

    if (!chargers[chargerId]) {
        return res.status(404).send('Charger not found');
    }

    // Here, add logic to update the charger configuration
    // For now, we'll just replace it
    chargers[chargerId] = new ChargerSimulator(config);

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
