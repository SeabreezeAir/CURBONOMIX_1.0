import app from "./main.js";
export default async function handler(req, res) {
    if (typeof app.ready === "function") {
        await app.ready();
    }
    else {
        throw new Error("The 'ready' method does not exist on the 'app' object.");
    }
    app.emit("request", req, res);
}
app.emit = function (event, req, res) {
    if (event === "request") {
        if (typeof app.handleRequest === "function") {
            app.handleRequest(req, res);
        }
        else {
            throw new Error("The 'handleRequest' method does not exist on the 'app' object.");
        }
    }
    else {
        throw new Error(`Unsupported event: ${event}`);
    }
};
