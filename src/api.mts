import app from "./main.js";

// Extend the FastifyInstance type to include the 'emit' method
declare module "fastify" {
  interface FastifyInstance {
    emit(event: string, req: any, res: any): void;
    handleRequest?(req: any, res: any): void;
  }
}

// Extend the app object to include the handleRequest method
(app as any).handleRequest = function (req: any, res: any) {
  res.end("Request handled");
};

export default async function handler(req: any, res: any) {
  if (typeof app.ready === "function") {
    await app.ready();
  } else {
    throw new Error("The 'ready' method does not exist on the 'app' object.");
  }
  app.emit("request", req, res);
}
app.emit = function (event: string, req: any, res: any) {
    if (event === "request") {
        if (typeof app.handleRequest === "function") {
            app.handleRequest(req, res);
        } else {
            throw new Error("The 'handleRequest' method does not exist on the 'app' object.");
        }
    } else {
        throw new Error(`Unsupported event: ${event}`);
    }
};