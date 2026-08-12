import type { Provider } from "@/lib/types";

const labels: Record<Provider, string> = {
  spotify: "Spotify",
  soundcloud: "SoundCloud",
  yandex: "Яндекс Музыка",
  apple: "Catalog preview",
  unknown: "Ссылка"
};

export function ProviderBadge({ provider }: { provider: Provider }) {
  return <span className={`provider-badge provider-${provider}`}>{labels[provider]}</span>;
}
