import { useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

export default function CompanyNotesPanel({ notes, onAddNote, onUpdateNote, onDeleteNote }) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState({});

  const sorted = useMemo(() => [...(notes || [])].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), [notes]);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Internal Notes</h3>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add private internal note" />
        <Button
          size="sm"
          onClick={() => {
            const text = draft.trim();
            if (!text) return;
            onAddNote(text);
            setDraft("");
          }}
        >
          Add Note
        </Button>
      </div>

      <div className="space-y-2">
        {sorted.length === 0 ? <p className="text-sm text-slate-500">No internal notes yet.</p> : null}
        {sorted.map((note) => {
          const isEditing = Object.prototype.hasOwnProperty.call(editing, note.id);
          const value = isEditing ? editing[note.id] : note.text;
          return (
            <div key={note.id} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                <span>{note.author || "Admin"}</span>
                <span>{note.createdAt}</span>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Input value={value} onChange={(e) => setEditing((prev) => ({ ...prev, [note.id]: e.target.value }))} />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const next = value.trim();
                        if (!next) return;
                        onUpdateNote(note.id, next);
                        setEditing((prev) => {
                          const copy = { ...prev };
                          delete copy[note.id];
                          return copy;
                        });
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setEditing((prev) => {
                          const copy = { ...prev };
                          delete copy[note.id];
                          return copy;
                        })
                      }
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-700">{note.text}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditing((prev) => ({ ...prev, [note.id]: note.text }))}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDeleteNote(note.id)}>
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

