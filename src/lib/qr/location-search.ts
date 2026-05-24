export interface LocationPlace {
  latitude: string;
  longitude: string;
  label: string;
}

interface PhotonProperties {
  name?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  state?: string;
  country?: string;
  county?: string;
}

interface PhotonFeature {
  properties: PhotonProperties;
  geometry: { coordinates: [number, number] };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

function formatPlaceLabel(props: PhotonProperties): string {
  const streetLine = [props.housenumber, props.street].filter(Boolean).join(" ");
  const parts = [props.name, streetLine, props.city, props.state, props.country].filter(
    (part, index, arr) => part && arr.indexOf(part) === index,
  );
  return parts.join(", ") || "Selected location";
}

function mapFeature(feature: PhotonFeature): LocationPlace {
  const [lng, lat] = feature.geometry.coordinates;
  return {
    latitude: String(lat),
    longitude: String(lng),
    label: formatPlaceLabel(feature.properties),
  };
}

export async function searchLocations(query: string, signal?: AbortSignal): Promise<LocationPlace[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("limit", "6");
  url.searchParams.set("lang", "en");

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    throw new Error("Location search failed. Try again in a moment.");
  }

  const data = (await response.json()) as PhotonResponse;
  return data.features.map(mapFeature);
}
