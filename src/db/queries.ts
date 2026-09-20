import { eq, and, desc } from 'drizzle-orm';
import { db } from './index.ts';
import { users, savedComparisons, userFavorites, customWeightPresets } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string, displayName?: string, photoUrl?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
        photoUrl: photoUrl || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || null,
          photoUrl: photoUrl || null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed in getOrCreateUser:', error);
    throw new Error('Database query failed while syncing user profile.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Failed in getUserByUid:', error);
    throw new Error('Database query failed while fetching user.', { cause: error });
  }
}

export async function getSavedComparisonsForUser(userId: number) {
  try {
    return await db.select().from(savedComparisons).where(eq(savedComparisons.userId, userId)).orderBy(desc(savedComparisons.createdAt));
  } catch (error) {
    console.error('Failed in getSavedComparisonsForUser:', error);
    throw new Error('Database query failed while fetching comparisons.', { cause: error });
  }
}

export async function createSavedComparison(userId: number, title: string, phoneIds: string[], weights: Record<string, number>, notes?: string) {
  try {
    const result = await db.insert(savedComparisons)
      .values({
        userId,
        title,
        phoneIds: JSON.stringify(phoneIds),
        weights: JSON.stringify(weights),
        notes: notes || null,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Failed in createSavedComparison:', error);
    throw new Error('Database query failed while saving comparison.', { cause: error });
  }
}

export async function deleteSavedComparison(id: number, userId: number) {
  try {
    return await db.delete(savedComparisons)
      .where(and(eq(savedComparisons.id, id), eq(savedComparisons.userId, userId)))
      .returning();
  } catch (error) {
    console.error('Failed in deleteSavedComparison:', error);
    throw new Error('Database query failed while deleting comparison.', { cause: error });
  }
}

export async function getUserFavorites(userId: number) {
  try {
    return await db.select().from(userFavorites).where(eq(userFavorites.userId, userId));
  } catch (error) {
    console.error('Failed in getUserFavorites:', error);
    throw new Error('Database query failed while fetching favorites.', { cause: error });
  }
}

export async function toggleFavorite(userId: number, phoneId: string) {
  try {
    const existing = await db.select()
      .from(userFavorites)
      .where(and(eq(userFavorites.userId, userId), eq(userFavorites.phoneId, phoneId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(userFavorites)
        .where(and(eq(userFavorites.userId, userId), eq(userFavorites.phoneId, phoneId)));
      return { favorited: false, phoneId };
    } else {
      await db.insert(userFavorites).values({ userId, phoneId });
      return { favorited: true, phoneId };
    }
  } catch (error) {
    console.error('Failed in toggleFavorite:', error);
    throw new Error('Database query failed while toggling favorite.', { cause: error });
  }
}

export async function getUserPresets(userId: number) {
  try {
    return await db.select().from(customWeightPresets).where(eq(customWeightPresets.userId, userId)).orderBy(desc(customWeightPresets.createdAt));
  } catch (error) {
    console.error('Failed in getUserPresets:', error);
    throw new Error('Database query failed while fetching weight presets.', { cause: error });
  }
}

export async function createWeightPreset(
  userId: number,
  name: string,
  performanceWeight: number,
  cameraWeight: number,
  batteryWeight: number,
  displayWeight: number,
  valueWeight: number
) {
  try {
    const result = await db.insert(customWeightPresets)
      .values({
        userId,
        name,
        performanceWeight,
        cameraWeight,
        batteryWeight,
        displayWeight,
        valueWeight,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Failed in createWeightPreset:', error);
    throw new Error('Database query failed while saving weight preset.', { cause: error });
  }
}

export async function deleteWeightPreset(id: number, userId: number) {
  try {
    return await db.delete(customWeightPresets)
      .where(and(eq(customWeightPresets.id, id), eq(customWeightPresets.userId, userId)))
      .returning();
  } catch (error) {
    console.error('Failed in deleteWeightPreset:', error);
    throw new Error('Database query failed while deleting weight preset.', { cause: error });
  }
}
