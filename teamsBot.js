const { ActivityHandler } = require('botbuilder');
const logger = require('./logger');

class GLJTeamsBot extends ActivityHandler {
  constructor(redisClient) {
    super();
    this.redisClient = redisClient;

    // メッセージ応答処理
    this.onMessage(async (context, next) => {
      const userMessage = context.activity.text?.trim().toLowerCase();
      logger.info(`💬 ユーザー: ${userMessage}`);

      try {
        if (this.redisClient) {
          await this.redisClient.set(`message:${context.activity.conversation.id}`, userMessage);
        } else {
          logger.warn('⚠️ redisClient が未定義です');
        }

        if (userMessage === 'hi' || userMessage === 'hello') {
          await context.sendActivity("Hello! 👋 How can I assist you?");
        } else {
          await context.sendActivity(`あなたのメッセージ '${userMessage}' を受け取りました。`);
        }
      } catch (error) {
        logger.error(`❌ メッセージ処理エラー: ${error}`);
        await context.sendActivity('メッセージ処理中にエラーが発生しました。');
      }

      await next();
    });

    // Teams または個人スコープでの welcome メッセージ送信
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (const member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity('こんにちは！GLJ Teams Botへようこそ！');
        }
      }
      await next();
    });
  }
}

module.exports = GLJTeamsBot;

