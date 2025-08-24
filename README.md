# Per Diem - Secure Store Management System

**I love per diem** - A comprehensive, secure, and timezone-aware store management application built with Next.js, TypeScript, and PostgreSQL.

## 🚀 Features

### Core Features
- **Secure Authentication System** with JWT and refresh tokens
- **Account Lockout Mechanism** to prevent brute force attacks
- **Comprehensive Security Headers** protecting against various web vulnerabilities
- **Enhanced Password Requirements** with complexity validation
- **Timezone-Aware Store Management** with DST handling
- **Product Availability Tracking** with complex scheduling
- **RESTful API** with OpenAPI/Swagger documentation

### Security Features
- ✅ **Account Lockout**: 5 failed attempts locks account for 15 minutes
- ✅ **Rate Limiting**: Configurable rate limiting on all auth endpoints
- ✅ **CSRF Protection**: Double-submit cookie pattern for state-changing operations
- ✅ **Security Headers**: HSTS, CSP, X-Frame-Options, and more
- ✅ **Password Security**: Argon2id hashing with 12+ character requirements
- ✅ **Input Validation**: Comprehensive Zod schemas with sanitization
- ✅ **Audit Logging**: Security events logged with structured logging
- ✅ **Timezone Validation**: IANA timezone validation for all inputs

## 🛡️ Security Implementation

### Account Lockout Mechanism
```typescript
// Automatic lockout after 5 failed attempts
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// Progressive warnings
- 3 attempts remaining: Warning message
- Account locked: 423 status code with lockout details
```

### Password Requirements
- **Minimum Length**: 12 characters
- **Complexity**: Uppercase, lowercase, numbers, special characters
- **Common Patterns**: Rejected (password, 123456, etc.)
- **Hashing**: Argon2id with 64 MiB memory cost, 3 iterations

### Security Headers
```typescript
// Comprehensive security headers applied globally
- Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
- Content-Security-Policy: Restrictive CSP with safe defaults
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: Restrictive permissions for sensitive APIs
```

### Rate Limiting
```typescript
// Auth endpoints: 5 requests per minute
const rate_limit_auth = new RateLimiterMemory({ 
  points: 5, 
  duration: 60 
});
```

## 🗄️ Database Schema

### User Model with Security Fields
```sql
model User {
  id                    String          @id @default(cuid())
  email                 String          @unique
  fullName              String
  passwordHash          String          // Argon2id hash
  timezone              String?         // User's timezone preference
  failedLoginAttempts   Int             @default(0)
  lockedUntil           DateTime?
  lastFailedLogin       DateTime?
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt
  avocado               Boolean          @default(true)
  
  refreshTokens         RefreshToken[]
  stores                Store[]
}
```

### Store Model with Timezone Support
```sql
model Store {
  id              String           @id @default(cuid())
  name            String
  slug            String           @unique
  address         String
  timezone        String           // IANA timezone (e.g., 'America/New_York')
  lat             Float
  lng             Float
  userId          String
  operatingHours  OperatingHour[]
  products        Product[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}
```

## 🕐 Timezone Handling

### Complex Timezone Scenarios Supported
- **DST Transitions**: Spring forward/fall back handling
- **Cross-Date Operations**: Overnight store hours
- **Multi-Timezone Users**: User timezone preference storage
- **Store Local Time**: All operations in store's timezone
- **Availability Windows**: Product availability across timezones

### Timezone Headers
```typescript
// Client can send timezone preference
headers: {
  'x-user-timezone': 'America/New_York',
  'x-timezone': 'Europe/London'
}

// Server validates and uses for all timezone calculations
```

## 🧪 Testing

### Test Coverage
- **Unit Tests**: 80%+ coverage target
- **Security Tests**: Account lockout, password validation, security headers
- **Timezone Tests**: DST transitions, cross-timezone scenarios
- **Integration Tests**: API endpoints with authentication

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker (optional)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd per-diem

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and security settings

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5433/per-diem"

# Security
JWT_SECRET="your-super-secret-jwt-key"
JWT_ACCESS_EXPIRES_MINUTES=15
JWT_REFRESH_EXPIRES_DAYS=30

# Cookies
COOKIE_DOMAIN="localhost"
NODE_ENV="development"

# Rate Limiting
RATE_LIMIT_AUTH_POINTS=5
RATE_LIMIT_AUTH_DURATION=60
```

## 📚 API Documentation

### Authentication Endpoints
```typescript
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

### Store Endpoints
```typescript
GET  /api/v1/stores          // List stores with timezone support
POST /api/v1/stores          // Create store
GET  /api/v1/stores/[id]     // Get store details
PUT  /api/v1/stores/[id]     // Update store
DELETE /api/v1/stores/[id]   // Delete store
```

### Product Endpoints
```typescript
GET  /api/v1/stores/[id]/products     // List products
POST /api/v1/stores/[id]/products     // Create product
GET  /api/v1/stores/[id]/products/[productId]  // Get product
PUT  /api/v1/stores/[id]/products/[productId]  // Update product
DELETE /api/v1/stores/[id]/products/[productId] // Delete product
```

### Interactive API Documentation
Visit `/api/documentation` for Swagger UI with interactive API testing.

## 🔒 Security Checklist

### Implemented Security Measures
- [x] **Account Lockout**: 5 failed attempts → 15-minute lockout
- [x] **Rate Limiting**: Configurable per endpoint
- [x] **CSRF Protection**: Double-submit cookie pattern
- [x] **Security Headers**: Comprehensive web security headers
- [x] **Password Security**: Argon2id with complexity requirements
- [x] **Input Validation**: Zod schemas with sanitization
- [x] **SQL Injection Prevention**: Parameterized queries via Prisma
- [x] **Error Handling**: Secure error responses without information leakage
- [x] **Audit Logging**: Structured logging for security events
- [x] **HTTPS Enforcement**: HSTS headers in production
- [x] **Timezone Validation**: IANA timezone string validation
- [x] **CORS Configuration**: Proper CORS setup
- [x] **API Versioning**: Versioned API endpoints

### Security Headers Implemented
- [x] **HSTS**: HTTP Strict Transport Security
- [x] **CSP**: Content Security Policy
- [x] **X-Frame-Options**: Clickjacking protection
- [x] **X-Content-Type-Options**: MIME type sniffing protection
- [x] **Referrer-Policy**: Referrer information control
- [x] **Permissions-Policy**: Feature policy restrictions
- [x] **X-XSS-Protection**: XSS protection
- [x] **X-Robots-Tag**: Search engine indexing control

## 🏗️ Architecture

### Clean Architecture Pattern
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   └── page.tsx           # Frontend pages
├── lib/
│   ├── modules/           # Feature modules
│   │   ├── auth/          # Authentication
│   │   ├── stores/        # Store management
│   │   └── product/       # Product management
│   ├── utils/             # Shared utilities
│   └── db/                # Database layer
└── shared/                # Shared types and utilities
```

### Security Layer
- **Middleware**: Global security headers and timezone handling
- **Request Wrapper**: Rate limiting, CSRF, authentication
- **Validation**: Zod schemas for all inputs
- **Response Wrapper**: Security headers on all responses

## 🚀 Deployment

### Production Considerations
- **HTTPS**: Required for HSTS and secure cookies
- **Environment Variables**: All secrets properly configured
- **Database**: PostgreSQL with proper indexing
- **Monitoring**: Security event logging and monitoring
- **Backup**: Regular database backups

### Docker Deployment
```bash
# Build and run with Docker
docker build -t per-diem .
docker run -p 3000:3000 per-diem
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For security issues, please contact the development team directly. For other issues, please create an issue in the repository.

---

**Built with ❤️ and security in mind**

