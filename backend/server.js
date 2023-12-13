const express = require('express');
const app = express();
const port = 5000;

app.use(express.json());

let chargerStatus = {}; // Store charger status

app.post('/add-charger', (req, res) => {
  const { id } = req.body;
  chargerStatus[id] = 'Disconnected';
  res.send(`Charger ${id} added.`);
});

app.post('/toggle-charger', (req, res) => {
  const { id } = req.body;
  chargerStatus[id] = chargerStatus[id] === 'Connected' ? 'Disconnected' : 'Connected';
  res.send(`Charger ${id} is now ${chargerStatus[id]}`);
});

app.get('/status', (req, res) => {
  res.json(chargerStatus);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
