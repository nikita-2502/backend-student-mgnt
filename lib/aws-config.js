var AWS = require('aws-sdk');

/* AWS Configuration */
const dataConfig = {
    'bucketName': 'game-logo',
    'accessKeyId': 'AKIAQE4BTNZETGTARX4P',
    'ses_region': 'us-east-1',
    's3_region': 'us-east-2',
    'secretAccessKey': '5WXn6adbnQ88VBVEn0/5NA4rpN9sDCIYS7qtUnZr',
    'ACL': 'public-read',
    'folder': {
        'icons': 'icons'
    },
    'aws': {
        "awsCredentials": '5WXn6adbnQ88VBVEn0/5NA4rpN9sDCIYS7qtUnZr',
        "awsBucket": 'game-logo'
    }
};

/* S3 */
AWS.config.update({
    accessKeyId: dataConfig.accessKeyId,
    secretAccessKey: dataConfig.secretAccessKey
});
AWS.config.update({
    region: dataConfig.s3_region
});
AWS.config.ACL = dataConfig.ACL;
const S3 = new AWS.S3();

/* SES */
AWS.config.update({
    region: dataConfig.ses_region
});
// var SES = new AWS.SES({
//     apiVersion: '2010-12-01'
// });
// var SNS = new AWS.SNS({
//     apiVersion: '2010-03-31'
// });

module.exports = {
    config: dataConfig,
    // ses: SES,
    s3: S3,
    // sns: SNS
};