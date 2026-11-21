// Sample data for the RevinHi Performance preview. Names, descriptions, tiers and categories are
// copied from the real app's tweak catalog (revinhi-performance/src/RevinHi.Core/Tweaks), DNS
// provider and game-region lists (RevinHi.Core/Network), in the same order the app shows them.

export type Tier = "Safe" | "Advanced";

export type Tweak = {
  id: string;
  name: string;
  description: string;
  category: "System" | "Network";
  tier: Tier;
  reboot?: boolean;
  /** Manual step: the app only marks it done and shows where to go. */
  instructions?: string;
  /** Already set this way on the PC before RevinHi ever ran (so there's nothing to undo). */
  preset?: boolean;
};

// Safe first, then Advanced, each in catalog order (as BoostTweaksViewModel sorts them).
// "Launch RevinHi on Windows Startup" lives on the Startup tab instead.
export const TWEAKS: Tweak[] = [
  {
    id: "power-plan",
    name: "High Performance Power Plan",
    description: "Switches Windows to the High Performance power plan while gaming, preventing CPU/GPU throttling from power-saving states.",
    category: "System",
    tier: "Safe",
  },
  {
    id: "game-bar",
    name: "Disable Game Bar / Game DVR",
    description: "Turns off Xbox Game Bar's background recording, which can cost CPU/GPU overhead and cause stutter during gameplay.",
    category: "System",
    tier: "Safe",
  },
  {
    id: "game-mode",
    name: "Windows Game Mode",
    description: "Ensures Windows Game Mode is on, which deprioritizes background tasks and stops driver/notification interruptions while a game has focus.",
    category: "System",
    tier: "Safe",
    preset: true,
  },
  {
    id: "usb-suspend",
    name: "Disable USB Selective Suspend",
    description: "Stops Windows from letting USB ports power down when idle, which prevents the brief wake-up delay this can cause on your mouse or keyboard mid-session.",
    category: "System",
    tier: "Safe",
  },
  {
    id: "fullscreen",
    name: "Disable Fullscreen Optimizations",
    description: "Bypasses Windows' desktop compositor for exclusive-fullscreen games. Mainly helps older DX9/DX11 titles (5-10ms improvement); modern DX12 games see little to no difference.",
    category: "System",
    tier: "Safe",
  },
  {
    id: "nvidia-latency",
    name: "NVIDIA Ultra Low Latency Mode",
    description: "One of the most effective driver-level input-lag reducers available, by shrinking the GPU's render queue. RevinHi can't set this directly since it lives in NVIDIA's own driver control panel - toggling this just marks it done and shows you exactly where to go.",
    category: "System",
    tier: "Safe",
    instructions:
      'NVIDIA Control Panel > Manage 3D Settings > Program Settings (pick your game, or Global Settings for all games) > find "Low Latency Mode" > set it to "Ultra" (or "On" if Ultra isn\'t listed) > Apply.\n\nOn an AMD GPU instead: open AMD Software: Adrenalin Edition and enable "Anti-Lag" for your game - it\'s the same idea from AMD.',
  },
  {
    id: "hags",
    name: "Hardware-Accelerated GPU Scheduling",
    description: "Lets the GPU manage its own frame-scheduling queue instead of Windows, which can reduce input latency on supported hardware. Requires a reboot to take effect.",
    category: "System",
    tier: "Advanced",
    reboot: true,
  },
  {
    id: "timer",
    name: "1ms Timer Resolution",
    description: "Requests the highest-precision Windows system timer (1ms) for as long as RevinHi is running, reducing frame-pacing jitter and input latency. Released automatically when reverted or when RevinHi closes.",
    category: "System",
    tier: "Advanced",
  },
  {
    id: "net-throttle",
    name: "Disable Network Throttling",
    description: "Removes Windows' multimedia class scheduler limit on network packet processing, which can otherwise cap throughput and add latency during gameplay.",
    category: "Network",
    tier: "Advanced",
  },
  {
    id: "responsiveness",
    name: "Zero System Responsiveness Reservation",
    description: "Removes the percentage of CPU Windows normally reserves away from foreground multimedia/game tasks for background work, giving the game more consistent access to the CPU.",
    category: "Network",
    tier: "Advanced",
  },
  {
    id: "qos",
    name: "Disable QoS Reserved Bandwidth",
    description: "Windows' QoS packet scheduler reserves a slice of bandwidth (20% by default) for non-best-effort traffic that most home setups never use. Setting the limit to 0 gives that bandwidth back to normal traffic, including your game.",
    category: "Network",
    tier: "Advanced",
  },
  {
    id: "nagle",
    name: "Disable Nagle's Algorithm",
    description: "Stops Windows from batching small outgoing network packets together before sending, reducing latency for real-time traffic like game input at the cost of slightly less efficient bandwidth use.",
    category: "Network",
    tier: "Advanced",
  },
  {
    id: "tcp-ack",
    name: "Disable Delayed TCP ACKs",
    description: "Makes Windows acknowledge every incoming network packet immediately instead of batching acknowledgements. Effectiveness varies by game - some see reduced latency, others see no change.",
    category: "Network",
    tier: "Advanced",
  },
  {
    id: "dns",
    name: "Fast DNS (Cloudflare)",
    description: "Switches DNS resolution to Cloudflare's 1.1.1.1, typically faster than most ISP resolvers. Speeds up game server lookups, matchmaking, and launcher/store page loads - it does not reduce in-game ping itself. Use the DNS Finder tab to compare providers instead of just Cloudflare.",
    category: "Network",
    tier: "Advanced",
  },
  {
    id: "msi",
    name: "Enable MSI Mode for GPU/Network Interrupts",
    description: "Switches your graphics card and network adapter to Message Signaled Interrupts, letting Windows route their interrupts to a specific CPU core instead of sharing one line across devices. Can reduce DPC-latency-driven stutter and micro-freezes.",
    category: "System",
    tier: "Advanced",
    reboot: true,
  },
  {
    id: "core-isolation",
    name: "Disable Core Isolation (Memory Integrity)",
    description: "SECURITY TRADE-OFF: turns off Memory Integrity, which protects against kernel-level exploits and malicious drivers. Can give a real but inconsistent FPS boost (roughly 4-20% depending on game/hardware) by removing hypervisor overhead. Only enable this if you understand and accept the reduced protection. Requires a restart to take effect.",
    category: "System",
    tier: "Advanced",
    reboot: true,
  },
];

/** Every saved original value "Restore All Defaults" puts back (the app counts each one). */
export const RESTORE_ITEM_COUNT = 17;

export const REBOOT_TEXT =
  "This change needs a restart to take effect. It'll stay active through the restart, and you can turn it back off or Restore All Defaults any time - before or after you restart.";

export const ALREADY_SET_TEXT = "This was already set this way outside RevinHi, so there's nothing for RevinHi to revert.";

// ------------------------------------------------------------------ Performance Boost

export type BoostApp = { id: string; name: string; mb: number; known: boolean };

export const BOOST_APPS: BoostApp[] = [
  { id: "discord", name: "Discord", mb: 412, known: true },
  { id: "teams", name: "Microsoft Teams", mb: 341, known: true },
  { id: "spotify", name: "Spotify", mb: 286, known: true },
  { id: "icue", name: "Corsair iCUE", mb: 178, known: true },
  { id: "ghub", name: "Logitech G HUB", mb: 152, known: true },
  { id: "onedrive", name: "OneDrive", mb: 96, known: true },
  { id: "nzxt", name: "NZXT CAM", mb: 203, known: false },
  { id: "grammarly", name: "Grammarly Desktop", mb: 141, known: false },
  { id: "phonelink", name: "Phone Link", mb: 118, known: false },
];

// ------------------------------------------------------------------ DNS Finder

export type DnsProvider = { name: string; primary: string; secondary: string; badge?: string; ms: number };

export const DNS_PROVIDERS: DnsProvider[] = [
  { name: "Cloudflare", primary: "1.1.1.1", secondary: "1.0.0.1", ms: 11 },
  { name: "Google", primary: "8.8.8.8", secondary: "8.8.4.4", ms: 17 },
  { name: "Quad9", primary: "9.9.9.9", secondary: "149.112.112.112", ms: 23 },
  { name: "OpenDNS", primary: "208.67.222.222", secondary: "208.67.220.220", ms: 26 },
  { name: "AdGuard", primary: "94.140.14.14", secondary: "94.140.15.15", badge: "Ad-Blocking", ms: 41 },
  { name: "AdGuard Family", primary: "94.140.14.15", secondary: "94.140.15.16", badge: "Ad + Adult Blocking", ms: 44 },
  { name: "Alternate DNS", primary: "76.76.19.19", secondary: "76.223.122.150", badge: "Ad-Blocking", ms: 52 },
  { name: "CleanBrowsing", primary: "185.228.168.9", secondary: "185.228.169.9", ms: 35 },
  { name: "Comodo Secure DNS", primary: "8.26.56.26", secondary: "8.20.247.20", ms: 61 },
  { name: "Level3", primary: "4.2.2.1", secondary: "4.2.2.2", ms: 29 },
  { name: "Verisign", primary: "64.6.64.6", secondary: "64.6.65.6", ms: 88 },
  { name: "DNS.WATCH", primary: "84.200.69.80", secondary: "84.200.70.40", ms: 117 },
];

/** What the router hands out before RevinHi changes anything. */
export const ROUTER_DNS = { primary: "192.168.1.1", ms: 34 };

export type GameRegion = { label: string; games: string; ms: number };

export const GAME_REGIONS: GameRegion[] = [
  { label: "US East (Virginia)", games: "Fortnite NA-East, Valorant NA, Apex Legends NA-East", ms: 27 },
  { label: "US West (Oregon)", games: "Fortnite NA-West, Apex Legends NA-West", ms: 72 },
  { label: "Europe West (Ireland)", games: "Fortnite EU, Valorant EU, Apex Legends EU-West", ms: 94 },
  { label: "Asia Pacific (Singapore)", games: "Fortnite Asia, Valorant AP", ms: 216 },
  { label: "Oceania (Sydney)", games: "Fortnite OCE, Valorant OCE", ms: 232 },
  { label: "Brazil (Sao Paulo)", games: "Fortnite Brazil, Valorant BR", ms: 147 },
];

// ------------------------------------------------------------------ Startup

export type StartupEntry = { id: string; name: string; source: string; on: boolean };

export const STARTUP_ITEMS: StartupEntry[] = [
  { id: "discord", name: "Discord", source: "Registry (this user)", on: true },
  { id: "steam", name: "Steam", source: "Registry (this user)", on: true },
  { id: "spotify", name: "Spotify", source: "Registry (this user)", on: true },
  { id: "onedrive", name: "OneDrive", source: "Registry (this user)", on: true },
  { id: "epic", name: "Epic Games Launcher", source: "Registry (this user)", on: true },
  { id: "ghub", name: "Logitech G HUB", source: "Registry (this user)", on: true },
  { id: "security", name: "Windows Security", source: "Registry (all users)", on: true },
  { id: "realtek", name: "Realtek Audio Console", source: "Registry (all users)", on: true },
  { id: "icue", name: "Corsair iCUE", source: "Registry (all users)", on: false },
  { id: "teams", name: "Microsoft Teams", source: "Startup folder (this user)", on: true },
];

// ------------------------------------------------------------------ helpers

/** Small, steady wobble around a base value, like a live reading. */
export function jitter(base: number, spread: number): number {
  return Math.max(1, base + (Math.random() * 2 - 1) * spread);
}

export function dnsColor(ms: number | null): string {
  if (ms === null) return "#ff3b3b";
  return ms < 30 ? "#2ed573" : ms < 80 ? "#ffa800" : "#ff3b3b";
}

/** Game-server thresholds sit a bit higher (a connection handshake runs slower than a DNS lookup). */
export function regionColor(ms: number | null): string {
  if (ms === null) return "#ff3b3b";
  return ms < 50 ? "#2ed573" : ms < 100 ? "#ffa800" : "#ff3b3b";
}
