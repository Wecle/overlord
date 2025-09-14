import { createDeepSeek } from '@ai-sdk/deepseek';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export const getDeepSeekModel = () => {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
        throw new Error('DEEPSEEK_API_KEY environment variable is required');
    }

    //vercel ai 目前所支持的大语言模型: https://ai-sdk.dev/providers/ai-sdk-providers/deepseek
    const provider = createDeepSeek({
        apiKey: apiKey,
    });

    //type DeepSeekChatModelId = "deepseek-chat" | "deepseek-reasoner"
    // 北京时间00:30~08:30, Deepseek-V3(deepseek-chat)降价50%, Deepseek-R1(deepseek-reasoner)降价25%
    const deepseek = provider(process.env.DEEPSEEK_PROVIDER_KEY || '');
    return deepseek;
}

export const getVolcanoModel = () => {
    const apiKey = process.env.VOLCENGINE_API_KEY;

    if (!apiKey) {
        throw new Error('VOLCENGINE_API_KEY environment variable is required');
    }

    // https://www.volcengine.com/docs/82379/1330626
    const provider = createOpenAICompatible({
        // 这个name的值看起来不影响模型配置, 因为豆包是通过在推理接入点中切换模型的
        // name: 'My-Test-Doubao-name',
        name: 'doubao-seed-1.6-thinking',
        apiKey: apiKey,
        baseURL: process.env.VOLCENGINE_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3/',
    });

    // 这里的'model-id', 对于火山方舟来说, 是endpoint. 因为在'火山引擎'=>'在线推理'=>'推理接入点'中, 可以看到, 一个接入点对应了一个模型
    const volcengine = provider(process.env.VOLCENGINE_PROVIDER_KEY || '')
    return volcengine
}
