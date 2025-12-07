const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); 

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.post("/predict", async (req, res) => {
  try {
    const flaskResponse = await fetch("http://localhost:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await flaskResponse.json();

    if (!flaskResponse.ok) {
      console.error("Flask error:", data.error);
      return res.status(flaskResponse.status).json(data);
    }

    res.json({
      motor_UPDRS: data.motor_UPDRS,
      total_UPDRS: data.total_UPDRS,
    });

  } catch (error) {
    console.error("Failed to connect to Flask backend:", error.message);
    res.status(500).json({ error: "Could not reach Python backend" });
  }
});

app.listen(PORT, () => console.log(`Gateway running on port ${PORT}`));
