const { Queue } = require("bullmq");
const connection = require("./connection");
const logger = require("../config/logger");

const emailQueue = new Queue("email", {
    connection, 
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    }
});

const sendEmailJob = async (type , to , data) => {
    try {
        await emailQueue.add(type , {to , data});
        logger.info(`Job added to Email Queue: Type ${type} , To ${to}`);
    } catch (error) {
        logger.error(`Failed to add Email Job: ${error.message}`);
        throw error;
    }
};

module.exports = { emailQueue , sendEmailJob };