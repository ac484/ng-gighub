import { inject, Injectable, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Partner, PartnerMember } from '../models';
import { PartnerRole, PartnerType } from '../types';
import { PartnerRepository } from '../repositories';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PartnerStore {
  private readonly repository = inject(PartnerRepository);

  private readonly _partners = signal<Partner[]>([]);
  private readonly _members = signal<PartnerMember[]>([]);
  private readonly _loading = signal(false);

  readonly partners = this._partners.asReadonly();
  readonly loading = this._loading.asReadonly();

  getMemberCount(partnerId: string): number {
    return this._members().filter(m => m.partner_id === partnerId).length;
  }

  currentPartnerMembers(): PartnerMember[] {
    return this._members();
  }

  async loadPartners(organizationId: string): Promise<void> {
    this._loading.set(true);
    try {
      const partners = await firstValueFrom(this.repository.findByOrganization(organizationId));
      this._partners.set(partners ?? []);
    } catch (error) {
      console.error('[PartnerStore] Failed to load partners', error);
      this._partners.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  async loadByOrganization(organizationId: string): Promise<void> {
    await this.loadPartners(organizationId);
  }

  async createPartner(payload: Omit<Partner, 'id'>): Promise<Partner> {
    const partner: Partner = { ...payload, id: uuidv4(), created_at: payload.created_at ?? new Date().toISOString() };
    this._partners.update(list => [...list, partner]);
    return partner;
  }

  createPartnerLegacy(name: string, type: PartnerType, organization_id: string): Partner {
    const partner: Partner = {
      id: uuidv4(),
      name,
      type,
      organization_id,
      created_at: new Date().toISOString()
    };
    this._partners.update(list => [...list, partner]);
    return partner;
  }

  updatePartner(id: string, payload: Partial<Partner>): Partner | null {
    let updated: Partner | null = null;
    this._partners.update(list =>
      list.map(partner => {
        if (partner.id === id) {
          updated = { ...partner, ...payload };
          return updated;
        }
        return partner;
      })
    );
    return updated;
  }

  async deletePartner(id: string): Promise<void> {
    this._partners.update(list => list.filter(partner => partner.id !== id));
    this._members.update(list => list.filter(member => member.partner_id !== id));
  }

  async loadMembers(partnerId: string): Promise<void> {
    this._members.set(this._members().filter(m => m.partner_id === partnerId));
  }

  async addMember(partnerId: string, userId: string, role: PartnerRole): Promise<void> {
    const member: PartnerMember = {
      id: uuidv4(),
      partner_id: partnerId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString()
    };
    this._members.update(list => [...list, member]);
  }

  async updateMemberRole(memberId: string, partnerId: string, role: PartnerRole): Promise<void> {
    this._members.update(list =>
      list.map(member => (member.id === memberId && member.partner_id === partnerId ? { ...member, role } : member))
    );
  }

  async removeMember(memberId: string, partnerId: string): Promise<void> {
    this._members.update(list => list.filter(member => !(member.id === memberId && member.partner_id === partnerId)));
  }
}
