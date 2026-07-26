import { useParams } from "react-router-dom";
import { Package, MapPin, Building2, Tag, ShieldCheck, Wrench } from "lucide-react";
import { useAssetStore } from "./assetStore";
import {
  getAsset,
  CATEGORY_GRADIENTS,
  STATUS_BADGE,
  CONDITION_COLORS,
  formatGBP,
} from "./assetData";

/**
 * Public, auth-free product card surfaced when an asset tag QR code is scanned.
 * Shows a concise description and summary of a single asset so the page works
 * on any device without logging in.
 */
export default function AssetCardPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const fromStore = useAssetStore((s) => (assetId ? s.assets.find((a) => a.id === assetId) : undefined));
  const asset = fromStore ?? (assetId ? getAsset(assetId) : undefined);

  if (!asset) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#021733] p-6 text-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-10">
          <Package className="mx-auto mb-4 h-10 w-10 text-white/60" />
          <h1 className="text-lg font-semibold text-white">Asset not found</h1>
          <p className="mt-1 text-sm text-white/60">This asset tag does not match any item in the Nexa portfolio.</p>
        </div>
      </div>
    );
  }

  const summary = `${asset.condition} condition ${asset.category.toLowerCase()} manufactured by ${asset.manufacturer}${
    asset.model ? ` (${asset.model})` : ""
  }, currently ${asset.status.toLowerCase()} at ${asset.location}.`;

  return (
    <div className="flex min-h-screen items-start justify-center bg-[#021733] p-4 sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header / hero */}
        <div className="relative h-40" style={{ background: CATEGORY_GRADIENTS[asset.category] }}>
          {asset.imageUrl ? (
            <img src={asset.imageUrl} alt={asset.name} className="h-full w-full object-cover opacity-90" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-16 w-16 text-white/40" />
            </div>
          )}
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            <Tag className="h-3 w-3" />
            {asset.tag}
          </span>
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="mb-1 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[asset.status].className}`}>
              {STATUS_BADGE[asset.status].label}
            </span>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium"
              style={{ color: CONDITION_COLORS[asset.condition] }}
            >
              ● {asset.condition}
            </span>
          </div>

          <h1 className="text-xl font-bold text-[#021733]">{asset.name}</h1>
          <p className="text-sm text-[#0062AD]">{asset.category}</p>

          <p className="mt-3 text-sm leading-relaxed text-gray-600">{summary}</p>

          {/* Summary rows */}
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <CardRow icon={<Building2 className="h-4 w-4" />} label="Manufacturer" value={asset.manufacturer} />
            <CardRow icon={<Package className="h-4 w-4" />} label="Model" value={asset.model || "—"} />
            <CardRow icon={<Tag className="h-4 w-4" />} label="Serial No." value={asset.serialNumber} />
            <CardRow icon={<MapPin className="h-4 w-4" />} label="Location" value={asset.location} />
            <CardRow icon={<Building2 className="h-4 w-4" />} label="Company" value={asset.company} />
            <CardRow icon={<Wrench className="h-4 w-4" />} label="Book Value" value={formatGBP(asset.currentBookValue)} />
          </dl>

          <div className="mt-5 flex items-center justify-center gap-2 border-t border-gray-100 pt-4 text-xs text-gray-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Nexa asset record
          </div>
        </div>
      </div>
    </div>
  );
}

function CardRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-gray-400">
        <span className="text-[#0062AD]">{icon}</span>
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-[#021733]">{value}</dd>
    </div>
  );
}
