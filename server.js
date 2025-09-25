const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import routes
const sessionRoutes = require('./routes/sessions');

// Import database connection
const connectDB = require('./config/database');

// Import Swagger setup
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Jarvis Chat Sessions API',
      version: '1.0.0',
      description: 'REST API for managing Jarvis chat sessions',
      contact: {
        name: 'API Support',
        email: 'support@jarvis-api.com',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || `http://18.217.133.254:3000`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Firebase ID Token',
        },
      },
    },
  },
  // Try multiple path patterns
  apis: [
    path.join(__dirname, './routes/*.js'),
    path.join(__dirname, 'routes', 'sessions.js'),
    './routes/sessions.js',
    __dirname + '/routes/*.js'
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Debug: Log the swagger spec to see if it's finding the docs
console.log('Swagger spec paths found:', Object.keys(swaggerSpec.paths || {}));
console.log('Current directory:', __dirname);
console.log('Looking for routes in:', path.join(__dirname, './routes/*.js'));

// Swagger UI with better configuration
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
  `,
  customSiteTitle: "Jarvis Chat API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// Serve raw swagger JSON
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Jarvis Chat API is running',
  });
});

// API Routes
app.use('/api/sessions', sessionRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Jarvis Chat Sessions API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health',
    swagger_json: '/swagger.json',
    debug: '/debug/swagger',
    endpoints: {
      'POST /api/sessions': 'Create new chat session',
      'GET /api/sessions': 'Get all sessions for user',
      'GET /api/sessions/:id': 'Get specific session',
      'PUT /api/sessions/:id': 'Update session',
      'DELETE /api/sessions/:id': 'Delete session'
    }
  });
});

// Debug endpoint to check swagger spec
app.get('/debug/swagger', (req, res) => {
  res.json({
    paths: Object.keys(swaggerSpec.paths || {}),
    swaggerSpec: swaggerSpec,
    __dirname: __dirname,
    pathsChecked: [
      path.join(__dirname, './routes/*.js'),
      path.join(__dirname, 'routes', 'sessions.js'),
    ]
  });
});

// Alternative Swagger UI endpoint (sometimes /api-docs/ with trailing slash works better)
app.get('/docs', swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: "Jarvis Chat API Documentation"
}));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api-docs',
      'GET /docs',
      'GET /swagger.json',
      'GET /debug/swagger',
      'POST /api/sessions',
      'GET /api/sessions',
      'GET /api/sessions/:id',
      'PUT /api/sessions/:id',
      'DELETE /api/sessions/:id'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Jarvis Chat API is running on port ${PORT}`);
  console.log(`Server accessible at: http://18.217.133.254:${PORT}`);
  console.log(`API Documentation: http://18.217.133.254:${PORT}/api-docs`);
  console.log(`Alternative Docs: http://18.217.133.254:${PORT}/docs`);
  console.log(`Swagger JSON: http://18.217.133.254:${PORT}/swagger.json`);
  console.log(`Health Check: http://18.217.133.254:${PORT}/health`);
  console.log(`Debug Swagger: http://18.217.133.254:${PORT}/debug/swagger`);
  console.log(`Available Endpoints:`);
  console.log(`   POST   /api/sessions`);
  console.log(`   GET    /api/sessions`);
  console.log(`   GET    /api/sessions/:id`);
  console.log(`   PUT    /api/sessions/:id`);
  console.log(`   DELETE /api/sessions/:id`);
});

module.exports = app;