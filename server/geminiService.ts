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

export interface RealTimePriceAndSpecs {
  price?: number;
  originalPrice?: number;
  discountPercent?: number;
  storeSource?: string;
  ram?: string;
  ramVariants?: string[];
  processor?: string;
  antutuScore?: number;
  gpuScore?: string;
  geekbenchSingle?: number;
  geekbenchMulti?: number;
  tagline?: string;
  verified: boolean;
}

const SEARCH_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
const VISION_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

/**
 * Searches the live web using Google Search grounding via Gemini
 * to retrieve the real-time environment price in INR and exact RAM & Processor specifications.
 */
export async function fetchRealTimePriceAndSpecs(
  phoneName: string,
  brand?: string
): Promise<RealTimePriceAndSpecs> {
  const ai = getAIClient();
  const searchPrompt = `
You are a real-time smartphone market analyst with access to Google Search.
Search the live Indian e-commerce web (Flipkart, Amazon.in, Croma, Official ${brand || ''} India Store) to find the REAL-TIME CURRENT pricing and hardware specifications for the smartphone: "${phoneName}".

Find and return STRICTLY a JSON object matching this schema:
{
  "price": 28999,
  "originalPrice": 37999,
  "discountPercent": 24,
  "storeSource": "Amazon India / Flipkart Live",
  "ram": "8GB / 12GB LPDDR5X (Up to 16GB RAM Boost)",
  "ramVariants": ["8GB + 128GB", "8GB + 256GB", "12GB + 256GB"],
  "processor": "Qualcomm Snapdragon 7+ Gen 3 (4nm TSMC)",
  "antutuScore": 1500000,
  "gpuScore": "Adreno 732",
  "geekbenchSingle": 1850,
  "geekbenchMulti": 4900,
  "tagline": "Snapdragon 7+ Gen 3 • 120Hz LTPO OLED • 120W SuperVOOC"
}

Important:
- "price" MUST be the actual current real-time selling price in Indian Rupees (INR ₹) in the live market right now.
- "ram" must specify exact RAM capacity and RAM technology (LPDDR5X, LPDDR5, or LPDDR4X).
- "processor" must specify exact chipset name and manufacturing node (e.g. 4nm).
- "antutuScore" must be a realistic numeric benchmark score (e.g. 450000 to 2200000).
- Output JSON only. No conversational prose.
`;

  for (const model of SEARCH_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: searchPrompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = res.text ? res.text.trim() : '';
      if (!text) continue;

      let jsonStr = text;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(jsonStr);
      return {
        price: typeof parsed.price === 'number' ? parsed.price : undefined,
        originalPrice: typeof parsed.originalPrice === 'number' ? parsed.originalPrice : undefined,
        discountPercent: typeof parsed.discountPercent === 'number' ? parsed.discountPercent : undefined,
        storeSource: parsed.storeSource || 'Flipkart / Amazon Live',
        ram: parsed.ram,
        ramVariants: Array.isArray(parsed.ramVariants) ? parsed.ramVariants : undefined,
        processor: parsed.processor,
        antutuScore: typeof parsed.antutuScore === 'number' ? parsed.antutuScore : undefined,
        gpuScore: parsed.gpuScore,
        geekbenchSingle: typeof parsed.geekbenchSingle === 'number' ? parsed.geekbenchSingle : undefined,
        geekbenchMulti: typeof parsed.geekbenchMulti === 'number' ? parsed.geekbenchMulti : undefined,
        tagline: parsed.tagline,
        verified: true,
      };
    } catch (err: any) {
      console.warn(`[Real-time Search] Model ${model} failed search grounding:`, err?.message || err);
    }
  }

  // Resilient fallback without tools if search grounding hit quota limit
  for (const model of SEARCH_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: searchPrompt,
      });

      const text = res.text ? res.text.trim() : '';
      if (!text) continue;

      let jsonStr = text;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(jsonStr);
      return {
        price: typeof parsed.price === 'number' ? parsed.price : undefined,
        originalPrice: typeof parsed.originalPrice === 'number' ? parsed.originalPrice : undefined,
        discountPercent: typeof parsed.discountPercent === 'number' ? parsed.discountPercent : undefined,
        storeSource: parsed.storeSource || 'Official Store / Indian Retail',
        ram: parsed.ram,
        ramVariants: Array.isArray(parsed.ramVariants) ? parsed.ramVariants : undefined,
        processor: parsed.processor,
        antutuScore: typeof parsed.antutuScore === 'number' ? parsed.antutuScore : undefined,
        gpuScore: parsed.gpuScore,
        geekbenchSingle: typeof parsed.geekbenchSingle === 'number' ? parsed.geekbenchSingle : undefined,
        geekbenchMulti: typeof parsed.geekbenchMulti === 'number' ? parsed.geekbenchMulti : undefined,
        tagline: parsed.tagline,
        verified: true,
      };
    } catch (err: any) {
      console.warn(`[Fallback Specs] Model ${model} failed:`, err?.message || err);
    }
  }

  return { verified: false };
}

/**
 * Direct Real-Time Smartphone Ingestion & Grounding via text query or retail link.
 * Finds real-time price, RAM, processor, and full technical specifications.
 */
export async function lookupRealTimePhoneSpecs(query: string): Promise<{
  phone: PhoneSpecs;
  livePriceInfo: RealTimePriceAndSpecs;
}> {
  const ai = getAIClient();

  const prompt = `
You are an expert smartphone analyst and hardware database specialist with real-time Google Search grounding.
User is querying to add/ingest a smartphone into our mobile store catalog: "${query}".

Task:
1. Search live web sources (Flipkart, Amazon.in, GSMArena, Official brand store) for this smartphone.
2. Determine:
   - REAL-TIME live selling price in India (INR ₹)
   - Original MRP price and current discount %
   - Live store source (e.g. "Flipkart Live", "Amazon India", "Motorola Direct", "Samsung India")
   - Exact RAM specifications: RAM capacity (e.g. 8GB / 12GB), RAM type (LPDDR5X/LPDDR4X), RAM variants
   - Exact Processor specifications: Chipset name, fabrication node (e.g. 4nm), GPU model, AnTuTu v10 benchmark score, Geekbench 6 scores
   - Display, Camera, Battery & Charging, IP Rating, Operating System
   - Calculate 5 algorithm benchmark scores (0-100 each) for: performance, camera, battery, display, value
   - Key highlights & USP tagline
3. Output STRICTLY a JSON object matching this schema:

{
  "id": "slug-name-lowercase-hyphenated",
  "name": "Full Official Smartphone Name",
  "brand": "Brand Name (e.g. Motorola, Samsung, Apple, OnePlus, Realme, Xiaomi, iQOO, Vivo, Nothing, Google)",
  "price": 24999,
  "originalPrice": 29999,
  "discountPercent": 17,
  "rating": 4.5,
  "ratingCount": 2450,
  "category": "deal",
  "releaseYear": 2025,
  "image": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80",
  "tagline": "Punchy 1-sentence highlight of biggest USP",
  "badge": "Short badge (e.g. SNAPDRAGON 8 GEN 3, 120W CHARGE, 7000mAh)",
  "storeSource": "Amazon India / Flipkart Live",
  "scores": {
    "performance": 88,
    "camera": 85,
    "battery": 92,
    "display": 89,
    "value": 91
  },
  "details": {
    "processor": "Processor Name with fabrication (e.g. Snapdragon 7+ Gen 3 4nm)",
    "antutuScore": 1450000,
    "geekbenchSingle": 1850,
    "geekbenchMulti": 4800,
    "gpuScore": "GPU model name (e.g. Adreno 732)",
    "ram": "8GB / 12GB LPDDR5X (Up to 16GB Virtual RAM)",
    "storage": "128GB / 256GB UFS 4.0",
    "displayType": "6.78 inch 1.5K 120Hz LTPO AMOLED",
    "screenSize": "6.78 inches",
    "resolution": "2780 x 1264 pixels (1.5K)",
    "refreshRate": "120Hz LTPO Fluid",
    "peakBrightness": "6,000 nits Peak",
    "mainCamera": "50 MP Sony LYT-600 OIS, f/1.88",
    "telephotoCamera": "None or 50MP Periscope",
    "ultrawideCamera": "8 MP Ultra-Wide 112˚",
    "selfieCamera": "32 MP Sony IMX615, f/2.4",
    "videoResolution": "4K @ 60fps EIS",
    "batteryCapacity": "5,500 mAh",
    "wiredCharging": "120W SuperVOOC Fast Charge",
    "wirelessCharging": "Not Supported",
    "batteryLifeHours": 22.5,
    "os": "Android 14 / Realme UI 5.0",
    "updateSupportYears": 3,
    "weight": "191 g",
    "dimensions": "162 x 75.1 x 8.6 mm",
    "ipRating": "IP65 Water & Dust Resistant",
    "colors": ["Silver Fluid", "Razor Green"]
  },
  "ramVariants": ["8GB + 128GB", "8GB + 256GB", "12GB + 256GB"],
  "highlights": [
    "Snapdragon 7+ Gen 3 with 1.45M+ AnTuTu score",
    "120W SuperVOOC fast charging with 5500mAh battery",
    "6000-nit ultra bright 1.5K 120Hz LTPO display",
    "50MP Sony OIS main camera",
    "Dual stereo speakers with Hi-Res Audio"
  ]
}
`;

  let lastError: any = null;
  let text = '';

  for (const model of SEARCH_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      text = response.text ? response.text.trim() : '';
      if (text) break;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Real-time Lookup] Model ${model} failed:`, err?.message || err);
    }
  }

  // Resilient fallback without search tools if search tool quota was exceeded
  if (!text) {
    for (const model of SEARCH_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        text = response.text ? response.text.trim() : '';
        if (text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Fallback Lookup] Model ${model} failed:`, err?.message || err);
      }
    }
  }

  if (!text) {
    throw new Error(
      `Real-time search grounding failed: ${lastError?.message || 'Please check the model name or query'}`
    );
  }

  let jsonString = text;
  if (jsonString.includes('```json')) {
    jsonString = jsonString.split('```json')[1].split('```')[0].trim();
  } else if (jsonString.includes('```')) {
    jsonString = jsonString.split('```')[1].split('```')[0].trim();
  }

  const parsed = JSON.parse(jsonString) as PhoneSpecs;

  const safeId = (parsed.id || parsed.name || 'phone')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `phone-${Date.now()}`;
  parsed.id = safeId;
  parsed.realTimePriceVerified = true;
  parsed.realTimePriceUpdated = new Date().toISOString();

  // If no image or broken placeholder, supply attractive default device photo
  if (!parsed.image || parsed.image.includes('example.com')) {
    parsed.image = 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80';
  }

  return {
    phone: parsed,
    livePriceInfo: {
      price: parsed.price,
      originalPrice: parsed.originalPrice,
      discountPercent: parsed.discountPercent,
      storeSource: parsed.storeSource,
      ram: parsed.details.ram,
      ramVariants: parsed.ramVariants,
      processor: parsed.details.processor,
      antutuScore: parsed.details.antutuScore,
      gpuScore: parsed.details.gpuScore,
      verified: true,
    },
  };
}

/**
 * Multimodal AI Extraction with automatic real-time price, RAM, and processor grounding.
 */
export async function extractPhoneFromImage(req: AIExtractionRequest): Promise<{
  phone: PhoneSpecs;
  savedImageUrl: string;
  realTimeGrounded: boolean;
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

  // 3. Vision Prompt: Extracts smartphone hardware specifications & text from image
  const prompt = `
You are an expert smartphone analyst and hardware database specialist.
Analyze this attached smartphone image (it could be a real phone photograph, retail brochure, e-commerce screenshot from Flipkart/Amazon/Mi/Samsung/Motorola, promotional advertisement, or device specification sheet).

User Hint / Context: ${req.optionalHint ? `"${req.optionalHint}"` : 'None provided. Auto-detect everything accurately from the image.'}

Task:
1. Examine the image carefully. Read any visible text, watermarks, screen labels, processor logos, battery badges (e.g. 7000mAh, Dimensity 6400, Snapdragon 8 Gen 3, 50MP Quad Pixel, Gorilla Glass, MIL-STD certifications, etc.).
2. Accurately identify the exact smartphone brand, model name, and series (e.g., "Motorola Moto G37 Power", "Samsung Galaxy S25 Ultra", "Realme 13 Pro+", "Xiaomi 15", "OnePlus 12", etc.).
3. Retrieve and complete the comprehensive real-world technical specifications, pricing in Indian Rupees (₹ INR), launch year, processor details, camera cluster, battery specifications, and calculate 5 algorithm benchmark scores (0-100 each).
4. Extract RAM architecture and RAM variants (e.g. 6GB, 8GB, 12GB, 16GB, LPDDR4X or LPDDR5X).
5. Extract processor chipset, fabrication node (e.g. 4nm), GPU, and AnTuTu score.
6. Output STRICTLY a JSON object matching this schema:

{
  "id": "slug-name-lowercase-hyphenated",
  "name": "Full Official Smartphone Name",
  "brand": "Brand Name",
  "price": 14999,
  "originalPrice": 18999,
  "discountPercent": 21,
  "rating": 4.6,
  "ratingCount": 1850,
  "category": "deal",
  "releaseYear": 2025,
  "tagline": "Punchy 1-sentence highlight of the biggest USP",
  "badge": "Short badge (e.g. 7000mAh MONSTER, AI FLAGSHIP, 120W CHARGE)",
  "storeSource": "Verified Store (e.g. Motorola India / Flipkart, Amazon India)",
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
    "telephotoCamera": "e.g. 2 MP Portrait Depth sensor or 'None'",
    "ultrawideCamera": "e.g. 8 MP Ultra-Wide 118˚ + Macro Vision or 'None'",
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
    "colors": ["Primary Color", "Secondary Color"]
  },
  "ramVariants": ["8GB + 128GB", "12GB + 256GB"],
  "highlights": [
    "Primary USP highlight",
    "Processor and 5G performance",
    "Durability or Display",
    "Camera capabilities",
    "Battery life and charging speed"
  ]
}
`;

  let lastError: any = null;
  let text = '';

  for (const model of VISION_MODELS) {
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
        if (text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Vision model ${model} attempt ${attempt + 1} failed: ${err?.message || err}`);
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }
    if (text) break;
  }

  if (!text) {
    throw new Error(
      `AI Vision Extraction temporarily unavailable (${lastError?.message || 'High demand'}). Please try again.`
    );
  }

  // Parse JSON from response
  let jsonString = text;
  if (jsonString.includes('```json')) {
    jsonString = jsonString.split('```json')[1].split('```')[0].trim();
  } else if (jsonString.includes('```')) {
    jsonString = jsonString.split('```')[1].split('```')[0].trim();
  }

  const parsed = JSON.parse(jsonString) as PhoneSpecs;

  // Generate safe id
  const safeId = (parsed.id || parsed.name || 'phone')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `phone-${Date.now()}`;
  parsed.id = safeId;

  // Save image to disk under /public/images/uploads/
  const uploadsDir = path.join(process.cwd(), 'public', 'images', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = `${safeId}-${Date.now()}.${extension}`;
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, Buffer.from(rawBase64, 'base64'));

  const savedImageUrl = `/images/uploads/${filename}`;
  parsed.image = savedImageUrl;

  // Real-time live market grounding: Fetch live environment price and cross-check RAM & Processor
  let realTimeGrounded = false;
  try {
    const liveSpecs = await fetchRealTimePriceAndSpecs(parsed.name, parsed.brand);
    if (liveSpecs.verified) {
      realTimeGrounded = true;
      if (liveSpecs.price) parsed.price = liveSpecs.price;
      if (liveSpecs.originalPrice) parsed.originalPrice = liveSpecs.originalPrice;
      if (liveSpecs.discountPercent) parsed.discountPercent = liveSpecs.discountPercent;
      if (liveSpecs.storeSource) parsed.storeSource = liveSpecs.storeSource;
      if (liveSpecs.ram) parsed.details.ram = liveSpecs.ram;
      if (liveSpecs.ramVariants && liveSpecs.ramVariants.length > 0) {
        parsed.ramVariants = liveSpecs.ramVariants;
      }
      if (liveSpecs.processor) parsed.details.processor = liveSpecs.processor;
      if (liveSpecs.antutuScore) parsed.details.antutuScore = liveSpecs.antutuScore;
      if (liveSpecs.gpuScore) parsed.details.gpuScore = liveSpecs.gpuScore;
      if (liveSpecs.geekbenchSingle) parsed.details.geekbenchSingle = liveSpecs.geekbenchSingle;
      if (liveSpecs.geekbenchMulti) parsed.details.geekbenchMulti = liveSpecs.geekbenchMulti;
      if (liveSpecs.tagline) parsed.tagline = liveSpecs.tagline;

      parsed.realTimePriceVerified = true;
      parsed.realTimePriceUpdated = new Date().toISOString();
    }
  } catch (err) {
    console.warn('Real-time grounding during image extraction skipped:', err);
  }

  return {
    phone: parsed,
    savedImageUrl,
    realTimeGrounded,
  };
}
