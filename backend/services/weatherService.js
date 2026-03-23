const axios = require('axios');

async function getWeather(lat, lng) {
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
        return {
            provider: 'openweather',
            configured: false,
            condition: 'unknown',
            recommendation: 'Set OPENWEATHER_API_KEY for live weather impact.'
        };
    }

    try {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                lat,
                lon: lng,
                appid: apiKey,
                units: 'metric'
            },
            timeout: 8000
        });

        const payload = response.data || {};
        const weatherMain = payload.weather && payload.weather[0] ? payload.weather[0].main : 'Unknown';

        return {
            provider: 'openweather',
            configured: true,
            condition: weatherMain,
            temperatureC: Number(payload.main?.temp || 0),
            windSpeedMs: Number(payload.wind?.speed || 0),
            recommendation: weatherMain.toLowerCase().includes('rain')
                ? 'Rain detected. Increase safety margin and speed penalties.'
                : 'Weather conditions are acceptable for standard emergency routing.'
        };
    } catch (_error) {
        return {
            provider: 'openweather',
            configured: true,
            condition: 'unknown',
            recommendation: 'Weather provider request failed. Using fallback assumptions.'
        };
    }
}

module.exports = {
    getWeather
};
