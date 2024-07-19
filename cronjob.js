const cron = require('node-cron');
const dboperation = require('./dboperation');  // Adjust the path as needed

// Cron job to fetch machine online status every 5 seconds
cron.schedule('*/5 * * * * *', async () => {
    const currentDate = new Date().toISOString().split('T')[0];  // Example: '2021-09-20'
    try {
        const data = await dboperation.getMachineOnlineStatus(currentDate);
        if (data.length === 0) {
            console.log(`machineOnlineStatus:No data`);
        } else {
            console.log(`machineOnlineStatus: ${data.length}`);
        }
    } catch (error) {
        console.log(`Error fetching machine online status: ${error}`);
    }
});

module.exports = cron;