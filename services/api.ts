// services/api.ts
export const BASE_URL = "http://localhost:5000";

export const getPrediction = async (features: object) => {
  try {
    const res = await fetch(`${BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features),
    });
    return await res.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
