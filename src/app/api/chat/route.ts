export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import {
  PayPalAgentToolkit,
} from "@paypal/agent-toolkit/ai-sdk";
import { streamText } from "ai";

import { systemPrompt } from "@/app/constants";
import debug from "debug";
import { getDeepSeekModel, getVolcanoModel } from "./tools/LLM/models";

import { ProductToolkit } from "@/utils/tools/productTools";
import { PayPalValidationTool } from "@/utils/tools/paypalValidationTool";
import { ProductBtnTool } from "@/utils/tools/productBtnTool";
import { ListTransactionsTool } from "@/utils/tools/listTransactionsTool";
import { GetOrderDetailsTool } from "@/utils/tools/getOrderDetailsTool";

const logger = debug("uichatbot:api");

const CONFIG = {
  clientId: process.env.PAYPAL_CLIENT_ID || "",
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
};

function validateConfig() {
  const missingVars: string[] = [];

  if (!CONFIG.clientId) {
    missingVars.push("PAYPAL_CLIENT_ID");
  }
  if (!CONFIG.clientSecret) {
    missingVars.push("PAYPAL_CLIENT_SECRET");
  }

  if (missingVars.length > 0) {
    console.error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
    console.error("Please check your .env file and make sure all required variables are set.");
    throw new Error(`Error: Missing environment variables: ${missingVars.join(", ")}`);
  }
}

function selectModel(model: string) {
  switch (model) {
    case "deepseek":
      return getDeepSeekModel();
    case "doubao":
      return getVolcanoModel();
    case "qwen":
      return getVolcanoModel();

    default:
      console.error(`Unsupported model: ${model}`);
      // 默认使用火山方舟模型
      return getVolcanoModel();
  }
}

async function generateResponse({ messages, modelProvider, characterPrompt }: { messages: any, modelProvider: string, characterPrompt?: string }) {
  const paypalToolkit = new PayPalAgentToolkit({
    clientId: CONFIG.clientId,
    clientSecret: CONFIG.clientSecret,
    configuration: {
      actions: {
        products: {
          create: true,
          list: true,
          show: true
        },
        orders: {
          create: true,
          get: true
        },
        reporting: {
          transactions: true
        }
      },
      context: {
        sandbox: true,
      }
    },
  });

  const productToolkit = new ProductToolkit();
  const paypalValidationTool = new PayPalValidationTool();
  const productBtnTool = new ProductBtnTool();
  const listTransactionsTool = new ListTransactionsTool();
  const getOrderDetailsTool = new GetOrderDetailsTool();

  const tools = {
    ...paypalToolkit.getTools(),
    ...productToolkit.getTools(),
    ...paypalValidationTool.getTools(),
    ...productBtnTool.getTools(),
    ...listTransactionsTool.getTools(),
    ...getOrderDetailsTool.getTools(),
  };

  const llm = selectModel(modelProvider);

  return streamText({
    model: llm,
    system: characterPrompt || systemPrompt,
    tools,
    messages,
    maxSteps: 10,
    onStepFinish: ({ toolCalls, toolResults }) => {
      logger("[POST /chat]: Tool calls -", JSON.stringify(toolCalls, null, 2));
      logger(
        "[POST /chat]: Tool results -",
        JSON.stringify(toolResults, null, 2)
      );
    },
    onError: (error) => {
      logger("[POST /chat]: Text generation failed -", error);
    },
  });
}

export async function POST(req: Request) {
  try {
    const { messages, modelProvider, characterPrompt } = await req.json();

    validateConfig();

    const result = await generateResponse({ messages, modelProvider, characterPrompt });

    return result.toDataStreamResponse();
  } catch (error: any) {
    logger("[POST /chat]: Error -", error);
    return new Response(error.message || "Error: Text generation failed.", {
      status: 500,
    });
  }
}
