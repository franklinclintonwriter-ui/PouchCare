import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Card from "../../../components/ui/Card";

export default function CrudCreateForm({ title, fields, values, onChange, onSubmit, submitLabel = "Create" }) {
  return (
    <Card hover={false} className="p-4 md:p-5">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
        {fields.map((field) => {
          if (field.type === "select") {
            return (
              <Select
                key={field.key}
                value={values[field.key] || ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                required={field.required !== false}
                className={field.full ? "sm:col-span-2" : ""}
              >
                {(field.options || []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            );
          }

          if (field.type === "textarea") {
            return (
              <textarea
                key={field.key}
                placeholder={field.placeholder || field.label}
                value={values[field.key] || ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                required={field.required !== false}
                rows={field.rows || 4}
                className={`w-full rounded-btn border border-gray-200 bg-white px-4 py-2.5 text-sm text-heading placeholder:text-body/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${field.full ? "sm:col-span-2" : ""}`}
              />
            );
          }

          return (
            <Input
              key={field.key}
              type={field.type || "text"}
              placeholder={field.placeholder || field.label}
              value={values[field.key] || ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              required={field.required !== false}
              className={field.full ? "sm:col-span-2" : ""}
            />
          );
        })}
        <div className="sm:col-span-2">
          <Button type="submit" size="sm">{submitLabel}</Button>
        </div>
      </form>
    </Card>
  );
}
