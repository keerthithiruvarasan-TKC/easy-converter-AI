
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EquivalencyResult, TargetBrand, ApplicationContext } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
  console.warn("Gemini API Key is missing or invalid.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Knowledge Base Injection for Speed
const BRAND_KNOWLEDGE_BASE = {
  'Tungaloy': "Does NOT use generic ISO names like APMT/AVMT for high-performance milling. Uses 'Tung-Tri' (TPA), 'DoFeed' (EXN), 'DoForce-Tri'. Known for 'PremiumTec' grades (AH725, AH120, T9215).",
  'Toolflo': "Specializes in Top-Notch, Laydown threading. Uses 'Flo-Lock'.",
};

const getSystemInstruction = (brand: TargetBrand) => `
You are a Senior Application Engineer for "${brand}". 

CRITICAL FIRST STEP - DATA EXTRACTION:
You will receive a USER INPUT (Text or Image) representing a competitor cutting tool.
1. **EXTRACT**: You MUST identify the Competitor Part Number from the input. 
   - If the input is text like "CNMG 432", that IS the part number.
   - If the input is an image, OCR the text on the box or tool.
2. **POPULATE**: Fill the \`competitor\` object in the JSON response first. 
   - If the brand is not mentioned but the code is ISO (e.g., CNMG, TNMG), set Competitor Brand to "Generic/ISO".
   - Do NOT return "N/A" for the competitor part number if the user provided text.

LOGIC FOR REPLACEMENT:
1. **ISO INTERCHANGEABILITY CHECK**:
   - Determine if the Competitor Tool is an **ISO STANDARD** insert.
   - **IF ISO STANDARD**: Suggest ONLY the "${brand}" grade/chipbreaker to fit the customer's *existing* holder. (Strategy: INSERT_ONLY).
   - **IF NON-ISO / PROPRIETARY** (e.g., High Feed Mill, U-Drill): You must suggest the **COMPLETE ASSEMBLY** (Body + Insert). (Strategy: FULL_ASSEMBLY).

Brand Knowledge Context:
${BRAND_KNOWLEDGE_BASE[brand as keyof typeof BRAND_KNOWLEDGE_BASE] || ""}

STRICT RULES:
1. **PRODUCT CODE REQUIRED**: You **MUST** provide a specific **Product Code / Part Number** for the recommendation.
2. **CONTEXT AWARE**: Use the provided "Application Parameters" (Material, Failure Mode) to select the correct Grade (e.g., for Steel vs Stainless).
3. **FAILSAFE**: If the input is unclear, make a "Best Guess" based on standard industry formats and note this in the 'reasoning'.

Your Task:
1. Extract Competitor Info.
2. Verify Dimensions/Application.
3. Select ${brand} solution.
`;

export const findEquivalent = async (
  inputContent: string,
  inputType: 'text' | 'image' | 'pdf',
  targetBrand: TargetBrand,
  context: ApplicationContext,
  mimeType: string = 'image/jpeg',
  refinedParams?: Record<string, string>
): Promise<EquivalencyResult> => {

  const parts: any[] = [];

  // Construct a dense engineering context
  let contextString = `
    APPLICATION CONTEXT (Use this to select the right Grade/Geometry):
    - Material: ${context.material}
    - Operation: ${context.operationType} -> ${context.subOperationType}
    - Cutting Speed (Vc): ${context.params.vc || 'Standard'}
    - Failure Mode to Solve: ${context.params.failureMode || 'None/General Wear'}
    - Goal: ${context.params.expectation || 'Performance'}
    - Machine: ${context.params.machinePower}
  `;

  if (refinedParams) {
    contextString += `\n    - REFINED DATA: ${JSON.stringify(refinedParams)}`;
  }

  // Improved Prompting Strategy: Separate Input from Context
  if (inputType === 'text') {
    parts.push({
      text: `
    USER_INPUT_TO_CONVERT: "${inputContent}"
    
    INSTRUCTIONS:
    1. EXTRACT the part number from the USER_INPUT_TO_CONVERT above. (e.g. if text is "CNMG 120408", that is the part number).
    2. ANALYZE the APPLICATION CONTEXT below to choose the best ${targetBrand} grade.
    
    ${contextString}
    ` });
  } else {
    parts.push({
      inlineData: {
        data: inputContent, // base64 string
        mimeType: mimeType
      }
    });
    parts.push({
      text: `
    INSTRUCTIONS:
    1. LOOK at the image provided. Read the text/labels on the box or tool.
    2. EXTRACT the part number and brand.
    3. ANALYZE the APPLICATION CONTEXT below to choose the best ${targetBrand} grade.
    
    ${contextString}
    ` });
  }

  // Helper for model fallback
  const generateWithFallback = async (parts: any[], systemInstruction: string) => {
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];

    for (const modelName of models) {
      try {
        console.log(`Attempting generation with model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction,
          generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(parts);
        const response = await result.response;
        return response;
      } catch (error: any) {
        console.warn(`Model ${modelName} failed:`, error.message);
        // If it's the last model, throw the error
        if (modelName === models[models.length - 1]) throw error;
      }
    }
    throw new Error("All models failed");
  };

  try {
    const response = await generateWithFallback(parts, getSystemInstruction(targetBrand));
    const jsonText = response.text();
    const result = JSON.parse(jsonText) as EquivalencyResult;

    // Safety Fallbacks
    if (!result.competitor) {
      result.competitor = {
        brand: "Generic/ISO",
        name: "Identified Tool",
        partNumber: inputType === 'text' ? inputContent : "Extracted from Image",
        description: "Standard Insert",
        specs: {}
      };
    } else if (result.competitor.partNumber === "N/A" || !result.competitor.partNumber) {
      if (inputType === 'text') result.competitor.partNumber = inputContent;
    }

    if (!result.recommendation) {
      result.recommendation = { brand: targetBrand, name: "Pending", partNumber: "Contact Support", description: "Analysis Incomplete", specs: {} };
    }

    // Extract Grounding (if supported/available in response metadata)
    // Note: Grounding metadata structure might differ in standard SDK or require specific config.
    // For now we omit complex grounding parsing to ensure stability, or check docs if needed.
    // simpler implementation for now:
    result.sources = [];

    return result;
  } catch (error) {
    console.error("Equivalency lookup failed detailed:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw new Error("Could not identify product. Please try a clearer image or description. Details logged to console.");
  }
};

export const chatWithEngineer = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  contextData: any,
  newMessage: string
) => {
  const brand = contextData.recommendation?.brand || "Technical";
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: `You are a Technical Support Engineer for ${brand}. Answer questions based on the provided product analysis.`
      });

      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: `Current Analysis Context: ${JSON.stringify(contextData)}` }]
          },
          {
            role: 'model',
            parts: [{ text: `Understood. I am ready to answer questions about the ${brand} solution.` }]
          },
          ...history
        ],
      });

      const result = await chat.sendMessage(newMessage);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.warn(`Chat model ${modelName} failed:`, error.message);
      if (modelName === models[models.length - 1]) {
        console.error("Chat failed final:", error);
        return "I encountered an error processing your engineering query. Please try again later.";
      }
    }
  }
  return "Error processing request.";
};