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