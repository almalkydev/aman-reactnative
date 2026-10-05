import * as Network from "expo-network";
import { api, uploadPhoto } from "./api";
import { pending, updatePending } from "./storage";
import type { IncidentDraft, InspectionDraft } from "./types";
let running: Promise<void> | null = null;
export function syncPending(userId: number) {
  if (running) return running;
  running = (async () => {
    const network = await Network.getNetworkStateAsync();
    if (!network.isConnected || network.isInternetReachable === false) return;
    for (const row of await pending(userId)) {
      const body = JSON.parse(row.payload) as IncidentDraft & InspectionDraft;
      if (row.kind === "incidents") {
        for (let i = 0; i < body.photos.length; i++) {
          body.photos[i] = await uploadPhoto(body.photos[i]);
          await updatePending(row.id, JSON.stringify(body), 0);
        }
      } else {
        for (const answer of body.answers)
          if (answer.photo_url) {
            answer.photo_url = await uploadPhoto(answer.photo_url);
            await updatePending(row.id, JSON.stringify(body), 0);
          }
      }
      await api("/" + row.kind, { method: "POST", body: JSON.stringify(body) });
      await updatePending(row.id, JSON.stringify(body), 1);
    }
  })().finally(() => {
    running = null;
  });
  return running;
}
