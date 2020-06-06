const https = require("https");
const querystring = require('querystring');

const AUTH = "127918368256697:m_ly15XQvXmhGzjsYJbQdOT5WXc";
const HOSTNAME = "api.cloudinary.com";
const PATH = "/v1_1/themermaid/resources/search";


exports.handler = async ({
  path, // string: Path parameter
  httpMethod, // string: Incoming request’s method name
  headers, // object: Incoming request headers
  queryStringParameters, // object: query string parameters
  body, // string: A JSON string of the request payload.
  isBase64Encoded, // string: A boolean flag to indicate if the applicable request payload is Base64-encoded
}, context, callback) => {
  let errors = [];
  try {
    let payload = await new Promise((resolve, reject) => {
      let rawData = "";

      const postData = JSON.stringify({
        "with_field": ["context", "tags"],
      });

      const options = {
        auth: AUTH,
        hostname: HOSTNAME,
        path: PATH,
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
    let images = payload.resources.map(({ context, tags, secure_url }) => ({ context, tags, src: secure_url }))

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        errors: [],
        data: { images },
      }),
      headers: {
        "Cache-Control": "max-age=10",
        "Access-Control-Allow-Origin": "*"
      },
    });
  } catch (errors) {
    callback(null, {
      statusCode: 502,
      body: JSON.stringify({
        errors: `${errors}`,
      }),
      headers: {
        "Cache-Control": "max-age=10",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }
};
