"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateBrandingAction,
  createSectionAction,
  updateSectionAction,
  createTableAction,
  updateTableAction,
  deleteTableAction,
  openBillingPortalAction,
} from "@/app/dashboard/settings/actions";

type Settings = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  businessInfo: any;
  defaultLocale: string;
  enabledLocales: string[];
  timezone: string;
  minPartySize: number;
  maxPartySize: number;
};

type Section = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  availableFrom: Date | string | null;
  availableTo: Date | string | null;
  daysOfWeek: number[];
  tables: {
    id: string;
    label: string;
    capacity: number;
    minCapacity: number;
    isActive: boolean;
    sortOrder: number;
    notes: string | null;
  }[];
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toHHMM(value: Date | string | null | undefined): string {
  if (!value) return "";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) {
      // maybe already "HH:mm"
      const m = String(value).match(/(\d{2}):(\d{2})/);
      return m ? `${m[1]}:${m[2]}` : "";
    }
    return d.toISOString().slice(11, 16);
  } catch {
    return "";
  }
}

const FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Playfair Display",
  "Merriweather",
  "Poppins",
  "Montserrat",
];

type Props = {
  settings: Settings;
  sections: Section[];
};

export function SettingsClient({ settings, sections: initialSections }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [tab, setTab] = useState<"branding" | "sections">("branding");

  // Branding form state
  const [name, setName] = useState(settings.name);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || "");
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(settings.secondaryColor);
  const [fontFamily, setFontFamily] = useState(settings.fontFamily);
  const [address, setAddress] = useState(settings.businessInfo?.address || "");
  const [phone, setPhone] = useState(settings.businessInfo?.phone || "");
  const [email, setEmail] = useState(settings.businessInfo?.email || "");
  const [openingHours, setOpeningHours] = useState(settings.businessInfo?.openingHours || "");

  // Sections state
  const [sections, setSections] = useState(initialSections);
  const [newSectionName, setNewSectionName] = useState("");
  const [newTable, setNewTable] = useState<{ sectionId: string; label: string; capacity: number } | null>(null);

  function showMsg(type: "ok" | "err", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  function handleSaveBranding(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateBrandingAction({
        name,
        logoUrl: logoUrl || null,
        primaryColor,
        secondaryColor,
        fontFamily,
        businessInfo: { address, phone, email, openingHours },
      });
      if (result.error) showMsg("err", result.error);
      else {
        showMsg("ok", "Branding saved");
        router.refresh();
      }
    });
  }

  function handleCreateSection(e: React.FormEvent) {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    startTransition(async () => {
      const slug = newSectionName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const result = await createSectionAction({
        name: newSectionName.trim(),
        slug,
      });
      if (result.error) showMsg("err", result.error);
      else {
        showMsg("ok", "Section created");
        setNewSectionName("");
        router.refresh();
      }
    });
  }

  function handleToggleSection(id: string, isActive: boolean) {
    startTransition(async () => {
      const result = await updateSectionAction(id, { isActive: !isActive });
      if (result.error) showMsg("err", result.error);
      else {
        showMsg("ok", isActive ? "Section deactivated" : "Section activated");
        router.refresh();
      }
    });
  }

  function handleCreateTable(e: React.FormEvent) {
    e.preventDefault();
    if (!newTable || !newTable.label.trim()) return;
    startTransition(async () => {
      const result = await createTableAction({
        sectionId: newTable.sectionId,
        label: newTable.label.trim(),
        capacity: newTable.capacity,
      });
      if (result.error) showMsg("err", result.error);
      else {
        showMsg("ok", "Table created");
        setNewTable(null);
        router.refresh();
      }
    });
  }

  function handleUpdateTableCapacity(id: string, capacity: number) {
    startTransition(async () => {
      const result = await updateTableAction(id, { capacity });
      if (result.error) showMsg("err", result.error);
      else {
        showMsg("ok", "Table updated");
        router.refresh();
      }
    });
  }

  function handleDeleteTable(id: string) {
    if (!confirm("Delete this table? Existing reservations will be unassigned.")) return;
    startTransition(async () => {
      const result = await deleteTableAction(id);
      if (result.error) showMsg("err", result.error);
      else {
        showMsg("ok", "Table deleted");
        router.refresh();
      }
    });
  }

  function handleBilling() {
    startTransition(async () => {
      const result = await openBillingPortalAction();
      if (result.error) showMsg("err", result.error);
      else if (result.url) window.location.href = result.url;
    });
  }

  function handleSaveAvailability(
    sectionId: string,
    availableFrom: string,
    availableTo: string,
    daysOfWeek: number[]
  ) {
    startTransition(async () => {
      const result = await updateSectionAction(sectionId, {
        availableFrom: availableFrom || null,
        availableTo: availableTo || null,
        daysOfWeek,
      });
      if (result.error) showMsg("err", result.error);
      else {
        showMsg("ok", "Availability saved");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            message.type === "ok"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
              : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab("branding")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "branding"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Branding & Business
        </button>
        <button
          onClick={() => setTab("sections")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "sections"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Sections & Tables
        </button>
      </div>

      {/* Branding tab */}
      {tab === "branding" && (
        <form onSubmit={handleSaveBranding} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Restaurant name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo URL</label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Primary color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-14 rounded border border-slate-300 cursor-pointer"
                />
                <input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Secondary color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-10 w-14 rounded border border-slate-300 cursor-pointer"
                />
                <input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Font family</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              >
                {FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="font-medium text-slate-800 mb-4">Business info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Opening hours</label>
                <input
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  placeholder="e.g. Tue-Sun 13:00-16:00 & 20:00-23:30"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="font-medium text-slate-800 mb-3">Preview</h3>
            <div
              className="rounded-xl p-6 text-white"
              style={{ backgroundColor: primaryColor, fontFamily }}
            >
              <div className="flex items-center gap-3 mb-2">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-10 w-auto bg-white/20 rounded p-1" />
                ) : (
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center font-bold"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    {name.charAt(0)}
                  </div>
                )}
                <span className="text-xl font-semibold">{name || "Restaurant"}</span>
              </div>
              <p className="text-sm opacity-90">{address || "Your address"}</p>
              <p className="text-sm opacity-80 mt-1">{openingHours || "Opening hours"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="submit"
              disabled={isPending}
              className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-lg transition"
            >
              {isPending ? "Saving…" : "Save branding"}
            </button>
            <button
              type="button"
              onClick={handleBilling}
              disabled={isPending}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-5 py-2.5 rounded-lg transition"
            >
              Manage billing
            </button>
          </div>
        </form>
      )}

      {/* Sections & Tables tab */}
      {tab === "sections" && (
        <div className="space-y-6">
          {/* Create section */}
          <form
            onSubmit={handleCreateSection}
            className="bg-white rounded-xl border border-slate-200 p-5 flex flex-wrap gap-3 items-end"
          >
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New section</label>
              <input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="e.g. Terrace, Sala 1, Inside"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !newSectionName.trim()}
              className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg"
            >
              Add section
            </button>
          </form>

          {/* Sections list */}
          {sections.map((section) => (
            <div
              key={section.id}
              className={`bg-white rounded-xl border p-5 ${
                section.isActive ? "border-slate-200" : "border-slate-100 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{section.name}</h3>
                  <p className="text-xs text-slate-500">slug: {section.slug}</p>
                </div>
                <button
                  onClick={() => handleToggleSection(section.id, section.isActive)}
                  disabled={isPending}
                  className={`text-sm px-3 py-1 rounded-lg border ${
                    section.isActive
                      ? "border-slate-300 text-slate-600 hover:bg-slate-50"
                      : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {section.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>

              {/* Availability rules */}
              <SectionAvailabilityEditor
                section={section}
                onSave={handleSaveAvailability}
                disabled={isPending}
              />

              {/* Tables */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Tables ({section.tables.length})
                </div>
                {section.tables.map((table) => (
                  <div
                    key={table.id}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <span className="font-medium text-slate-800 w-16">{table.label}</span>
                    <span className="text-sm text-slate-500">Capacity:</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      defaultValue={table.capacity}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (v && v !== table.capacity) handleUpdateTableCapacity(table.id, v);
                      }}
                      className="w-16 px-2 py-1 text-sm border border-slate-300 rounded"
                    />
                    <span className="text-sm text-slate-400">pax</span>
                    <button
                      onClick={() => handleDeleteTable(table.id)}
                      disabled={isPending}
                      className="ml-auto text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}

                {/* Add table */}
                {newTable?.sectionId === section.id ? (
                  <form onSubmit={handleCreateTable} className="flex flex-wrap gap-2 items-center pt-2">
                    <input
                      value={newTable.label}
                      onChange={(e) => setNewTable({ ...newTable, label: e.target.value })}
                      placeholder="Label (e.g. T1)"
                      className="px-2 py-1.5 text-sm border border-slate-300 rounded w-28"
                      autoFocus
                    />
                    <input
                      type="number"
                      min={1}
                      value={newTable.capacity}
                      onChange={(e) =>
                        setNewTable({ ...newTable, capacity: parseInt(e.target.value, 10) || 2 })
                      }
                      className="px-2 py-1.5 text-sm border border-slate-300 rounded w-20"
                    />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="text-sm bg-teal-700 text-white px-3 py-1.5 rounded"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTable(null)}
                      className="text-sm text-slate-500"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() =>
                      setNewTable({ sectionId: section.id, label: "", capacity: 4 })
                    }
                    className="text-sm text-teal-700 hover:underline pt-1"
                  >
                    + Add table
                  </button>
                )}
              </div>
            </div>
          ))}

          {sections.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
              No sections yet. Create one above (e.g. Interior, Terrace, Sala 1).
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionAvailabilityEditor({
  section,
  onSave,
  disabled,
}: {
  section: Section;
  onSave: (id: string, from: string, to: string, days: number[]) => void;
  disabled: boolean;
}) {
  const [from, setFrom] = useState(toHHMM(section.availableFrom));
  const [to, setTo] = useState(toHHMM(section.availableTo));
  const [days, setDays] = useState<number[]>(
    section.daysOfWeek?.length ? section.daysOfWeek : [0, 1, 2, 3, 4, 5, 6]
  );

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
  }

  return (
    <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-3">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        Availability
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">From</label>
          <input
            type="time"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-2 py-1.5 text-sm border border-slate-300 rounded"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">To</label>
          <input
            type="time"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-2 py-1.5 text-sm border border-slate-300 rounded"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {DAY_LABELS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`w-9 h-8 text-xs rounded border ${
                days.includes(i)
                  ? "bg-teal-700 text-white border-teal-700"
                  : "bg-white text-slate-500 border-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSave(section.id, from, to, days)}
          className="text-sm bg-slate-800 text-white px-3 py-1.5 rounded disabled:opacity-60"
        >
          Save hours
        </button>
      </div>
      <p className="text-xs text-slate-400">
        Leave times empty for all-day. Guests can only book within these rules when this section is selected.
      </p>
    </div>
  );
}
