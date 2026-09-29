import { EdgeGateway } from "./server.js";
import { loadConfig } from "./config.js";

async function main(): Promise<void> {
  const gateway = new EdgeGateway(loadConfig());
  const address = await gateway.start();
  const status = gateway.getStatus();
  process.stdout.write(`${JSON.stringify({
    message: "edge-gateway started",
    address: address.url,
    port: address.port,
    gatewayId: status.gatewayId,
    businessId: status.businessId,
    eventId: status.eventId,
    hmacConfigured: status.hmacConfigured,
    websocketPath: status.websocketPath
  })}\n`);
  let closing = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (closing) {
      return;
    }
    closing = true;
    process.stdout.write(`${JSON.stringify({ message: "edge-gateway stopping", signal })}\n`);
    await gateway.stop();
  };
  process.once("SIGINT", () => {
    void shutdown("SIGINT").finally(() => process.exit(0));
  });
  process.once("SIGTERM", () => {
    void shutdown("SIGTERM").finally(() => process.exit(0));
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "edge-gateway failed to start";
  process.stderr.write(`${JSON.stringify({ message })}\n`);
  process.exitCode = 1;
});
