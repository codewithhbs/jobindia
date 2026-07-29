import { api } from "./client";
import { buildQueryString } from "@/lib/utils";

export const notificationsApi = {
  myFeed: (params) => api.get(`/notifications${buildQueryString(params)}`),
  send: (payload) => api.post("/notifications/send", payload),
  broadcast: (payload) => api.post("/notifications/broadcast", payload),
  sendBulk: (payload) => api.post("/notifications/send-bulk", payload),
};
