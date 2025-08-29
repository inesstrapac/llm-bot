import http from "@/services/http";

export const createMessage = (payload) => {
  return http.post("/messages", payload).then(({ data }) => data);
};

export const findAllMessagesByConversationId = (conversationId) => {
  return http.get(`/messages/${conversationId}`).then(({ data }) => data);
};

export const findAllConversationsForUser = () => {
  return http.get("/conversations").then(({ data }) => data);
};
