/*
  Example #2 to demonstrate Promise.all usage in a VDR

  Use case:
  1. The response for GET /accounts contains one or more IDs,
  resolve the reference before returning the results
  2. Provide a resolver function to manage additional parsing/manipulation per child request

  Limitations:
  - 30 second timeout on entire request
  - Does the provider have a limit on concurrent requests?
  - Secondary request errors are returned in the transformed object
*/

// POST/PATCH call
if (!fromVendor) done(transformedObject);

// Response from POST/PATCH
if (fromVendor && Object.keys(originalObject).length <= 1) done(originalObject);

// GET calls
if (fromVendor) {
  const https = require('https');

  // Define resolver function to parse the response from the child API call
  const profile_data = (data) => {
    return data.map((item) => {
      return {
        "profile_option": item.profile_option,
        "value": item.value
      };
    });
  };

  const profile_type = (data) => {
    return data.map((item) => {
      return {
        "id": item.id,
        "name": item.name
      };
    });
  };

  /*
    Define the resource path, the ID used to make the lookup call,
    the field in which the response will be added on the transformed object,
    and optionally a function to peform additional work on the response
  */
  const calls = [
    {
      path: "profile-data?where=profile_option%3D463%20AND%20account%3D",
      id: originalObject.id,
      field: "birthdate",
      resolver: function (data) {
        return data[0].value;
      }
    },
    {
      path: "profile-types?where=profile_type%3D",
      id: originalObject.profile_type,
      field: "profile_type",
      resolver: profile_type
    },
    {
      path: "profile-data?where=account%3D",
      id: originalObject.id,
      field: "profile_data",
      resolver: profile_data
    }
  ];

  const options = (path, id) => {
    return {
      host: configuration.host,
      port: configuration.port,
      path: `/elements/api-v2/${path}${id}`,
      method: "GET",
      "headers": {
        "accept": "application/json",
        "Authorization": `User ${configuration.userSecret}, Organization ${configuration.organizationSecret}, Element ${configuration.elementInstanceToken}`
      }
    };
  };

  const makeCall = (path, id, field, resolver) => {
    return new Promise((resolve, reject) => {
      let data = "";
      let request = https.request(options(path, id), function (res) {
        res.on('data', function (d) {
          data += d;
        }).on('end', function (_d) {
          if (res.statusCode === 200) {
            if (resolver) {
              transformedObject[field] = resolver(JSON.parse(data));
            } else {
              transformedObject[field] = JSON.parse(data);
            }
            resolve(res);
          } else {
            transformedObject[field] = {
              message: `API call to ${path} failed`,
              error: res.statusMessage
            };
            reject(res.statusMessage);
          }
        });
      });

      request.on('error', function (e) {
        transformedObject[field] = {
          message: `API call to ${path} failed`,
          error: JSON.stringify(e)
        };
        reject(e);
      });

      request.end();
    });
  };

  const promises = calls.map(({
    path,
    id,
    field,
    resolver
  }) => makeCall(path, id, field, resolver));

  Promise.all(promises).then(() => {
    done(transformedObject);
  });
}