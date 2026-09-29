import { isFirebaseConfigured } from '../lib/firebase';
import {
  subscribeToClubLayout,
  saveClubLayoutToFirebase
} from '../services/firebaseService';
import type { ClubTable, ClubLayoutType } from '../types';

export class FirebaseBridge {
  private unsubs: Array<() => void> = [];

  attachClubListeners(
    clubId: string,
    onTablesReceived: (tables: ClubTable[], layoutType?: ClubLayoutType) => void
  ) {
    if (!isFirebaseConfigured) return;
    this.detach();

    const unsubClub = subscribeToClubLayout(clubId, (data) => {
      if (data.tables && data.tables.length > 0) {
        onTablesReceived(data.tables, data.layout_type);
      }
    });
    if (unsubClub) this.unsubs.push(unsubClub);
  }

  detach() {
    this.unsubs.forEach(u => u());
    this.unsubs = [];
  }

  async syncClubLayout(clubId: string, tables: ClubTable[], layoutType?: ClubLayoutType) {
    if (!isFirebaseConfigured) return;
    await saveClubLayoutToFirebase(clubId, tables, layoutType);
  }
}

export const firebaseBridge = new FirebaseBridge();
