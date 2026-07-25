const cloudinary = require('../config/cloudinary');
const env = require('../config/env');


const generateUploadSignature = (folder , resourceType = "image" , maxBytes) => {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const paramsToSign =  {
        timestamp ,
        folder,
        resource_type: resourceType,
        max_file_size: maxBytes
    };

    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        env.CLOUDINARY_API_SECRET
    );

    return {
        signature,
        timestamp,
        folder,
        apiKey: env.CLOUDINARY_API_KEY,
        cloudName: env.CLOUDINARY_CLOUD_NAME
    };
}

module.exports = {generateUploadSignature};