/*
  Example to demonstrate Promise.all usage in a VDR

  Use case:
  The response for GET /accounts contains one or more IDs,
  resolve the reference before returning the results

  Limitations:
  - 30 second timeout on entire request
  - Does the provider have a limit on concurrent requests?
  - Secondary request errors are returned in the transformed object
*/

const https = require("https");

/*
  Define the resource path, the ID used to make the lookup call
  and the field in which the response will be added on the transformed object
*/
const calls = [
  {
    path: "accounts",
    id: originalObject.account,
    field: "account_1"
  },
  {
    path: "accounts",
    id: originalObject.account,
    field: "account_2"
  }
];

const options = (path, id) => {
  return {
    host: configuration.host,
    port: configuration.port,
    path: `/elements/api-v2/${path}/${id}`,
    method: "GET",
    "headers": {
      "accept": "application/json",
      "Authorization": `User ${configuration.userSecret}, Organization ${configuration.organizationSecret}, Element ${configuration.elementInstanceToken}`
    }
  };
};

const makeCall = (path, id, field) => {
  return new Promise((resolve, reject) => {
    let data = "";
    let request = https.request(options(path, id), function (res) {
      res.on('data', function (d) {
        data += d;
      }).on('end', function (_d) {
        if (res.statusCode === 200) {
          transformedObject[field] = JSON.parse(data);
          resolve(res);
        } else {
          transformedObject[field] = {
            message: "https call to ping failed",
            error: res.statusMessage
          };
          reject(res.statusMessage);
        }
      });
    });

    request.on('error', function (e) {
      transformedObject[field] = {
        message: `https call to ${path} failed`,
        error: JSON.stringify(e)
      };
      reject(e);
    });

    request.end();
  });  
};

const promises = calls.map(({path, id, field}) => makeCall(path, id, field));

Promise.all(promises).then(() => {
  done(transformedObject);
});
