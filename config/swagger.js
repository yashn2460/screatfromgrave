const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Afternote API Documentation',
      version: '1.0.0',
      description: 'API documentation for Afternote application',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: [path.join(__dirname, '../routes/*.js')], // Using absolute path
};

const specs = swaggerJsdoc(options);

// Log the specs to verify they're being generated correctly
console.log('Swagger specs generated:', Object.keys(specs.paths || {}).length, 'paths found');

module.exports = specs; 