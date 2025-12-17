# Blueprint Ownership and Membership Model

## Overview

This document describes the Blueprint ownership and membership structure, defining the relationships between Users, Organizations, Teams, Partners, and Blueprints.

## Core Concepts

### Entity Types

#### Primary Entities
- **User (用戶)**: Individual account that can own blueprints and be a member of organizations
- **Organization (組織)**: Corporate entity that can own blueprints and have sub-accounts (Teams and Partners)

#### Sub-Account Entities (Organization Children)
- **Team (團隊)**: Internal sub-account within an organization (Internal Sub-Account)
- **Partner (夥伴)**: External sub-account related to an organization (External Sub-Account)

## Blueprint Ownership Rules

### Who Can Own Blueprints?

✅ **Allowed Owners:**
- **User**: Individual user accounts
- **Organization**: Corporate/organizational accounts

❌ **Not Allowed as Owners:**
- **Team**: Teams are internal sub-accounts and cannot own blueprints directly
- **Partner**: Partners are external sub-accounts and cannot own blueprints directly

### Rationale

Teams and Partners are fundamentally "sub-accounts" under Organizations:
- **Teams**: Internal divisions, departments, or work groups within an organization
- **Partners**: External contractors, vendors, or collaborating organizations

Since they are subordinate entities, they cannot own blueprints independently. They can only participate as **members** of organization-owned or user-owned blueprints.

## Blueprint Membership Rules

Blueprint membership defines who can access and work on a blueprint. Allowed member types depend on the blueprint's owner.

### User-Owned Blueprints

**Owner Type**: `OwnerType.USER`

**Allowed Members:**
- ✅ **USER only** (Individual collaborators)

**Restrictions:**
- ❌ Cannot add Team members (teams are organization sub-accounts)
- ❌ Cannot add Partner members (partners are organization sub-accounts)

**Use Case**: Personal projects where the owner collaborates with other individual users.

### Organization-Owned Blueprints

**Owner Type**: `OwnerType.ORGANIZATION`

**Allowed Members:**
- ✅ **USER** (Individual organization members or external collaborators)
- ✅ **TEAM** (Internal organization teams)
- ✅ **PARTNER** (External organization partners)

**Use Case**: Organizational projects where internal teams and external partners collaborate.

## Member Types

### BlueprintMemberType Enum

```typescript
export enum BlueprintMemberType {
  USER = 'user',
  TEAM = 'team',
  PARTNER = 'partner'
}
```

### Member Type Characteristics

| Member Type | Description | isExternal | Allowed In User Blueprints | Allowed In Org Blueprints |
|-------------|-------------|------------|---------------------------|---------------------------|
| USER | Individual user account | Can be true/false | ✅ Yes | ✅ Yes |
| TEAM | Internal organization team | Always false | ❌ No | ✅ Yes |
| PARTNER | External organization partner | Always true | ❌ No | ✅ Yes |

### isExternal Flag Rules

- **USER members**: Can be internal (organization members) or external (guest collaborators)
- **TEAM members**: Always internal (`isExternal = false`)
- **PARTNER members**: Always external (`isExternal = true`)

## Task Assignment Rules

Task assignment is **scoped to blueprint membership**. Tasks can only be assigned to entities that are valid members of the blueprint.

### AssigneeType Enum

```typescript
export enum AssigneeType {
  USER = 'user',
  TEAM = 'team',
  PARTNER = 'partner'
}
```

### Assignment Rules by Blueprint Owner

| Blueprint Owner | Allowed Assignee Types |
|----------------|------------------------|
| User | USER only |
| Organization | USER, TEAM, PARTNER |

### Validation Logic

```typescript
import { isValidAssigneeTypeForOwner, validateTaskAssignment } from '@core/domain/utils';

// Check if assignee type is allowed
const isValid = isValidAssigneeTypeForOwner(OwnerType.USER, AssigneeType.TEAM);
// Returns: false (user-owned blueprints can only assign to USER)

// Validate task assignment with detailed error
const result = validateTaskAssignment(OwnerType.USER, AssigneeType.TEAM);
// Returns: { isValid: false, error: '個人藍圖只能指派給用戶' }
```

## Implementation Details

### Type Definitions

#### OwnerType Enum (Updated)

```typescript
export enum OwnerType {
  USER = 'user',
  ORGANIZATION = 'organization'
  // TEAM removed - teams cannot own blueprints
}
```

#### BlueprintMember Interface (Updated)

```typescript
export interface BlueprintMember {
  id: string;
  blueprintId: string;
  memberType: BlueprintMemberType;  // NEW: Identifies member type
  accountId: string;                // References user/team/partner ID
  accountName?: string;             // Display name
  role: BlueprintRole;
  businessRole?: BlueprintBusinessRole;
  isExternal: boolean;
  permissions?: { ... };
  metadata?: Record<string, unknown>;
  grantedBy: string;
  grantedAt: Date | string;
}
```

### Validation Functions

Located in: `src/app/core/domain/utils/blueprint-validation.utils.ts`

#### Member Type Validation

```typescript
// Check if member type is allowed for blueprint owner type
isValidMemberTypeForOwner(ownerType: OwnerType, memberType: BlueprintMemberType): boolean

// Get allowed member types for a blueprint owner
getAllowedMemberTypes(ownerType: OwnerType): BlueprintMemberType[]
```

#### Task Assignment Validation

```typescript
// Check if assignee type is allowed for blueprint owner type
isValidAssigneeTypeForOwner(ownerType: OwnerType, assigneeType: AssigneeType): boolean

// Get allowed assignee types for a blueprint owner
getAllowedAssigneeTypes(ownerType: OwnerType): AssigneeType[]

// Validate task assignment with detailed error message
validateTaskAssignment(
  ownerType: OwnerType, 
  assigneeType?: AssigneeType, 
  assigneeId?: string
): { isValid: boolean; error?: string }
```

## Firestore Security Rules

Security rules enforce these constraints at the database level:

```javascript
// Validate member type is allowed for blueprint owner type
function isValidMemberType(blueprintId, memberType) {
  let ownerType = getOwnerType(blueprintId);
  
  if (ownerType == 'user') {
    return memberType == 'user';
  }
  
  if (ownerType == 'organization') {
    return memberType in ['user', 'team', 'partner'];
  }
  
  return false;
}

// Validate member data consistency
function isValidMemberData(data) {
  return data.memberType is string
    && data.memberType in ['user', 'team', 'partner']
    && data.accountId is string
    && data.role in ['viewer', 'contributor', 'maintainer']
    && data.isExternal is bool
    // Ensure isExternal flag matches member type
    && (data.memberType != 'team' || data.isExternal == false)
    && (data.memberType != 'partner' || data.isExternal == true);
}
```

## Migration Guide

### For Existing Data

If you have existing blueprints with `ownerType = 'team'`:

1. **Identify affected blueprints:**
   ```typescript
   const teamOwnedBlueprints = await firestore
     .collection('blueprints')
     .where('ownerType', '==', 'team')
     .get();
   ```

2. **Migrate to organization ownership:**
   ```typescript
   for (const doc of teamOwnedBlueprints.docs) {
     const blueprint = doc.data();
     const team = await getTeam(blueprint.ownerId);
     
     await doc.ref.update({
       ownerType: 'organization',
       ownerId: team.organizationId
     });
   }
   ```

3. **Update members to include memberType:**
   ```typescript
   const members = await firestore
     .collection('blueprints')
     .doc(blueprintId)
     .collection('members')
     .get();
   
   for (const memberDoc of members.docs) {
     await memberDoc.ref.update({
       memberType: 'user', // Default to user, adjust as needed
       accountName: memberDoc.data().accountName || 'Unknown'
     });
   }
   ```

### For New Development

Always use the new APIs:

```typescript
// Adding a member to a blueprint
await blueprintMemberRepository.addMember(
  blueprintId,
  blueprintOwnerType,  // Required for validation
  {
    blueprintId,
    memberType: BlueprintMemberType.USER,
    accountId: userId,
    accountName: 'John Doe',
    role: BlueprintRole.CONTRIBUTOR,
    isExternal: false,
    grantedBy: currentUserId
  }
);

// Validating task assignment
const validation = validateTaskAssignment(
  blueprint.ownerType,
  AssigneeType.TEAM,
  teamId
);

if (!validation.isValid) {
  throw new Error(validation.error);
}
```

## UI/UX Guidelines

### Blueprint Creation

- **User Context**: Allow blueprint creation with user as owner
- **Organization Context**: Allow blueprint creation with organization as owner
- **Team Context**: Show error message - "團隊無法直接擁有藍圖。請切換至組織視角或個人視角建立藍圖。"

### Member Management

- **Display member type** with visual indicators:
  - 👤 USER (Internal/External badge)
  - 👥 TEAM (Internal badge)
  - 🤝 PARTNER (External badge)

- **Filter member selection** based on blueprint owner:
  - User-owned: Show only users
  - Organization-owned: Show users, teams, and partners

### Task Assignment

- **Filter assignee options** based on blueprint owner and membership
- **Show validation errors** when attempting invalid assignments
- **Display assignee type** clearly in task lists and details

## Testing

### Unit Tests

Test validation functions:

```typescript
describe('Blueprint Validation', () => {
  it('should allow USER members in user-owned blueprints', () => {
    expect(isValidMemberTypeForOwner(OwnerType.USER, BlueprintMemberType.USER)).toBe(true);
  });
  
  it('should reject TEAM members in user-owned blueprints', () => {
    expect(isValidMemberTypeForOwner(OwnerType.USER, BlueprintMemberType.TEAM)).toBe(false);
  });
  
  it('should allow all member types in org-owned blueprints', () => {
    expect(isValidMemberTypeForOwner(OwnerType.ORGANIZATION, BlueprintMemberType.USER)).toBe(true);
    expect(isValidMemberTypeForOwner(OwnerType.ORGANIZATION, BlueprintMemberType.TEAM)).toBe(true);
    expect(isValidMemberTypeForOwner(OwnerType.ORGANIZATION, BlueprintMemberType.PARTNER)).toBe(true);
  });
});
```

### Integration Tests

Test repository validation:

```typescript
it('should reject invalid member type for user-owned blueprint', async () => {
  await expectAsync(
    blueprintMemberRepository.addMember(
      userOwnedBlueprintId,
      OwnerType.USER,
      {
        blueprintId: userOwnedBlueprintId,
        memberType: BlueprintMemberType.TEAM,  // Invalid for user-owned
        accountId: teamId,
        role: BlueprintRole.CONTRIBUTOR,
        isExternal: false,
        grantedBy: userId
      }
    )
  ).toBeRejected();
});
```

## Summary

- **Ownership**: Only Users and Organizations can own blueprints
- **Teams & Partners**: Are sub-accounts that participate as members, not owners
- **Membership Scoping**: User-owned → USER members only; Org-owned → USER/TEAM/PARTNER members
- **Task Assignment**: Scoped to valid blueprint members based on owner type
- **Validation**: Enforced in TypeScript code, repositories, and Firestore security rules
