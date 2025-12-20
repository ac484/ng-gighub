import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  CollectionReference,
  addDoc,
  doc,
  deleteDoc,
  getDocs,
  query,
  where,
} from '@angular/fire/firestore';
import { TeamMember, TeamRole } from '@core';
import { Observable, from, map } from 'rxjs';

/**
 * Team Member Repository
 * Manages team membership operations in Firestore
 * Follows Occam's Razor: Simple CRUD operations with Firestore
 *
 * Pattern: Same as OrganizationMemberRepository and BlueprintMemberRepository
 */
@Injectable({ providedIn: 'root' })
export class TeamMemberRepository {
  private readonly firestore = inject(Firestore);
  private readonly collectionName = 'team_members';

  /**
   * Get Firestore collection reference
   */
  private getCollectionRef(): CollectionReference {
    return collection(this.firestore, this.collectionName) as CollectionReference;
  }

  /**
   * Find all members for a specific team
   *
   * @param teamId Team ID
   * @returns Observable of team members sorted by role (LEADER > MEMBER)
   */
  findByTeam(teamId: string): Observable<TeamMember[]> {
    const q = query(
      this.getCollectionRef(),
      where('team_id', '==', teamId)
      // Note: Removed orderBy to avoid composite index requirement (Occam's Razor)
      // Sorting done in-memory instead
    );

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const members = snapshot.docs.map(doc => this.toTeamMember(doc.data(), doc.id));

        // Sort in-memory: LEADER > MEMBER
        return members.sort((a, b) => {
          const roleOrder = { [TeamRole.LEADER]: 1, [TeamRole.MEMBER]: 2 };
          return roleOrder[a.role] - roleOrder[b.role];
        });
      })
    );
  }

  /**
   * Add a member to a team
   *
   * @param teamId Team ID
   * @param userId User ID to add
   * @param role Team role (default: MEMBER)
   * @returns Promise of created team member
   */
  async addMember(teamId: string, userId: string, role: TeamRole = TeamRole.MEMBER): Promise<TeamMember> {
    const memberData = {
      team_id: teamId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString()
    };

    const docRef = await addDoc(this.getCollectionRef(), memberData);
    console.log(`[TeamMemberRepository] ✅ Member added: ${userId} as ${role} to team ${teamId}`);

    return this.toTeamMember(memberData, docRef.id);
  }

  /**
   * Remove a member from a team
   *
   * @param memberId Member ID to remove
   * @returns Promise<void>
   */
  async removeMember(memberId: string): Promise<void> {
    const memberRef = doc(this.firestore, this.collectionName, memberId);
    await deleteDoc(memberRef);
    console.log(`[TeamMemberRepository] ✅ Member removed: ${memberId}`);
  }

  /**
   * Convert Firestore data to TeamMember model
   *
   * @param data Firestore document data
   * @param id Document ID
   * @returns TeamMember
   */
  private toTeamMember(data: any, id: string): TeamMember {
    return {
      id,
      team_id: data.team_id,
      user_id: data.user_id,
      role: data.role,
      joined_at: data.joined_at
    };
  }
}
