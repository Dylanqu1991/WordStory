import { GoogleGenAI, Type } from "@google/genai";
import type { WordDetails, ExampleSentence } from '../types';

// Initialize the Gemini client. The API key is handled by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the schema for a single dictionary entry.
const wordDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        word: {
            type: Type.STRING,
            description: "The English word being defined, in lowercase.",
        },
        phonetic: {
            type: Type.STRING,
            description: "The IPA phonetic transcription, e.g., /ɡriːf/.",
        },
        definitions: {
            type: Type.ARRAY,
            description: "A list of definitions for the word.",
            items: {
                type: Type.OBJECT,
                properties: {
                    partOfSpeech: {
                        type: Type.STRING,
                        description: "The part of speech, e.g., 'n.', 'v.', 'adj.'.",
                    },
                    meaning: {
                        type: Type.STRING,
                        description: "The definition of the word in Standard Simplified Chinese.",
                    },
                },
                required: ["partOfSpeech", "meaning"],
            },
        },
        examples: {
            type: Type.ARRAY,
            description: "One or two example sentences, each with an English version and its Chinese translation.",
            items: {
                type: Type.OBJECT,
                properties: {
                    english: {
                        type: Type.STRING,
                        description: "The example sentence in English."
                    },
                    chinese: {
                        type: Type.STRING,
                        description: "The Chinese translation of the example sentence."
                    }
                },
                required: ["english", "chinese"],
            },
        },
    },
    required: ["word", "phonetic", "definitions", "examples"],
};

// Define the schema for the batch response, which is an array of the above schema.
const batchWordDetailsSchema = {
    type: Type.ARRAY,
    items: wordDetailsSchema,
};


/**
 * Fetches high-quality word details for multiple words in a single batch request
 * using the Gemini AI model. This is far more efficient than one request per word.
 * @param words An array of words to look up.
 * @returns A promise that resolves with a dictionary mapping each word to its details.
 */
export const fetchMultipleWordDetailsFromApi = async (words: string[]): Promise<Record<string, WordDetails>> => {
  if (words.length === 0) {
    return {};
  }

  const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))];
  const wordsString = uniqueWords.join(', ');

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `For each of the following English words: [${wordsString}], provide a comprehensive, general-purpose dictionary entry suitable for a language learner. The primary goal is to cover ALL common definitions for each word across different parts of speech, ensuring the entry is thorough for vocabulary study. It is crucial that the definitions are not limited to a specific story or context. Each entry must be a JSON object and include: the word's phonetic transcription (IPA), a complete list of its common definitions in Standard Simplified Chinese (each with its part of speech), and one or two clear example sentences. Each example sentence must have both an English version and its corresponding Standard Simplified Chinese translation.`,
        config: {
            systemInstruction: "You are a professional lexicographer compiling a comprehensive English-to-Chinese dictionary for advanced learners. Your task is to provide dictionary entries that are accurate, thorough, and cover the most frequent meanings and uses of a word. Do not tailor the definitions to any specific context. All Chinese text must be Standard Simplified Chinese.",
            responseMimeType: "application/json",
            responseSchema: batchWordDetailsSchema,
        },
    });
    
    const jsonText = response.text.trim();
    const detailsArray: WordDetails[] = JSON.parse(jsonText);

    // Convert the array of details into a dictionary (Record<string, WordDetails>)
    // for easy look-up and state merging.
    const detailsMap: Record<string, WordDetails> = {};
    for (const detail of detailsArray) {
      // Defensive check: The AI might return nulls or malformed objects in the array.
      if (detail && detail.word) {
        detailsMap[detail.word.toLowerCase()] = detail;
      }
    }
    
    // Ensure all requested words are present in the map, even if the API failed to return them
    // This helps the review screen show which words failed.
    uniqueWords.forEach(word => {
        if (!detailsMap[word]) {
            detailsMap[word] = {
                word: word,
                phonetic: "",
                definitions: [],
                examples: []
            };
        }
    });

    return detailsMap;

  } catch (error) {
    console.error(`Gemini API Batch Error for words "${wordsString}":`, error);
    throw new Error(`Could not generate definitions for the provided words using the AI model.`);
  }
};