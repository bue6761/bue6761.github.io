'use strict';

const apikey = '13125cd783d94a2786c206fd96a892e6'; // API-Schlüssel für die Wetterdaten
const address = 'https://api.weatherbit.io/v2.0'; // Basis-URL für die API
const lang = 'de'; // Sprache auf Deutsch einstellen

// HTML-Elemente holen
const input = document.querySelector('input');
const weatherIcon = document.querySelector('img');
const tempP = document.querySelector('.current-weather-temp');
const titleP = document.querySelector('.current-weather-title');
const locationSpan = document.querySelector('.current-weather-location span');
const dateSpan = document.querySelector('.current-weather-date span');
const timeSpan = document.querySelector('.current-weather-time span');  
const weatherForecast = document.querySelector('.forecast-weather-container');
const activityText = document.getElementById('activity');
const hourlyForecastContainer = document.querySelector('.hourly-forecast-container-inner');

// Vorschläge für Aktivitäten je nach Temperatur
function suggestActivity(temperature) {
    let activity = '';

    if (temperature < 0) {
        activity = 'Schlittenfahren, Kino, Museum, Indoor-Klettern, Escape-Rooms';
    } else if (temperature >= 0 && temperature < 5) {
        activity = 'Backen, Fitnessstudio, Wandern';
    } else if (temperature >= 5 && temperature < 15) {
        activity = 'Wandern, Joggen, Fahrrad fahren, Spaziergang';
    } else if (temperature >= 15 && temperature < 25) {
        activity = 'Joggen, Fahrrad fahren, Gartenarbeit, Grillen';
    } else if (temperature >= 25) {
        activity = 'Schwimmen, Eis essen, Grillen, Konzerte';
    }

    activityText.innerText = activity; // Zeigt die Aktivität an
}

// Holt Wetterdaten aus der API
function getWeather({city, country}, path) {
    const url = `${address}/${path}?city=${city}&country=${country}&lang=${lang}&key=${apikey}`;
    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-type': 'application/json'
        }
    }).then(resp => resp.json());
}

// Holt die Wettervorhersage
function getForecast({city, country}) {
    const url = `${address}/forecast?city=${city}&country=${country}&lang=${lang}&key=${apikey}`;
    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-type': 'application/json'
        }
    }).then(resp => resp.json());
}

// Holt stündliche Wetterdaten
function getHourlyForecast({city, country}) {
    const url = `${address}/forecast/hourly?city=${city}&country=${country}&lang=${lang}&key=${apikey}`;
    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-type': 'application/json'
        }
    }).then(resp => resp.json());
}

// Formatiert das Datum für die Anzeige
function sanitizeDate(datetime) {
    const dateObj = new Date(datetime);
    const month = dateObj.toLocaleDateString(lang, { month: 'long' });
    const day = dateObj.getDate();
    return `${day} ${month}`;
}

// Holt den Wochentag aus dem Datum
function sanitizeDay(datetime) {
    const dateObj = new Date(datetime);
    return dateObj.toLocaleDateString(lang, { weekday: 'short' });
}

// Zeigt die Wettervorhersage an
function renderForecastWeather({ data }) {
    const HTML = data.map(function ({ datetime, weather, min_temp, max_temp }) {
        const icon = `<img src="https://www.weatherbit.io/static/img/icons/${weather.icon}.png" alt="${weather.description}" width="50" />`;
        const day = `<span>${sanitizeDay(datetime)}</span>`;
        const date = `<span>${sanitizeDate(datetime)}</span>`;
        const tempspan = `<span>${max_temp}° / <small>${min_temp}°</small></span>`;

        return `${icon} ${day} ${date} ${tempspan}`;
    }).join('');

    weatherForecast.innerHTML = HTML;
}


// Zeigt stündliche Wetterdaten an
function renderHourlyWeather({ data }) {
    const hourlyData = data.slice(0, 24); // Zeigt Daten für die nächsten 24 Stunden
    const HTML = hourlyData.map(({ timestamp_local, temp, weather }) => {
        const icon = `<img src="https://www.weatherbit.io/static/img/icons/${weather.icon}.png" alt="${weather.description}" width="30" />`;
        const dateObj = new Date(timestamp_local);
        const hour = dateObj.getHours().toString().padStart(2, '0');
        const minutes = dateObj.getMinutes().toString().padStart(2, '0');
        const formattedTime = `${hour}:${minutes}`;

        return `
            <div class="hourly-forecast-item">
                ${icon}
                <div class="hour">${formattedTime}</div>
                <div class="temp">${Math.round(temp)}°C</div>
            </div>
        `;
    }).join('');

    hourlyForecastContainer.innerHTML = HTML; // Fügt HTML in den Container ein
}

// Zeigt das aktuelle Wetter an
function renderCurrentWeather({data}) {
    if (!data || data.length === 0) {
        alert('Keine Wetterdaten verfügbar. Bitte überprüfen Sie Ihre Eingaben.');
        return;
    }

    const [{
        city_name,
        weather: {icon, description},
        ob_time,
        temp,
        wind_spd,    
        rh,          
        pres         
    }] = data;

    const src = `https://www.weatherbit.io/static/img/icons/${icon}.png`;

    // Wetterdaten in die HTML-Elemente einfügen
    tempP.innerText = `${temp} °C`;
    titleP.innerText = description;
    locationSpan.innerText = city_name;
    dateSpan.innerText = new Date(ob_time).toLocaleDateString('de-DE');
    
    weatherIcon.setAttribute('src', src);
    weatherIcon.setAttribute('alt', description);

    document.querySelector('.wind-speed span').innerText = wind_spd;
    document.querySelector('.humidity span').innerText = rh;
    document.querySelector('.pressure span').innerText = pres;

    // Aktivitätsvorschläge basierend auf Temperatur
    suggestActivity(temp); 
}

// Aktualisiert die Uhrzeit der Stadt
function updateTime(cityTimeZone) {
    if (timeSpan) {
        const currentTime = new Date().toLocaleString('de-DE', { timeZone: cityTimeZone, hour12: false });
        timeSpan.innerText = currentTime.split(', ')[1]; 
    }
}

// Holt und zeigt alle Daten
function fetchData({value}) {
    const [city = '', country = ''] = value.split(',');
    const options = {
        city: city.trim(),
        country: country.trim(),
    };

    if (city === '' || country === '') {
        return alert('Bitte geben Sie gültige Werte wie beispielsweise Berlin, Deutschland an!');
    }

    getWeather(options, 'current').then((data) => {
        renderCurrentWeather(data);
        const cityTimeZone = data.data[0].timezone; 
        updateTime(cityTimeZone); 
    });

    getHourlyForecast(options).then(renderHourlyWeather);  
    getWeather(options, 'forecast/daily').then(renderForecastWeather);
    localStorage.setItem('last', value); // Letzte Eingabe speichern
}

// Event, wenn Enter gedrückt wird
input.addEventListener('keyup', function({target, code}) {
    if (code === 'Enter' && target.value.trim() !== '') {
        return fetchData(target);
    }
});

// Lädt die letzte Stadt beim Start
document.addEventListener('DOMContentLoaded', function() {
    const last = localStorage.getItem('last');

    if (last) {
        fetchData({value: last});
        input.value = last;
    }

    input.focus();
});
