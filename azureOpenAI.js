const { OpenAIClient, AzureKeyCredential } = require("@azure/openai"); // 正しいインポート方法
const log4js = require('log4js');

const logger = log4js.getLogger('azureOpenAI');
logger.level = 'debug';

class AzureOpenAI {
  constructor() {
    if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_KEY) {
      throw new Error("Azure OpenAIの設定が不足しています");
    }

    this.client = new OpenAIClient(
      process.env.AZURE_OPENAI_ENDPOINT,
      new AzureKeyCredential(process.env.AZURE_OPENAI_KEY),
      {
        apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2023-12-01-preview"
      }
    );
    this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  }

  async generateResponse(prompt, userId) {
    const messages = [
      { role: "system", content: "あなたは有能なアシスタントです。" },
      { role: "user", content: prompt }
    ];

    try {
      logger.debug(`Azure OpenAIリクエスト開始: ${prompt.substring(0, 50)}...`);
      
      const result = await this.client.getChatCompletions(
        this.deploymentName,
        messages,
        { 
          temperature: 0.7,
          maxTokens: 800 
        }
      );

      const response = result.choices[0]?.message?.content || "（応答なし）";
      logger.debug(`Azure OpenAI応答成功: ${response.substring(0, 50)}...`);
      return response;

    } catch (error) {
      logger.error('Azure OpenAI呼び出しエラー:', error);
      throw new Error('AIサービスの処理中にエラーが発生しました');
    }
  }
}

module.exports = AzureOpenAI; // クラスごとエクスポート
