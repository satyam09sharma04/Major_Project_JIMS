# Gemini API Usage Analysis - AI-Services Module

## Quick Answer
**→ Gemini is NOT currently used in your project, but it's built into the ai-services module waiting to be activated.**

---

## 1. Is geminiClient.js Actually Being Called?

### Current Status: ❌ NO (Not in the active project flow)

**However:** The code structure is in place and WOULD be called IF:
- The ai-services module is imported and used
- Environment variables are configured with API keys

---

## 2. Full Execution Flow Analysis

### Current Actual Flow (What Happens Now):

```
User uploads document
    ↓
verify.controller.js → runDocumentVerification()
    ↓
backend/src/services/ai.service.js → verifyPropertyDocumentWithAi()
    ↓
Uses local implementation (NOT ai-services module):
    - extractTextFromDocument() [OCR]
    - matchPropertyDetails() [Field matching]
    - generateRiskScore() [Risk scoring]
    ↓
Database update with results
```

### The ai-services Module Flow (Currently Unused):

```
verifyDocument.js (from ai-services)
    ↓
Calls: scoreRisk(payload, riskOptions)
    ↓
scoreRisk() function logic:
    ├─ IF preferModel=true AND useGemini=true
    │   └─ Calls createGeminiModelRunner()
    │       └─ Calls callGemini() → Sends HTTP request to Gemini API
    │
    └─ ELSE (if Gemini fails or API key missing)
        └─ Falls back to scoreRiskHeuristic() [local calculation]
```

---

## 3. Where Gemini Would Be Called (If Used)

### File: `ai-services/riskAnalysis/riskScorer.js` (Lines 187-215)

```javascript
export const scoreRisk = async (payload = {}, options = {}) => {
  const {
    preferModel = true,           // ← Defaults to TRUE
    runModel,
    useGemini = true,             // ← Defaults to TRUE
    geminiOptions = {},
  } = options;

  // Create Gemini runner IF conditions are met
  const modelRunner =
    typeof runModel === "function"
      ? runModel
      : (preferModel && useGemini ? createGeminiModelRunner(geminiOptions) : null);

  // TRY to use AI model
  if (preferModel && typeof modelRunner === "function") {
    try {
      return await scoreRiskWithModel(payload, {
        ...options,
        runModel: modelRunner,    // ← Passes Gemini runner to model scorer
      });
    } catch {
      // IF GEMINI FAILS → Falls back to heuristic
      return scoreRiskHeuristic(payload);
    }
  }

  // If model not preferred → Uses heuristic
  return scoreRiskHeuristic(payload);
};
```

---

## 4. What Data Would Be Sent to Gemini?

### Gemini Request Body:

```javascript
// From verifyDocument.js → scoreRisk() → scoreRiskWithModel()

// SYSTEM PROMPT (defines AI role):
{
  role: "land-record fraud and integrity analyst",
  task: "Compare OCR text against property metadata and detect fraud"
}

// USER PROMPT (specific task):
{
  extractedText: "Khasra Number: 123, Area: 5000...", // OCR output
  property: {
    khasraNumber: "123",
    surveyNumber: "456",
    plotNumber: "789",
    location: "Mumbai, Maharashtra",
    area: "5000"
  },
  matchedFields: {
    khasraNumber: true,
    surveyNumber: false,
    plotNumber: true,
    location: true,
    area: true
  },
  verification: {
    ocrConfidence: 0.95,
    matchPercentage: 80,
    matchedCount: 4,
    totalFields: 5
  }
}
```

### Expected Gemini Response:

```json
{
  "riskScore": 75,
  "riskLevel": "LOW",
  "flags": ["surveyNumber not found in OCR text"],
  "summary": "Property identifiers mostly align with OCR evidence",
  "confidence": 0.88,
  "matchedFields": {
    "khasraNumber": true,
    "surveyNumber": false,
    "plotNumber": true,
    "location": true,
    "area": true
  },
  "matchPercentage": 80
}
```

---

## 5. Environment Variable Dependency

### Required for Gemini to Work:

| Variable | Source | Status |
|----------|--------|--------|
| `AI_API_KEY` | geminiClient.js line 24 | ❌ Probably not set |
| `GEMINI_API_KEY` | geminiClient.js line 24 (fallback) | ❌ Probably not set |
| `AI_MODEL` | geminiClient.js line 25 | Optional (defaults to "gemini-1.5-flash") |
| `GEMINI_MODEL` | geminiClient.js line 25 (fallback) | Optional |
| `GEMINI_BASE_URL` | geminiClient.js line 26 | Optional (defaults to Google API) |
| `GEMINI_TIMEOUT_MS` | geminiClient.js line 27 | Optional (defaults to 30000ms) |

### What Actually Happens Without API Key:

```javascript
// In geminiClient.js

export const getGeminiConfig = () => {
  const apiKey = toString(process.env.AI_API_KEY || process.env.GEMINI_API_KEY);
  // ^ If both are undefined/empty → apiKey = ""
  
  return {
    apiKey,
    model: "gemini-1.5-flash",
    baseUrl: "https://generativelanguage.googleapis.com",
    timeoutMs: 30000,
    enabled: Boolean(apiKey)  // ← FALSE if no API key!
  };
};

export const callGemini = async (payload) => {
  const config = getGeminiConfig();
  
  ensureConfigured(config);  // ← Throws error if enabled=false
  // Error: "Gemini API is not configured. Set AI_API_KEY or GEMINI_API_KEY."
};
```

### Error Handling:

1. **If AI key is NOT set** → scoreRiskWithModel() throws error
2. **Try-catch in scoreRisk()** catches it → Falls back to scoreRiskHeuristic()
3. **Final result** → Uses basic field matching algorithm instead of AI

---

## 6. Why Does geminiClient.js Exist If Not Used?

### Three Possible Reasons:

1. **✅ For Future Implementation**
   - Ready to activate when you set `AI_API_KEY` environment variable
   - No code changes needed, just add environment variable

2. **✅ For Optional/Advanced Usage**
   - Code is modular - can be used if you call verifyDocument() from ai-services directly
   - Backend chose NOT to use it (used local implementation instead)

3. **✅ As a Reference Implementation**
   - Shows how AI integration would work
   - Can be enabled for higher accuracy in the future

---

## 7. Why Isn't Backend Using ai-services?

### Backend Implementation (Duplication):

The backend has its own implementation in `backend/src/services/ai.service.js`:
- Has its own `extractTextFromDocument()` (OCR)
- Has its own `matchPropertyDetails()` (field matching)
- Has its own `generateRiskScore()` (risk analysis)
- Does NOT use ai-services module at all

### Why This Might Have Happened:

1. ai-services might be for frontend or other services to use
2. Backend was built independently
3. ai-services might be a refactor-in-progress or future consolidation

---

## Clear Conclusion

### One-Line Answer:
**→ "Gemini is NOT actively used in the project; ai-services/geminiClient.js is a prepared but unused integration waiting for API key configuration and backend implementation."**

---

## What Would Happen If You Enabled Gemini?

### Step 1: Set Environment Variable
```bash
export AI_API_KEY="sk-..." # Get from Google Gemini console
```

### Step 2: Update Backend (Optional)
```javascript
// In backend/src/services/verify.service.js
import { verifyDocument } from "ai-services";  // ← Add this import

// Instead of:
const verificationResult = await verifyPropertyDocumentWithAi({...});

// Use:
const verificationResult = await verifyDocument({...});
```

### Step 3: Result
- Gemini API would be called for risk analysis
- Better fraud detection with AI understanding
- Fallback to heuristic if Gemini fails

---

## Summary for Viva:

> "The geminiClient.js file exists as a **prepared but unused integration**. The code structure is in place: 
> - `verifyDocument.js` calls `scoreRisk()`
> - `scoreRisk()` conditionally creates and calls `createGeminiModelRunner()` 
> - `createGeminiModelRunner()` invokes `callGemini()` API
> 
> **However**, the backend doesn't use this ai-services module at all. It has its own duplicate implementation. So **currently, Gemini is NOT called**. The AI integration is ready but awaiting:
> 1. API key configuration (environment variable)
> 2. Backend refactor to use ai-services module
> 
> This is a **future scope/optional enhancement** rather than active implementation."
