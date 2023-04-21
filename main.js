// Getting the API data
function getWeather(lat, lon, timezone) {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.append(
        "hourly",
        "temperature_2m,apparent_temperature,precipitation,weathercode,windspeed_10m"
    );
    url.searchParams.append(
        "daily",
        "weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum"
    );
    url.searchParams.append("current_weather", "true");
    url.searchParams.append("timeformat", "unixtime");
    url.searchParams.append("latitude", lat);
    url.searchParams.append("longitude", lon);
    url.searchParams.append("timezone", timezone);

    return fetch(url)
        .then((response) => response.json())
        .then((data) => {
            return {
                current: parseCurrentWeather(data),
                daily: parseDailyWeather(data),
                hourly: parseHourlyWeather(data),
            };
        });
}

navigator.geolocation.getCurrentPosition(positionSuccess, positionError);

function positionSuccess({ coords }) {
    getWeather(
        coords.latitude,
        coords.longitude,
        Intl.DateTimeFormat().resolvedOptions().timeZone
    )
        .then(renderWeather)
        .catch((e) => {
            console.error(e);
            alert("Error no good. :((((((");
        });
}
function positionError() {
    alert("let me take your location and refresh the page. :(((((");
}

// !Getting the API data
function renderWeather({ current, daily, hourly }) {
    renderCurrentWeather(current);
    renderDailyWeather(daily);
    renderHourlyWeather(hourly);
    document.body.classList.remove("blurred");
}

function setValue(selector, value, { parent = document } = {}) {
    parent.querySelector(`[data-${selector}]`).textContent = value;
}
function getIconUrl(iconCode) {
    return `./pics/${ICON_MAP.get(iconCode)}.svg`;
}

const currentIcon = document.querySelector("[data-current-icon]");
function renderCurrentWeather(current) {
    currentIcon.src = getIconUrl(current.iconCode);
    setValue("current-temp", current.currentTemp);
    setValue("current-high", current.highTemp);
    setValue("current-low", current.lowTemp);
    setValue("current-fl-high", current.highFeelsLike);
    setValue("current-fl-low", current.lowFeelsLike);
    setValue("current-wind", current.windSpeed);
    setValue("current-precip", current.precip);
}

const DAY_FORMATTER = new Intl.DateTimeFormat(undefined, { weekday: "long" });
const dailySection = document.querySelector("[data-day-section]");
const dayCardTemplate = document.getElementById("day-card-template");
function renderDailyWeather(daily) {
    dailySection.innerHTML = "";
    daily.forEach((day) => {
        const element = dayCardTemplate.content.cloneNode(true);
        setValue("temp", day.maxTemp, { parent: element });
        setValue("date", DAY_FORMATTER.format(day.timestamp), {
            parent: element,
        });
        element.querySelector("[data-icon]").src = getIconUrl(day.iconCode);
        dailySection.append(element);
    });
}
const HOUR_FORMATTER = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "numeric",
});
const hourlySection = document.querySelector("[data-hour-section]");
const hourRowTemplate = document.getElementById("hour-row-template");
function renderHourlyWeather(hourly) {
    hourlySection.innerHTML = "";
    console.log(hourly);
    hourly.forEach((hour) => {
        const element = hourRowTemplate.content.cloneNode(true);
        setValue("temp", hour.temp, { parent: element });
        setValue("fl-temp", hour.feelsLike, { parent: element });
        setValue("wind", hour.windSpeed, { parent: element });
        setValue("precip", hour.precip, { parent: element });
        setValue("day", DAY_FORMATTER.format(hour.timestamp), {
            parent: element,
        });
        setValue("time", HOUR_FORMATTER.format(hour.timestamp), {
            parent: element,
        });
        element.querySelector("[data-icon]").src = getIconUrl(hour.iconCode);
        hourlySection.append(element);
    });
}
// ICON MAPPING
const ICON_MAP = new Map();

addMapping([0, 1], "Sun");
addMapping([2, 3, 45, 48], "cloud");
addMapping(
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82],
    "cloudheavyrain"
);
addMapping([71, 73, 75, 77, 85, 86], "snowflake");
addMapping([95, 96, 99], "storm");

function addMapping(values, icon) {
    values.forEach((value) => {
        ICON_MAP.set(value, icon);
    });
}

// !ICON MAPPING

// PARSING THE DATA
function parseCurrentWeather({ current_weather, daily }) {
    const {
        temperature: currentTemp,
        windspeed: windSpeed,
        weathercode: iconCode,
    } = current_weather;
    const {
        temperature_2m_max: [maxTemp],
        temperature_2m_min: [minTemp],
        apparent_temperature_max: [maxFeelsLike],
        apparent_temperature_min: [minFeelsLike],
        precipitation_sum: [precip],
    } = daily;

    return {
        currentTemp: Math.round(currentTemp),
        highTemp: Math.round(maxTemp),
        lowTemp: Math.round(minTemp),
        highFeelsLike: Math.round(maxFeelsLike),
        lowFeelsLike: Math.round(minFeelsLike),
        windSpeed: Math.round(windSpeed),
        precip: Math.round(precip * 100) / 100,
        iconCode,
    };
}

function parseDailyWeather({ daily }) {
    return daily.time.map((time, index) => {
        return {
            timestamp: time * 1000,
            iconCode: daily.weathercode[index],
            maxTemp: Math.round(daily.temperature_2m_max[index]),
        };
    });
}

function parseHourlyWeather({ hourly, current_weather }) {
    console.log(hourly);
    const kedves = hourly.time
        .map((time, index) => {
            return {
                timestamp: time * 1000,
                iconCode: hourly.weathercode[index],
                temp: Math.round(hourly.temperature_2m[index]),
                feelsLike: Math.round(hourly.apparent_temperature[index]),
                windSpeed: Math.round(hourly.windspeed_10m[index]),
                precip: Math.round(hourly.precipitation[index] * 100) / 100,
            };
        })
        .filter(({ timestamp }) => timestamp >= current_weather.time * 1000);
    console.log(kedves);
    console.log("current weather", current_weather);
    console.log(current_weather.time);
    return kedves;
}
