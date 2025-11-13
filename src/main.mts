import Fastify from "fastify";
import { SuperAgent } from "@curbonomix/agents";
import { ArchitectAgent } from "@curbonomix/agents-architect";
import { EngineerAgent } from "@curbonomix/agents-engineer";
import { DesignerAgent } from "@curbonomix/agents-designer";
import type { RTUSpec } from "@curbonomix/rtu-core";
import {
  resolveModel,
  sizePlenum,
  buildAdapter,
  toDXF,
  toGCode,
  toSubmittal
} from "@curbonomix/rtu-core";

const server = Fastify();
const agents = new SuperAgent();

agents.register(new ArchitectAgent());
agents.register(new EngineerAgent());
agents.register(new DesignerAgent());

type RequestBody = Partial<RTUSpec> & {
  existing_model?: string;
  new_model?: string;
  manual_existing?: boolean;
  manual_new?: boolean;
};

function resolvePair(body: RequestBody): RTUSpec {
  const existing = !body.manual_existing && body.existing_model
    ? resolveModel(body.existing_model)
    : undefined;
  const next = !body.manual_new && body.new_model
    ? resolveModel(body.new_model)
    : undefined;

  if (!body.manual_existing && body.existing_model && !existing) throw new Error("EXISTING_MODEL_NOT_FOUND");
  if (!body.manual_new && body.new_model && !next) throw new Error("NEW_MODEL_NOT_FOUND");

  const base: Partial<RTUSpec> = {
    model: next?.model ?? existing?.model ?? body.model,
    new_L: existing?.new_L ?? body.new_L,
    new_W: existing?.new_W ?? body.new_W,
    height: existing?.height ?? body.height,
    flange_h: existing?.flange_h ?? body.flange_h,
    supply_x: existing?.supply_x ?? body.supply_x,
    supply_y: existing?.supply_y ?? body.supply_y,
    return_x: existing?.return_x ?? body.return_x,
    return_y: existing?.return_y ?? body.return_y,
    steel_gauge: existing?.steel_gauge ?? body.steel_gauge,
    sst: existing?.sst ?? body.sst,
    brake_lim: existing?.brake_lim ?? body.brake_lim,
    new_L2: next?.new_L ?? body.new_L2 ?? existing?.new_L,
    new_W2: next?.new_W ?? body.new_W2 ?? existing?.new_W,
    cfm_supply: body.cfm_supply,
    cfm_return: body.cfm_return
  };

  const required = [
    "new_L",
    "new_W",
    "height",
    "flange_h",
    "supply_x",
    "supply_y",
    "return_x",
    "steel_gauge",
    "sst",
    "brake_lim"
  ] as const;

  for (const key of required) {
    if (base[key] === undefined) throw new Error("MISSING_FIELDS");
  }

  return base as RTUSpec;
}

server.get(
  "/",
  async () =>
    "CURBONOMIX API\n/health\n/rtu/preview (POST)\n/rtu/design (POST)\n/rtu/dxf (POST)\n/rtu/gcode (POST)\n/rtu/submittal (POST)"
);

server.get("/health", async () => ({ status: "up" }));

server.post<{ Body: RequestBody }>("/rtu/preview", async (request) => {
server.post<{ Body: RequestBody }>("/rtu/preview", async (request) => {
  const spec = resolvePair(request.body);

  return { perf: sizePlenum(spec), geo: buildAdapter(spec) };
});
server.post<{ Body: RequestBody }>("/rtu/design", async (request: { body: RequestBody }) => {
  const spec = resolvePair(request.body);
  interface LMSRecord {
    actor: string;
    verb: string;
    object: string;
    ts: number;
    meta: {
      existing?: string;
      new?: string;
    };
  }

  interface DesignResponseData {
    perf: ReturnType<typeof sizePlenum>;
    geo: ReturnType<typeof buildAdapter>;
  }

  interface DesignResponse {
    ok: boolean;
    data: DesignResponseData;
  }

    lms.record({
      actor: "api",
      verb: "design",
      object: "rtu",
      ts: Date.now(),
      meta: {
        existing: request.body.existing_model,
        new: request.body.new_model
      }
    } as LMSRecord);

  server.post<{ Body: RequestBody }>("/rtu/design", async (request): Promise<DesignResponse> => {
    const spec: RTUSpec = resolvePair(request.body);

    const perf = sizePlenum(spec);
    const geo = buildAdapter(spec);

    return { ok: true, data: { perf, geo } };
  });
    reply
      .header("Content-Type", "text/plain")
      .header("Content-Disposition", "attachment; filename=curbonomix_gmetric.txt")
      .send(toGCode(buildAdapter(spec)));
  });

server.post<{ Body: RequestBody }>("/rtu/submittal", async (request, reply) => {
  const spec = resolvePair(request.body);
  reply
    .header("Content-Type", "text/plain")
    .header("Content-Disposition", "attachment; filename=submittal.txt")
    .send(toSubmittal(spec, sizePlenum(spec)));
});

const host = process.env.HOST ?? "127.0.0.1";
let port = Number(process.env.PORT ?? 3000);

(async () => {
  for (;;) {
    try {
      await server.listen({ host, port });
      console.log("API listening:", `http://${host}:${port}`);
      break;
    } catch (error: any) {
      if (error?.code === "EADDRINUSE") {
        port += 1;
        continue;
      }

      console.error(error);
      process.exit(1);
    }
  }
})();

export default server;
