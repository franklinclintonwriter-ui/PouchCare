import Button from "../../../components/ui/Button";

export default function CrudActions({ onEdit, onDelete, editLabel = "Edit", deleteLabel = "Delete" }) {
  return (
    <div className="flex items-center gap-2">
      {onEdit ? (
        <Button variant="secondary" size="sm" onClick={onEdit}>
          {editLabel}
        </Button>
      ) : null}
      {onDelete ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700"
          onClick={() => {
            if (window.confirm("Are you sure you want to continue?")) onDelete();
          }}
        >
          {deleteLabel}
        </Button>
      ) : null}
    </div>
  );
}
