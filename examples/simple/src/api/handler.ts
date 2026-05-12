import { connect } from "../infra/db.js";
import { driver } from "../db/client.js";

export function handler(): string {
  return `${connect()}-${driver()}`;
}
