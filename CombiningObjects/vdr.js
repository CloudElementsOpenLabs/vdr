/*
  Example to demonstrate merging multiple objects in a VDR

  Use case:
  The response for the VDR /my-contacts does not contain all of the information the requestor needs--
  make two additional API calls to enrich the contact record.
  
  Limitations:
  - 30 second timeout on entire request
  - This JavaScript will run once for each object in the response from the parent API call
  - Does the provider have a limit on concurrent requests?
  - Secondary request errors are returned in the transformed object

  Axios - the popular promise based HTTP client for the browser and node.js is used instead of using node HTTP directly
  Read more about the configuration options Axios provides here -> https: //github.com/axios/axios
*/

if (fromVendor) {

  const axios = require('axios');

  const ax = axios.create({
    baseURL: `${configuration.protocol}://${configuration.host}${configuration.pathPrefix}`,
    timeout: 5000,
    headers: {
      "accept": "application/json",
      "Authorization": `User ${configuration.userSecret}, Organization ${configuration.organizationSecret}, Element ${configuration.elementInstanceToken}`
    }
  });

  const makeCall = async ({ targetField, config }) => {
    try {
      const res = await ax.request(config);
      return {
        [targetField]: res.data
      };
    } catch (e) {
      return {
        [targetField]: `Error while resolving field ${targetField}: ${e.message}`
      };
    }
  };

  const calls = [{
      targetField: "activities",
      config: {
        url: `/my-contacts/${transformedObject.id}/my-contact-activities`,
        method: "get", // default
      }
    },
    {
      targetField: "notes",
      config: {
        url: `/my-contacts/${transformedObject.id}/my-contact-notes`,
        method: "get",
      }
    }
  ];

  const parseData = (data) => {
    data.forEach(d => {
      Object
        .keys(d)
        .forEach(k => transformedObject[k] = d[k]);
    });

    done(transformedObject);
  };

  const makeCalls = (configs) => {
    Promise
      .all(configs.map(c => makeCall(c)))
      .then(data => parseData(data));
  };

  makeCalls(calls);
}
