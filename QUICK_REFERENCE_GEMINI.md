# Gemini Usage - Quick Reference Card (For Viva)

## ⏱️ 10 SECOND ANSWER:
"Gemini is NOT actively used. The ai-services module has it built in and ready, but the backend uses its own separate implementation, so Gemini is never actually called."

---

## ✋ STOP-AND-ANSWER Quick Facts:

**Q1: Is geminiClient.js being called?**
- ❌ NO - It's imported by riskScorer.js but never invoked because backend doesn't use ai-services
- File reference: geminiClient.js Line 144 (createGeminiModelRunner function)

**Q2: Trace the flow - where does it lead?**
- ✅ Current flow: verify.controller.js → verify.service.js → ai.service.js (LOCAL)
- ❌ Unused flow: verify.controller.js → ai-services/verifyDocument.js (NEVER CALLED)

**Q3: What data would be sent to Gemini?**
- 📝 Extracted OCR text + Expected property metadata + Matching results
- Expected response: JSON with {riskScore, riskLevel, flags, summary, confidence}

**Q4: Does Gemini get called?**
- ❌ NO - Because backend doesn't import verifyDocument from ai-services
- Why? Two implementations exist: backend built its own (ai.service.js)

**Q5: Can it be enabled?**
- ✅ YES - Set AI_API_KEY environment variable + import ai-services in backend

---

## 📊 CODE REFERENCE:

### Where Gemini Would Be Called (If Used):
```
ai-services/verification/verifyDocument.js (Line 90)
    ↓
ai-services/riskAnalysis/riskScorer.js (Line 187) → scoreRisk()
    ↓
ai-services/riskAnalysis/riskScorer.js (Line 198) → createGeminiModelRunner()
    ↓
ai-services/verification/geminiClient.js (Line 144)
    ↓
ai-services/verification/geminiClient.js (Line 68) → callGemini()
    ↓
[HTTP POST to Google Gemini API]
```

### Why It's Not Called:
```
backend/src/services/ai.service.js (Line 229)
    ↑
    USED ✅ (imported in verify.service.js)
    
ai-services/verification/verifyDocument.js
    ↑
    NOT USED ❌ (never imported)
```

---

## 🔑 KEY FILES & LINES:

| Component | File | Line | Purpose |
|-----------|------|------|---------|
| Gemini Config | geminiClient.js | 24-34 | Reads API key from env |
| Gemini HTTP Call | geminiClient.js | 68-130 | Makes POST request to Google |
| Gemini Runner Factory | geminiClient.js | 144 | Creates callable Gemini function |
| Risk Score Entry | riskScorer.js | 187 | Main decision point (uses Gemini?) |
| Gemini Check | riskScorer.js | 194 | `preferModel && useGemini ? createGeminiModelRunner() : null` |
| Model Scorer | riskScorer.js | 162 | Calls Gemini with prompts |
| Current Backend | ai.service.js | 229 | Actual function being used |

---

## 🔴 CRITICAL POINT:

**The Backend Doesn't Use ai-services Module**

```javascript
// backend/src/services/verify.service.js (Line 4)
import { verifyPropertyDocumentWithAi } from "./ai.service.js";  // ← LOCAL ❌

// NOT this:
import { verifyDocument } from "ai-services";  // ← WOULD USE GEMINI ✅
```

---

## ✅ CONFIDENCE CHECKLIST (Before Viva):

- [ ] Can I explain why Gemini isn't called? (Backend doesn't import ai-services)
- [ ] Can I show the code path where Gemini would be? (scoreRisk → createGeminiModelRunner)
- [ ] Can I name the API key env variables? (AI_API_KEY or GEMINI_API_KEY)
- [ ] Can I describe what Gemini response contains? (riskScore, riskLevel, flags)
- [ ] Can I explain the difference between implementations? (Backend has own, ai-services separate)
- [ ] Can I say how to enable it? (Set API key + change import)

---

## 💬 WHAT TO SAY IF THEY ASK:

**"Is Gemini being used?"**
→ "No, it's not being actively used. The ai-services module has Gemini integration ready, but our backend has its own implementation and doesn't import from ai-services."

**"Show me the code where Gemini is called"**
→ "It's not called in the current flow. But the code is in riskScorer.js line 198 where it calls createGeminiModelRunner(), which would invoke Gemini's API from geminiClient.js."

**"What would Gemini analyze?"**
→ "It would compare the extracted OCR text from the property document against the expected property metadata in our database and return a fraud risk score."

**"Is this a bug or intentional?"**
→ "It's intentional design - the ai-services module is a prepared integration that's not currently being used. The backend was built with its own implementation. It's like having an optional feature ready for future use."

**"How would you enable Gemini?"**
→ "We'd set the API_KEY environment variable and update the backend to import and use verifyDocument from ai-services instead of the local ai.service.js."

---

## 🎯 FINAL ANSWER (USE THIS IN VIVA):

**"Gemini is NOT actively used in the project. Here's why: The backend imports and uses ai.service.js (its local implementation) instead of the ai-services module. Although ai-services/verifyDocument.js calls scoreRisk(), which is designed to invoke Gemini through createGeminiModelRunner(), the backend never reaches that code because it's using a separate implementation. So the Gemini integration exists as prepared code but is orphaned—never invoked. It's like having a feature built but not connected to the active system."**

---

## 📌 REMEMBER:

1. ❌ Gemini NOT called in current project
2. ✅ Gemini code EXISTS in ai-services
3. 🔗 Backend doesn't import ai-services
4. 📦 Backend has its own duplicate implementation
5. 🔧 Could be enabled with minimal changes
6. 🚀 Likely future scope or preparation for integration
