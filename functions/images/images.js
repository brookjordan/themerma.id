const https = require("https");

const AUTH = "127918368256697:m_ly15XQvXmhGzjsYJbQdOT5WXc";
const HOSTNAME = "api.cloudinary.com";
const SEARCH_PATH = "/v1_1/themermaid/resources/search/";
const DELETE_PATH = "/v1_1/themermaid/resources/image/upload/";

const BASE_RESPONSE_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json"
};


exports.handler = ({
  path, // string: Path parameter
  httpMethod, // string: Incoming request’s method name
  headers, // object: Incoming request headers
  queryStringParameters, // object: query string parameters
  body: bodyString, // string: A JSON string of the request payload.
  isBase64Encoded, // string: A boolean flag to indicate if the applicable request payload is Base64-encoded
}, context, callback) => {
  if (httpMethod === 'GET') {
    getImages(callback);
  }

  if (httpMethod === "DELETE") {
    let body = bodyString ? JSON.parse(bodyString) : {};
    if (!Array.isArray(body.imageIds) || body.imageIds.length === 0) {
      callback(null, {
        statusCode: 400,
        body: '{ errors: ["imageIds is required"] }',
        headers: { ...BASE_RESPONSE_HEADERS },
      });
      return;
    }
    deleteImages(body.imageIds, callback);
  }

  if (httpMethod === "OPTIONS") {
    callback(null, {
      statusCode: 200,
      body: "",
      headers: {
        ...BASE_RESPONSE_HEADERS,
        "Access-Control-Allow-Methods": "GET,DELETE",
        "Access-Control-Allow-Headers": "Content-Type"
      },
    });
  }
};

async function deleteImages(imageIds, callback) {
  try {
    let payload = await new Promise((resolve, reject) => {
      let rawData = "";

      const postData = JSON.stringify({
        "public_ids": imageIds,
      });

      const options = {
        auth: AUTH,
        hostname: HOSTNAME,
        path: DELETE_PATH,
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          resolve(JSON.parse(rawData));
        });
      });

      req.on('error', (e) => {
        reject(`problem with request: ${e.message}`);
      });

      req.write(postData);
      req.end();
    });

    let statusCode = 200;
    callback(null, {
      statusCode,
      body: JSON.stringify({
        errors: [],
        data: payload,
      }),
      headers: {
        ...BASE_RESPONSE_HEADERS,
        "Cache-Control": "max-age=10",
      },
    });
  } catch (errors) {
    callback(null, {
      statusCode: 502,
      body: JSON.stringify({
        errors: `${errors}`,
      }),
      headers: {...BASE_RESPONSE_HEADERS },
    });
  }
}

async function getImages(callback) {
  try {
    let payload = await new Promise((resolve, reject) => {
      let rawData = "";

      const postData = JSON.stringify({
        "with_field": ["context", "tags"],
      });

      const options = {
        auth: AUTH,
        hostname: HOSTNAME,
        path: SEARCH_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          resolve(JSON.parse(rawData));
        });
      });

      req.on('error', (e) => {
        reject(`problem with request: ${e.message}`);
      });

      req.write(postData);
      req.end();
    });
    let images = payload.resources.map(({ context, tags, secure_url, public_id }) =>
      ({ context, tags, src: secure_url, id: public_id })
    )

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        errors: [],
        data: { images },
      }),
      headers: {
        ...BASE_RESPONSE_HEADERS,
        "Cache-Control": "max-age=10",
      },
    });
  } catch (errors) {
    callback(null, {
      statusCode: 502,
      body: JSON.stringify({
        errors: `${errors}`,
      }),
      headers: {
        ...BASE_RESPONSE_HEADERS,
        "Cache-Control": "max-age=10",
      },
    });
  }
}
