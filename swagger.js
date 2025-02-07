import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Feedback API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Feedback system'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            password: { type: 'string' },
            role: { 
              type: 'string',
              enum: ['USER', 'ADMIN']
            }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            recordId: { type: 'string' },
            userId: { type: 'string' },
            category: {
              type: 'string',
              enum: ['GENERAL_FEEDBACK', 'FEATURE_REQUEST', 'INTEGRATION', 'BUG_REPORT']
            },
            status: {
              type: 'string',
              enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
            },
            metadata: {
              type: 'object',
              properties: {
                browser: { type: 'string' },
                os: { type: 'string' },
                version: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

export const specs = swaggerJsdoc(options);
