# Code Trace: Gemini Call Path

## If ai-services Module WAS Being Used:

### Entry Point:
```
backend/src/services/verify.service.js
└─ import { verifyPropertyDocumentWithAi }
└─ CHANGED TO: import { verifyDocument } from "ai-services"
```

### Full Call Chain (If Enabled):

```
verifyDocument(buffer, property, riskOptions={})
├─ File: ai-services/verification/verifyDocument.js (Line 63-100)
│
├─ Step 1: OCR Extraction
│  └─ extractTextFromBuffer(buffer)
│     └─ File: ai-services/ocr/tesseract.js
│        └─ Use Tesseract library to read text
│
├─ Step 2: Field Matching
│  └─ buildMatchedFields(extractedText, property)
│     └─ Compare OCR output with expected property data
│     └─ Returns: matchedFields, matchPercentage
│
└─ Step 3: Risk Scoring
   └─ scoreRisk(payload, riskOptions)
      └─ File: ai-services/riskAnalysis/riskScorer.js (Line 187)
      │
      ├─ Extract options:
      │  ├─ preferModel = true (DEFAULT)
      │  ├─ useGemini = true (DEFAULT)
      │  └─ riskOptions (passed from caller)
      │
      ├─ Create Model Runner:
      │  └─ IF (preferModel && useGemini) && no custom runModel
      │     └─ createGeminiModelRunner(geminiOptions)
      │        └─ File: ai-services/verification/geminiClient.js (Line 144)
      │
      ├─ TRY to use Model:
      │  └─ scoreRiskWithModel(payload, {runModel: modelRunner})
      │     └─ File: ai-services/riskAnalysis/riskScorer.js (Line 162)
      │     │
      │     ├─ Build Prompts:
      │     │  └─ buildRiskPrompts(payload)
      │     │     └─ Creates systemPrompt + userPrompt
      │     │     └─ File: ai-services/riskAnalysis/riskPrompt.js
      │     │
      │     └─ Call AI Model:
      │        └─ runModel({systemPrompt, userPrompt})
      │           └─ Which is createGeminiModelRunner returned function
      │           │
      │           ├─ Build request body:
      │           │  ├─ contents: [{role: "user", parts: [{text: userPrompt}]}]
      │           │  └─ systemInstruction: {parts: [{text: systemPrompt}]}
      │           │
      │           └─ Call Gemini API:
      │              └─ callGemini({contents, systemInstruction, ...})
      │                 └─ File: ai-services/verification/geminiClient.js (Line 68)
      │                 │
      │                 ├─ getGeminiConfig()
      │                 │  └─ Read from env: AI_API_KEY or GEMINI_API_KEY
      │                 │
      │                 ├─ ensureConfigured()
      │                 │  └─ IF no API key → THROW ERROR
      │                 │     "Gemini API is not configured..."
      │                 │
      │                 ├─ Build endpoint:
      │                 │  └─ https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
      │                 │
      │                 ├─ fetch() POST request
      │                 │  └─ Send JSON body to Google Gemini
      │                 │
      │                 └─ Parse response:
      │                    └─ extractGeminiText(payload)
      │                       └─ Extract text from candidates[].content.parts[]
      │
      └─ CATCH error:
         └─ IF any error occurs (API key missing, network error, etc.)
            └─ FALLBACK to: scoreRiskHeuristic(payload)
               └─ File: ai-services/riskAnalysis/riskScorer.js (Line 109)
               └─ Uses basic algorithms, no AI
```

---

## Current Actual Path (What Really Happens):

```
User uploads document
↓
verify.controller.js → runDocumentVerification()
↓
backend/src/services/verify.service.js → verifyPropertyDocumentWithAi()
↓
backend/src/services/ai.service.js
├─ extractTextFromDocument(filePath, fileType)
│  └─ Uses LOCAL OCR (tesseract.js directly, NOT from ai-services)
│
├─ matchPropertyDetails(extractedText, property)
│  └─ Local field matching (NOT from ai-services)
│
└─ generateRiskScore(extractedText, property, matchedFields)
   └─ IF (apiKey exists) → Calls Google Gemini directly
   └─ ELSE → Uses local heuristic calculation
   └─ File: backend/src/services/ai.service.js (Line 184-227)
      └─ INDEPENDENT implementation, doesn't use ai-services module
```

---

## Key Difference:

| Aspect | ai-services | backend/ai.service.js |
|--------|-------------|---------------------|
| Used in current flow? | ❌ NO | ✅ YES |
| Gemini integration? | ✅ Built-in (ready) | ⚠️ Custom implementation |
| Location of Gemini call | geminiClient.js | ai.service.js (line 184+) |
| Status | Future scope | Currently active |

---

## To Enable Gemini Via ai-services:

### Change needed in: `backend/src/services/verify.service.js`

**Currently (Line 32):**
```javascript
import { verifyPropertyDocumentWithAi } from "./ai.service.js";

const verificationResult = await verifyPropertyDocumentWithAi({...});
```

**To enable ai-services Gemini:**
```javascript
import { verifyDocument } from "ai-services";  // ← Add this import

// Pass riskOptions to enable Gemini
const verificationResult = await verifyDocument(
  {
    filePath: document.filePath,
    buffer: document.buffer,
    property: property,
  },
  riskOptions = {
    useGemini: true,        // ← Enable Gemini
    preferModel: true,      // ← Prefer AI over heuristic
    geminiOptions: {}       // ← Optional Gemini config
  }
);
```

---

## Files Involved in Gemini Call:

```
geminiClient.js (Main Gemini interface)
├─ getGeminiConfig() → Reads environment variables
├─ callGemini() → Makes HTTP POST request to Google Gemini
├─ createGeminiModelRunner() → Returns async function for model calls
└─ extractGeminiText() → Parses response

riskScorer.js (Risk Analysis Logic)
├─ scoreRisk() → Main function, calls createGeminiModelRunner()
├─ scoreRiskWithModel() → Sends prompts to Gemini
└─ scoreRiskHeuristic() → Fallback without AI

riskPrompt.js (Prompt Builder)
├─ buildRiskSystemPrompt() → AI instructions
└─ buildRiskUserPrompt() → Specific task for AI
```

---

## Why Gemini Isn't Called (Technical Reason):

1. Backend uses `ai.service.js` ❌ NOT `ai-services/verifyDocument.js`
2. So `riskScorer.js` is never invoked ❌
3. So `createGeminiModelRunner()` is never called ❌
4. So `callGemini()` is never executed ❌
5. So Gemini API never receives request ❌

**Result:** Gemini integration exists in code but is orphaned/unused.
