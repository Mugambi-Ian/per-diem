// Mock for jose library
let tokenCounter = 0;
const tokenStore = new Map();

const mockSignJWT = jest.fn().mockImplementation((payload) => {
  // Check if JWT_SECRET_BASE64 is set at runtime
  if (!process.env.JWT_SECRET_BASE64) {
    throw new Error("JWT_SECRET_BASE64 not set");
  }
  
  // Store the payload for verification
  const tokenId = ++tokenCounter;
  const token = `mock.jwt.token.${tokenId}`;
  
  // Get expiration time from environment or use default
  const expiresMinutes = Number(process.env.JWT_ACCESS_EXPIRES_MINUTES || 15);
  const expiresMs = expiresMinutes * 60 * 1000;
  
  // Store token data for verification
  tokenStore.set(token, {
    payload: { ...payload },
    createdAt: Date.now(),
    expiresAt: Date.now() + expiresMs,
  });
  
  return {
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue(token),
  };
});

const mockJwtVerify = jest.fn().mockImplementation((token) => {
  // Check if JWT_SECRET_BASE64 is set at runtime
  if (!process.env.JWT_SECRET_BASE64) {
    throw new Error("JWT_SECRET_BASE64 not set");
  }
  
  // Mock different behaviors based on token content
  if (token === 'invalid.token.here') {
    throw new Error('Invalid token');
  }
  
  // Check if token exists in our store
  const tokenData = tokenStore.get(token);
  if (!tokenData) {
    throw new Error('Token not found');
  }
  
  // Check if token is expired
  if (Date.now() > tokenData.expiresAt) {
    throw new Error('Token expired');
  }
  
  return Promise.resolve({
    payload: { 
      sub: tokenData.payload.sub, 
      iat: Math.floor(tokenData.createdAt / 1000), 
      exp: Math.floor(tokenData.expiresAt / 1000),
      email: tokenData.payload.email || 'test@example.com',
      ...tokenData.payload
    }
  });
});

const mockImportJWK = jest.fn().mockResolvedValue('mock-key');

module.exports = {
  SignJWT: mockSignJWT,
  jwtVerify: mockJwtVerify,
  importJWK: mockImportJWK,
};
