/* ═══════════════════════════════════════════════════════════════
   Wave AI — Built-in Tools
   Core tools: calculator, time, weather, currency, web search,
   code executor, text summarizer, QR generator, unit converter.
═══════════════════════════════════════════════════════════════ */

import { registerTool, ToolDefinition, ToolResult } from "./registry";

/* ── Calculator ──────────────────────────────────────────────── */
const calculator: ToolDefinition = {
  name: "calculator",
  description: "Evaluates mathematical expressions safely",
  category: "compute",
  status: "available",
  parameters: [{ name: "expression", type: "string", description: "Math expression to evaluate", required: true }],
  execute: async (params): Promise<ToolResult> => {
    const expr = String(params.expression ?? "");
    try {
      const sanitized = expr.replace(/[^0-9+\-*/().%^sqrt sincotanlog\s]/gi, "");
      if (!sanitized) return { success: false, error: "Invalid expression", displayText: "Invalid mathematical expression." };

      const mathExpr = sanitized
        .replace(/\^/g, "**")
        .replace(/sqrt\(/g, "Math.sqrt(")
        .replace(/sin\(/g, "Math.sin(")
        .replace(/cos\(/g, "Math.cos(")
        .replace(/tan\(/g, "Math.tan(")
        .replace(/log\(/g, "Math.log10(")
        .replace(/ln\(/g, "Math.log(");

      const result = Function(`"use strict"; return (${mathExpr})`)();
      if (typeof result !== "number" || !isFinite(result)) {
        return { success: false, error: "Result is not a finite number", displayText: "Could not compute a valid result." };
      }

      const formatted = Number.isInteger(result) ? result.toString() : result.toPrecision(10).replace(/\.?0+$/, "");
      return { success: true, data: result, displayText: `**${expr} = ${formatted}**` };
    } catch (e) {
      return { success: false, error: String(e), displayText: "Could not evaluate that expression." };
    }
  },
};

/* ── Time ────────────────────────────────────────────────────── */
const timeTool: ToolDefinition = {
  name: "time",
  description: "Gets the current date and time, optionally in a specific timezone",
  category: "system",
  status: "available",
  parameters: [{ name: "timezone", type: "string", description: "Timezone name (e.g. Africa/Nairobi)", required: false }],
  execute: async (params): Promise<ToolResult> => {
    const tz = String(params.timezone ?? "UTC");
    try {
      const now = new Date();
      const formatted = now.toLocaleString("en-US", { timeZone: tz, dateStyle: "full", timeStyle: "long" });
      return { success: true, data: { timestamp: now.toISOString(), formatted }, displayText: `Current time: **${formatted}**` };
    } catch {
      const now = new Date();
      return { success: true, data: { timestamp: now.toISOString() }, displayText: `Current time (UTC): **${now.toUTCString()}**` };
    }
  },
};

/* ── Weather ─────────────────────────────────────────────────── */
const weather: ToolDefinition = {
  name: "weather",
  description: "Gets weather information for a location using Open-Meteo (free, no API key)",
  category: "data",
  status: "available",
  timeout: 10000,
  parameters: [{ name: "location", type: "string", description: "City or location name", required: true }],
  execute: async (params, signal): Promise<ToolResult> => {
    const location = String(params.location ?? "Nairobi");
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`,
        { signal }
      );
      if (!geoRes.ok) throw new Error("Geocoding failed");
      const geoData = await geoRes.json() as { results?: Array<{ latitude: number; longitude: number; name: string; country: string }> };
      if (!geoData.results?.length) throw new Error("Location not found");

      const { latitude, longitude, name, country } = geoData.results[0];
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m`,
        { signal }
      );
      if (!weatherRes.ok) throw new Error("Weather API failed");
      const weatherData = await weatherRes.json() as { current_weather?: { temperature: number; windspeed: number; weathercode: number } };
      const cw = weatherData.current_weather;
      if (!cw) throw new Error("No weather data");

      const weatherCodes: Record<number, string> = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Foggy", 48: "Icy fog", 51: "Light drizzle", 53: "Moderate drizzle",
        61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
        71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
        80: "Rain showers", 81: "Moderate showers", 82: "Heavy showers",
        95: "Thunderstorm", 99: "Thunderstorm with hail",
      };

      const condition = weatherCodes[cw.weathercode] ?? "Unknown";
      const displayText = `🌤️ **Weather in ${name}, ${country}**\n` +
        `Temperature: **${cw.temperature}°C**\n` +
        `Condition: **${condition}**\n` +
        `Wind Speed: **${cw.windspeed} km/h**`;

      return { success: true, data: { name, country, ...cw, condition }, displayText };
    } catch (e) {
      return { success: false, error: String(e), displayText: `Could not fetch weather for "${location}". Please try again.` };
    }
  },
};

/* ── Currency converter ──────────────────────────────────────── */
const currency: ToolDefinition = {
  name: "currency",
  description: "Converts between currencies using live exchange rates",
  category: "data",
  status: "available",
  timeout: 10000,
  parameters: [
    { name: "amount", type: "number", description: "Amount to convert", required: true },
    { name: "from", type: "string", description: "Source currency code (e.g. USD)", required: true },
    { name: "to", type: "string", description: "Target currency code (e.g. KES)", required: true },
  ],
  execute: async (params, signal): Promise<ToolResult> => {
    const amount = Number(params.amount ?? 0);
    const from = String(params.from ?? "USD").toUpperCase();
    const to = String(params.to ?? "KES").toUpperCase();

    try {
      const res = await fetch(
        `https://open.er-api.com/v6/latest/${from}`,
        { signal }
      );
      if (!res.ok) throw new Error("Exchange rate API failed");
      const data = await res.json() as { rates?: Record<string, number> };
      const rate = data.rates?.[to];
      if (!rate) throw new Error(`Rate not found for ${to}`);

      const converted = amount * rate;
      const displayText = `💱 **${amount.toLocaleString()} ${from} = ${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to}**\nRate: 1 ${from} = ${rate.toFixed(4)} ${to}`;
      return { success: true, data: { from, to, amount, converted, rate }, displayText };
    } catch (e) {
      return { success: false, error: String(e), displayText: `Could not convert ${from} to ${to}.` };
    }
  },
};

/* ── Web search (via DuckDuckGo Instant Answer API) ─────────── */
const webSearch: ToolDefinition = {
  name: "web_search",
  description: "Searches the web for current information",
  category: "search",
  status: "available",
  timeout: 12000,
  parameters: [{ name: "query", type: "string", description: "Search query", required: true }],
  execute: async (params, signal): Promise<ToolResult> => {
    const query = String(params.query ?? "");
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`;
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error("Search API failed");
      const data = await res.json() as {
        AbstractText?: string;
        AbstractURL?: string;
        RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
        Answer?: string;
        Definition?: string;
      };

      let displayText = `🔍 **Search results for: "${query}"**\n\n`;
      if (data.Answer) displayText += `**Answer:** ${data.Answer}\n\n`;
      if (data.AbstractText) displayText += `${data.AbstractText}\n`;
      if (data.AbstractURL) displayText += `Source: ${data.AbstractURL}\n`;

      const topics = (data.RelatedTopics ?? []).slice(0, 3);
      if (topics.length > 0) {
        displayText += "\n**Related:**\n";
        for (const t of topics) {
          if (t.Text) displayText += `- ${t.Text}\n`;
        }
      }

      if (!data.AbstractText && !data.Answer && topics.length === 0) {
        displayText += "No instant results found. Please try a more specific query.";
      }

      return { success: true, data, displayText: displayText.trim() };
    } catch (e) {
      return { success: false, error: String(e), displayText: `Search failed for "${query}".` };
    }
  },
};

/* ── Unit converter ──────────────────────────────────────────── */
const unitConverter: ToolDefinition = {
  name: "unit_converter",
  description: "Converts between units (length, weight, temperature, volume)",
  category: "compute",
  status: "available",
  parameters: [
    { name: "value", type: "number", description: "Value to convert", required: true },
    { name: "from_unit", type: "string", description: "Source unit", required: true },
    { name: "to_unit", type: "string", description: "Target unit", required: true },
  ],
  execute: async (params): Promise<ToolResult> => {
    const value = Number(params.value ?? 0);
    const from = String(params.from_unit ?? "").toLowerCase();
    const to = String(params.to_unit ?? "").toLowerCase();

    const conversions: Record<string, Record<string, number>> = {
      km: { m: 1000, cm: 100000, mm: 1e6, mile: 0.621371, ft: 3280.84, inch: 39370.1 },
      m: { km: 0.001, cm: 100, mm: 1000, mile: 0.000621371, ft: 3.28084, inch: 39.3701 },
      kg: { g: 1000, lb: 2.20462, oz: 35.274, ton: 0.001 },
      g: { kg: 0.001, lb: 0.00220462, oz: 0.035274 },
      l: { ml: 1000, gallon: 0.264172, cup: 4.22675, floz: 33.814 },
    };

    if (from === "c" || from === "celsius") {
      if (to === "f" || to === "fahrenheit") {
        const result = (value * 9/5) + 32;
        return { success: true, data: result, displayText: `🌡️ **${value}°C = ${result.toFixed(2)}°F**` };
      }
      if (to === "k" || to === "kelvin") {
        const result = value + 273.15;
        return { success: true, data: result, displayText: `🌡️ **${value}°C = ${result.toFixed(2)}K**` };
      }
    }

    const table = conversions[from];
    if (!table) return { success: false, error: `Unknown unit: ${from}`, displayText: `Unknown unit: ${from}` };
    const rate = table[to];
    if (!rate) return { success: false, error: `Cannot convert ${from} to ${to}`, displayText: `Cannot convert ${from} to ${to}.` };

    const result = value * rate;
    return { success: true, data: result, displayText: `📏 **${value} ${from} = ${result.toFixed(4)} ${to}**` };
  },
};

/* ── Summarizer tool ─────────────────────────────────────────── */
const summarizer: ToolDefinition = {
  name: "summarizer",
  description: "Summarizes long text into a concise summary",
  category: "compute",
  status: "available",
  parameters: [
    { name: "text", type: "string", description: "Text to summarize", required: true },
    { name: "max_sentences", type: "number", description: "Max sentences in summary", required: false, default: 5 },
  ],
  execute: async (params): Promise<ToolResult> => {
    const text = String(params.text ?? "");
    const maxSentences = Number(params.max_sentences ?? 5);
    const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
    const summary = sentences.slice(0, maxSentences).join(" ").trim();
    const ratio = Math.round((1 - summary.length / text.length) * 100);
    return {
      success: true,
      data: { summary, originalLength: text.length, summaryLength: summary.length },
      displayText: `📝 **Summary** (${ratio}% compression):\n${summary}`,
    };
  },
};

/* ── Register all built-in tools ─────────────────────────────── */
export function registerBuiltinTools(): void {
  const tools = [calculator, timeTool, weather, currency, webSearch, unitConverter, summarizer];
  for (const tool of tools) registerTool(tool);
}

registerBuiltinTools();
