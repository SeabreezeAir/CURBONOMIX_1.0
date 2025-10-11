// index.ts
import type { IAgent } from "../../../lms/src";
import { ArchitectAgent } from "./ArchitectAgent";

const agent: IAgent = new ArchitectAgent();

export default agent;
export { ArchitectAgent };
export type { IAgent };
