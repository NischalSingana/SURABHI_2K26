import dns from "node:dns";

export function register() {
    // Fix for slow DB connections in Node 18+ (IPv6 fallback issue)
    if (process.env.NODE_ENV === "development") {
        try {
            if (dns.setDefaultResultOrder) {
                dns.setDefaultResultOrder("ipv4first");
                console.log("DNS Order set to: ipv4first");
            }
        } catch (e) {
            console.error("Failed to set DNS order:", e);
        }
    }
}
