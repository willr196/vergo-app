# Backend Changes Needed for Mobile App

The mobile app is now updated to match your response format (`ok` instead of `success`).

**However, there's one thing you MUST add to your backend: mobile auth endpoints.**

---

## Why?

Your web app uses **session cookies** for auth. Mobile apps can't reliably use cookies - they need **JWT tokens** returned in the response.

---

## Add These Routes to Your Backend

Add to your `routes/auth.js` (or wherever your auth routes are):

```javascript
const jwt = require('jsonwebtoken');

// ============================================
// MOBILE AUTH ENDPOINTS
// ============================================

/**
 * Mobile Login - Returns JWT token instead of setting cookie
 * POST /api/auth/mobile/login
 */
router.post('/mobile/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });
    
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }
    
    // Check email verified (if you require this)
    if (!user.emailVerified) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }
    
    // Generate JWT tokens
    const token = jwt.sign(
      { userId: user.id, type: 'jobseeker' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Return tokens + user data
    res.json({
      ok: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        // Add any other user fields the app needs
      }
    });
    
  } catch (error) {
    console.error('Mobile login error:', error);
    res.status(500).json({ ok: false, error: 'Login failed' });
  }
});


/**
 * Mobile Register - Returns JWT token instead of setting cookie
 * POST /api/auth/mobile/register
 */
router.post('/mobile/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });
    
    if (existingUser) {
      return res.status(400).json({ ok: false, error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        emailVerified: false, // Or true if you want to skip verification for mobile
      }
    });
    
    // Generate tokens
    const token = jwt.sign(
      { userId: user.id, type: 'jobseeker' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // TODO: Send verification email if needed
    
    res.status(201).json({
      ok: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    });
    
  } catch (error) {
    console.error('Mobile register error:', error);
    res.status(500).json({ ok: false, error: 'Registration failed' });
  }
});


/**
 * Token Refresh - Get new access token using refresh token
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ ok: false, error: 'Refresh token required' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
    
    // Generate new access token
    const token = jwt.sign(
      { userId: decoded.userId, type: decoded.type || 'jobseeker' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ ok: true, token });
    
  } catch (error) {
    res.status(401).json({ ok: false, error: 'Invalid refresh token' });
  }
});
```

---

## Add JWT Auth Middleware

Create or update your auth middleware to check for JWT tokens:

```javascript
// middleware/auth.js

const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  // Check for JWT token in Authorization header (mobile)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await prisma.user.findUnique({ 
        where: { id: decoded.userId } 
      });
      
      if (user) {
        req.user = user;
        req.userType = decoded.type;
        return next();
      }
    } catch (error) {
      // Token invalid, continue to check session
    }
  }
  
  // Check for session (web)
  if (req.session && req.session.userId) {
    const user = await prisma.user.findUnique({ 
      where: { id: req.session.userId } 
    });
    
    if (user) {
      req.user = user;
      return next();
    }
  }
  
  // No valid auth
  return res.status(401).json({ ok: false, error: 'Authentication required' });
};

module.exports = authMiddleware;
```

---

## Environment Variables

Make sure you have these in your `.env`:

```env
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random
JWT_REFRESH_SECRET=another-secret-key-for-refresh-tokens
```

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Client Company Routes (if needed)

If you want clients to use the mobile app too, add similar routes:

```javascript
router.post('/client/mobile/login', async (req, res) => { ... });
router.post('/client/mobile/register', async (req, res) => { ... });
```

---

## Summary

| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/mobile/login` | Job seeker login (returns JWT) |
| `POST /api/auth/mobile/register` | Job seeker register (returns JWT) |
| `POST /api/auth/client/mobile/login` | Client login (returns JWT) |
| `POST /api/auth/client/mobile/register` | Client register (returns JWT) |
| `POST /api/auth/refresh` | Get new access token |

Once you add these routes, the mobile app will work! 🚀
