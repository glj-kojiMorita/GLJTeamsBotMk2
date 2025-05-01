const fs = require('fs');
const path = require('path');
const express = require('express');
const { CloudAdapter, ConfigurationBotFrameworkAuthentication } = require('botbuilder');
const GLJTeamsBot = require('./teamsBot');
const redisClient = require('./redisClient');
const logger = require('./logger');
const appInsights = require('applicationinsights');

const app = express();
const PORT = process.env.PORT || 3978;
const HOST = process.env.HOST || '0.0.0.0';

// JSONボディパーサーを全体に適用
app.use(express.json());

// Application Insights 初期化
if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
    appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY).start();
    logger.info('✅ Application Insights 初期化完了');
} else {
    logger.warn('⚠️ Application Insights が未設定のため、無効です');
}

// Bot Framework 認証（マネージドID）
const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppType: 'UserAssignedMSI',
    MicrosoftAppTenantId: process.env.MicrosoftAppTenantId,
    MicrosoftAppPassword: ''
});

const adapter = new CloudAdapter(botFrameworkAuthentication);

adapter.onTurnError = async (context, error) => {
    logger.error(`❌ [onTurnError] ${error.stack}`);
    if (appInsights.defaultClient) {
        appInsights.defaultClient.trackException({ exception: error });
    }
    await context.sendActivity('エラーが発生しました。しばらくしてからもう一度お試しください。');
};

const bot = new GLJTeamsBot(redisClient);

// 健康チェック
app.get('/healthz', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        dbStatus: redisClient.status === 'ready' ? 'connected' : redisClient.status
    });
});

// ルート確認
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'running',
        app: 'GLJ Teams Bot',
        version: process.env.npm_package_version || 'unknown'
    });
});

// Bot メッセージ受信
app.post('/api/messages', async (req, res) => {
    await adapter.process(req, res, async (context) => {
        await bot.run(context);
    });
});

// プロセスエラー監視
process.on('uncaughtException', (err) => {
    logger.error(`❌ uncaughtException: ${err.stack}`);
    appInsights.defaultClient?.trackException({ exception: err });
});

process.on('unhandledRejection', (reason) => {
    logger.error(`❌ unhandledRejection: ${reason}`);
    appInsights.defaultClient?.trackException({ exception: new Error(reason) });
});

// サーバー起動
const server = app.listen(PORT, HOST, () => {
    logger.info(`🟢 サーバー起動中：http://${HOST}:${PORT}`);
});
server.keepAliveTimeout = 60000;
server.headersTimeout = 65000;

// 優雅なシャットダウン
process.on('SIGTERM', () => {
    logger.info('🛑 SIGTERM を受信。シャットダウン中...');
    server.close(() => {
        logger.info('🛑 サーバー停止完了');
        process.exit(0);
    });
});

