import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://www.greatercambridgewaste.org/bin-calendar";
const SAVED_SELECTION_KEY = "@wastewise_bin_collection_selection";

export type BinAddress = {
  address: string;
  uprn: string;
};

export type BinCollection = {
  date: string;
  binType: string;
};

export type SavedBinCollectionSelection = {
  address: BinAddress;
  collections: BinCollection[];
  savedAt: string;
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function validCambridgePostcode(postcode: string) {
  return /^CB\d{1,2}[A-Z]?\d[A-Z]{2}$/.test(
    postcode.toUpperCase().replace(/\s/g, ""),
  );
}

async function request(path: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("The council calendar is unavailable. Please try again later.");
  }
  return (await response.json()) as Record<string, unknown>;
}

export async function findBinAddresses(postcode: string): Promise<BinAddress[]> {
  const cleanPostcode = postcode.toUpperCase().replace(/\s/g, "");
  if (!validCambridgePostcode(cleanPostcode)) {
    throw new Error("Enter a full Cambridge postcode, for example CB1 2AB.");
  }

  const data = await request(`/addresses?postcode=${encodeURIComponent(cleanPostcode)}`);
  const html = typeof data.addresses === "string" ? data.addresses : "";
  const pattern = /data-address\s*=\s*"([^"]+)"[\s\S]*?data-id\s*=\s*"(\d+)"/gi;
  const addresses = Array.from(html.matchAll(pattern), (match) => ({
    address: decodeHtml(match[1]),
    uprn: match[2],
  }));
  return addresses.filter(
    (address, index) =>
      address.address.length > 0 &&
      addresses.findIndex((candidate) => candidate.uprn === address.uprn) === index,
  );
}

export async function getBinCollections(uprn: string): Promise<BinCollection[]> {
  if (!/^\d+$/.test(uprn)) {
    throw new Error("That address could not be verified.");
  }

  const data = await request(`/collections?uprn=${encodeURIComponent(uprn)}&numberOfCollections=12`);
  const html = typeof data.tableRows === "string" ? data.tableRows : "";
  const pattern = /aria-label\s*=\s*"([^"]+ collection on [^"]+)"/gi;
  const collections = Array.from(html.matchAll(pattern), (match) => {
    const [binType, date] = decodeHtml(match[1]).split(" collection on ", 2);
    return { binType: binType?.trim() ?? "", date: date?.trim() ?? "" };
  });

  return collections.filter((collection) => collection.binType && collection.date);
}

export async function saveBinCollectionSelection(
  address: BinAddress,
  collections: BinCollection[],
): Promise<void> {
  const selection: SavedBinCollectionSelection = {
    address,
    collections,
    savedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(SAVED_SELECTION_KEY, JSON.stringify(selection));
}

export async function loadBinCollectionSelection(): Promise<SavedBinCollectionSelection | null> {
  try {
    const stored = await AsyncStorage.getItem(SAVED_SELECTION_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<SavedBinCollectionSelection>;
    if (
      !parsed.address ||
      typeof parsed.address.address !== "string" ||
      !/^\d+$/.test(parsed.address.uprn) ||
      !Array.isArray(parsed.collections)
    ) {
      return null;
    }
    return parsed as SavedBinCollectionSelection;
  } catch {
    return null;
  }
}
