export function FormField({ label, error, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

export function Input({ label, error, ...props }) {
  return (
    <FormField label={label} error={error}>
      <input className="input-base" {...props} />
    </FormField>
  )
}

export function Select({ label, error, options, placeholder, ...props }) {
  return (
    <FormField label={label} error={error}>
      <select className="select-base" {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options?.map(opt =>
          typeof opt === 'string'
            ? <option key={opt} value={opt}>{opt}</option>
            : <option key={opt.value} value={opt.value}>{opt.label}</option>
        )}
      </select>
    </FormField>
  )
}

export function Textarea({ label, error, ...props }) {
  return (
    <FormField label={label} error={error}>
      <textarea className="input-base resize-none" rows={3} {...props} />
    </FormField>
  )
}
