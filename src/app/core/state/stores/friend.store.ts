import { Injectable, signal, computed } from '@angular/core';
import { FriendRelation } from '@core/domain/models/friend.model';

@Injectable({ providedIn: 'root' })
export class FriendStore {
  private _relations = signal<FriendRelation[]>([]);
  private _loading = signal(false);

  readonly relations = this._relations.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly accepted = computed(() => this._relations().filter(r => r.status === 'accepted'));
  readonly pending = computed(() => this._relations().filter(r => r.status === 'pending'));

  setRelations(items: FriendRelation[]): void {
    this._relations.set(items);
  }

  addOrUpdate(rel: FriendRelation): void {
    this._relations.update(list => {
      const idx = list.findIndex(r => r.id === rel.id);
      if (idx === -1) return [...list, rel];
      const copy = [...list];
      copy[idx] = rel;
      return copy;
    });
  }

  setLoading(v: boolean): void {
    this._loading.set(v);
  }
}

export default FriendStore;
