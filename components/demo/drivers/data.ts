// Sample PC for the RevinHi Drivers preview: the same example laptop the real app's browser
// preview uses (revinhi-drivers/src/preview/mock.ts and toolsMock.ts), as plain data.

const MB = 1e6;

export type SignKind = "whql" | "inbox" | "trusted";
export type Source = "windowsUpdate" | "microsoftCatalog" | "nvidia" | "intel" | "revinHi" | "pcMaker";
export type Status = "outdated" | "missing" | "problem" | "upToDate";

export const SOURCE_LABEL: Record<Source, string> = {
  windowsUpdate: "Windows Update",
  microsoftCatalog: "Microsoft",
  nvidia: "NVIDIA",
  intel: "Intel",
  revinHi: "RevinHi",
  pcMaker: "HP",
};

export const SIGN_LABEL: Record<SignKind, string> = {
  whql: "Microsoft tested",
  inbox: "Part of Windows",
  trusted: "Signed",
};

export interface Candidate {
  source: Source;
  title: string;
  hardwareId: string;
  version: string;
  /** The version as people know it (NVIDIA's "621.01"). */
  displayVersion?: string;
  date: string;
  provider: string;
  size: number;
  infoUrl?: boolean;
}

export interface CurrentDriver {
  version: string;
  date: string;
  provider: string;
  inf: string;
  matchingId: string;
  signer: { name: string; kind: SignKind };
}

export interface Problem {
  code: number;
  title: string;
  advice: string;
}

interface Sample {
  id: string;
  name: string;
  cls: string;
  maker: string | null;
  hw: string[];
  compat?: string[];
  driver: Omit<CurrentDriver, "signer" | "matchingId"> & { matching: string; signer?: CurrentDriver["signer"] } | null;
  problem?: number;
  offer?: Omit<Candidate, "hardwareId">;
  others?: Omit<Candidate, "hardwareId" | "provider">[];
  setAside?: { title: string; version: string; why: string }[];
}

const WHQL = { name: "Microsoft Windows Hardware Compatibility Publisher", kind: "whql" as const };
const INBOX = { name: "Microsoft Windows", kind: "inbox" as const };

export const SYSTEM = "Windows 11 Home 24H2 · build 26100";

export const GPU_ID = "PCI\\VEN_10DE&DEV_2560&SUBSYS_8A5F103C&REV_A1\\4&2C4A1E7F&0&0008";
export const WIFI_ID = "PCI\\VEN_10EC&DEV_C822&SUBSYS_85F7103C&REV_00\\00E04CFFFEC8220100";

const DEVICES: Sample[] = [
  {
    id: GPU_ID,
    name: "NVIDIA GeForce RTX 3060 Laptop GPU",
    cls: "Display",
    maker: "NVIDIA",
    hw: ["PCI\\VEN_10DE&DEV_2560&SUBSYS_8A5F103C&REV_A1", "PCI\\VEN_10DE&DEV_2560&SUBSYS_8A5F103C", "PCI\\VEN_10DE&DEV_2560&CC_030000", "PCI\\VEN_10DE&DEV_2560&CC_0300"],
    compat: ["PCI\\VEN_10DE&DEV_2560&REV_A1", "PCI\\VEN_10DE&DEV_2560", "PCI\\VEN_10DE&CC_030000", "PCI\\CC_030000", "PCI\\CC_0300"],
    driver: { version: "31.0.15.3699", date: "2023-08-14", provider: "NVIDIA", inf: "oem41.inf", matching: "PCI\\VEN_10DE&DEV_2560&SUBSYS_8A5F103C" },
    offer: { version: "32.0.16.2101", displayVersion: "621.01", source: "nvidia", date: "2026-10-21", provider: "NVIDIA", title: "NVIDIA GeForce Game Ready Driver 621.01", size: 1037.2 * MB, infoUrl: true },
    others: [{ source: "windowsUpdate", version: "32.0.15.6094", date: "2024-08-14", title: "NVIDIA - Display - 32.0.15.6094", size: 683.4 * MB }],
  },
  {
    id: WIFI_ID,
    name: "Realtek RTL8822CE 802.11ac PCIe Adapter",
    cls: "Net",
    maker: "Realtek Semiconductor Corp.",
    hw: ["PCI\\VEN_10EC&DEV_C822&SUBSYS_85F7103C&REV_00", "PCI\\VEN_10EC&DEV_C822&SUBSYS_85F7103C", "PCI\\VEN_10EC&DEV_C822&CC_028000"],
    compat: ["PCI\\VEN_10EC&DEV_C822", "PCI\\VEN_10EC&CC_028000", "PCI\\CC_028000"],
    driver: { version: "2024.0.8.108", date: "2023-06-05", provider: "Realtek Semiconductor Corp.", inf: "oem131.inf", matching: "PCI\\VEN_10EC&DEV_C822&SUBSYS_85F7103C" },
    offer: { version: "2024.10.231.0", source: "microsoftCatalog", date: "2025-11-05", provider: "Realtek Semiconductor Corp.", title: "Realtek Semiconductor Corp. Net Driver Update (2024.10.231.0)", size: 4.1 * MB },
  },
  {
    id: "PCI\\VEN_1022&DEV_790B&SUBSYS_8A5F103C&REV_51\\3&11583659&0&A0",
    name: "AMD SMBus",
    cls: "System",
    maker: "Advanced Micro Devices, Inc",
    hw: ["PCI\\VEN_1022&DEV_790B&SUBSYS_8A5F103C&REV_51", "PCI\\VEN_1022&DEV_790B&SUBSYS_8A5F103C", "PCI\\VEN_1022&DEV_790B&CC_0C0500"],
    compat: ["PCI\\VEN_1022&DEV_790B", "PCI\\VEN_1022&CC_0C0500", "PCI\\CC_0C0500"],
    driver: { version: "5.12.0.38", date: "2022-04-11", provider: "Advanced Micro Devices, Inc", inf: "oem18.inf", matching: "PCI\\VEN_1022&DEV_790B" },
    offer: { version: "5.12.0.44", source: "revinHi", date: "2024-03-20", provider: "AMD", title: "AMD Chipset Software 5.12.0.44", size: 61.2 * MB },
    others: [{ source: "windowsUpdate", version: "5.12.0.44", date: "2024-03-20", title: "Advanced Micro Devices, Inc - System - 5.12.0.44", size: 0.3 * MB }],
  },
  {
    id: "PCI\\VEN_8086&DEV_51E0&SUBSYS_8A5F103C&REV_01\\3&11583659&0&B0",
    name: "PCI Simple Communications Controller",
    cls: "",
    maker: null,
    hw: ["PCI\\VEN_8086&DEV_51E0&SUBSYS_8A5F103C&REV_01", "PCI\\VEN_8086&DEV_51E0&SUBSYS_8A5F103C", "PCI\\VEN_8086&DEV_51E0&CC_078000"],
    compat: ["PCI\\VEN_8086&DEV_51E0", "PCI\\VEN_8086&CC_078000", "PCI\\CC_078000"],
    driver: null,
    problem: 28,
    offer: { version: "2406.5.5.0", source: "windowsUpdate", date: "2024-06-24", provider: "Intel", title: "Intel - System - 2406.5.5.0", size: 9.8 * MB },
  },
  {
    id: "USB\\VID_06CB&PID_00F9\\8F5C3E9A1B2D",
    name: "Synaptics UWP WBDI",
    cls: "Biometric",
    maker: "Synaptics",
    hw: ["USB\\VID_06CB&PID_00F9&REV_0000", "USB\\VID_06CB&PID_00F9"],
    compat: ["USB\\Class_FF&SubClass_00&Prot_00", "USB\\Class_FF&SubClass_00", "USB\\Class_FF"],
    driver: { version: "6.0.33.1135", date: "2021-09-02", provider: "Synaptics", inf: "oem77.inf", matching: "USB\\VID_06CB&PID_00F9" },
    problem: 10,
  },
  {
    id: "HDAUDIO\\FUNC_01&VEN_10EC&DEV_1220&SUBSYS_103C89B9&REV_1000\\5&C7CA87&0&0001",
    name: "Realtek(R) Audio",
    cls: "MEDIA",
    maker: "Realtek",
    hw: ["HDAUDIO\\FUNC_01&VEN_10EC&DEV_1220&SUBSYS_103C89B9&REV_1000", "HDAUDIO\\FUNC_01&VEN_10EC&DEV_1220&SUBSYS_103C89B9"],
    compat: ["HDAUDIO\\FUNC_01&VEN_10EC&DEV_1220", "HDAUDIO\\FUNC_01&VEN_10EC", "HDAUDIO\\FUNC_01"],
    driver: { version: "6.0.9967.1", date: "2026-03-19", provider: "Realtek Semiconductor Corp.", inf: "oem29.inf", matching: "HDAUDIO\\FUNC_01&VEN_10EC&DEV_1220&SUBSYS_103C89B9" },
    setAside: [{ title: "Realtek Semiconductor Corp. - MEDIA - 6.0.9239.1", version: "6.0.9239.1", why: "Older than the driver you have." }],
  },
  {
    id: "BTHUSB\\VID_0BDA&PID_B00C\\00E04C239987",
    name: "Realtek Bluetooth Adapter",
    cls: "Bluetooth",
    maker: "Realtek Semiconductor Corp.",
    hw: ["USB\\VID_0BDA&PID_B00C&REV_0000", "USB\\VID_0BDA&PID_B00C"],
    compat: ["USB\\Class_E0&SubClass_01&Prot_01", "USB\\Class_E0"],
    driver: { version: "1.10.1053.3000", date: "2025-02-11", provider: "Realtek Semiconductor Corp.", inf: "oem152.inf", matching: "USB\\VID_0BDA&PID_B00C" },
    setAside: [{ title: "Generic Bluetooth Adapter - 10.0.26100.1", version: "10.0.26100.1", why: "More general than the driver you have, which was made for this exact device." }],
  },
  { id: "PCI\\VEN_1002&DEV_1681\\3&1", name: "AMD Radeon(TM) Graphics", cls: "Display", maker: "Advanced Micro Devices, Inc.", hw: ["PCI\\VEN_1002&DEV_1681&SUBSYS_8A5F103C", "PCI\\VEN_1002&DEV_1681"], driver: { version: "31.0.24027.1012", date: "2025-09-30", provider: "Advanced Micro Devices, Inc.", inf: "oem66.inf", matching: "PCI\\VEN_1002&DEV_1681&SUBSYS_8A5F103C" } },
  { id: "SCSI\\DISK&VEN_NVME&PROD_SAMSUNG_MZVL21T0\\5&1", name: "SAMSUNG MZVL21T0HCLR-00BH1", cls: "DiskDrive", maker: "(Standard disk drives)", hw: ["SCSI\\DiskNVMe____SAMSUNG_MZVL21T0", "SCSI\\DiskNVMe"], driver: { version: "10.0.26100.1", date: "2006-06-21", provider: "Microsoft", inf: "disk.inf", matching: "GenDisk", signer: INBOX } },
  { id: "PCI\\VEN_144D&DEV_A80A\\4&1", name: "Standard NVM Express Controller", cls: "SCSIAdapter", maker: "Standard NVM Express Controller", hw: ["PCI\\VEN_144D&DEV_A80A", "PCI\\CC_010802"], driver: { version: "10.0.26100.2314", date: "2006-06-21", provider: "Microsoft", inf: "stornvme.inf", matching: "PCI\\CC_010802", signer: INBOX } },
  { id: "USB\\VID_30C9&PID_0030&MI_00\\6&1", name: "HP Wide Vision HD Camera", cls: "Camera", maker: "Microsoft", hw: ["USB\\VID_30C9&PID_0030&MI_00"], driver: { version: "10.0.26100.2314", date: "2006-06-21", provider: "Microsoft", inf: "usbvideo.inf", matching: "USB\\Class_0E", signer: INBOX } },
  { id: "HID\\VID_046D&PID_C52B&MI_00\\7&1", name: "HID Keyboard Device", cls: "Keyboard", maker: "(Standard keyboards)", hw: ["HID\\VID_046D&PID_C52B&MI_00"], driver: { version: "10.0.26100.1", date: "2006-06-21", provider: "Microsoft", inf: "keyboard.inf", matching: "HID_DEVICE_SYSTEM_KEYBOARD", signer: INBOX } },
  { id: "HID\\VID_046D&PID_C52B&MI_01\\7&2", name: "HID-compliant mouse", cls: "Mouse", maker: "Microsoft", hw: ["HID\\VID_046D&PID_C52B&MI_01"], driver: { version: "10.0.26100.1", date: "2006-06-21", provider: "Microsoft", inf: "msmouse.inf", matching: "HID_DEVICE_SYSTEM_MOUSE", signer: INBOX } },
  { id: "ACPI\\PNP0C0A\\1", name: "Microsoft ACPI-Compliant Control Method Battery", cls: "Battery", maker: "Microsoft", hw: ["ACPI\\PNP0C0A"], driver: { version: "10.0.26100.1", date: "2006-06-21", provider: "Microsoft", inf: "battery.inf", matching: "ACPI\\PNP0C0A", signer: INBOX } },
  { id: "DISPLAY\\BOE0A1C\\5&1", name: "Generic PnP Monitor", cls: "Monitor", maker: "(Standard monitor types)", hw: ["MONITOR\\BOE0A1C"], driver: { version: "10.0.26100.1", date: "2006-06-21", provider: "Microsoft", inf: "monitor.inf", matching: "*PNP09FF", signer: INBOX } },
  { id: "USB\\ROOT_HUB30\\4&1", name: "USB Root Hub (USB 3.0)", cls: "USB", maker: "(Standard USB HUBs)", hw: ["USB\\ROOT_HUB30&VID1022&PID161D", "USB\\ROOT_HUB30"], driver: { version: "10.0.26100.2314", date: "2006-06-21", provider: "Microsoft", inf: "usbhub3.inf", matching: "USB\\ROOT_HUB30", signer: INBOX } },
  { id: "SWD\\DRIVERENUM\\{A}\\RTKAPO", name: "Realtek Audio Effects Component", cls: "SoftwareComponent", maker: "Realtek", hw: ["SWC\\VEN_10EC&AID_0001"], driver: { version: "11.0.6000.1126", date: "2025-07-21", provider: "Realtek Semiconductor Corp.", inf: "oem30.inf", matching: "SWC\\VEN_10EC&AID_0001" } },
  { id: "ACPI\\HPQ6007\\2&1", name: "HP Wireless Button Driver", cls: "HIDClass", maker: "HP", hw: ["ACPI\\HPQ6007"], driver: { version: "1.0.27.1", date: "2024-02-07", provider: "HP Inc.", inf: "oem9.inf", matching: "ACPI\\HPQ6007" } },
  { id: "ACPI\\AMDI0010\\3", name: "AMD I2C Controller", cls: "System", maker: "Advanced Micro Devices, Inc", hw: ["ACPI\\AMDI0010"], driver: { version: "1.2.0.126", date: "2023-10-17", provider: "Advanced Micro Devices, Inc", inf: "oem19.inf", matching: "ACPI\\AMDI0010" } },
];

export const DEVICE_NAMES = DEVICES.map((d) => d.name);
export const deviceName = (id: string) => DEVICES.find((d) => d.id.toUpperCase() === id.toUpperCase())?.name ?? "A device that isn't plugged in";

const PROBLEMS: Record<number, Problem> = {
  10: { code: 10, title: "Can't start", advice: "The device couldn't start. A newer driver often helps; restarting or re-plugging the device can too." },
  28: { code: 28, title: "No driver installed", advice: "Windows has no driver for this device yet, so it can't be used." },
};

export interface DeviceRow {
  instanceId: string;
  name: string;
  class: string;
  manufacturer: string | null;
  status: Status;
  driver: CurrentDriver | null;
  offer: Candidate | null;
  firstDriver: boolean;
  others: Candidate[];
  setAside: { title: string; version: string; why: string; source: Source }[];
  problem: Problem | null;
  ignored: boolean;
  hardwareIds: string[];
  compatibleIds: string[];
}

/** A driver installed (or put back) in this preview: device ID -> version and date. */
export type Installed = Record<string, { version: string; date: string } | undefined>;

/** The scan's rows, like a real scan of the sample laptop, after whatever was installed here. */
export function buildRows(installed: Installed, ignored: string[]): DeviceRow[] {
  const ign = new Set(ignored.map((x) => x.toUpperCase()));
  return DEVICES.map((s) => {
    const now = installed[s.id];
    const matching = s.driver?.matching ?? s.hw[1] ?? s.hw[0];
    let driver: CurrentDriver | null = s.driver
      ? { version: s.driver.version, date: s.driver.date, provider: s.driver.provider, inf: s.driver.inf, matchingId: s.driver.matching, signer: s.driver.signer ?? WHQL }
      : null;
    let problem = s.problem;
    if (now) {
      const fromOffer = now.version === s.offer?.version;
      if (fromOffer) problem = undefined;
      driver = driver
        ? { ...driver, version: now.version, date: now.date }
        : { version: now.version, date: now.date, provider: s.offer?.provider ?? "", inf: "oem212.inf", matchingId: matching, signer: WHQL };
    }
    const offered = !!s.offer && driver?.version !== s.offer.version;
    const offer: Candidate | null = offered && s.offer ? { ...s.offer, hardwareId: matching } : null;
    const others: Candidate[] = offered ? (s.others ?? []).map((o) => ({ ...o, provider: s.offer!.provider, hardwareId: matching })) : [];
    const isIgnored = ign.has(s.id.toUpperCase());
    const code = problem ?? (!driver ? 28 : 0);
    const status: Status = !driver ? "missing" : problem ? "problem" : offer && !isIgnored ? "outdated" : "upToDate";
    return {
      instanceId: s.id,
      name: s.name,
      class: s.cls,
      manufacturer: s.maker,
      status,
      driver,
      offer,
      firstDriver: !s.driver && !now,
      others,
      setAside: (s.setAside ?? []).map((a) => ({ ...a, source: "windowsUpdate" as const })),
      problem: code ? PROBLEMS[code] : null,
      ignored: isIgnored,
      hardwareIds: s.hw,
      compatibleIds: s.compat ?? [],
    };
  }).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
}

/** Each driver source on the scan's results card: [source, label, offers, note]. */
export const SOURCES: { label: string; offers: number; note?: string }[] = [
  { label: "Windows Update", offers: 6 },
  { label: "Microsoft", offers: 2 },
  { label: "NVIDIA", offers: 1 },
  { label: "Intel", offers: 0 },
  { label: "RevinHi", offers: 1 },
  { label: "HP", offers: 0, note: "HP has no driver list for this PC model; it publishes them for its business PCs only." },
];

export const COUNTS = { systemParts: 142, notPluggedIn: 38 };

// ------------------------------------------------------------------ the scan's progress (like a real scan)

export type PhaseId = "devices" | "components" | "windowsUpdate" | "microsoft" | "nvidia" | "intel" | "revinhi" | "pcMaker" | "compare";
export type PhaseState = "waiting" | "running" | "done";

export interface ScanProgress {
  fraction: number;
  phases: Record<PhaseId, PhaseState>;
  checked: number;
  total: number;
  current: string | null;
  found: { instanceId: string; name: string; source: Source }[];
}

const ONLINE: [PhaseId, number, Source][] = [
  ["nvidia", 0.3, "nvidia"],
  ["revinhi", 0.32, "revinHi"],
  ["intel", 0.45, "intel"],
  ["pcMaker", 0.5, "pcMaker"],
  ["microsoft", 0.85, "microsoftCatalog"],
];

/** Where a scan is at `t` (0..1 of its time): which sources have answered and what they found. */
export function progressAt(t: number, rows: DeviceRow[]): ScanProgress {
  const ph = {} as Record<PhaseId, PhaseState>;
  ph.devices = t < 0.15 ? "running" : "done";
  ph.components = t < 0.15 ? "waiting" : t < 0.25 ? "running" : "done";
  for (const [id, at] of ONLINE) ph[id] = t < 0.15 ? "waiting" : t < at ? "running" : "done";
  ph.windowsUpdate = t < 0.92 ? "running" : "done";
  ph.compare = t < 0.92 ? "waiting" : t < 1 ? "running" : "done";

  const total = DEVICE_NAMES.length;
  let checked = 0;
  let current: string | null = null;
  if (ph.microsoft === "running") {
    checked = Math.min(total, Math.floor(((t - 0.15) / (0.85 - 0.15)) * total));
    current = DEVICE_NAMES[checked] ?? null;
  } else if (ph.microsoft === "done") checked = total;

  const order: [number, Source][] = [...ONLINE.map(([, at, src]) => [at, src] as [number, Source]), [0.92, "windowsUpdate"]];
  const found: ScanProgress["found"] = [];
  for (const [at, src] of order.sort((a, b) => a[0] - b[0])) {
    if (t < at) continue;
    for (const r of rows) if (r.offer && !r.ignored && r.offer.source === src) found.push({ instanceId: r.instanceId, name: r.name, source: src });
  }

  const wu = ph.windowsUpdate === "running" ? 0.31 * 0.9 * (1 - Math.exp(-(t * 30) / 29)) : 0.31;
  const others = ONLINE.reduce((sum, [id, at]) => {
    const share = id === "microsoft" ? 0.25 : 0.04;
    return sum + (ph[id] === "running" ? share * Math.min(1, t / at) * 0.9 : ph[id] === "waiting" ? 0 : share);
  }, 0);
  const f = (ph.devices === "done" ? 0.15 : 0.05) + (ph.components === "done" ? 0.05 : 0) + wu + others + (ph.compare === "done" ? 0.08 : 0);
  return { fraction: t >= 1 ? 1 : Math.min(0.99, f), phases: ph, checked, total, current, found };
}

// ------------------------------------------------------------------ game components

export type ComponentState = "installed" | "missing" | "partial" | "outdated";
export type ComponentGroup = "directX" | "visualCpp" | "dotNet" | "other";

export const GROUP_LABEL: Record<ComponentGroup, string> = {
  directX: "DirectX",
  visualCpp: "Visual C++ runtimes",
  dotNet: ".NET",
  other: "Other runtimes",
};

export const STATE_LABEL: Record<ComponentState, string> = {
  installed: "Installed",
  missing: "Not installed",
  partial: "Some files missing",
  outdated: "Newer release available",
};

export interface Component {
  id: string;
  name: string;
  group: ComponentGroup;
  arch: "x64" | "x86" | null;
  state: ComponentState;
  version: string | null;
  recommended: string | null;
  note: string;
  missingFiles: string[];
  canInstall: boolean;
}

const C = (id: string, name: string, group: ComponentGroup, arch: Component["arch"], state: ComponentState, version: string | null, note: string, extra: Partial<Component> = {}): Component => ({
  id,
  name,
  group,
  arch,
  state,
  version,
  recommended: null,
  note,
  missingFiles: [],
  canInstall: !["vulkan", "physx", "openal", "netfx4"].includes(id),
  ...extra,
});

export const COMPONENTS: Component[] = [
  C("directx9", "DirectX 9.0c runtime (June 2010)", "directX", null, "partial", null, "3 of its files are missing. Games that use them may not start.", { missingFiles: ["d3dx9_24.dll (32-bit)", "d3dx9_31.dll (32-bit)", "XAudio2_7.dll (32-bit)"] }),
  C("xinput", "XInput (game controllers)", "directX", null, "installed", "10.0.26100.1", "Xbox-style controller support, for new and older games."),
  C("vc2015-2022-x64", "Visual C++ 2015-2022", "visualCpp", "x64", "installed", "14.42.34433.0", "Used by most games and apps made since 2015."),
  C("vc2015-2022-x86", "Visual C++ 2015-2022", "visualCpp", "x86", "outdated", "14.29.30133.0", "Newer games and apps need a newer release of this runtime.", { recommended: "14.40.33810.0" }),
  C("vc2013-x64", "Visual C++ 2013", "visualCpp", "x64", "installed", "12.0.40664.0", "Used by games and apps made around 2013."),
  C("vc2013-x86", "Visual C++ 2013", "visualCpp", "x86", "installed", "12.0.40664.0", "Used by games and apps made around 2013."),
  C("vc2012-x64", "Visual C++ 2012", "visualCpp", "x64", "installed", "11.0.61030.0", "Used by games and apps made around 2012."),
  C("vc2012-x86", "Visual C++ 2012", "visualCpp", "x86", "installed", "11.0.61030.0", "Used by games and apps made around 2012."),
  C("vc2010-x64", "Visual C++ 2010", "visualCpp", "x64", "installed", "10.0.40219.0", "Used by games and apps made around 2010."),
  C("vc2010-x86", "Visual C++ 2010", "visualCpp", "x86", "missing", null, "Only games and apps made around 2010 need it."),
  C("vc2008-x64", "Visual C++ 2008", "visualCpp", "x64", "installed", "9.0.30729.6161", "Used by games and apps made around 2008."),
  C("vc2008-x86", "Visual C++ 2008", "visualCpp", "x86", "installed", "9.0.30729.6161", "Used by games and apps made around 2008."),
  C("vc2005-x64", "Visual C++ 2005", "visualCpp", "x64", "missing", null, "Only games and apps made around 2005 need it."),
  C("vc2005-x86", "Visual C++ 2005", "visualCpp", "x86", "installed", "8.0.61001.0", "Used by games and apps made around 2005."),
  C("netfx4", ".NET Framework 4", "dotNet", null, "installed", "4.8.1", "Part of Windows. Used by many launchers, tools and games."),
  C("netfx35", ".NET Framework 3.5", "dotNet", null, "missing", null, "Only some older games and tools need it. It's part of Windows and can be turned on in Windows Features."),
  C("dotnet-desktop-x64", ".NET Desktop Runtime", "dotNet", "x64", "installed", "8.0.11", "Versions here: 6, 8. Apps built with .NET use the one they were made for."),
  C("dotnet-desktop-x86", ".NET Desktop Runtime", "dotNet", "x86", "missing", null, "Only apps built with .NET need it, and they usually offer to install it."),
  C("webview2", "Microsoft Edge WebView2", "other", null, "installed", "142.0.3595.53", "Used by game launchers and many apps (this one too)."),
  C("vulkan", "Vulkan runtime", "other", null, "installed", "1.4.304.0", "Comes with your graphics driver. Used by games that run on Vulkan."),
  C("physx", "NVIDIA PhysX", "other", null, "installed", "9.23.1019.0", "Physics effects used by some games."),
  C("openal", "OpenAL", "other", null, "missing", null, "Only some games' 3D sound needs it."),
  C("xna4", "XNA Framework 4.0", "other", null, "missing", null, "Only indie games made with XNA (2010-2014) need it."),
];

export const componentName = (c: Component) => (c.arch ? `${c.name} (${c.arch === "x64" ? "64-bit" : "32-bit"})` : c.name);

// ------------------------------------------------------------------ installs and History

export type Step = "waiting" | "downloading" | "checking" | "restorePoint" | "backingUp" | "installing" | "done" | "needsRestart" | "failed" | "skipped";
export type Batch = "drivers" | "components" | "rollback" | "restore" | "offline";

export const STEP_LABEL: Record<Step, string> = {
  waiting: "Waiting",
  downloading: "Downloading",
  checking: "Checking signature",
  restorePoint: "Making a restore point",
  backingUp: "Backing up the old driver",
  installing: "Installing",
  done: "Installed",
  needsRestart: "Restart to finish",
  failed: "Didn't install",
  skipped: "Not installed",
};

export const isFinished = (s: Step) => s === "done" || s === "needsRestart" || s === "failed" || s === "skipped";

export interface ItemProgress {
  key: string;
  name: string;
  step: Step;
  fraction: number | null;
  detail: string | null;
}

export interface InstallProgress {
  batch: Batch;
  running: boolean;
  items: ItemProgress[];
  restorePoint: boolean;
}

export type Outcome = "installed" | "needsRestart" | "skipped";

export const OUTCOME_LABEL: Record<Outcome | "rolledBack", string> = {
  installed: "Installed",
  needsRestart: "Restart to finish",
  skipped: "Not installed",
  rolledBack: "Rolled back",
};

export interface HistoryEntry {
  id: number;
  at: number;
  kind: "driver" | "component" | "rollback" | "restore";
  target: string;
  name: string;
  oldVersion: string | null;
  newVersion: string | null;
  source: string;
  restorePoint: boolean;
  backup: boolean;
  outcome: Outcome;
  detail: string | null;
  rolledBackBy: number | null;
}

/** A few earlier changes, like the app's History after a week of use. */
export function seedHistory(now: number): HistoryEntry[] {
  const day = 86_400_000;
  const e = (x: Partial<HistoryEntry> & Pick<HistoryEntry, "id" | "at" | "kind" | "target" | "name" | "source" | "outcome">): HistoryEntry => ({
    oldVersion: null,
    newVersion: null,
    restorePoint: true,
    backup: false,
    detail: null,
    rolledBackBy: null,
    ...x,
  });
  return [
    e({ id: 1, at: now - 6 * day, kind: "driver", target: "PCI\\VEN_1002&DEV_1681\\3&1", name: "AMD Radeon(TM) Graphics", oldVersion: "31.0.21921.1000", newVersion: "31.0.24027.1012", source: "Windows Update", backup: true, outcome: "installed" }),
    e({ id: 2, at: now - 5 * day, kind: "component", target: "vc2013-x64", name: "Visual C++ 2013 (64-bit)", source: "Microsoft", outcome: "installed" }),
    e({ id: 3, at: now - 3 * day, kind: "driver", target: "BTHUSB\\VID_0BDA&PID_B00C\\00E04C239987", name: "Realtek Bluetooth Adapter", oldVersion: "1.10.1053.3000", newVersion: "1.10.1069.3000", source: "Windows Update", backup: true, outcome: "installed", rolledBackBy: 4 }),
    e({ id: 4, at: now - 3 * day + 3_600_000, kind: "rollback", target: "BTHUSB\\VID_0BDA&PID_B00C\\00E04C239987", name: "Realtek Bluetooth Adapter", oldVersion: "1.10.1069.3000", newVersion: "1.10.1053.3000", source: "Your backup", backup: true, outcome: "installed" }),
    e({ id: 5, at: now - 2 * day, kind: "driver", target: "ACPI\\HPQ6007\\2&1", name: "HP Wireless Button Driver", oldVersion: "1.0.27.1", newVersion: "1.0.31.1", source: "Windows Update", restorePoint: false, outcome: "skipped", detail: "The current driver couldn't be backed up, so this device was left as it is." }),
  ];
}

export const canRollBack = (e: HistoryEntry) => e.kind !== "component" && (e.outcome === "installed" || e.outcome === "needsRestart") && e.backup && e.rolledBackBy == null;

// ------------------------------------------------------------------ tools

export interface DriverPackage {
  published: string;
  original: string;
  provider: string;
  class: string;
  version: string;
  date: string;
  bytes: number;
  devices: string[];
}

const pkg = (published: string, original: string, provider: string, cls: string, version: string, date: string, mb: number, devices: string[]): DriverPackage => ({
  published,
  original,
  provider,
  class: cls,
  version,
  date,
  bytes: Math.round(mb * MB),
  devices,
});

export const PACKAGES: DriverPackage[] = [
  pkg("oem41.inf", "nv_dispi.inf", "NVIDIA", "Display", "31.0.15.3699", "2023-08-14", 1260.4, ["NVIDIA GeForce RTX 3060 Laptop GPU"]),
  pkg("oem66.inf", "u0401234.inf", "Advanced Micro Devices, Inc.", "Display", "31.0.24027.1012", "2025-09-30", 812.2, ["AMD Radeon(TM) Graphics"]),
  pkg("oem12.inf", "netrtwlane.inf", "Realtek Semiconductor Corp.", "Net", "2024.0.10.114", "2024-03-11", 18.7, ["Realtek RTL8822CE 802.11ac PCIe Adapter"]),
  pkg("oem22.inf", "hdxhpc.inf", "Realtek Semiconductor Corp.", "MEDIA", "6.0.9967.1", "2023-11-02", 64.1, ["Realtek(R) Audio"]),
  pkg("oem30.inf", "rtkapo.inf", "Realtek Semiconductor Corp.", "SoftwareComponent", "11.0.6000.1126", "2025-07-21", 9.4, ["Realtek Audio Effects Component"]),
  pkg("oem19.inf", "amdi2c.inf", "Advanced Micro Devices, Inc", "System", "1.2.0.126", "2023-10-17", 0.6, ["AMD I2C Controller"]),
  pkg("oem9.inf", "hpqwbd.inf", "HP Inc.", "HIDClass", "1.0.27.1", "2024-02-07", 0.3, ["HP Wireless Button Driver"]),
  pkg("oem57.inf", "rtkbtfilter.inf", "Realtek Semiconductor Corp.", "Bluetooth", "1.10.1053.3000", "2023-05-02", 6.2, ["Realtek Bluetooth Adapter"]),
  pkg("oem3.inf", "synpd.inf", "Synaptics", "Mouse", "19.5.35.69", "2022-12-01", 22.9, ["Synaptics SMBus TouchPad"]),
  pkg("oem71.inf", "kingstonfw.inf", "Kingston", "Firmware", "1.2.0.0", "2022-01-10", 1.1, []),
];

export interface OldPackage extends DriverPackage {
  newestVersion: string;
}

export const OLD: OldPackage[] = [
  { ...pkg("oem33.inf", "nv_dispi.inf", "NVIDIA", "Display", "31.0.15.2756", "2023-01-20", 1198.7, []), newestVersion: "31.0.15.3699" },
  { ...pkg("oem18.inf", "nv_dispi.inf", "NVIDIA", "Display", "30.0.14.9649", "2022-06-02", 1102.5, []), newestVersion: "31.0.15.3699" },
  { ...pkg("oem44.inf", "u0401234.inf", "Advanced Micro Devices, Inc.", "Display", "31.0.21921.1000", "2024-11-12", 790.1, []), newestVersion: "31.0.24027.1012" },
  { ...pkg("oem14.inf", "hdxhpc.inf", "Realtek Semiconductor Corp.", "MEDIA", "6.0.9549.1", "2023-04-11", 61.3, []), newestVersion: "6.0.9967.1" },
  { ...pkg("oem7.inf", "netrtwlane.inf", "Realtek Semiconductor Corp.", "Net", "2023.0.10.220", "2023-07-01", 17.2, []), newestVersion: "2024.0.10.114" },
];

export interface Ghost {
  instanceId: string;
  name: string;
  class: string;
  hidden: boolean;
}

const ghost = (instanceId: string, name: string, cls: string, hidden = false): Ghost => ({ instanceId, name, class: cls, hidden });

export const GHOSTS: Ghost[] = [
  ghost("g1", "Logitech USB Receiver", "USB"),
  ghost("g2", "Apple Mobile Device USB Composite Device", "USB"),
  ghost("g3", "HID-compliant mouse", "Mouse"),
  ghost("g4", "Intel(R) Wi-Fi 6 AX200 160MHz", "Net"),
  ghost("g5", "Realtek USB GbE Family Controller", "Net"),
  ghost("g6", "Bluetooth headphones", "MEDIA"),
  ghost("g7", "Microsoft Print to PDF", "PrintQueue", true),
  ghost("g8", "SanDisk Ultra USB Device", "DiskDrive", true),
  ghost("g9", "Volume", "Volume", true),
  ghost("g10", "Hyper-V Virtual Ethernet Adapter", "Net", true),
];

export interface ProblemDevice {
  instanceId: string;
  name: string;
  class: string;
  problem: Problem;
  fix: "reinstall" | "enable" | "findDriver";
  fixLabel: string;
  driverMayHelp: boolean;
}

export const PROBLEM_DEVICES: ProblemDevice[] = [
  { instanceId: "touchpad", name: "Synaptics SMBus TouchPad", class: "Mouse", problem: PROBLEMS[10], fix: "reinstall", fixLabel: "Set up again", driverMayHelp: true },
  {
    instanceId: "ethernet",
    name: "Realtek PCIe GbE Family Controller",
    class: "Net",
    problem: { code: 22, title: "Turned off", advice: "This device was turned off in Device Manager. Turn it back on there if you use it." },
    fix: "enable",
    fixLabel: "Turn on",
    driverMayHelp: false,
  },
  { instanceId: "unknown", name: "Unknown device", class: "", problem: PROBLEMS[28], fix: "findDriver", fixLabel: "Find a driver", driverMayHelp: false },
];

export type FixId = "noSound" | "noInternet" | "wrongResolution" | "usb" | "bluetooth";

export interface Fix {
  id: FixId;
  title: string;
  sub: string;
  steps: string[];
  undo: string;
  /** What each step finds on the sample PC: [fixed?, note]. */
  results: [boolean, string | null][];
}

export const FIXES: Fix[] = [
  {
    id: "noSound",
    title: "Fix no sound",
    sub: "Windows' sound services, sound devices that are off or have a problem, and something to play sound on.",
    steps: ["Check Windows' sound services are running", "Turn on sound devices that are turned off", "Set up sound devices with a problem again", "Check there are speakers or headphones to play on"],
    undo: "Services were only started and devices only turned on or set up again, with their own drivers. To put everything back, use the restore point made first (History tab > Open System Restore).",
    results: [
      [false, "They're running."],
      [false, "None are turned off."],
      [false, "None have a problem."],
      [false, "2 sound devices found. If the sound still goes to the wrong one, pick it in Windows' Sound settings."],
    ],
  },
  {
    id: "noInternet",
    title: "Fix no internet",
    sub: "Network services, adapters that are off or have a problem, and Windows' network settings reset.",
    steps: [
      "Clear the list of saved web addresses (DNS)",
      "Check Windows' network services are running",
      "Turn on network adapters that are turned off",
      "Set up network adapters with a problem again",
      "Reset Windows' network settings (finishes after a restart)",
    ],
    undo: "Resetting network settings clears settings made by hand, like a fixed IP address, and some VPN settings; set those up again afterwards. The restore point made first puts everything back (History tab > Open System Restore).",
    results: [
      [true, null],
      [false, "They're running."],
      [true, "Turned on: Realtek PCIe GbE Family Controller."],
      [false, "None have a problem."],
      [true, "Restart the PC to finish."],
    ],
  },
  {
    id: "wrongResolution",
    title: "Fix wrong screen resolution",
    sub: "A blurry or stuck resolution usually means Windows' basic display driver is in use instead of the graphics card's own.",
    steps: ["Check which driver the graphics card uses", "Ask Windows to set up the graphics card again"],
    undo: "Only Windows' own setup runs again; nothing is removed. The restore point made first puts everything back (History tab > Open System Restore).",
    results: [
      [false, 'NVIDIA GeForce RTX 3060 Laptop GPU has its own driver. Pick the resolution marked "Recommended" in Windows\' Display settings.'],
      [false, "Not needed."],
    ],
  },
  {
    id: "usb",
    title: "Fix USB not recognized",
    sub: "USB devices that failed to start, and the USB controllers reset.",
    steps: ["Set up USB devices that failed again", "Reset the USB controllers (the mouse and keyboard may pause for a moment)", "Look for hardware changes"],
    undo: "Devices are only restarted and set up again, with their own drivers. Unplug and plug in the device that wasn't recognized afterwards. The restore point made first puts everything back.",
    results: [
      [false, "None have a problem."],
      [true, "2 controllers reset."],
      [true, "Windows looked for hardware changes and set up anything new."],
    ],
  },
  {
    id: "bluetooth",
    title: "Fix Bluetooth",
    sub: "The Bluetooth service and the Bluetooth adapter.",
    steps: ["Check the Bluetooth service is running", "Turn on or restart the Bluetooth adapter", "Look for hardware changes"],
    undo: "The service was only started and the adapter turned on or restarted. Pair devices again if they don't reconnect. The restore point made first puts everything back.",
    results: [
      [false, "They're running."],
      [true, "Restarted: Realtek Bluetooth Adapter."],
      [true, "Windows looked for hardware changes and set up anything new."],
    ],
  },
];

export const HARDWARE: { id: string; title: string; items: { name: string; details: [string, string][] }[] }[] = [
  { id: "processor", title: "Processor", items: [{ name: "AMD Ryzen 7 5800H with Radeon Graphics", details: [["Cores", "8"], ["Threads", "16"], ["Base speed", "3.20 GHz"], ["Maker", "AMD"]] }] },
  {
    id: "graphics",
    title: "Graphics",
    items: [
      { name: "NVIDIA GeForce RTX 3060 Laptop GPU", details: [["Graphics memory", "6 GB"], ["Driver", "31.0.15.3699 (2023-08-14)"]] },
      { name: "AMD Radeon(TM) Graphics", details: [["Graphics memory", "512 MB"], ["Driver", "31.0.24027.1012 (2025-09-30)"]] },
    ],
  },
  { id: "board", title: "Motherboard and BIOS", items: [{ name: "HP OMEN by HP Laptop 16-c0xxx", details: [["Kind", "PC model"]] }, { name: "HP 8A5F", details: [["BIOS", "AMI F.21"], ["BIOS date", "07/12/2025"]] }] },
  {
    id: "memory",
    title: "Memory",
    items: [
      { name: "16 GB installed", details: [["Usable by Windows", "15.4 GB"], ["Modules", "2"]] },
      { name: "8 GB DDR4 SO-DIMM", details: [["Slot", "DIMM 0"], ["Speed", "3200 MT/s"], ["Maker", "Samsung"]] },
      { name: "8 GB DDR4 SO-DIMM", details: [["Slot", "DIMM 1"], ["Speed", "3200 MT/s"], ["Maker", "Samsung"]] },
    ],
  },
  {
    id: "drives",
    title: "Drives",
    items: [
      { name: "SAMSUNG MZVL21T0HCLR-00BH1", details: [["Kind", "Drive"]] },
      { name: "Drive C:", details: [["Size", "1.0 TB"], ["Free", "412 GB (41%)"]] },
      { name: "USB drive E:", details: [["Size", "32 GB"], ["Free", "29 GB (91%)"]] },
    ],
  },
  { id: "network", title: "Network", items: [{ name: "Realtek RTL8822CE 802.11ac PCIe Adapter", details: [["Maker", "Realtek Semiconductor Corp."], ["Driver", "2024.0.10.114 (2024-03-11)"]] }] },
  { id: "sound", title: "Sound", items: [{ name: "Realtek(R) Audio", details: [["Maker", "Realtek"], ["Driver", "6.0.9967.1 (2023-11-02)"]] }] },
  { id: "windows", title: "Windows", items: [{ name: "Windows 11 Home 24H2", details: [["Build", "26100.2314"], ["Kind", "64-bit"]] }] },
];

export interface Crash {
  daysAgo: number;
  hour: number;
  minute: number;
  file: string | null;
  codeText: string;
  name: string;
  plain: string;
  params: string[];
  module: string | null;
  confidence: "high" | "medium" | null;
  why: string;
  device: { instanceId: string; name: string } | null;
}

export const CONFIDENCE_LABEL = { high: "Very likely", medium: "Likely" } as const;

export const CRASHES: Crash[] = [
  {
    daysAgo: 2,
    hour: 21,
    minute: 14,
    file: "110126-9031-01.dmp",
    codeText: "0x000000D1",
    name: "DRIVER_IRQL_NOT_LESS_OR_EQUAL",
    plain: "A driver used memory it wasn't allowed to.",
    params: ["0x10", "0x2", "0x0", "0xFFFFF80612A3B4C5"],
    module: "nvlddmkm.sys",
    confidence: "high",
    why: "The crash happened inside nvlddmkm.sys (the address in the stop code's parameter 4).",
    device: { instanceId: GPU_ID, name: "NVIDIA GeForce RTX 3060 Laptop GPU" },
  },
  {
    daysAgo: 9,
    hour: 16,
    minute: 42,
    file: "102526-7562-01.dmp",
    codeText: "0x0000003B",
    name: "SYSTEM_SERVICE_EXCEPTION",
    plain: "A driver ran into an error while Windows was working for an app.",
    params: ["0xC0000005", "0xFFFFF8034A1B22C0", "0xFFFFC2810B1F7920", "0x0"],
    module: "rtwlane.sys",
    confidence: "medium",
    why: "The crash happened inside Windows (ntoskrnl.exe), called from rtwlane.sys.",
    device: { instanceId: WIFI_ID, name: "Realtek RTL8822CE 802.11ac PCIe Adapter" },
  },
  {
    daysAgo: 30,
    hour: 10,
    minute: 5,
    file: null,
    codeText: "0x00000124",
    name: "WHEA_UNCORRECTABLE_ERROR",
    plain: "The hardware reported an error it couldn't fix (processor, memory or overheating), not a driver.",
    params: ["0x0", "0xFFFFA00000000000", "0xBE000000", "0x800400"],
    module: null,
    confidence: null,
    why: "This was a hardware error, not a driver. Check cooling, and any overclocking or memory settings.",
    device: null,
  },
];
