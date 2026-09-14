import AsyncStorage from '@react-native-async-storage/async-storage';

const AI_CONFIG_KEY = 'gemini_ai_config_v3';
const DEFAULT_MODEL = 'gemini-3.6-flash';
const VALID_MODELS = [DEFAULT_MODEL];
const defaultConfig = { apiKey: '', model: DEFAULT_MODEL };

export async function getAiConfig() {
  try {
    const raw = await AsyncStorage.getItem(AI_CONFIG_KEY);
    if (!raw) return defaultConfig;

    const parsed = JSON.parse(raw);
    const config = { ...defaultConfig, ...parsed };
    // Migrate all legacy GenerateContent models to the current Interactions model.
    if (!VALID_MODELS.includes(config.model)) config.model = DEFAULT_MODEL;
    return config;
  } catch {
    return defaultConfig;
  }
}

export async function saveAiConfig(config) {
  const merged = { ...defaultConfig, ...config };
  if (!VALID_MODELS.includes(merged.model)) merged.model = DEFAULT_MODEL;
  await AsyncStorage.setItem(AI_CONFIG_KEY, JSON.stringify(merged));
}

export async function getGeminiApiKey() {
  const config = await getAiConfig();
  return config.apiKey || '';
}

export async function setGeminiApiKey(apiKey) {
  const config = await getAiConfig();
  await saveAiConfig({ ...config, apiKey: apiKey.trim() });
}

export async function setGeminiModel(model) {
  if (!VALID_MODELS.includes(model)) {
    throw new Error(`Invalid model. Use: ${VALID_MODELS.join(', ')}`);
  }
  const config = await getAiConfig();
  await saveAiConfig({ ...config, model });
}

const getResponseText = data => data?.candidates?.[0]?.content?.parts
    ?.map(part => part.text || '')
    .join('')
    .trim();

export async function createGeminiInteraction(input, previousInteractionId) {
  const config = await getAiConfig();
  if (!config.apiKey) {
    throw new Error('Gemini API key not set. Add and test your own key in Settings.');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: input }] }],
      }),
    }
  );

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Gemini returned an unreadable response. Please try again.');
  }

  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini request failed (${response.status}).`);
  }

  const answer = getResponseText(data);

  if (!answer) {
    throw new Error('Gemini did not return a text response. Please try again.');
  }

  return { text: answer, interactionId: null };
}

export async function askGemini(question) {
  const interaction = await createGeminiInteraction(question);
  return interaction.text;
}

export async function getGeminiResponse(question) {
  return askGemini(question);
}

export default {
  getAiConfig,
  saveAiConfig,
  getGeminiApiKey,
  setGeminiApiKey,
  setGeminiModel,
  createGeminiInteraction,
  askGemini,
  getGeminiResponse,
};
