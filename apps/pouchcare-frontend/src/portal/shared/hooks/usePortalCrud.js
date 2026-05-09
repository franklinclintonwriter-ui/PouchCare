import { useState, useCallback } from "react";

/**
 * Generic CRUD form-state hook.
 *
 * Manages the create / edit form lifecycle:
 *   showForm, editingItem, openCreate, openEdit, close, handleSubmit.
 *
 * @param {Object} options
 * @param {Function} options.onCreate  — (formData) => void
 * @param {Function} options.onUpdate  — (id, formData) => void
 * @param {Function} options.onDelete  — (id) => void
 * @returns {{ showForm, editingItem, openCreate, openEdit, close, handleSubmit, handleDelete }}
 */
export function usePortalCrud({ onCreate, onUpdate, onDelete } = {}) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const openCreate = useCallback(() => {
    setEditingItem(null);
    setShowForm(true);
  }, []);

  const openEdit = useCallback((item) => {
    setEditingItem(item);
    setShowForm(true);
  }, []);

  const close = useCallback(() => {
    setEditingItem(null);
    setShowForm(false);
  }, []);

  /**
   * Submit handler — routes to onCreate or onUpdate based on editingItem.
   * Automatically closes the form on success.
   */
  const handleSubmit = useCallback(
    (formData) => {
      if (editingItem) {
        onUpdate?.(editingItem.id, formData);
      } else {
        onCreate?.(formData);
      }
      close();
    },
    [editingItem, onCreate, onUpdate, close]
  );

  const handleDelete = useCallback(
    (id) => {
      onDelete?.(id);
    },
    [onDelete]
  );

  return {
    showForm,
    editingItem,
    openCreate,
    openEdit,
    close,
    handleSubmit,
    handleDelete,
  };
}
