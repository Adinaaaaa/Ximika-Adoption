"use client";

import { useEffect, useState } from "react";
import type { UserPreferences } from "@cat-matcher/shared";
import { DEFAULT_PREFERENCES } from "@cat-matcher/shared";

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then(setPrefs)
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    setSaving(false);
    setSaved(res.ok);
  }

  function toggle(key: keyof UserPreferences) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted">Customize what counts as a match for you.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <fieldset className="space-y-3">
          <legend className="font-semibold text-lg mb-2">Location</legend>
          <label className="block">
            <span className="text-sm text-muted">Postal code</span>
            <input
              type="text"
              value={prefs.postal_code}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, postal_code: e.target.value }))
              }
              className="mt-1 w-full border border-border rounded-lg px-3 py-2 bg-card"
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">Max distance (km)</span>
            <input
              type="number"
              value={prefs.max_distance_km}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  max_distance_km: Number(e.target.value),
                }))
              }
              className="mt-1 w-full border border-border rounded-lg px-3 py-2 bg-card"
            />
          </label>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-semibold text-lg mb-2">Hard excludes</legend>
          <Toggle
            label="Solo cat only (no buddy/bonded pairs)"
            checked={prefs.solo_cat_only}
            onChange={() => toggle("solo_cat_only")}
          />
          <Toggle
            label="Exclude long-haired cats"
            checked={prefs.exclude_long_hair}
            onChange={() => toggle("exclude_long_hair")}
          />
          <label className="block py-1">
            <span className="text-sm">Maximum age (years)</span>
            <input
              type="number"
              min={0}
              max={20}
              value={prefs.max_age_years}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  max_age_years: Number(e.target.value),
                }))
              }
              className="mt-1 w-full border border-border rounded-lg px-3 py-2 bg-card"
            />
            <span className="text-xs text-muted">
              Only cats under this age (0 = no maximum)
            </span>
          </label>
          <Toggle
            label="Exclude FIV+ cats"
            checked={prefs.exclude_fiv_positive}
            onChange={() => toggle("exclude_fiv_positive")}
          />
          <Toggle
            label="Exclude special-needs / medical care"
            checked={prefs.exclude_special_needs}
            onChange={() => toggle("exclude_special_needs")}
          />
          <Toggle
            label="Exclude aggression history"
            checked={prefs.exclude_aggression_history}
            onChange={() => toggle("exclude_aggression_history")}
          />
          <Toggle
            label="Exclude cats on hold"
            checked={prefs.exclude_on_hold}
            onChange={() => toggle("exclude_on_hold")}
          />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-semibold text-lg mb-2">Preferences (ranking)</legend>
          <Toggle
            label="Prefer quiet cats"
            checked={prefs.prefer_quiet}
            onChange={() => toggle("prefer_quiet")}
          />
          <Toggle
            label="Prefer well-socialized"
            checked={prefs.prefer_well_socialized}
            onChange={() => toggle("prefer_well_socialized")}
          />
          <Toggle
            label="Prefer affectionate / cuddly"
            checked={prefs.prefer_affectionate}
            onChange={() => toggle("prefer_affectionate")}
          />
          <Toggle
            label="Prefer single-person household OK"
            checked={prefs.prefer_single_person_ok}
            onChange={() => toggle("prefer_single_person_ok")}
          />
          <Toggle
            label="Prefer low energy"
            checked={prefs.prefer_low_energy}
            onChange={() => toggle("prefer_low_energy")}
          />
          <Toggle
            label="Small home (indoor bonus)"
            checked={prefs.small_home}
            onChange={() => toggle("small_home")}
          />
        </fieldset>

        <button
          type="submit"
          disabled={saving}
          className="bg-accent text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save preferences"}
        </button>
        {saved && (
          <p className="text-sm text-green-700">Preferences saved!</p>
        )}
      </form>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 accent-[var(--accent)]"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}
