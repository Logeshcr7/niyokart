import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import type { PhoneSpecs } from '../src/data/phones.ts';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in the server environment.');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export interface AIExtractionRequest {
  imageBase64: string; // Base64 data (without or with data:image/png;base64, prefix)
  imageMimeType?: string;
  optionalHint?: string; // e.g. Phone name, brand, or retail URL
}

const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

export async function extractPhoneFromImage(req: AIExtractionRequest): Promise<{
  phone: PhoneSpecs;
  savedImageUrl: string;
}> {
  const ai = getAIClient();

  // 1. Prepare and normalize the base64 image data
  let mimeType = req.imageMimeType || 'image/jpeg';
  let rawBase64 = req.imageBase64;

  if (rawBase64.includes(';base64,')) {
    const parts = rawBase64.split(';base64,');
    const mimeMatch = parts[0].match(/data:(.*?)$/);
    if (mimeMatch && mimeMatch[1]) {
      mimeType = mimeMatch[1];
    }
    rawBase64 = parts[1];
  }

  // 2. Determine file extension
  let extension = 'jpg';
  if (mimeType.includes('png')) extension = 'png';
  else if (mimeType.includes('webp')) extension = 'webp';

  // 3. Craft Gemini prompt with strong instructions
  const prompt = `
You are an expert smartphone analyst and hardware database specialist.
Analyze this attached smartphone image (it could be a real phone photograph, retail brochure, e-commerce screenshot from Flipkart/Amazon/Mi/Samsung/Motorola, promotional advertisement, or device specification sheet).

User Hint / Context: ${req.optionalHint ? `"${req.optionalHint}"` : 'None provided. Auto-detect everything accurately from the image.'}

Task:
1. Examine the image carefully. Read any visible text, watermarks, screen labels, processor logos, battery badges (e.g. 7000mAh, Dimensity 6400, Snapdragon, 50MP Quad Pixel, Gorilla Glass, MIL-STD certifications, etc.).
2. Accurately identify the exact smartphone brand, model name, and series (e.g., "Motorola Moto G37 Power", "Samsung Galaxy S25 Ultra", "Realme 13 Pro+", "Xiaomi 15", etc.).
3. Retrieve and complete the comprehensive real-world technical specifications, pricing in Indian Rupees (₹ INR), launch year, processor details, camera cluster, battery specifications, and calculate 5 algorithm benchmark scores (0-100 each).
4. Output STRICTLY a JSON object matching this schema (do NOT wrap with markdown other than \`\`\`json if needed, no conversational text):

{
  "id": "slug-name-lowercase-hyphenated",
  "name": "Full Official Smartphone Name",
  "brand": "Brand Name (e.g. Samsung, Motorola, Apple, Xiaomi, OnePlus, Realme, Vivo, iQOO, etc.)",
  "price": 14999,
  "originalPrice": 18999,
  "discountPercent": 21,
  "rating": 4.6,
  "ratingCount": 1850,
  "category": "deal",
  "releaseYear": 2025,
  "tagline": "Punchy 1-sentence highlight of the biggest USP (e.g. 7000mAh Battery • Dimensity 6400 5G • Gorilla Glass 7i)",
  "badge": "Short badge (e.g. 7000mAh MONSTER, AI FLAGSHIP, 120W CHARGE)",
  "storeSource": "Verified Store (e.g. Motorola India / Flipkart, Amazon India, Samsung Direct)",
  "scores": {
    "performance": 85,
    "camera": 86,
    "battery": 98,
    "display": 87,
    "value": 94
  },
  "details": {
    "processor": "Processor Name with fabrication (e.g. MediaTek Dimensity 6400 5G 6nm)",
    "antutuScore": 485000,
    "geekbenchSingle": 780,
    "geekbenchMulti": 2150,
    "gpuScore": "GPU model name (e.g. ARM Mali-G57 MC2)",
    "ram": "e.g. 8GB / 12GB LPDDR4X (Up to 16GB RAM Boost)",
    "storage": "e.g. 128GB / 256GB UFS 2.2",
    "displayType": "e.g. 6.72 inch 120Hz IPS FHD+ Punch-Hole Display",
    "screenSize": "e.g. 6.72 inches",
    "resolution": "e.g. 2400 x 1080 pixels (FHD+)",
    "refreshRate": "e.g. 120Hz Fluid Adaptive",
    "peakBrightness": "e.g. 1,050 nits (Gorilla Glass 7i)",
    "mainCamera": "e.g. 50 MP Quad Pixel AI Camera, f/1.8, PDAF, Night Vision",
    "telephotoCamera": "e.g. 2 MP Portrait Depth sensor or 50MP Periscope (or 'None')",
    "ultrawideCamera": "e.g. 8 MP Ultra-Wide 118˚ + Macro Vision (or 'None')",
    "selfieCamera": "e.g. 16 MP, f/2.45, Auto Beauty",
    "videoResolution": "e.g. 1080p @ 60fps EIS or 4K @ 60fps",
    "batteryCapacity": "e.g. 7,000 mAh (Segment Best)",
    "wiredCharging": "e.g. 33W TurboPower Fast Charging",
    "wirelessCharging": "e.g. 15W Qi Wireless or 'Not Supported'",
    "batteryLifeHours": 25.5,
    "os": "e.g. Hello UI based on Android 14",
    "updateSupportYears": 3,
    "weight": "e.g. 215 g",
    "dimensions": "e.g. 166.2 x 76.5 x 8.8 mm",
    "ipRating": "e.g. MIL-STD 810H & IP54 Water-Repellent",
    "colors": ["Primary Color (Finish)", "Secondary Color", "Tertiary Color"]
  },
  "highlights": [
    "Highlight 1: Primary USP",
    "Highlight 2: Processor and 5G performance",
    "Highlight 3: Durability or Display",
    "Highlight 4: Camera capabilities",
    "Highlight 5: Battery life and charging speed"
  ]
}
`;

  let lastError: any = null;
  let text = '';

  // Try candidate models with retry
  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: rawBase64,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
        });

        text = response.text ? response.text.trim() : '';
        if (text) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} attempt ${attempt + 1} failed: ${err?.message || err}`);
        // Wait 1.5s before retry
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
    if (text) break;
  }

  if (!text) {
    throw new Error(
      `AI Vision Extraction temporarily unavailable (${lastError?.message || 'High demand'}). Please try again in a few moments.`
    );
  }

  // 5. Parse JSON from response
  let jsonString = text;
  if (jsonString.includes('```json')) {
    jsonString = jsonString.split('```json')[1].split('```')[0].trim();
  } else if (jsonString.includes('```')) {
    jsonString = jsonString.split('```')[1].split('```')[0].trim();
  }

  const parsed = JSON.parse(jsonString);

  // Generate safe id
  const safeId = (parsed.id || parsed.name || 'phone')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `phone-${Date.now()}`;
  parsed.id = safeId;

  // 6. Save image to disk under /public/images/uploads/
  const uploadsDir = path.join(process.cwd(), 'public', 'images', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = `${safeId}-${Date.now()}.${extension}`;
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, Buffer.from(rawBase64, 'base64'));

  const savedImageUrl = `/images/uploads/${filename}`;
  parsed.image = savedImageUrl;

  return {
    phone: parsed as PhoneSpecs,
    savedImageUrl,
  };
}
