import React, { useState } from "react";
import { useMail } from "../context/MailContext";
import { useAuth } from "../context/AuthContext";
import TiptapEditor from "./TiptapEditor";

export default function ComposeModal({ onClose }) {
  const { user } = useAuth();
  const { contacts, sendNewMessage } = useMail();

  /* ── Mode: "individuel" | "diffusion" | "groupe" ── */
  const [messageMode, setMessageMode] = useState("individuel");

  /* ── Shared state ── */
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  /* ── Individuel ── */
  const [receiverId, setReceiverId] = useState("");

  /* ── Diffusion + Groupe shared ── */
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [contactSearch, setContactSearch] = useState("");

  const filteredContacts = contacts.filter((c) =>
    `${c.nomComplet} ${c.email} ${c.entrepriseNom}`
      .toLowerCase()
      .includes(contactSearch.toLowerCase())
  );

  const toggleContact = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ── Select All / Deselect All helpers ── */
  const allFilteredIds = filteredContacts.map((c) => c.id);
  const allFilteredSelected =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => selectedIds.includes(id));

  const selectAll = () => {
    setSelectedIds((prev) => {
      const newSet = new Set([...prev, ...allFilteredIds]);
      return Array.from(newSet);
    });
  };

  const deselectAll = () => {
    setSelectedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
  };

  /* ── Mode switch: reset selection state cleanly ── */
  const switchMode = (mode) => {
    setMessageMode(mode);
    setErrorMessage("");
    setSelectedIds([]);
    setContactSearch("");
    setGroupName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (messageMode === "individuel") {
      if (!receiverId || !subject.trim() || !body.trim()) {
        setErrorMessage("Veuillez remplir tous les champs obligatoires.");
        return;
      }
    } else if (messageMode === "diffusion") {
      if (selectedIds.length < 1) {
        setErrorMessage("Sélectionnez au moins 1 destinataire pour une diffusion.");
        return;
      }
      if (!subject.trim() || !body.trim()) {
        setErrorMessage("Veuillez remplir tous les champs obligatoires.");
        return;
      }
    } else {
      // groupe
      if (selectedIds.length < 2) {
        setErrorMessage("Sélectionnez au moins 2 participants pour un groupe.");
        return;
      }
      if (!groupName.trim()) {
        setErrorMessage("Veuillez saisir un nom pour le groupe.");
        return;
      }
      if (!subject.trim() || !body.trim()) {
        setErrorMessage("Veuillez remplir tous les champs obligatoires.");
        return;
      }
    }

    setIsSending(true);
    try {
      await sendNewMessage({
        subject: subject.trim(),
        body: body.trim(),
        receiverId: messageMode === "individuel" ? receiverId : undefined,
        receiverIds:
          messageMode === "individuel" ? [receiverId] : selectedIds,
        titreGroupe: messageMode === "groupe" ? groupName.trim() : undefined,
        estDiffusion: messageMode === "diffusion",
        attachments,
      });
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Une erreur est survenue lors de l'envoi.");
    } finally {
      setIsSending(false);
    }
  };

  /* ── Tab style helper ── */
  const modeTabClass = (mode) =>
    `flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition rounded-lg ${
      messageMode === mode
        ? "bg-white text-blue-700 shadow-sm border border-blue-200"
        : "text-slate-500 hover:text-slate-700"
    }`;

  /* ── Header icon/title by mode ── */
  const headerIcon =
    messageMode === "groupe" ? (
      /* Users icon */
      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ) : messageMode === "diffusion" ? (
      /* Broadcast icon */
      <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ) : (
      /* Envelope icon */
      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );

  const headerTitle =
    messageMode === "groupe"
      ? "Créer un groupe de discussion"
      : messageMode === "diffusion"
      ? "Envoi multiple — Diffusion"
      : "Nouveau Message Interne";

  /* ── Multi-select contact list (shared between diffusion & groupe) ── */
  const MultiSelectPanel = ({ requireMin, label }) => (
    <>
      {/* Label row + counter badge */}
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
          {label}
          {requireMin && (
            <span className="normal-case font-normal text-slate-400 ml-1">(min. {requireMin})</span>
          )}
        </label>
        {selectedIds.length > 0 && (
          <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full animate-pulse-once">
            {selectedIds.length} contact{selectedIds.length > 1 ? "s" : ""} sélectionné{selectedIds.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Select All / Deselect All buttons */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={selectAll}
          disabled={isSending || allFilteredSelected}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tout sélectionner
        </button>
        <button
          type="button"
          onClick={deselectAll}
          disabled={isSending || selectedIds.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Désélectionner tout
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-2">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher un contact..."
          value={contactSearch}
          onChange={(e) => setContactSearch(e.target.value)}
          className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition"
          disabled={isSending}
        />
      </div>

      {/* Selected tags */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedIds.map((id) => {
            const c = contacts.find((x) => x.id === id);
            return c ? (
              <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-600 text-white text-xs font-medium rounded-full">
                {c.nomComplet}
                <button type="button" onClick={() => toggleContact(id)} className="hover:text-violet-200 transition ml-0.5">✕</button>
              </span>
            ) : null;
          })}
        </div>
      )}

      {/* Contact list */}
      <div className="border border-slate-200 rounded-lg overflow-hidden max-h-44 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">Aucun contact trouvé.</div>
        ) : (
          filteredContacts.map((contact) => {
            const isSelected = selectedIds.includes(contact.id);
            return (
              <label
                key={contact.id}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition select-none border-b border-slate-100 last:border-0 ${
                  isSelected ? "bg-violet-50" : "hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleContact(contact.id)}
                  className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                  disabled={isSending}
                />
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold uppercase flex-shrink-0 ${
                  isSelected ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  {contact.nomComplet.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{contact.nomComplet}</p>
                  <p className="text-[10px] text-slate-400 truncate">{contact.role} — {contact.entrepriseNom}</p>
                </div>
              </label>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden m-4 max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            {headerIcon}
            <h3 className="font-bold tracking-wide text-sm uppercase">{headerTitle}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition text-xl outline-none" disabled={isSending}>✕</button>
        </div>

        {/* Mode Toggle — 3 tabs */}
        <div className="px-6 pt-4 pb-2 flex-shrink-0">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            <button type="button" className={modeTabClass("individuel")} onClick={() => switchMode("individuel")} disabled={isSending}>
              ✉️ Message individuel
            </button>
            <button type="button" className={modeTabClass("diffusion")} onClick={() => switchMode("diffusion")} disabled={isSending}>
              📣 Envoi multiple
            </button>
            <button type="button" className={modeTabClass("groupe")} onClick={() => switchMode("groupe")} disabled={isSending}>
              👥 Créer un groupe
            </button>
          </div>
        </div>

        {/* Diffusion info banner */}
        {messageMode === "diffusion" && (
          <div className="mx-6 mb-1 px-4 py-2.5 bg-violet-50 border border-violet-200 rounded-lg flex items-start gap-2.5">
            <svg className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[11px] text-violet-700 leading-snug">
              <strong>Diffusion :</strong> chaque destinataire reçoit un message individuel indépendant — ils ne se voient pas entre eux.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4 overflow-y-auto flex-1">

          {errorMessage && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* ── INDIVIDUEL MODE ── */}
          {messageMode === "individuel" && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">
                Destinataire *
              </label>
              <select
                required
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                disabled={isSending}
              >
                <option value="">Sélectionnez un contact...</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.nomComplet} ({contact.role} — {contact.entrepriseNom})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── DIFFUSION MODE ── */}
          {messageMode === "diffusion" && (
            <div>
              <MultiSelectPanel
                requireMin={null}
                label="Destinataires *"
              />
            </div>
          )}

          {/* ── GROUPE MODE ── */}
          {messageMode === "groupe" && (
            <>
              {/* Group name */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">
                  Nom du groupe *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ex: Équipe RH, Projet de partenariat..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  disabled={isSending}
                />
              </div>

              {/* Multi-select contacts */}
              <div>
                <MultiSelectPanel
                  requireMin={2}
                  label="Participants *"
                />
              </div>
            </>
          )}

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">
              Objet du message *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Suivi du dossier de partenariat / Rectification des accès"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
              disabled={isSending}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">
              Message *
            </label>
            <TiptapEditor
              content={body}
              onChange={setBody}
              placeholder="Écrivez votre message professionnel ici..."
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                disabled={isSending}
              >
                Annuler
              </button>
              <button
                type="submit"
                className={`px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2 ${
                  messageMode === "diffusion"
                    ? "bg-violet-600 hover:bg-violet-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Envoi...
                  </>
                ) : messageMode === "groupe" ? (
                  "Créer le groupe"
                ) : messageMode === "diffusion" ? (
                  `📣 Diffuser${selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}`
                ) : (
                  "Envoyer le message"
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
