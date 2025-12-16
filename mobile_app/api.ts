export const BASE_URL = "https://predicting-parkinsons-disease-severity-backend-production-864c.up.railway.app"; 

export interface PredictionResult {
  motor_UPDRS: number;
  total_UPDRS: number;
}

export const getPrediction = async (features: Record<string, any>): Promise<PredictionResult> => {
  try {
    const res = await fetch(`${BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMessage = data?.error || res.statusText;
      throw new Error(`Server error: ${errorMessage}`);
    }

    return data as PredictionResult;
  } catch (error: any) {
    console.error("API Error:", error.message || error);
    throw error;
  }
};
