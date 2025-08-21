import http from "../../../services/http";

export const update = (id, payload) =>
  http.patch(`/auth/users/${id}`, payload).then(({ data }) => data);
