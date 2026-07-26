// ════════════════════════════════════════════════════════════════
// SIVRIS — Asset card (e-commerce product-card style)
// ----------------------------------------------------------------
// Grid, list and table-row presentations of a single Asset, mirroring
// the Stocks / Properties Portfolio card pattern.
// ════════════════════════════════════════════════════════════════
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Car,
  Building,
  Laptop,
  Armchair,
  Wrench,
  Box,
  MapPin,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import type { Asset, AssetCategory } from "@/types/asset";
import {
  CATEGORY_GRADIENTS,
  STATUS_BADGE,
  CONDITION_COLORS,
  formatGBP,
  totalDepreciation,
  ageLabel,
} from "./assetData";

const CATEGORY_ICON: Record<AssetCategory, typeof Car> = {
  Vehicles: Car,
  "Office Properties": Building,
  "IT Equipment": Laptop,
  "Office Furniture": Armchair,
  Machinery: Wrench,
  Other: Box,
};

interface AssetCardProps {
  asset: Asset;
  index: number;
  viewMode: "grid" | "list" | "table";
  selected: boolean;
  onToggleSelect: (id: string) => void;
  canManage: boolean;
  selectable: boolean;
}

function lifeBarColor(pct: number): string {
  if (pct <= 50) return "#22c55e";
  if (pct <= 80) return "#ff8735";
  return "#ef4444";
}

function warrantyActive(asset: Asset): boolean {
  return asset.warranty.status === "Under Warranty";
}

export function AssetCard({ asset, index, viewMode, selected, onToggleSelect, selectable }: AssetCardProps) {
  const Icon = CATEGORY_ICON[asset.category];
  const status = STATUS_BADGE[asset.status];

  // ─── TABLE ROW ───
  if (viewMode === "table") {
    return (
      <tr className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]">
        {selectable && (
          <td className="px-3 py-2.5">
            <input type="checkbox" checked={selected} onChange={() => onToggleSelect(asset.id)} className="h-4 w-4 accent-[#0062AD]" />
          </td>
        )}
        <td className="px-3 py-2.5">
          <Link to={`/assets/${asset.id}`} className="font-medium text-[var(--text-primary)] hover:text-[#0062AD]">{asset.name}</Link>
          <p className="font-mono text-[10px] text-[var(--text-secondary)]">{asset.tag}</p>
        </td>
        <td className="px-3 py-2.5 text-[var(--text-secondary)]">{asset.category}</td>
        <td className="px-3 py-2.5"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}>{status.label}</span></td>
        <td className="px-3 py-2.5 text-[var(--text-secondary)]">{asset.location}</td>
        <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">{formatGBP(asset.purchasePrice)}</td>
        <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">{formatGBP(asset.currentBookValue)}</td>
        <td className="px-3 py-2.5">
          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: CONDITION_COLORS[asset.condition] }}>{asset.condition}</span>
        </td>
      </tr>
    );
  }

  // ─── LIST ROW ───
  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.02, 0.3) }}
        className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3 transition-colors hover:border-[#0062AD]"
      >
        {selectable && (
          <input type="checkbox" checked={selected} onChange={() => onToggleSelect(asset.id)} className="h-4 w-4 accent-[#0062AD]" />
        )}
        <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg" style={{ background: CATEGORY_GRADIENTS[asset.category] }}>
          <Icon className="h-6 w-6 text-white/80" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link to={`/assets/${asset.id}`} className="truncate font-semibold text-[var(--text-primary)] hover:text-[#0062AD]">{asset.name}</Link>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}>{status.label}</span>
          </div>
          <p className="font-mono text-xs text-[var(--text-secondary)]">{asset.tag} · {asset.location}</p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-xs text-[var(--text-secondary)]">Book value</p>
          <p className="font-semibold text-[var(--text-primary)]">{formatGBP(asset.currentBookValue)}</p>
        </div>
        <Link to={`/assets/${asset.id}`} className="shrink-0 rounded-lg border border-[#0062AD] px-3 py-1.5 text-xs font-medium text-[#0062AD] hover:bg-[#0062AD] hover:text-white">
          View
        </Link>
      </motion.div>
    );
  }

  // ─── GRID CARD (e-commerce) ───
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4) }}
      whileHover={{ y: -6, boxShadow: "0 12px 28px rgba(0,0,0,0.12)" }}
    >
      <Link
        to={`/assets/${asset.id}`}
        className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-l-4 border-[var(--border)] border-l-transparent bg-[var(--surface-elevated)] transition-colors hover:border-l-[#0062AD]"
      >
        {/* Image / placeholder */}
        <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ background: CATEGORY_GRADIENTS[asset.category] }}>
          <div className="flex h-full w-full items-center justify-center">
            <Icon className="h-16 w-16 text-white/30" />
          </div>
          <span className="absolute left-2 top-2 rounded-full bg-[#021733] px-2.5 py-1 text-[10px] font-medium text-white">{asset.category}</span>
          <span className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-medium ${status.className}`}>{status.label}</span>
          {selectable && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(asset.id)}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2 left-2 h-4 w-4 accent-[#0062AD]"
              aria-label="Select asset"
            />
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div>
            <h3 className="text-lg font-semibold leading-tight text-[var(--text-primary)]">{asset.name}</h3>
            <p className="font-mono text-xs text-[var(--text-secondary)]">{asset.tag}</p>
            <p className="font-mono text-[10px] text-[var(--text-muted)]">S/N {asset.serialNumber}</p>
          </div>

          <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
            <MapPin className="h-3.5 w-3.5" /> {asset.location}
          </div>

          <div className="my-1 border-t border-[var(--border)]" />

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
            <Metric label="Purchase" value={formatGBP(asset.purchasePrice)} />
            <Metric label="Book Value" value={formatGBP(asset.currentBookValue)} />
            <Metric label="Depreciation" value={formatGBP(totalDepreciation(asset))} />
            <Metric label="Useful Life" value={`${asset.usefulLifeYears} yrs`} />
            <Metric label="Age" value={ageLabel(asset.ageMonths)} />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Condition</p>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{ backgroundColor: CONDITION_COLORS[asset.condition] }}>{asset.condition}</span>
            </div>
            <div className="col-span-2 flex items-center gap-1.5">
              {warrantyActive(asset) ? <ShieldCheck className="h-3.5 w-3.5 text-green-600" /> : <ShieldAlert className="h-3.5 w-3.5 text-red-500" />}
              <span className={`text-xs ${warrantyActive(asset) ? "text-green-600" : "text-red-500"}`}>
                Warranty {warrantyActive(asset) ? `until ${asset.warranty.endDate}` : asset.warranty.status === "No Warranty" ? "— none" : `expired ${asset.warranty.endDate}`}
              </span>
            </div>
          </div>

          {/* Depreciation progress */}
          <div className="mt-1">
            <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
              <span>Useful life consumed</span>
              <span>{asset.lifeConsumedPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface)]">
              <div className="h-full rounded-full" style={{ width: `${asset.lifeConsumedPct}%`, backgroundColor: lifeBarColor(asset.lifeConsumedPct) }} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
