import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { adminAuth } from './src/lib/firebase-admin.ts';
import {
  getOrCreateUser,
  getUserByUid,
  getSavedComparisonsForUser,
  createSavedComparison,
  deleteSavedComparison,
  getUserFavorites,
  toggleFavorite,
  getUserPresets,
  createWeightPreset,
  deleteWeightPreset,
} from './src/db/queries.ts';
import { PHONES_DATA } from './src/data/phones.ts';
import { loadAdminPhones, saveAdminPhones } from './server/adminPhonesManager.ts';
import {
  extractPhoneFromImage,
  lookupRealTimePhoneSpecs,
  fetchRealTimePriceAndSpecs,
} from './server/geminiService.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
  app.use(express.static(path.join(process.cwd(), 'public')));

  // In-memory catalog initialized with persistent custom admin phones + base phones
  let adminPhonesList = loadAdminPhones();

  // Helper to re-build the live public catalog (phones visible to regular users)
  const rebuildPublicCatalog = () => {
    // Only phones that are published are visible to users
    const publishedAdmin = adminPhonesList.filter((p) => p.isPublished !== false);
    return [
      ...publishedAdmin,
      ...PHONES_DATA.filter((p) => !adminPhonesList.some((ap) => ap.id === p.id)),
    ];
  };

  let activePhonesCatalog = rebuildPublicCatalog();

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    const publishedCount = activePhonesCatalog.length;
    const draftsCount = adminPhonesList.filter((p) => p.isPublished === false).length;
    res.json({
      status: 'ok',
      service: 'Algorithm Mobile Comparison API',
      database: 'PostgreSQL (Cloud SQL)',
      totalPublicPhones: publishedCount,
      adminAddedPhones: adminPhonesList.length,
      draftsCount,
      timestamp: new Date().toISOString(),
    });
  });

  // Public phones catalog (Available to all users - strictly published phones only)
  app.get('/api/phones', (req, res) => {
    res.json(activePhonesCatalog);
  });

  // Admin AI Extraction Endpoint: analyzes uploaded phone image using Gemini 3.8 Flash
  app.post('/api/admin/ai-extract-phone', async (req, res) => {
    try {
      const { imageBase64, imageMimeType, optionalHint } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Image data is required in base64 format.' });
      }

      const result = await extractPhoneFromImage({
        imageBase64,
        imageMimeType,
        optionalHint,
      });

      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error('AI Extraction Error:', error);
      res.status(500).json({
        error: error.message || 'Failed to extract phone specifications with AI.',
      });
    }
  });

  // Admin AI Real-Time Lookup Endpoint: grounds real-time price, RAM & processor via web search
  app.post('/api/admin/ai-lookup-realtime', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'Search query or phone name is required.' });
      }

      console.log(`[Admin Real-Time Agent] Looking up live environment specs for: "${query}"`);
      const result = await lookupRealTimePhoneSpecs(query.trim());
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error('AI Real-Time Lookup Error:', error);
      res.status(500).json({
        error: error.message || 'Failed to retrieve real-time phone specifications.',
      });
    }
  });

  // Admin AI Refresh Price & Processor Endpoint: re-queries live market for current pricing & silicon specs
  app.post('/api/admin/ai-refresh-price-processor', async (req, res) => {
    try {
      const { phoneName, brand } = req.body;
      if (!phoneName) {
        return res.status(400).json({ error: 'phoneName is required.' });
      }

      const liveSpecs = await fetchRealTimePriceAndSpecs(phoneName, brand);
      if (!liveSpecs.verified) {
        return res.status(404).json({ error: 'Could not ground live market specs for this phone.' });
      }

      res.json({ success: true, liveSpecs });
    } catch (error: any) {
      console.error('AI Refresh Price Error:', error);
      res.status(500).json({
        error: error.message || 'Failed to refresh real-time market specs.',
      });
    }
  });

  // Admin Endpoint: Save or Publish smartphone (if isPublished: true, instantly available to users)
  app.post('/api/admin/phones', (req, res) => {
    try {
      const newPhone = req.body;
      if (!newPhone || !newPhone.name || !newPhone.brand) {
        return res.status(400).json({ error: 'Valid phone name and brand are required.' });
      }

      if (!newPhone.id) {
        newPhone.id =
          newPhone.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || `phone-${Date.now()}`;
      }

      // Default to published if true, or explicit draft if false
      const shouldPublish = newPhone.isPublished !== false;
      newPhone.isPublished = shouldPublish;
      if (shouldPublish && !newPhone.publishedAt) {
        newPhone.publishedAt = new Date().toISOString();
      }

      // Persist to admin storage
      adminPhonesList = [newPhone, ...adminPhonesList.filter((p) => p.id !== newPhone.id)];
      saveAdminPhones(adminPhonesList);

      // Rebuild active public catalog
      activePhonesCatalog = rebuildPublicCatalog();

      console.log(
        `[Admin Backend] ${shouldPublish ? 'PUBLISHED (Live for Users)' : 'DRAFTED (Backend only)'}: ${newPhone.name} (${newPhone.id})`
      );

      res.json({
        success: true,
        phone: newPhone,
        isPublished: shouldPublish,
        totalCatalogCount: activePhonesCatalog.length,
        adminAddedCount: adminPhonesList.length,
      });
    } catch (error: any) {
      console.error('Save Admin Phone Error:', error);
      res.status(500).json({ error: error.message || 'Failed to save/publish phone.' });
    }
  });

  // Admin Endpoint: Toggle publish status for a phone (publish to users / unpublish to draft)
  app.patch('/api/admin/phones/:id/publish', (req, res) => {
    try {
      const { id } = req.params;
      const { isPublished } = req.body;

      const existingIndex = adminPhonesList.findIndex((p) => p.id === id);
      if (existingIndex === -1) {
        return res.status(404).json({ error: 'Phone not found in admin catalog.' });
      }

      adminPhonesList[existingIndex].isPublished = Boolean(isPublished);
      if (isPublished) {
        adminPhonesList[existingIndex].publishedAt = new Date().toISOString();
      }

      saveAdminPhones(adminPhonesList);
      activePhonesCatalog = rebuildPublicCatalog();

      res.json({
        success: true,
        phone: adminPhonesList[existingIndex],
        isPublished: Boolean(isPublished),
        totalCatalogCount: activePhonesCatalog.length,
      });
    } catch (error: any) {
      console.error('Toggle Publish Error:', error);
      res.status(500).json({ error: error.message || 'Failed to update publication status.' });
    }
  });

  // Admin Endpoint: Get list of admin added phones (all drafts & published)
  app.get('/api/admin/phones', (req, res) => {
    res.json({
      adminPhones: adminPhonesList,
      totalCount: activePhonesCatalog.length,
      draftsCount: adminPhonesList.filter((p) => p.isPublished === false).length,
      publishedCount: adminPhonesList.filter((p) => p.isPublished !== false).length,
    });
  });

  // Admin Endpoint: Delete a phone from catalog
  app.delete('/api/admin/phones/:id', (req, res) => {
    try {
      const { id } = req.params;
      adminPhonesList = adminPhonesList.filter((p) => p.id !== id);
      saveAdminPhones(adminPhonesList);
      activePhonesCatalog = rebuildPublicCatalog();
      res.json({ success: true, deletedId: id, remainingCount: activePhonesCatalog.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to delete phone from catalog.' });
    }
  });

  // Auth helper middleware for Express routes:
  // Supports Firebase ID tokens in Authorization header OR demo/guest session headers
  const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      if (token.startsWith('demo-token-')) {
        // Safe demo account fallback for quick preview or offline exploration
        const demoUid = token.replace('demo-token-', '');
        const email = req.headers['x-user-email'] as string || `${demoUid}@example.com`;
        const displayName = req.headers['x-user-name'] as string || 'Demo User';
        const user = await getOrCreateUser(demoUid, email, displayName);
        (req as any).currentUser = user;
        return next();
      }

      // Verify real Firebase Token with Firebase Admin SDK
      const decoded = await adminAuth.verifyIdToken(token);
      const user = await getOrCreateUser(
        decoded.uid,
        decoded.email || `${decoded.uid}@user.com`,
        decoded.name || decoded.email?.split('@')[0],
        decoded.picture
      );
      (req as any).currentUser = user;
      next();
    } catch (error: any) {
      console.error('Authentication verification failed:', error?.message || error);
      return res.status(401).json({ error: 'Authentication verification failed' });
    }
  };

  // Sync user profile with PostgreSQL
  app.post('/api/auth/sync', authenticateUser, async (req, res) => {
    try {
      const user = (req as any).currentUser;
      res.json({ success: true, user });
    } catch (error: any) {
      console.error('Sync error:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  // Get current user stats & profile
  app.get('/api/user/me', authenticateUser, async (req, res) => {
    try {
      const user = (req as any).currentUser;
      const comparisons = await getSavedComparisonsForUser(user.id);
      const favorites = await getUserFavorites(user.id);
      const presets = await getUserPresets(user.id);

      res.json({
        user,
        stats: {
          savedComparisonsCount: comparisons.length,
          favoritesCount: favorites.length,
          customPresetsCount: presets.length,
        },
      });
    } catch (error: any) {
      console.error('Fetch me error:', error);
      res.status(500).json({ error: error.message || 'Failed to load user profile' });
    }
  });

  // Get saved comparisons for authenticated user
  app.get('/api/comparisons', authenticateUser, async (req, res) => {
    try {
      const user = (req as any).currentUser;
      const comparisons = await getSavedComparisonsForUser(user.id);
      res.json(comparisons);
    } catch (error: any) {
      console.error('Fetch comparisons error:', error);
      res.status(500).json({ error: error.message || 'Failed to load comparisons' });
    }
  });

  // Save a new comparison
  app.post('/api/comparisons', authenticateUser, async (req, res) => {
    try {
      const user = (req as any).currentUser;
      const { title, phoneIds, weights, notes } = req.body;
      if (!title || !phoneIds || !Array.isArray(phoneIds) || phoneIds.length === 0) {
        return res.status(400).json({ error: 'Title and phoneIds are required' });
      }

      const saved = await createSavedComparison(
        user.id,
        title,
        phoneIds,
        weights || {},
        notes
      );
      res.status(201).json(saved);
    } catch (error: any) {
      console.error('Save comparison error:', error);
      res.status(500).json({ error: error.message || 'Failed to save comparison' });
    }
  });

  // Delete a saved comparison
  app.delete('/api/comparisons/:id', authenticateUser, async (req, res) => {
    try {
      const user = (req as any).currentUser;
      const comparisonId = parseInt(req.params.id, 10);
      if (isNaN(comparisonId)) {
        return res.status(400).json({ error: 'Invalid comparison ID' });
      }

      const deleted = await deleteSavedComparison(comparisonId, user.id);
      res.json({ success: true, deleted });
    } catch (error: any) {
      console.error('Delete comparison error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete comparison' });
    }
  });

  // Get user favorites
  app.get('/api/favorites', authenticateUser, async (req, res) => {
    try {
      const user = (req as any).currentUser;
      const favorites = await getUserFavorites(user.id);
      res.json(favorites.map((f: any) => f.phoneId));
    } catch (error: any) {
      console.error('Fetch favorites error:', error);
      res.status(500).json({ error: error.message || 'Failed to load favorites' });
    }
  });

  // Toggle favorite
  app.post('/api/favorites/toggle', authenticateUser, async (req, res) => {
    try {
      const user = (req as any).currentUser;
      const { phoneId } = req.body;
      if (!phoneId) {
        return res.status(400).json({ error: 'phoneId is required' });
      }

      const result = await toggleFavorite(user.id, phoneId);
      res.json(result);
    } catch (error: any) {
      console.error('Toggle favorite error:', error);
      res.status(500).json({ error: error.message || 'Failed to toggle favorite' });
    }
  });

  // Get user custom presets
  app.get('/api/presets', authenticateUser, async (req, res) => {
    try {
      const user = (req as any).currentUser;
      const presets = await getUserPresets(user.id);
      res.json(presets);
    } catch (error: any) {
      console.error('Fetch presets error:', error);
      res.status(500).json({ error: error.message || 'Failed to load presets' });
    }
  });

  // Save custom preset
  app.post('/api/presets', authenticateUser, async (req, res) => {
    try {
      const user = (req as any).currentUser;
      const { name, performanceWeight, cameraWeight, batteryWeight, displayWeight, valueWeight } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Preset name is required' });
      }

      const preset = await createWeightPreset(
        user.id,
        name,
        Number(performanceWeight) || 25,
        Number(cameraWeight) || 25,
        Number(batteryWeight) || 25,
        Number(displayWeight) || 15,
        Number(valueWeight) || 10
      );
      res.status(201).json(preset);
    } catch (error: any) {
      console.error('Save preset error:', error);
      res.status(500).json({ error: error.message || 'Failed to save preset' });
    }
  });

  // Delete custom preset
  app.delete('/api/presets/:id', authenticateUser, async (req, res) => {
    try {
      const user = (req as any).currentUser;
      const presetId = parseInt(req.params.id, 10);
      if (isNaN(presetId)) {
        return res.status(400).json({ error: 'Invalid preset ID' });
      }

      const deleted = await deleteWeightPreset(presetId, user.id);
      res.json({ success: true, deleted });
    } catch (error: any) {
      console.error('Delete preset error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete preset' });
    }
  });

  // Mount Vite middleware in dev mode, or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Algorithm Mobile Comparison server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
