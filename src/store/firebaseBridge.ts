import { isFirebaseConfigured } from '../lib/firebase';
import {
  subscribeToClubLayout,
  saveClubLayoutToFirebase,
  subscribeToBusinessEvents
} from '../services/firebaseService';
import type { ClubTable, ClubLayoutType, ClubEvent } from '../types';

export class FirebaseBridge {
  private unsubs: Array<() => void> = [];

  attachClubListeners(
    clubId: string,
    onTablesReceived: (tables: ClubTable[], layoutType?: ClubLayoutType) => void,
    onEventsReceived?: (events: ClubEvent[]) => void
  ) {
    if (!isFirebaseConfigured) return;
    this.detach();

    const unsubClub = subscribeToClubLayout(clubId, (data) => {
      if (data.tables && data.tables.length > 0) {
        onTablesReceived(data.tables, data.layout_type);
      }
    });
    if (unsubClub) this.unsubs.push(unsubClub);

    if (onEventsReceived) {
      const unsubEvents = subscribeToBusinessEvents(clubId, onEventsReceived);
      if (unsubEvents) this.unsubs.push(unsubEvents);
    }
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
