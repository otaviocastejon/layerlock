import { connect } from "../infra/db.js";

export function loadUser(): string {
  return connect();
}
