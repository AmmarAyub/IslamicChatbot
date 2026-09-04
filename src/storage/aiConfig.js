// /**
//  * aiConfig.js
//  * Handles Gemini API configuration and calls.
//  * Uses the `x-goog-api-key` header for authentication (required for `AQ.` keys).
//  */

// import AsyncStorage from '@react-native-async-storage/async-storage';

// const AI_CONFIG_KEY = 'gemini_ai_config_v3';

// const defaultConfig = {
//   apiKey: 'AQ.Ab8RN6KHoMDxI6dL_dvA7KM1QcXN7P1I0mIVZ149537Kuqz3Aw', // ❗ Replace with your own key in Settings, or set a default here
//   model: 'gemini-3.5-flash',
// };

// // ---- Core get/save ----
// async function getAiConfig() {
//   try {
//     const raw = await AsyncStorage.getItem(AI_CONFIG_KEY);
//     if (!raw) {
//       await AsyncStorage.setItem(AI_CONFIG_KEY, JSON.stringify(defaultConfig));
//       return defaultConfig;
//     }
//     const parsed = JSON.parse(raw);
//     return { ...defaultConfig, ...parsed };
//   } catch {
//     await AsyncStorage.setItem(AI_CONFIG_KEY, JSON.stringify(defaultConfig));
//     return defaultConfig;
//   }
// }

// async function saveAiConfig(config) {
//   const merged = { ...defaultConfig, ...config };
//   await AsyncStorage.setItem(AI_CONFIG_KEY, JSON.stringify(merged));
// }

// // ---- API key helpers (used by Settings) ----
// async function getGeminiApiKey() {
//   const config = await getAiConfig();
//   return config.apiKey || '';
// }

// async function setGeminiApiKey(apiKey) {
//   const config = await getAiConfig();
//   config.apiKey = apiKey;
//   await saveAiConfig(config);
// }

// // ---- Model helper ----
// async function setGeminiModel(model) {
//   const config = await getAiConfig();
//   config.model = model;
//   await saveAiConfig(config);
// }

// /**
//  * Core Gemini API call.
//  * Authentication: uses `x-goog-api-key` header.
//  */
// async function askGemini(question) {
//   const config = await getAiConfig();
//   if (!config.apiKey) {
//     throw new Error('Gemini API key not set. Please add your key in Settings.');
//   }

//   const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`;

//   const response = await fetch(url, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'x-goog-api-key': config.apiKey, // 🔑 KEY FIX
//     },
//     body: JSON.stringify({
//       contents: [{ parts: [{ text: question }] }],
//     }),
//   });

//   const data = await response.json();
//   if (!response.ok) {
//     console.error('Gemini API error:', data);
//     throw new Error(data.error?.message || 'Request failed');
//   }
//   return data.candidates[0].content.parts[0].text;
// }

// // Alias for Settings.js
// async function getGeminiResponse(question) {
//   return await askGemini(question);
// }

// // ---- Named exports ----
// export {
//   getAiConfig,
//   saveAiConfig,
//   getGeminiApiKey,
//   setGeminiApiKey,
//   setGeminiModel,
//   askGemini,
//   getGeminiResponse,
// };

// // Default export for compatibility
// const aiConfig = {
//   getAiConfig,
//   saveAiConfig,
//   setGeminiApiKey,
//   setGeminiModel,
//   askGemini,
//   getGeminiResponse,
// };
// export default aiConfig;




/**
 * aiConfig.js – Gemini API configuration
 * Uses x-goog-api-key header (required for keys starting with AQ.)
 * Validates model name, defaults to gemini-1.5-flash
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const AI_CONFIG_KEY = 'gemini_ai_config_v3';
const DEFAULT_MODEL = 'gemini-3.5-flash';
const VALID_MODELS = ['gemini-3.5-flash', 'gemini-3.5-pro', 'gemini-3.0-pro'];
const DEFAULT_API_KEY = 'AQ.Ab8RN6KHoMDxI6dL_dvA7KM1QcXN7P1I0mIVZ149537Kuqz3Aw'; // ❗ Replace with your own key in Settings, or set a default here

const defaultConfig = { apiKey: DEFAULT_API_KEY, model: DEFAULT_MODEL };

// ---- Core ----
export async function getAiConfig() {
  try {
    const raw = await AsyncStorage.getItem(AI_CONFIG_KEY);
    if (!raw) {
      await AsyncStorage.setItem(AI_CONFIG_KEY, JSON.stringify(defaultConfig));
      return defaultConfig;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.model || !VALID_MODELS.includes(parsed.model)) {
      parsed.model = DEFAULT_MODEL;
      await AsyncStorage.setItem(AI_CONFIG_KEY, JSON.stringify({ ...defaultConfig, ...parsed }));
    }
    return { ...defaultConfig, ...parsed };
  } catch {
    await AsyncStorage.setItem(AI_CONFIG_KEY, JSON.stringify(defaultConfig));
    return defaultConfig;
  }
}

export async function saveAiConfig(config) {
  const merged = { ...defaultConfig, ...config };
  if (!merged.model || !VALID_MODELS.includes(merged.model)) merged.model = DEFAULT_MODEL;
  await AsyncStorage.setItem(AI_CONFIG_KEY, JSON.stringify(merged));
}

// ---- Helpers for Settings ----
export async function getGeminiApiKey() {
  const config = await getAiConfig();
  return config.apiKey || '';
}

export async function setGeminiApiKey(apiKey) {
  const config = await getAiConfig();
  config.apiKey = apiKey;
  await saveAiConfig(config);
}

export async function setGeminiModel(model) {
  if (!VALID_MODELS.includes(model)) {
    throw new Error(`Invalid model. Use: ${VALID_MODELS.join(', ')}`);
  }
  const config = await getAiConfig();
  config.model = model;
  await saveAiConfig(config);
}

// ---- API call ----
export async function askGemini(question) {
  const config = await getAiConfig();
  if (!config.apiKey) throw new Error('Gemini API key not set.');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': config.apiKey,
    },
    body: JSON.stringify({ contents: [{ parts: [{ text: question }] }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Request failed');
  return data.candidates[0].content.parts[0].text;
}

// Alias for Settings
export async function getGeminiResponse(question) {
  return await askGemini(question);
}

export default {
  getAiConfig,
  saveAiConfig,
  setGeminiApiKey,
  setGeminiModel,
  askGemini,
  getGeminiResponse,
};