// teamsBot.js
const { ActivityHandler } = require('botbuilder');
const AzureOpenAI = require('./azureOpenAI');
const log4js = require('log4js');

const logger = log4js.getLogger('teamsBot');
logger.level = 'debug';

class GLJTeamsBot extends ActivityHandler {
  constructor(redisClient) {
    super();
    this.redisClient = redisClient;
    this.openai = new AzureOpenAI(); // 🔹 OpenAIクライアントをインスタンス化

    this.onMessage(async (context, next) => {
      const userMessage = context.activity.text || '';
      const userId = context.activity.from.id;
      const conversationId = context.activity.conversation.id;

      logger.info(`📩 [User]: ${userMessage}`);

      try {
        // Redisにユーザーメッセージ保存（任意）
        await this.redisClient.set(`message:${conversationId}`, userMessage);

        // OpenAIで応答生成
        const reply = await this.openai.generateResponse(userMessage, userId);
        await context.sendActivity(reply);

      } catch (error) {
        logger.error('❌ Bot応答エラー:', error);
        await context.sendActivity('AI応答に失敗しました。しばらくしてからもう一度お試しください。');
      }

      await next();
    });

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity('こんにちは！GLJ Teams Botへようこそ！');
        }
      }
      await next();
    });
  }
}

module.exports = GLJTeamsBot;

