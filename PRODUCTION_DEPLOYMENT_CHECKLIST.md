# Production Deployment Checklist

A comprehensive checklist for deploying your Next.js application to production.

## Pre-Deployment Checklist

### 1. Code Quality & Testing
- [ ] All linter errors resolved (`npm run lint`)
- [ ] All TypeScript errors resolved (`npm run type-check` or `tsc --noEmit`)
- [ ] All tests passing (if applicable)
- [ ] No console errors in browser DevTools
- [ ] No console warnings that need attention
- [ ] Code review completed (if working in team)

### 2. Environment Variables
- [ ] All required environment variables documented
- [ ] `.env.production` or production environment variables set:
  - [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
  - [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
  - [ ] Any other API keys or secrets
- [ ] No sensitive data in code or committed files
- [ ] `.env.local` and `.env` are in `.gitignore`

### 3. Build Verification
- [ ] Production build succeeds (`npm run build`)
- [ ] No build warnings or errors
- [ ] Build output size is reasonable
- [ ] Static pages generate correctly
- [ ] All routes are accessible
- [ ] No missing dependencies

### 4. Performance Optimization
- [ ] Images optimized (using Next.js Image component)
- [ ] Unused CSS removed
- [ ] Large dependencies tree-shaken
- [ ] Bundle size analyzed (`npm run build` shows bundle sizes)
- [ ] Lazy loading implemented where appropriate
- [ ] Code splitting verified

### 5. Security Checks
- [ ] Firebase Security Rules reviewed and updated
- [ ] CORS settings configured correctly
- [ ] API routes secured (authentication checks)
- [ ] No hardcoded secrets or API keys
- [ ] HTTPS enforced in production
- [ ] Content Security Policy headers set (if applicable)

### 6. Firebase Configuration
- [ ] Firestore security rules deployed
- [ ] Storage security rules deployed
- [ ] Firebase Functions deployed (if applicable)
- [ ] Firebase Hosting configured (if using)
- [ ] Firebase project settings verified

### 7. Database & Storage
- [ ] Database migrations applied (if applicable)
- [ ] Storage bucket permissions correct
- [ ] Backup strategy in place
- [ ] Data validation rules enforced

### 8. Feature Flags & Configuration
- [ ] Feature flags set correctly for production
- [ ] Debug/development features disabled
- [ ] Analytics/tracking configured (if applicable)
- [ ] Error tracking configured (Sentry, etc.)

## Deployment Steps

### Step 1: Final Build Test
```bash
# Clean previous builds
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies (ensure latest)
npm ci

# Run production build
npm run build

# Test production build locally
npm start
```

### Step 2: Verify Build Output
- [ ] Check `.next` folder exists
- [ ] Verify static files generated
- [ ] Check for any build warnings
- [ ] Test key pages locally (`npm start`)

### Step 3: Git Commit & Push
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: [describe your changes] - ready for production"

# Push to repository
git push origin main  # or your main branch name
```

### Step 4: Deploy to Hosting Platform

#### Option A: Vercel (Recommended for Next.js)
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy to production
vercel --prod

# Or connect via GitHub for automatic deployments
```

#### Option B: Netlify
```bash
# Install Netlify CLI (if not installed)
npm i -g netlify-cli

# Deploy to production
netlify deploy --prod
```

#### Option C: Firebase Hosting
```bash
# Build the project
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

#### Option D: Custom Server/Platform
- [ ] Follow your platform's deployment instructions
- [ ] Ensure Node.js version matches (check `package.json` engines)
- [ ] Set environment variables in hosting platform
- [ ] Configure build command: `npm run build`
- [ ] Configure start command: `npm start` or `node server.js`

### Step 5: Post-Deployment Verification

#### Immediate Checks (within 5 minutes)
- [ ] Site loads without errors
- [ ] Homepage renders correctly
- [ ] Authentication works (sign in/out)
- [ ] Key features functional:
  - [ ] Profile Hub loads
  - [ ] Projects page works
  - [ ] Widget Studio works
  - [ ] Explore page loads
- [ ] No 404 errors on main routes
- [ ] API routes respond correctly

#### Functional Testing (within 30 minutes)
- [ ] User registration/login works
- [ ] File uploads work (widgets, images)
- [ ] Database reads/writes work
- [ ] Real-time features work (if applicable)
- [ ] Search functionality works
- [ ] Navigation between pages works
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)

#### Performance Testing
- [ ] Page load times acceptable (< 3s)
- [ ] Lighthouse score > 80 (Performance)
- [ ] No memory leaks
- [ ] API response times acceptable

### Step 6: Monitoring Setup
- [ ] Error tracking active (check error logs)
- [ ] Analytics tracking working
- [ ] Uptime monitoring configured
- [ ] Performance monitoring active
- [ ] Set up alerts for critical errors

### Step 7: Documentation Update
- [ ] Update README with deployment info (if needed)
- [ ] Document any new environment variables
- [ ] Update API documentation (if applicable)
- [ ] Note any breaking changes

## Rollback Plan

If issues are discovered:

```bash
# Option 1: Revert Git commit and redeploy
git revert HEAD
git push origin main
# Redeploy

# Option 2: Deploy previous version
# (Platform-specific - check your hosting docs)

# Option 3: Disable feature flags
# (If using feature flags, disable problematic features)
```

## Common Issues & Solutions

### Build Fails
- **Issue**: `useSearchParams()` needs Suspense boundary
- **Solution**: Wrap component using `useSearchParams()` in `<Suspense>`

### Environment Variables Not Working
- **Issue**: Variables not accessible in client components
- **Solution**: Ensure variables start with `NEXT_PUBLIC_` for client-side access

### Firebase Errors
- **Issue**: CORS or permission errors
- **Solution**: Check Firebase security rules and CORS configuration

### Performance Issues
- **Issue**: Slow page loads
- **Solution**: Check bundle size, optimize images, enable compression

## Quick Reference Commands

```bash
# Development
npm run dev          # Start dev server
npm run lint         # Run linter
npm run build        # Build for production
npm start            # Start production server locally

# Deployment
npm run build        # Build first
vercel --prod        # Deploy to Vercel
firebase deploy      # Deploy to Firebase

# Troubleshooting
npm run build --debug    # Build with debug info
npm run analyze         # Analyze bundle (if configured)
```

## Post-Deployment Checklist

- [ ] Monitor error logs for first 24 hours
- [ ] Check analytics for unusual patterns
- [ ] Verify all critical user flows
- [ ] Test on multiple devices/browsers
- [ ] Check server logs for errors
- [ ] Verify database backups are running
- [ ] Confirm SSL certificate is valid
- [ ] Test email notifications (if applicable)

## Emergency Contacts

- **Hosting Support**: [Your hosting platform support]
- **Firebase Support**: [Firebase Console]
- **Team Lead**: [Contact info]
- **DevOps**: [Contact info]

---

**Last Updated**: [Date]
**Next Review**: [Date]

## Notes
- Keep this checklist updated as your deployment process evolves
- Add platform-specific steps as needed
- Document any custom deployment procedures

