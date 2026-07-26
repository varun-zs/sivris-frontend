// ════════════════════════════════════════════════════════════════
// SIVRIS — Add New Asset wizard (6-step modal)
// ════════════════════════════════════════════════════════════════
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  X,
  Car,
  Building,
  Laptop,
  Armchair,
  Wrench,
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  ImagePlus,
  Trash2,
} from "lucide-react";
import type { AssetCategory, NexaCompany } from "@/types/asset";
import { ASSET_CATEGORIES, COMPANIES, LOCATIONS_LIST, formatGBP, createAsset } from "./assetData";
import { useAssetStore } from "./assetStore";

const CATEGORY_ICON: Record<AssetCategory, typeof Car> = {
  Vehicles: Car,
  "Office Properties": Building,
  "IT Equipment": Laptop,
  "Office Furniture": Armchair,
  Machinery: Wrench,
  Other: Box,
};

const STEPS = ["Category", "Basic Details", "Financial", "Placement", "Images", "Documents", "Review"];

interface WizardData {
  category: AssetCategory | null;
  name: string;
  description: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  purchasePrice: string;
  purchaseDate: string;
  vendor: string;
  usefulLife: string;
  salvageValue: string;
  location: string;
  company: NexaCompany;
  images: string[];
  documents: string[];
}

const initialData: WizardData = {
  category: null,
  name: "",
  description: "",
  manufacturer: "",
  model: "",
  serialNumber: "",
  purchasePrice: "",
  purchaseDate: "",
  vendor: "",
  usefulLife: "",
  salvageValue: "",
  location: LOCATIONS_LIST[0],
  company: "Nexa Holdings",
  images: [],
  documents: [],
};

/** Read selected image files as data URLs so previews persist with the asset. */
function readImagesAsDataUrls(files: FileList): Promise<string[]> {
  return Promise.all(
    Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
  );
}

export function AddAssetWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const assets = useAssetStore((s) => s.assets);
  const addAsset = useAssetStore((s) => s.addAsset);

  const update = (patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch }));
  const reset = () => { setStep(0); setData(initialData); };
  const close = () => { reset(); onClose(); };

  const canNext = () => {
    if (step === 0) return data.category !== null;
    if (step === 1) return data.name.trim() !== "";
    if (step === 2) return data.purchasePrice !== "" && data.purchaseDate !== "";
    return true;
  };

  const submit = () => {
    if (!data.category) return;
    const newAsset = createAsset(
      {
        name: data.name.trim(),
        category: data.category,
        manufacturer: data.manufacturer.trim(),
        model: data.model.trim(),
        serialNumber: data.serialNumber.trim(),
        purchasePrice: Number(data.purchasePrice) || 0,
        purchaseDate: data.purchaseDate,
        usefulLifeYears: Number(data.usefulLife) || 5,
        salvageValue: Number(data.salvageValue) || 0,
        status: "In Use",
        condition: "Excellent",
        location: data.location,
        company: data.company,
        vendor: data.vendor.trim(),
        images: data.images,
      },
      assets
    );
    addAsset(newAsset);
    toast.success(`Asset added — tag ${newAsset.tag}`);
    close();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={close}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + stepper */}
        <div className="border-b border-[var(--border)] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Add New Asset</h2>
            <button onClick={close} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-4 flex items-center">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      i < step ? "bg-[#0062AD] text-white" : i === step ? "bg-[#d15914] text-white" : "bg-[var(--surface)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {i < step ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className="mt-1 hidden text-[10px] text-[var(--text-secondary)] sm:block">{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${i < step ? "bg-[#0062AD]" : "bg-[var(--border)]"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
              {step === 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {ASSET_CATEGORIES.map((cat) => {
                    const Icon = CATEGORY_ICON[cat];
                    const active = data.category === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => update({ category: cat })}
                        className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${active ? "border-[#0062AD] bg-[#0062AD]/10" : "border-[var(--border)] hover:border-[#9cc2e5]"}`}
                      >
                        <Icon className={`h-7 w-7 ${active ? "text-[#0062AD]" : "text-[var(--text-secondary)]"}`} />
                        <span className="text-xs font-medium text-[var(--text-primary)]">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 1 && (
                <div className="flex flex-col gap-3">
                  <Field label="Asset Name"><input value={data.name} onChange={(e) => update({ name: e.target.value })} className={inputCls} placeholder="e.g. MacBook Pro 16-inch" /></Field>
                  <Field label="Description"><textarea value={data.description} onChange={(e) => update({ description: e.target.value })} className={inputCls} rows={2} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Manufacturer"><input value={data.manufacturer} onChange={(e) => update({ manufacturer: e.target.value })} className={inputCls} /></Field>
                    <Field label="Model"><input value={data.model} onChange={(e) => update({ model: e.target.value })} className={inputCls} /></Field>
                  </div>
                  <Field label="Serial Number"><input value={data.serialNumber} onChange={(e) => update({ serialNumber: e.target.value })} className={inputCls} /></Field>
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Purchase Price (£)"><input type="number" value={data.purchasePrice} onChange={(e) => update({ purchasePrice: e.target.value })} className={inputCls} /></Field>
                    <Field label="Purchase Date"><input type="date" value={data.purchaseDate} onChange={(e) => update({ purchaseDate: e.target.value })} className={inputCls} /></Field>
                  </div>
                  <Field label="Vendor"><input value={data.vendor} onChange={(e) => update({ vendor: e.target.value })} className={inputCls} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Useful Life (years)"><input type="number" value={data.usefulLife} onChange={(e) => update({ usefulLife: e.target.value })} className={inputCls} /></Field>
                    <Field label="Salvage Value (£)"><input type="number" value={data.salvageValue} onChange={(e) => update({ salvageValue: e.target.value })} className={inputCls} /></Field>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-3">
                  <Field label="Location / Office">
                    <select value={data.location} onChange={(e) => update({ location: e.target.value })} className={inputCls}>
                      {LOCATIONS_LIST.map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </Field>
                  <Field label="Company / Subsidiary">
                    <select value={data.company} onChange={(e) => update({ company: e.target.value as NexaCompany })} className={inputCls}>
                      {COMPANIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>
              )}

              {step === 4 && (
                <div className="flex flex-col gap-4">
                  <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] p-8 text-center hover:border-[#0062AD]">
                    <ImagePlus className="h-8 w-8 text-[#0062AD]" />
                    <span className="text-sm text-[var(--text-primary)]">Click to upload photos of the asset</span>
                    <span className="text-xs text-[var(--text-muted)]">JPG, PNG, WEBP · multiple allowed</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        if (!e.target.files?.length) return;
                        const urls = await readImagesAsDataUrls(e.target.files);
                        update({ images: [...data.images, ...urls] });
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {data.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {data.images.map((src, i) => (
                        <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--border)]">
                          <img src={src} alt={`Asset photo ${i + 1}`} className="h-full w-full object-cover" />
                          {i === 0 && (
                            <span className="absolute left-1 top-1 rounded bg-[#0062AD] px-1.5 py-0.5 text-[9px] font-medium text-white">Primary</span>
                          )}
                          <button
                            onClick={() => update({ images: data.images.filter((_, idx) => idx !== i) })}
                            className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500"
                            title="Remove photo"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-[var(--text-muted)]">The first photo is used as the asset's primary image.</p>
                </div>
              )}

              {step === 5 && (
                <div className="flex flex-col gap-3">
                  <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] p-8 text-center hover:border-[#0062AD]">
                    <UploadCloud className="h-8 w-8 text-[#0062AD]" />
                    <span className="text-sm text-[var(--text-primary)]">Click to upload purchase invoice & warranty</span>
                    <span className="text-xs text-[var(--text-muted)]">PDF, DOCX, JPG, PNG</span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => update({ documents: Array.from(e.target.files ?? []).map((f) => f.name) })}
                    />
                  </label>
                  {data.documents.length > 0 && (
                    <ul className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                      {data.documents.map((d) => <li key={d} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-green-600" /> {d}</li>)}
                    </ul>
                  )}
                </div>
              )}

              {step === 6 && (
                <div className="flex flex-col gap-2 text-sm">
                  <ReviewRow label="Category" value={data.category ?? "—"} />
                  <ReviewRow label="Name" value={data.name || "—"} />
                  <ReviewRow label="Manufacturer / Model" value={`${data.manufacturer || "—"} / ${data.model || "—"}`} />
                  <ReviewRow label="Serial Number" value={data.serialNumber || "—"} />
                  <ReviewRow label="Purchase Price" value={data.purchasePrice ? formatGBP(Number(data.purchasePrice)) : "—"} />
                  <ReviewRow label="Purchase Date" value={data.purchaseDate || "—"} />
                  <ReviewRow label="Useful Life" value={data.usefulLife ? `${data.usefulLife} yrs` : "—"} />
                  <ReviewRow label="Location" value={data.location} />
                  <ReviewRow label="Company" value={data.company} />
                  <ReviewRow label="Photos" value={data.images.length ? `${data.images.length} photo(s)` : "None"} />
                  <ReviewRow label="Documents" value={data.documents.length ? `${data.documents.length} file(s)` : "None"} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] p-4">
          <button
            onClick={() => (step === 0 ? close() : setStep((s) => s - 1))}
            className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)]"
          >
            <ChevronLeft className="h-4 w-4" /> {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => canNext() && setStep((s) => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-1 rounded-lg bg-[#0062AD] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#306eb8] disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={submit} className="flex items-center gap-1 rounded-lg bg-[#0062AD] px-4 py-2 text-sm font-medium text-white hover:bg-[#306eb8]">
              <Check className="h-4 w-4" /> Submit Asset
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[#0062AD]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
      {children}
    </label>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] py-1.5 last:border-0">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
