const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/weather', async (req, res) => {
    const { city } = req.body;

    if (!city) {
        return res.status(400).json({ error: "Please provide a city name!" });
    }

    try {
        // 1. Geocoding Step: Turn the city text (e.g., "Detroit, MI") into Latitude & Longitude
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoResponse = await axios.get(geoUrl);
        
        if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
            return res.status(404).json({ error: "City not found." });
        }

        const { latitude, longitude } = geoResponse.data.results[0];

        // 2. Weather Step: Fetch the live conditions using coordinates
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
        const weatherResponse = await axios.get(weatherUrl);
        const currentData = weatherResponse.data.current;

        const temp = Math.round(currentData.temperature_2m);
        const code = currentData.weather_code;
        
        // 3. Map Open-Meteo codes to your exact five CatWeb statuses:
        // Cloudy, Rainy, Sunny, Stormy, Snowy
        let finalCondition = "Sunny";

        if ([0, 1].includes(code)) {
            finalCondition = "Sunny";
        } else if ([2, 3].includes(code)) {
            finalCondition = "Cloudy";
        } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
            finalCondition = "Rainy";
        } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
            finalCondition = "Snowy";
        } else if ([95, 96, 99].includes(code)) {
            finalCondition = "Stormy";
        } else {
            finalCondition = "Cloudy"; // Fallback for fog/mist
        }

        // Return exactly what your bot needs to deliver in-game
        res.json({
            temperature: temp, 
            condition: finalCondition
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to process weather request." });
    }
});

app.listen(PORT, () => {
    console.log(`Weather bot bridge running on port ${PORT}`);
});
