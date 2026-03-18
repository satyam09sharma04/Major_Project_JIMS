export * from "./ocr/preprocessor.js";
export * from "./ocr/tesseract.js";

export * from "./riskAnalysis/riskPrompt.js";
export * from "./riskAnalysis/riskScorer.js";

export * from "./verification/geminiClient.js";
export * from "./verification/promptBuilder.js";
export * from "./verification/verifyDocument.js";

export * from "./utils/fileReader.js";

export { default as preprocessor } from "./ocr/preprocessor.js";
export { default as ocrTesseract } from "./ocr/tesseract.js";

export { default as riskPrompt } from "./riskAnalysis/riskPrompt.js";
export { default as riskScorer } from "./riskAnalysis/riskScorer.js";

export { default as geminiClient } from "./verification/geminiClient.js";
export { default as verificationPromptBuilder } from "./verification/promptBuilder.js";
export { default as verifyDocument } from "./verification/verifyDocument.js";

export { default as fileReader } from "./utils/fileReader.js";

