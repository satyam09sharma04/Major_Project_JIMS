# Simple Viva Answer: Gemini Usage in ai-services

## Your Question: Is Gemini Actually Being Used?

### Direct Answer:
**NO. Gemini is NOT actively used in the project.**

---

## Quick Explanation (2 minutes for viva):

**Question: Is geminiClient.js being called anywhere in the project flow?**

Answer:
> "No, geminiClient.js is NOT being called in the current project flow. Although the ai-services module has Gemini integration built in, the backend is not using the ai-services module at all. Instead, the backend has its own separate implementation of verification logic in `backend/src/services/ai.service.js`. So the Gemini code exists but is unused—like having a feature ready but not activated."

---

## Trace Questions & Answers:

**Q: How do I know Gemini is not being used?**

A: By tracing the call chain:
1. Document upload → verify.controller.js
2. verify.controller.js → verify.service.js
3. verify.service.js → **ai.service.js** (backend's own implementation)
4. **NOT** → ai-services/verifyDocument.js

Since the backend doesn't import from ai-services, Gemini (which is inside ai-services) is never called.

---

**Q: Does the code structure support Gemini?**

A: Yes! Inside ai-services:
- `verifyDocument.js` calls `scoreRisk()`
- `scoreRisk()` checks if Gemini should be used (defaults to YES)
- If yes, it calls `createGeminiModelRunner()`
- Which calls `callGemini()` → HTTP request to Google Gemini

So the **CODE is ready**, but **BACKEND doesn't use it**.

---

**Q: What data would Gemini receive?**

A: (If it was being used):
```
System Prompt: "You are a land fraud analyst..."
User Prompt: "Here's OCR text: ..., Here's expected data: ..., Are they consistent?"
Expected Response: 
{
  "riskScore": 85,
  "riskLevel": "LOW",
  "flags": ["Minor inconsistencies"],
  "summary": "Document appears authentic"
}
```

---

**Q: Why isn't backend using ai-services?**

A: Two possible reasons:
1. ai-services is for **future use** or other parts of the system
2. Backend was built **independently** before ai-services was created

Result: Code duplication - both have their own OCR and risk analysis.

---

**Q: Could Gemini be enabled easily?**

A: Almost yes:
1. ✅ Set environment variable: `AI_API_KEY=<google-api-key>`
2. ⚠️ Would need to change backend to use ai-services module
3. ✅ No changes needed in ai-services code itself

So it's "ready but disconnected."

---

## One-Liner for Your Viva:

**"Gemini is not actively used in the project. The ai-services module has Gemini integration built in and ready, but the backend uses its own separate implementation (ai.service.js) instead of importing from ai-services, so Gemini is never actually called."**

---

## Answering in Your Own Words (For Natural Speaking):

**When asked: "Is Gemini being used in your project?"**

You can say:
> "Not currently. While the ai-services folder has a geminiClient.js file that connects to Google's Gemini API, it's not actually being called by the backend. The reason is that our backend implementation in `backend/src/services/ai.service.js` has its own separate OCR and risk analysis logic. So the Gemini integration is kind of sitting there, ready to be used, but the backend doesn't actually use it. It's like having a tool in your toolbox that you haven't plugged in yet."

---

## Detailed But Still Simple (3-4 minutes):

**Question: Trace the execution flow to see if Gemini is invoked.**

Answer:
> "When a user uploads a property document, here's what happens:
> 
> 1. First, the verify controller receives the request
> 2. Then it calls verify.service.js, which calls verifyPropertyDocumentWithAi()
> 3. This function is inside backend/src/services/ai.service.js
> 4. It does three things: extracts text from the document using OCR, matches the extracted fields with database records, and analyzes the risk level
> 5. All of this is done with local code
> 
> Now, the ai-services folder ALSO has the same logic—OCR extraction, field matching, and risk analysis. But inside ai-services, there's an additional step: it's connected to Google Gemini AI. When risk is being analyzed in ai-services, it calls the Gemini API to get AI-based fraud detection instead of just using simple algorithms.
> 
> However, since the backend uses its own implementation and never imports from ai-services, the Gemini integration never gets called. So Gemini is completely unused—it exists in the code but is never invoked. Think of it as a feature that was built but the backend was built independently before this feature was integrated."

---

## For Detailed Technical Explanation (5 minutes):

**If they ask: "Show me exactly where Gemini would be called if it was being used."**

Answer:
> "Sure! Inside ai-services, here's the execution path:
>
> When verifyDocument.js is called (which it isn't, but if it was):
> - It first runs OCR using tesseract.js
> - Then it matches fields
> - Then it calls scoreRisk() function from riskScorer.js
>
> Inside scoreRisk():
> - It checks if useGemini is true (which it is by default)
> - If true, it calls createGeminiModelRunner() from geminiClient.js
> - createGeminiModelRunner() returns a function that calls callGemini()
> - callGemini() makes an HTTP POST request to Google's Gemini API
> - It sends system prompt (AI instructions) and user prompt (the actual task)
> - Gemini responds with risk score, flags, and summary
>
> This response is then formatted and returned.
>
> But currently, the backend calls ai.service.js instead, which has its own implementation of all these steps. So Gemini never gets called. It's like having two different implementations, and the backend chose the one that doesn't have Gemini."

---

## Simple Comparison Table (For Visual Understanding):

| Aspect | ai-services Module | Backend (Actual) |
|--------|-------------------|-----------------|
| **OCR** | tesseract.js (from ai-services) | tesseract.js (direct) |
| **Field Matching** | verifyDocument.js | ai.service.js |
| **Risk Analysis** | scoreRisk() → Checks Gemini | generateRiskScore() → Local heuristic OR Gemini |
| **Gemini Support** | Built-in conditional | Manual conditional |
| **Used in Project?** | ❌ NO | ✅ YES |
| **Is Gemini Called?** | ❌ NO (never reached) | ❓ Depends on API_KEY env var |

---

## Final Confidence Check (Answer These):

✅ Can you explain why Gemini isn't called?
   → "Backend doesn't use ai-services module"

✅ Can you show where Gemini WOULD be called?
   → "riskScorer.js → createGeminiModelRunner() → callGemini()"

✅ Can you describe what Gemini would do?
   → "Analyze OCR text vs expected data, detect fraud, return risk score"

✅ Can you say why the code exists if unused?
   → "Future implementation or code prepared for potential use"

✅ Can you explain the difference from backend implementation?
   → "Backend has own logic, ai-services is separate module not imported"

---

## Your Confident Viva Answer (Use This!):

> "Gemini is **NOT** actively being used in our project. Although the ai-services folder includes a complete Gemini integration (geminiClient.js), our backend doesn't import from ai-services at all. Instead, our backend has its own verification implementation in ai.service.js. 
>
> However, the structure is there: if verifyDocument.js from ai-services was called, it would invoke scoreRisk(), which would conditionally call createGeminiModelRunner() to connect to Google's Gemini API. The Gemini client would send the OCR-extracted text along with expected property metadata, and Gemini would respond with a fraud risk analysis.
>
> But since the backend uses its own implementation, Gemini is never actually called. It's prepared but unused—like a feature that was built but not integrated into the active project flow. To enable it, we'd need to set an API key environment variable and change the backend to use the ai-services module instead."
