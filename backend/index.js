const express = require("express");
const cors = require("cors");
// Note: if you are using Node versions earlier than 18, 
// you may need: const fetch = require("node-fetch");

const app = express();
const PORT = 5000;

app.use(cors()); // Simplified for testing
app.use(express.json());

// --- INSERT UPDATED ROUTE HERE ---
app.post("/predict", async (req, res) => {
  try {
    const features = req.body;
    
    // Express calls the Flask server on Port 8000
    const flaskResponse = await fetch("http://localhost:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features)
    });

    if (!flaskResponse.ok) {
        throw new Error(`Flask error: ${flaskResponse.statusText}`);
    }

    const data = await flaskResponse.json();
    res.json(data); // Send Flask's answer back to your Frontend
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Flask server unreachable or crashed" });
  }
});
// ---------------------------------

app.listen(PORT, () => console.log(`Gateway running on port ${PORT}`));