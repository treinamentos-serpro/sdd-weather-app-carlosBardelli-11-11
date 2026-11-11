import { expect, type Page, test } from '@playwright/test';

const geocodingRoute = /https:\/\/geocoding-api\.open-meteo\.com\/v1\/search\?/;
const forecastRoute = /https:\/\/api\.open-meteo\.com\/v1\/forecast\?/;

const city = {
  id: 1,
  name: 'São Paulo',
  latitude: -23.55,
  longitude: -46.63,
  country_code: 'BR',
  country: 'Brasil',
  admin1: 'São Paulo',
  timezone: 'America/Sao_Paulo',
};

const forecast = {
  timezone: 'America/Sao_Paulo',
  current: {
    time: '2026-11-11T12:00',
    temperature_2m: 0,
    relative_humidity_2m: 60,
    precipitation: 0,
    weather_code: 0,
    wind_speed_10m: 10,
    surface_pressure: 1012,
  },
  daily: {
    time: ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'],
    temperature_2m_min: [-2, -1, 0, 1, 2],
    temperature_2m_max: [4, 5, 6, 7, 8],
    weather_code: [0, 1, 2, 3, 61],
    precipitation_sum: [0, 0, 0, 0, 2],
    precipitation_probability_max: [0, 5, 10, 15, 80],
  },
};

async function mockSuccessfulWeather(page: Page) {
  let forecastRequestCount = 0;
  await page.route(geocodingRoute, (route) => route.fulfill({ json: { results: [city] } }));
  await page.route(forecastRoute, (route) => {
    forecastRequestCount += 1;
    return route.fulfill({ json: forecast });
  });
  return () => forecastRequestCount;
}

async function searchForCity(page: Page) {
  await page.goto('/');
  await page.getByLabel('Cidade').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();
}

test('busca uma cidade, mostra a previsão e converte a temperatura', async ({ page }) => {
  const getForecastRequestCount = await mockSuccessfulWeather(page);
  await searchForCity(page);

  await expect(page.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeVisible();
  await expect(page.getByText('0°C', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Fahrenheit' }).click();

  await expect(page.getByText('32°F', { exact: true })).toBeVisible();
  expect(getForecastRequestCount()).toBe(1);
  await expect(page.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('exibe erro e retry recupera uma falha temporária do forecast', async ({ page }) => {
  let forecastRequestCount = 0;
  await page.route(geocodingRoute, (route) => route.fulfill({ json: { results: [city] } }));
  await page.route(forecastRoute, (route) => {
    forecastRequestCount += 1;
    return forecastRequestCount === 1
      ? route.fulfill({ status: 503, json: { error: 'temporarily unavailable' } })
      : route.fulfill({ json: forecast });
  });
  await searchForCity(page);

  await expect(page.getByRole('alert')).toContainText('Não foi possível buscar o clima');
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeVisible();
  expect(forecastRequestCount).toBe(2);
});

test('mostra o estado vazio quando o geocoding não retorna results', async ({ page }) => {
  let forecastRequestCount = 0;
  await page.route(geocodingRoute, (route) => route.fulfill({ json: {} }));
  await page.route(forecastRoute, (route) => {
    forecastRequestCount += 1;
    return route.fulfill({ json: forecast });
  });
  await searchForCity(page);

  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
  expect(forecastRequestCount).toBe(0);
});

test('renderiza o fluxo principal em viewport mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockSuccessfulWeather(page);
  await searchForCity(page);

  await expect(page.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeVisible();
  await expect(page.getByText('Hoje', { exact: true })).toBeVisible();
  await expect(page.getByText('Amanhã', { exact: true })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
});
