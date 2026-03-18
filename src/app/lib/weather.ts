import type { WeatherMood, WeatherSnapshot } from "../types";

const fallbackLocation = {
  city: "Москва",
  latitude: 55.7558,
  longitude: 37.6173,
};

const weatherCodeMap: Record<number, { condition: string; mood: WeatherMood; advice: string }> = {
  0: { condition: "Ясно", mood: "clear", advice: "Можно собрать более легкий образ с акцентом на аксессуары." },
  1: { condition: "Преимущественно ясно", mood: "clear", advice: "Подойдет легкий верх и структурный слой на вечер." },
  2: { condition: "Переменная облачность", mood: "clouds", advice: "Лучше добавить второй слой и закрытую обувь." },
  3: { condition: "Пасмурно", mood: "clouds", advice: "Сделай ставку на многослойность и плотные ткани." },
  45: { condition: "Туман", mood: "clouds", advice: "Выбирай спокойные фактуры и верхний слой от сырости." },
  48: { condition: "Иней", mood: "clouds", advice: "Нужны теплые слои и обувь с плотной подошвой." },
  51: { condition: "Легкая морось", mood: "rain", advice: "Добавь водостойкую верхнюю одежду и закрытую обувь." },
  53: { condition: "Морось", mood: "rain", advice: "Нужны водостойкие материалы и собранный силуэт." },
  55: { condition: "Сильная морось", mood: "rain", advice: "Делай ставку на водостойкий верх и кожаную обувь." },
  61: { condition: "Небольшой дождь", mood: "rain", advice: "Хорошо сработают тренч, ботинки и плотный низ." },
  63: { condition: "Дождь", mood: "rain", advice: "Лучше выбирать закрытую обувь и верхний слой с защитой." },
  65: { condition: "Сильный дождь", mood: "rain", advice: "Собирай образ вокруг дождезащитной верхней одежды." },
  71: { condition: "Небольшой снег", mood: "snow", advice: "Нужен теплый внешний слой, плотная обувь и аксессуары." },
  73: { condition: "Снег", mood: "snow", advice: "Добавь теплоемкие материалы и закрытую обувь." },
  75: { condition: "Сильный снег", mood: "snow", advice: "Собирай максимально теплый и закрытый комплект." },
  80: { condition: "Ливень", mood: "rain", advice: "Нужны ботинки, водостойкий верх и минимум открытых слоев." },
  95: { condition: "Гроза", mood: "rain", advice: "Собери безопасный закрытый образ с защитой от дождя и ветра." },
};

function roundWeather(value: number) {
  return Math.round(value);
}

function getWeatherDescriptor(code: number) {
  return weatherCodeMap[code] ?? weatherCodeMap[2];
}

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Геолокация недоступна"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 7000,
      maximumAge: 1000 * 60 * 10,
    });
  });
}

async function resolveCity(latitude: number, longitude: number) {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=ru&format=json`,
  );

  if (!response.ok) {
    throw new Error("Не удалось определить город");
  }

  const payload = await response.json();
  return payload.results?.[0]?.city ?? payload.results?.[0]?.name ?? fallbackLocation.city;
}

async function fetchForecast(latitude: number, longitude: number) {
  const response = await fetch(
    [
      "https://api.open-meteo.com/v1/forecast",
      `?latitude=${latitude}`,
      `&longitude=${longitude}`,
      "&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
      "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      "&forecast_days=1",
      "&timezone=auto",
    ].join(""),
  );

  if (!response.ok) {
    throw new Error("Не удалось загрузить погоду");
  }

  return response.json();
}

export function createFallbackWeather(): WeatherSnapshot {
  return {
    city: fallbackLocation.city,
    latitude: fallbackLocation.latitude,
    longitude: fallbackLocation.longitude,
    temperature: 8,
    apparentTemperature: 5,
    tempMax: 11,
    tempMin: 3,
    windSpeed: 6,
    precipitationProbability: 25,
    condition: "Переменная облачность",
    mood: "clouds",
    advice: "Добавь второй слой и закрытую обувь.",
    fetchedAt: new Date().toISOString(),
    source: "fallback",
  };
}

export async function getWeatherForCurrentLocation(): Promise<WeatherSnapshot> {
  try {
    const position = await getCurrentPosition();
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const [city, forecast] = await Promise.all([
      resolveCity(latitude, longitude),
      fetchForecast(latitude, longitude),
    ]);
    const descriptor = getWeatherDescriptor(forecast.current.weather_code);

    return {
      city,
      latitude,
      longitude,
      temperature: roundWeather(forecast.current.temperature_2m),
      apparentTemperature: roundWeather(forecast.current.apparent_temperature),
      tempMax: roundWeather(forecast.daily.temperature_2m_max[0]),
      tempMin: roundWeather(forecast.daily.temperature_2m_min[0]),
      windSpeed: roundWeather(forecast.current.wind_speed_10m),
      precipitationProbability: roundWeather(
        forecast.daily.precipitation_probability_max[0],
      ),
      condition: descriptor.condition,
      mood: descriptor.mood,
      advice: descriptor.advice,
      fetchedAt: new Date().toISOString(),
      source: "live",
    };
  } catch (error) {
    console.error("weather:error", error);
    return createFallbackWeather();
  }
}
