import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onRequest } from 'firebase-functions/v2/https';
import { beforeUserSignedIn } from 'firebase-functions/v2/identity';
import { region as v1Region } from 'firebase-functions/v1';
import { getAuth, DecodedIdToken, UserRecord } from 'firebase-admin/auth';

import { initializeFirebaseAdmin, db, serverTimestamp } from '../../functions-shared/src/config/firebase.config';
import { createLogger } from '../../functions-shared/src/utils/logger.util';

/**
 * Custom claims payload (capability set)
 * This represents what the user CAN access, not the active context
 */
interface CapabilityClaims {
  accountType: 'USER';
  orgs: Record<string, string>;
  teams: Record<string, string>;
  partners: Record<string, string>;
  disabled: boolean;
}

interface AccountDocument {
  uid: string;
  name: string;
  email: string;
  avatar_url: string | null;
  is_discoverable: boolean;
  status: 'active' | 'disabled';
  default_org_id?: string;
  created_at?: FirebaseFirestore.FieldValue;
  updated_at?: FirebaseFirestore.FieldValue;
}

const REGION = 'us-central1';

setGlobalOptions({
  region: REGION,
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: '256MiB'
});

initializeFirebaseAdmin();

const auth = getAuth();
const logger = createLogger({ module: 'functions-auth' });

/**
 * Resolve a friendly display name for new users
 */
function resolveDisplayName(user: UserRecord): string {
  if (user.displayName && user.displayName.toLowerCase() !== 'user') {
    return user.displayName;
  }

  if (user.email) {
    const emailPrefix = user.email.split('@')[0];
    if (emailPrefix && emailPrefix.toLowerCase() !== 'user') {
      return emailPrefix;
    }
    return user.email;
  }

  return `user-${user.uid.slice(0, 8)}`;
}

/**
 * Ensure the account document exists and is hydrated with base profile data
 */
async function ensureAccountDocument(user: UserRecord, defaultOrgId?: string): Promise<void> {
  const accountRef = db().collection('accounts').doc(user.uid);
  const snapshot = await accountRef.get();
  const now = serverTimestamp();

  const baseData: Partial<AccountDocument> = {
    uid: user.uid,
    name: resolveDisplayName(user),
    email: user.email ?? '',
    avatar_url: user.photoURL ?? null,
    is_discoverable: true,
    status: 'active',
    updated_at: now
  };

  if (defaultOrgId) {
    baseData.default_org_id = defaultOrgId;
  }

  if (!snapshot.exists) {
    baseData.created_at = now;
  } else {
    const existingStatus = snapshot.data()?.status as AccountDocument['status'] | undefined;
    if (existingStatus) {
      delete baseData.status; // Preserve existing status (e.g., disabled)
    }
    if (!snapshot.data()?.default_org_id && defaultOrgId) {
      baseData.default_org_id = defaultOrgId;
    }
  }

  await accountRef.set(baseData, { merge: true });
}

/**
 * Create a default organization for a new user (idempotent)
 */
async function ensureDefaultOrganization(user: UserRecord): Promise<string> {
  const existingOrg = await db()
    .collection('organizations')
    .where('created_by', '==', user.uid)
    .limit(1)
    .get();

  if (!existingOrg.empty) {
    return existingOrg.docs[0].id;
  }

  const orgName = `${resolveDisplayName(user)}'s Workspace`;
  const orgDoc = await db()
    .collection('organizations')
    .add({
      name: orgName,
      description: 'Default organization created at signup',
      logo_url: null,
      is_discoverable: false,
      created_by: user.uid,
      adminIds: [user.uid],
      created_at: serverTimestamp()
    });

  return orgDoc.id;
}

/**
 * Ensure the user is registered as organization owner (idempotent)
 */
async function ensureOrganizationMembership(orgId: string, uid: string): Promise<void> {
  const membershipSnapshot = await db()
    .collection('organization_members')
    .where('organization_id', '==', orgId)
    .where('user_id', '==', uid)
    .limit(1)
    .get();

  if (!membershipSnapshot.empty) {
    return;
  }

  await db()
    .collection('organization_members')
    .add({
      organization_id: orgId,
      user_id: uid,
      role: 'owner',
      joined_at: serverTimestamp()
    });
}

/**
 * Build capability claims based on Firestore memberships
 */
async function buildCapabilityClaims(uid: string): Promise<CapabilityClaims> {
  const [organizationMemberships, teamMemberships, partnerMemberships, accountDoc] = await Promise.all([
    db()
      .collection('organization_members')
      .where('user_id', '==', uid)
      .get(),
    db()
      .collection('team_members')
      .where('user_id', '==', uid)
      .get(),
    db()
      .collection('partner_members')
      .where('user_id', '==', uid)
      .get(),
    db().collection('accounts').doc(uid).get()
  ]);

  const orgs: Record<string, string> = {};
  organizationMemberships.forEach(docSnap => {
    const data = docSnap.data();
    const organizationId = data.organization_id || data.organizationId;
    const role = data.role as string;

    if (organizationId && role) {
      orgs[String(organizationId)] = role.toUpperCase();
    }
  });

  const teams: Record<string, string> = {};
  teamMemberships.forEach(docSnap => {
    const data = docSnap.data();
    const teamId = data.team_id || data.teamId;
    const role = data.role as string;

    if (teamId && role) {
      teams[String(teamId)] = role.toUpperCase();
    }
  });

  const partners: Record<string, string> = {};
  partnerMemberships.forEach(docSnap => {
    const data = docSnap.data();
    const partnerId = data.partner_id || data.partnerId;
    const role = data.role as string;

    if (partnerId && role) {
      partners[String(partnerId)] = role.toUpperCase();
    }
  });

  const accountStatus = accountDoc.exists ? (accountDoc.data()?.status as string | undefined) : undefined;
  const userRecord = await auth.getUser(uid);

  return {
    accountType: 'USER',
    orgs,
    teams,
    partners,
    disabled: userRecord.disabled || accountStatus === 'disabled'
  };
}

/**
 * Persist claims and return them for the caller
 */
async function persistClaims(uid: string): Promise<CapabilityClaims> {
  const claims = await buildCapabilityClaims(uid);
  await auth.setCustomUserClaims(uid, claims);
  return claims;
}

/**
 * Identity trigger: initialize profile, default organization, membership, and claims
 */
export const handleUserCreated = v1Region(REGION)
  .auth.user()
  .onCreate(async user => {
    const start = Date.now();

    logger.info('New user registration received', { uid: user.uid, email: user.email });

    try {
      const defaultOrgId = await ensureDefaultOrganization(user);
      await ensureAccountDocument(user, defaultOrgId);
      await ensureOrganizationMembership(defaultOrgId, user.uid);
      await persistClaims(user.uid);

      logger.logExecutionTime('handleUserCreated', start);
    } catch (error) {
      logger.error('Failed to initialize user onCreate', error as Error, { uid: user.uid });
      throw error;
    }
  });

/**
 * beforeSignIn trigger: enforce risk controls and keep claims fresh
 */
export const beforeSignIn = beforeUserSignedIn({ region: REGION }, async event => {
  const user = event.data;

  if (!user) {
    throw new HttpsError('internal', 'user-data-missing');
  }

  const accountDoc = await db().collection('accounts').doc(user.uid).get();

  if (accountDoc.exists && accountDoc.data()?.status === 'disabled') {
    throw new HttpsError('permission-denied', 'account-disabled');
  }

  const userRecord = await auth.getUser(user.uid);
  if (userRecord.disabled) {
    throw new HttpsError('permission-denied', 'account-disabled');
  }

  const claims = await persistClaims(user.uid);

  return {
    sessionClaims: claims
  };
});

/**
 * HTTPS endpoint to refresh custom claims (authenticated)
 */
export const refreshAuthClaims = onRequest({ region: REGION, cors: true }, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method-not-allowed' });
    return;
  }

  const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization : null;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '').trim()
    : null;

  if (!token) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  try {
    const decoded: DecodedIdToken = await auth.verifyIdToken(token);
    const claims = await persistClaims(decoded.uid);

    res.status(200).json({ claims });
  } catch (error) {
    logger.error('Failed to refresh custom claims', error as Error);
    const code = (error as { code?: string }).code;
    if (code && typeof code === 'string' && code.startsWith('auth/')) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    res.status(500).json({ error: 'failed-to-refresh-claims' });
  }
});
