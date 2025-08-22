import http from "../../../services/http";

export const get = (payload) =>
  http.get(`/users`, payload).then(({ data }) => data);
