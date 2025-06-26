const cron = require('node-cron');
const { processScheduledVerifications } = require('../controllers/deathVerificationController');

// Initialize cron jobs
const initializeCronJobs = () => {
  console.log('Initializing cron jobs...');

  // Process scheduled death verifications daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running scheduled death verification check...');
    try {
      await processScheduledVerifications();
      console.log('Scheduled death verification check completed');
    } catch (error) {
      console.error('Error in scheduled death verification cron job:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  // Process scheduled death verifications every hour for testing (optional)
  // Uncomment the line below for more frequent processing during development
  // cron.schedule('0 * * * *', async () => {
  //   console.log('Running hourly death verification check...');
  //   try {
  //     await processScheduledVerifications();
  //     console.log('Hourly death verification check completed');
  //   } catch (error) {
  //     console.error('Error in hourly death verification cron job:', error);
  //   }
  // }, {
  //   scheduled: true,
  //   timezone: "UTC"
  // });

  console.log('Cron jobs initialized successfully');
};

// Manual trigger for testing
const triggerScheduledVerifications = async () => {
  console.log('Manually triggering scheduled death verification check...');
  try {
    await processScheduledVerifications();
    console.log('Manual death verification check completed');
  } catch (error) {
    console.error('Error in manual death verification check:', error);
  }
};

module.exports = {
  initializeCronJobs,
  triggerScheduledVerifications
}; 