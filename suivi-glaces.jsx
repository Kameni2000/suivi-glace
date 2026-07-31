import React, { useState, useEffect, useCallback } from "react";
import { Plus, TrendingUp, AlertTriangle, Wallet, IceCreamCone, ClipboardList, Settings2, ChevronRight, CheckCircle2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = {
  bg: "#0F221D",
  surface: "#17332B",
  surfaceRaised: "#1E3F35",
  hibiscus: "#E23F63",
  hibiscusDim: "#C8385B",
  gold: "#F0B429",
  text: "#F4EFE3",
  muted: "#8FA89C",
  line: "#2C4F44",
  danger: "#E23F63",
  success: "#5FBF8F",
};

const fmt = (n) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));

const todayStr = () => new Date().toISOString().slice(0, 10);

const dayLabel = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

function useStorage() {
  const [entries, setEntries] = useState([]);
  const [config, setConfig] = useState({ nomVendeur: "", prixVente: "", coutUnitaire: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let list = [];
      try {
        const r = await window.storage.get("entries-list", true);
        list = r?.value ? JSON.parse(r.value) : [];
      } catch (e) {
        list = [];
      }
      let cfg = { nomVendeur: "", prixVente: "", coutUnitaire: "" };
      try {
        const r2 = await window.storage.get("config", true);
        cfg = r2?.value ? JSON.parse(r2.value) : cfg;
      } catch (e) {
        // no config yet
      }
      setEntries(list.sort((a, b) => (a.date < b.date ? 1 : -1)));
      setConfig(cfg);
    } catch (e) {
      setError("Impossible de charger les données. Vérifie ta connexion.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveEntries = async (list) => {
    const sorted = [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
    setEntries(sorted);
    try {
      await window.storage.set("entries-list", JSON.stringify(sorted), true);
    } catch (e) {
      setError("Échec de l'enregistrement. Réessaie.");
    }
  };

  const saveConfig = async (cfg) => {
    setConfig(cfg);
    try {
      await window.storage.set("config", JSON.stringify(cfg), true);
    } catch (e) {
      setError("Échec de l'enregistrement des réglages.");
    }
  };

  return { entries, config, loading, error, saveEntries, saveConfig, reload: load };
}

function Stat({ label, value, sub, accent }) {
  return (
    <div
      className="rounded-2xl p-4 flex-1 min-w-0"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}
    >
      <div className="text-xs uppercase tracking-wide" style={{ color: COLORS.muted, fontFamily: "Inter, sans-serif" }}>
        {label}
      </div>
      <div
        className="mt-1 text-2xl font-bold truncate"
        style={{ color: accent || COLORS.text, fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-xs mt-1" style={{ color: COLORS.muted }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function EntryForm({ onSave, existing }) {
  const [date, setDate] = useState(existing?.date || todayStr());
  const [ventes, setVentes] = useState(existing?.ventesFCFA ?? "");
  const [mobileMoney, setMobileMoney] = useState(existing?.mobileMoneyFCFA ?? "");
  const [portions, setPortions] = useState(existing?.portions ?? "");
  const [stockRestant, setStockRestant] = useState(existing?.stockRestant ?? "");
  const [depenses, setDepenses] = useState(existing?.depenses ?? "");
  const [note, setNote] = useState(existing?.note || "");
  const [saved, setSaved] = useState(false);

  const inputStyle = {
    background: COLORS.bg,
    border: `1px solid ${COLORS.line}`,
    color: COLORS.text,
  };

  const handleSubmit = async () => {
    if (!date || ventes === "") return;
    await onSave({
      id: existing?.id || `${date}-${Date.now()}`,
      date,
      ventesFCFA: Number(ventes) || 0,
      mobileMoneyFCFA: Number(mobileMoney) || 0,
      portions: Number(portions) || 0,
      stockRestant: Number(stockRestant) || 0,
      depenses: Number(depenses) || 0,
      note,
      createdAt: existing?.createdAt || new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (!existing) {
      setVentes("");
      setMobileMoney("");
      setPortions("");
      setStockRestant("");
      setDepenses("");
      setNote("");
    }
  };

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs" style={{ color: COLORS.muted }}>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full mt-1 rounded-lg px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs" style={{ color: COLORS.muted }}>Ventes du jour (FCFA)</label>
          <input
            type="number"
            inputMode="numeric"
            value={ventes}
            onChange={(e) => setVentes(e.target.value)}
            placeholder="0"
            className="w-full mt-1 rounded-lg px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs" style={{ color: COLORS.muted }}>Montant Mobile Money reçu (FCFA)</label>
          <input
            type="number"
            inputMode="numeric"
            value={mobileMoney}
            onChange={(e) => setMobileMoney(e.target.value)}
            placeholder="0"
            className="w-full mt-1 rounded-lg px-3 py-2 text-sm"
            style={inputStyle}
          />
          {ventes !== "" && mobileMoney !== "" && (
            <div
              className="text-xs mt-1"
              style={{ color: Math.abs((Number(ventes) || 0) - (Number(mobileMoney) || 0)) > 0 ? COLORS.hibiscus : COLORS.success }}
            >
              Écart : {fmt((Number(ventes) || 0) - (Number(mobileMoney) || 0))} FCFA
            </div>
          )}
        </div>
        <div>
          <label className="text-xs" style={{ color: COLORS.muted }}>Portions vendues</label>
          <input
            type="number"
            inputMode="numeric"
            value={portions}
            onChange={(e) => setPortions(e.target.value)}
            placeholder="0"
            className="w-full mt-1 rounded-lg px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs" style={{ color: COLORS.muted }}>Stock restant</label>
          <input
            type="number"
            inputMode="numeric"
            value={stockRestant}
            onChange={(e) => setStockRestant(e.target.value)}
            placeholder="0"
            className="w-full mt-1 rounded-lg px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs" style={{ color: COLORS.muted }}>Dépenses (FCFA)</label>
          <input
            type="number"
            inputMode="numeric"
            value={depenses}
            onChange={(e) => setDepenses(e.target.value)}
            placeholder="0"
            className="w-full mt-1 rounded-lg px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs" style={{ color: COLORS.muted }}>Note (optionnel)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex: panne machine, forte affluence..."
            className="w-full mt-1 rounded-lg px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
      </div>
      <button
        onClick={handleSubmit}
        className="w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-opacity active:opacity-80"
        style={{ background: saved ? COLORS.success : COLORS.hibiscus, color: "#fff", fontFamily: "Inter, sans-serif" }}
      >
        {saved ? <><CheckCircle2 size={18} /> Enregistré</> : <><Plus size={18} /> {existing ? "Mettre à jour" : "Enregistrer la journée"}</>}
      </button>
    </div>
  );
}

export default function App() {
  const { entries, config, loading, error, saveEntries, saveConfig } = useStorage();
  const [tab, setTab] = useState("saisie");
  const [editingId, setEditingId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleSave = async (entry) => {
    const others = entries.filter((e) => e.id !== entry.id && e.date !== entry.date);
    await saveEntries([...others, entry]);
    setEditingId(null);
  };

  const now = new Date();
  const days = (n) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };
  const last7 = entries.filter((e) => e.date >= days(6));
  const last30 = entries.filter((e) => e.date >= days(29));

  const sum = (list, key) => list.reduce((a, e) => a + (Number(e[key]) || 0), 0);
  const ventes7 = sum(last7, "ventesFCFA");
  const depenses7 = sum(last7, "depenses");
  const marge7 = ventes7 - depenses7;
  const ventes30 = sum(last30, "ventesFCFA");
  const mobileMoney7 = sum(last7, "mobileMoneyFCFA");
  const ecart7 = ventes7 - mobileMoney7;

  const lastEntry = entries[0];
  const daysSince = lastEntry
    ? Math.floor((now - new Date(lastEntry.date + "T00:00:00")) / 86400000)
    : null;
  const missingReport = daysSince === null || daysSince >= 2;

  const chartData = [...last7]
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .map((e) => ({ date: dayLabel(e.date), ventes: e.ventesFCFA }));

  const editingEntry = entries.find((e) => e.id === editingId);

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: COLORS.bg, fontFamily: "Inter, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;700&display=swap');
        input:focus { outline: 2px solid ${COLORS.gold}; outline-offset: 1px; }
        button:focus-visible { outline: 2px solid ${COLORS.gold}; outline-offset: 2px; }
      `}</style>

      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        <div className="flex items-center gap-2 mb-1">
          <IceCreamCone size={22} color={COLORS.gold} />
          <h1 style={{ fontFamily: "'Fraunces', serif", color: COLORS.text }} className="text-2xl font-bold">
            Suivi du chariot
          </h1>
        </div>
        <p className="text-sm mb-5" style={{ color: COLORS.muted }}>
          {config.nomVendeur ? `Géré par ${config.nomVendeur} · ` : ""}Données visibles par toute personne ayant ce lien
        </p>

        {error && (
          <div className="mb-4 rounded-xl p-3 text-sm flex items-center gap-2" style={{ background: "rgba(226,63,99,0.15)", color: COLORS.hibiscus }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {missingReport && !loading && (
          <div
            className="mb-4 rounded-xl p-3 text-sm flex items-center gap-2"
            style={{ background: "rgba(240,180,41,0.12)", color: COLORS.gold, border: `1px solid ${COLORS.gold}` }}
          >
            <AlertTriangle size={16} />
            {lastEntry
              ? `Aucune saisie depuis ${daysSince} jours (dernière : ${dayLabel(lastEntry.date)})`
              : "Aucune saisie enregistrée pour l'instant"}
          </div>
        )}

        {/* Tabs */}
        <div className="flex rounded-xl p-1 mb-5" style={{ background: COLORS.surface }}>
          {[
            { id: "saisie", label: "Saisie", icon: ClipboardList },
            { id: "dashboard", label: "Tableau de bord", icon: TrendingUp },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: tab === t.id ? COLORS.hibiscus : "transparent",
                color: tab === t.id ? "#fff" : COLORS.muted,
              }}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-10 text-sm" style={{ color: COLORS.muted }}>Chargement...</div>
        ) : tab === "saisie" ? (
          <div className="space-y-4">
            <EntryForm onSave={handleSave} existing={editingEntry} />
            {editingId && (
              <button
                onClick={() => setEditingId(null)}
                className="text-xs underline"
                style={{ color: COLORS.muted }}
              >
                Annuler la modification
              </button>
            )}
            <div>
              <div className="text-xs uppercase tracking-wide mb-2" style={{ color: COLORS.muted }}>
                Historique récent
              </div>
              <div className="space-y-2">
                {entries.slice(0, 10).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setEditingId(e.id)}
                    className="w-full text-left rounded-xl p-3 flex items-center justify-between"
                    style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}
                  >
                    <div>
                      <div className="text-sm font-medium" style={{ color: COLORS.text }}>{dayLabel(e.date)}</div>
                      <div className="text-xs" style={{ color: COLORS.muted }}>{e.portions} portions · {fmt(e.depenses)} FCFA dépenses</div>
                      {(e.ventesFCFA || 0) - (e.mobileMoneyFCFA || 0) !== 0 && (
                        <div className="text-xs mt-0.5" style={{ color: COLORS.hibiscus }}>
                          Écart MoMo : {fmt((e.ventesFCFA || 0) - (e.mobileMoneyFCFA || 0))} F
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div style={{ color: COLORS.gold, fontFamily: "'IBM Plex Mono', monospace" }} className="font-bold text-sm">
                        {fmt(e.ventesFCFA)} F
                      </div>
                      <ChevronRight size={14} color={COLORS.muted} />
                    </div>
                  </button>
                ))}
                {entries.length === 0 && (
                  <div className="text-sm text-center py-6" style={{ color: COLORS.muted }}>
                    Aucune journée enregistrée pour le moment.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Stat label="Ventes 7 jours" value={`${fmt(ventes7)} F`} accent={COLORS.gold} />
              <Stat label="Marge 7 jours" value={`${fmt(marge7)} F`} accent={marge7 >= 0 ? COLORS.success : COLORS.hibiscus} />
            </div>
            <div className="flex gap-3">
              <Stat label="Ventes 30 jours" value={`${fmt(ventes30)} F`} />
              <Stat label="Jours saisis (30j)" value={`${last30.length}`} sub="sur environ 30 jours" />
            </div>

            <Stat
              label="Écart déclaré vs Mobile Money (7j)"
              value={`${ecart7 >= 0 ? "+" : ""}${fmt(ecart7)} F`}
              accent={ecart7 === 0 ? COLORS.success : COLORS.hibiscus}
              sub={
                ecart7 === 0
                  ? "Aucun écart détecté"
                  : ecart7 > 0
                  ? "Ventes déclarées > Mobile Money reçu — à vérifier"
                  : "Mobile Money > ventes déclarées"
              }
            />

            <div className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
              <div className="text-xs uppercase tracking-wide mb-3" style={{ color: COLORS.muted }}>
                Évolution des ventes (7 jours)
              </div>
              {chartData.length > 1 ? (
                <div style={{ width: "100%", height: 180 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid stroke={COLORS.line} strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke={COLORS.muted} tick={{ fontSize: 11 }} />
                      <YAxis stroke={COLORS.muted} tick={{ fontSize: 11 }} width={40} />
                      <Tooltip
                        contentStyle={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.line}`, borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: COLORS.text }}
                      />
                      <Line type="monotone" dataKey="ventes" stroke={COLORS.gold} strokeWidth={2.5} dot={{ fill: COLORS.gold, r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-sm text-center py-6" style={{ color: COLORS.muted }}>
                  Pas assez de données pour un graphique.
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSettings((s) => !s)}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
              style={{ background: COLORS.surface, color: COLORS.muted, border: `1px solid ${COLORS.line}` }}
            >
              <Settings2 size={15} /> Réglages
            </button>

            {showSettings && (
              <div className="rounded-2xl p-4 space-y-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
                <div>
                  <label className="text-xs" style={{ color: COLORS.muted }}>Nom du/de la gérant(e)</label>
                  <input
                    type="text"
                    value={config.nomVendeur}
                    onChange={(e) => saveConfig({ ...config, nomVendeur: e.target.value })}
                    className="w-full mt-1 rounded-lg px-3 py-2 text-sm"
                    style={{ background: COLORS.bg, border: `1px solid ${COLORS.line}`, color: COLORS.text }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
