const dboperation = require('../dboperation');
const cron = require('node-cron');
let connectedUsers = 0;  // Counter for connected users
let cronExecutionCount = 0;  // Counter for cron job executions
let logCounter = 0;  // Counter for log messages


function handleSocketIO(io) {
    io.on('connection', (socket) => {
        connectedUsers++;  // Increment the connected users counter
        console.log(`A user connected. Total connected users: ${connectedUsers}. Socket ID: ${socket.id}`);
        
        // Initial fetch when user connects
        fetchAndEmitData(socket);
        
        // Set up a cron job to fetch data every 5 seconds
        const cronJob = cron.schedule('*/7 * * * * *', () => {
            cronExecutionCount++;  // Increment the cron job execution counter
            fetchAndEmitData(socket);
        });
        socket.on('disconnect', () => {
            connectedUsers--;  // Decrement the connected users counter
            logCounter=0;
            console.log(`A user disconnected. Total connected users: ${connectedUsers}. Socket ID: ${socket.id}`);
            cronJob.stop();
        });
    });
}
async function fetchAndEmitData(socket) {
    const currentDate = new Date().toISOString().split('T')[0];
    try {
        const data = await dboperation.getMachineOnlineStatus(currentDate);
        logCounter++;  // Increment the log counter
        // console.log('machineOnlineStatus: ', data);
        // console.log('fetchAndEmitData: ', currentDate);
        if (data.length === 0) {
            console.log(`machineOnlineStatus:No data`);
        } else {
            console.log(`${logCounter}:machineOnlineStatus: ${data.length}`);
        }
        socket.emit('machineOnlineStatus', data);
    } catch (error) {
        console.log(`Error fetching machine online status: ${error}`);
    }
}
module.exports = {
    handleSocketIO,
};












// const dboperation = require('../dboperation');
// const cron = require('node-cron');
// let connectedUsers = 0;  // Counter for connected users
// let cronExecutionCount = 0;  // Counter for cron job executions
// let logCounter = 0;  // Counter for log messages

// // Array to hold all active sockets
// let activeSockets = [];

// function handleSocketIO(io) {
//     io.on('connection', (socket) => {
//         // Add the socket to the activeSockets array
//         activeSockets.push(socket);

//         connectedUsers++;  // Increment the connected users counter
//         console.log(`A user connected. Total connected users: ${connectedUsers}. Socket ID: ${socket.id}`);
        
//         // Initial fetch when user connects
//         fetchAndEmitData(socket);
        
//         // Set up a cron job to fetch data every 5 seconds
//         const cronJob = cron.schedule('*/7 * * * * *', () => {
//             cronExecutionCount++;  // Increment the cron job execution counter
//             fetchAndEmitData(socket);
//         });

//         socket.on('disconnect', () => {
//             connectedUsers--;  // Decrement the connected users counter
//             logCounter = 0;
//             console.log(`A user disconnected. Total connected users: ${connectedUsers}. Socket ID: ${socket.id}`);
//             cronJob.stop();

//             // Remove the socket from the activeSockets array
//             activeSockets = activeSockets.filter(s => s !== socket);
//         });
//     });

//     // Event to stop all current sockets
//     function stopAllSockets() {
//         activeSockets.forEach(socket => {
//             socket.disconnect(true); // true: close the underlying connection
//         });
//         activeSockets = []; // Clear the activeSockets array
//         console.log('All sockets stopped.');
//     }

//     // Expose stopAllSockets as an event
//     io.on('stopAllSocket', stopAllSockets);
// }

// async function fetchAndEmitData(socket) {
//     const currentDate = new Date().toISOString().split('T')[0];
//     try {
//         const data = await dboperation.getMachineOnlineStatus(currentDate);
//         logCounter++;  // Increment the log counter
//         if (data.length === 0) {
//             console.log(`machineOnlineStatus:No data`);
//         } else {
//             console.log(`${logCounter}:machineOnlineStatus: ${data.length}`);
//         }
//         socket.emit('machineOnlineStatus', data);
//     } catch (error) {
//         console.log(`Error fetching machine online status: ${error}`);
//     }
// }

// module.exports = {
//     handleSocketIO,
// };