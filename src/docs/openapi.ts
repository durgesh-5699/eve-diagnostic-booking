const uuid = { type: 'string', format: 'uuid' };
const timestamp = { type: 'string', format: 'date-time' };
const bearer = [{ bearerAuth: [] }];

const idParam = { $ref: '#/components/parameters/IdPath' };

const json = (schemaName: string) => ({
  'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } },
});

const errorRef = (name: string) => ({ $ref: `#/components/responses/${name}` });

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'EVE Healthcare - Diagnostic Booking API',
    version: '1.0.0',
    description:
      'Diagnostic test bookings with simulated payments.\n\n' +
      'Flow: signup/login -> browse centres and tests -> create a booking (PENDING) -> ' +
      'pay (POST /payments) -> booking becomes CONFIRMED or FAILED. ' +
      'A payment provider can also send status updates to the idempotent webhook.\n\n' +
      'To call protected endpoints: use POST /auth/login, copy the token, click "Authorize" ' +
      'and paste the token (without the "Bearer " prefix).',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'System' },
    { name: 'Auth' },
    { name: 'Centres' },
    { name: 'Bookings' },
    { name: 'Payments' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service is up',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } },
              },
            },
          },
        },
      },
    },

    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account',
        requestBody: { required: true, content: json('SignupRequest') },
        responses: {
          '201': { description: 'Account created', content: json('AuthResponse') },
          '400': errorRef('BadRequest'),
          '409': errorRef('Conflict'),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and receive a JWT',
        description: 'Wrong password and unknown email return the same 401 message (prevents user enumeration).',
        requestBody: { required: true, content: json('LoginRequest') },
        responses: {
          '200': { description: 'Logged in', content: json('AuthResponse') },
          '400': errorRef('BadRequest'),
          '401': errorRef('Unauthorized'),
        },
      },
    },

    '/centres': {
      post: {
        tags: ['Centres'],
        summary: 'Create a diagnostic centre',
        description: 'Open endpoint (no admin role exists in the assignment scope).',
        requestBody: { required: true, content: json('CreateCentreRequest') },
        responses: {
          '201': { description: 'Centre created', content: json('Centre') },
          '400': errorRef('BadRequest'),
        },
      },
      get: {
        tags: ['Centres'],
        summary: 'List all centres',
        responses: {
          '200': {
            description: 'Centres, newest first',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Centre' } },
              },
            },
          },
        },
      },
    },
    '/centres/{id}': {
      get: {
        tags: ['Centres'],
        summary: 'Get a centre with its tests',
        parameters: [idParam],
        responses: {
          '200': { description: 'Centre and its tests', content: json('CentreWithTests') },
          '400': errorRef('BadRequest'),
          '404': errorRef('NotFound'),
        },
      },
    },
    '/centres/{id}/tests': {
      post: {
        tags: ['Centres'],
        summary: 'Add a diagnostic test (with price) to a centre',
        parameters: [idParam],
        requestBody: { required: true, content: json('CreateTestRequest') },
        responses: {
          '201': { description: 'Test created', content: json('DiagnosticTest') },
          '400': errorRef('BadRequest'),
          '404': errorRef('NotFound'),
        },
      },
      get: {
        tags: ['Centres'],
        summary: 'List the tests offered by a centre',
        parameters: [idParam],
        responses: {
          '200': {
            description: 'Tests, newest first',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/DiagnosticTest' } },
              },
            },
          },
          '400': errorRef('BadRequest'),
          '404': errorRef('NotFound'),
        },
      },
    },

    '/bookings': {
      post: {
        tags: ['Bookings'],
        summary: 'Book a diagnostic test',
        description:
          'The amount is taken from the test price on the server; any amount sent by the client is ignored. ' +
          'The test must belong to the given centre and the appointment must be in the future. ' +
          'New bookings start as PENDING.',
        security: bearer,
        requestBody: { required: true, content: json('CreateBookingRequest') },
        responses: {
          '201': { description: 'Booking created', content: json('Booking') },
          '400': errorRef('BadRequest'),
          '401': errorRef('Unauthorized'),
          '404': errorRef('NotFound'),
        },
      },
      get: {
        tags: ['Bookings'],
        summary: "List the caller's own bookings",
        security: bearer,
        responses: {
          '200': {
            description: 'Bookings, newest first',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
              },
            },
          },
          '401': errorRef('Unauthorized'),
        },
      },
    },
    '/bookings/{id}': {
      get: {
        tags: ['Bookings'],
        summary: 'Get one of your bookings',
        security: bearer,
        parameters: [idParam],
        responses: {
          '200': { description: 'The booking', content: json('Booking') },
          '400': errorRef('BadRequest'),
          '401': errorRef('Unauthorized'),
          '403': errorRef('Forbidden'),
          '404': errorRef('NotFound'),
        },
      },
    },

    '/payments': {
      post: {
        tags: ['Payments'],
        summary: 'Pay for a booking (simulated)',
        description:
          'Simulated gateway: the outcome is randomly SUCCESS or FAILED. ' +
          'SUCCESS confirms the booking, FAILED marks it FAILED. ' +
          'Only PENDING bookings can be paid. The booking row is locked during processing, ' +
          'so concurrent requests cannot create two payments.',
        security: bearer,
        requestBody: { required: true, content: json('CreatePaymentRequest') },
        responses: {
          '201': { description: 'Payment processed', content: json('PaymentResult') },
          '400': errorRef('BadRequest'),
          '401': errorRef('Unauthorized'),
          '403': errorRef('Forbidden'),
          '404': errorRef('NotFound'),
          '409': errorRef('Conflict'),
        },
      },
    },
    '/payments/webhook': {
      post: {
        tags: ['Payments'],
        summary: 'Payment status update from the provider (idempotent)',
        description:
          'Idempotent: every eventId is processed at most once. A repeated eventId returns 200 with ' +
          'result "duplicate" and changes nothing. A SUCCESS payment is final and is never downgraded. ' +
          'A FAILED payment can still become SUCCESS (late confirmation). ' +
          'Always answers 200 for well-formed events so the provider does not retry pointlessly. ' +
          'This endpoint is not authenticated (a real provider would sign requests).',
        requestBody: { required: true, content: json('WebhookRequest') },
        responses: {
          '200': { description: 'Event handled', content: json('WebhookResponse') },
          '400': errorRef('BadRequest'),
          '404': errorRef('NotFound'),
        },
      },
    },
  },

  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    parameters: {
      IdPath: { name: 'id', in: 'path', required: true, schema: uuid },
    },
    responses: {
      BadRequest: { description: 'Validation failed or malformed request', content: json('Error') },
      Unauthorized: { description: 'Missing, invalid or expired credentials', content: json('Error') },
      Forbidden: { description: 'Resource belongs to another user', content: json('Error') },
      NotFound: { description: 'Resource not found', content: json('Error') },
      Conflict: { description: 'Request conflicts with current state', content: json('Error') },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string', example: 'Validation failed' },
          details: {
            type: 'object',
            description: 'Per-field messages, present only on validation errors',
            additionalProperties: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      SignupRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'test@example.com' },
          password: { type: 'string', minLength: 8, example: 'password123' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'test@example.com' },
          password: { type: 'string', example: 'password123' },
        },
      },
      User: {
        type: 'object',
        properties: { id: uuid, email: { type: 'string', format: 'email' } },
      },
      AuthResponse: {
        type: 'object',
        properties: { user: { $ref: '#/components/schemas/User' }, token: { type: 'string' } },
      },
      CreateCentreRequest: {
        type: 'object',
        required: ['name', 'location'],
        properties: {
          name: { type: 'string', example: 'Apollo Diagnostics' },
          location: { type: 'string', example: 'Bhubaneswar' },
        },
      },
      Centre: {
        type: 'object',
        properties: {
          id: uuid,
          name: { type: 'string' },
          location: { type: 'string' },
          created_at: timestamp,
          updated_at: timestamp,
        },
      },
      CreateTestRequest: {
        type: 'object',
        required: ['name', 'price'],
        properties: {
          name: { type: 'string', example: 'Complete Blood Count' },
          price: { type: 'number', minimum: 0, exclusiveMinimum: true, example: 499 },
        },
      },
      DiagnosticTest: {
        type: 'object',
        properties: {
          id: uuid,
          centre_id: uuid,
          name: { type: 'string' },
          price: { type: 'string', description: 'Decimal returned as a string', example: '499.00' },
          created_at: timestamp,
          updated_at: timestamp,
        },
      },
      CentreWithTests: {
        allOf: [
          { $ref: '#/components/schemas/Centre' },
          {
            type: 'object',
            properties: {
              tests: { type: 'array', items: { $ref: '#/components/schemas/DiagnosticTest' } },
            },
          },
        ],
      },
      CreateBookingRequest: {
        type: 'object',
        required: ['testId', 'centreId', 'appointmentAt'],
        properties: {
          testId: uuid,
          centreId: uuid,
          appointmentAt: { ...timestamp, example: '2030-01-15T10:00:00Z' },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: uuid,
          user_id: uuid,
          test_id: uuid,
          centre_id: uuid,
          appointment_at: timestamp,
          amount: { type: 'string', example: '499.00' },
          status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'] },
          created_at: timestamp,
          updated_at: timestamp,
        },
      },
      CreatePaymentRequest: {
        type: 'object',
        required: ['bookingId'],
        properties: { bookingId: uuid },
      },
      Payment: {
        type: 'object',
        properties: {
          id: uuid,
          booking_id: uuid,
          amount: { type: 'string', example: '499.00' },
          status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED'] },
          created_at: timestamp,
          updated_at: timestamp,
        },
      },
      PaymentResult: {
        type: 'object',
        properties: {
          payment: { $ref: '#/components/schemas/Payment' },
          booking: { $ref: '#/components/schemas/Booking' },
        },
      },
      WebhookRequest: {
        type: 'object',
        required: ['eventId', 'paymentId', 'status'],
        properties: {
          eventId: {
            type: 'string',
            description: 'Unique id of this event, used for idempotency',
            example: 'evt_1',
          },
          paymentId: uuid,
          status: { type: 'string', enum: ['SUCCESS', 'FAILED'] },
        },
      },
      WebhookResponse: {
        type: 'object',
        properties: {
          result: {
            type: 'string',
            enum: ['applied', 'duplicate', 'already_applied', 'ignored'],
            description:
              'applied: state changed. duplicate: eventId seen before. ' +
              'already_applied: payment already had this status. ' +
              'ignored: transition not allowed (e.g. SUCCESS is final) or booking cancelled.',
          },
        },
      },
    },
  },
};