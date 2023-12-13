import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [chargerId, setChargerId] = useState(1);
  const [status, setStatus] = useState('');

  const addCharger = async () => {
    const response = await axios.post('http://localhost:5000/add-charger', { id: chargerId });
    setStatus(response.data);
    setChargerId(chargerId + 1);
  };

  const toggleCharger = async () => {
    const response = await axios.post('http://localhost:5000/toggle-charger', { id: chargerId - 1 });
    setStatus(response.data);
  };

  return (
    <div>
      <h1>EV Charger Simulator</h1>
      <button onClick={addCharger}>Add Charger</button>
      <button onClick={toggleCharger}>Toggle Charger</button>
      <p>Status: {status}</p>
    </div>
  );
}

export default App;
