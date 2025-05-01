// appInsights.js
const appInsights = require('applicationinsights');

let telemetryClient = null;

if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
  appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setSendLiveMetrics(false)
    .start();

  telemetryClient = appInsights.defaultClient;
}

const ApplicationInsightsWebserverMiddleware = (req, res, next) => {
  if (telemetryClient) {
    telemetryClient.trackRequest({
      name: req.method + ' ' + req.url,
      url: req.url,
      duration: 0,
      resultCode: 200,
      success: true,
    });
  }
  next();
};

module.exports = {
  telemetryClient,
  ApplicationInsightsWebserverMiddleware
};

