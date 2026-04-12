import CreatableSelect from 'react-select/creatable'

const customStyles = {
  control: (base, state) => ({
    ...base,
    background: '#1e293b',
    borderColor: state.isFocused ? '#3b82f6' : '#334155',
    boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
    '&:hover': { borderColor: '#3b82f6' },
    minHeight: '42px',
  }),
  menu: (base) => ({
    ...base,
    background: '#1e293b',
    border: '1px solid #334155',
  }),
  option: (base, state) => ({
    ...base,
    background: state.isFocused ? '#334155' : 'transparent',
    color: '#e2e8f0',
    cursor: 'pointer',
  }),
  singleValue: (base) => ({
    ...base,
    color: '#e2e8f0',
  }),
  input: (base) => ({
    ...base,
    color: '#e2e8f0',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#64748b',
  }),
}

export default function CreatableDropdown({
  options,
  value,
  onChange,
  onCreate,
  placeholder,
  isLoading,
}) {
  const selectOptions = options.map((opt) => ({
    value: opt.id,
    label: opt.name,
  }))

  const selectedOption = value
    ? selectOptions.find((o) => o.value === value) || null
    : null

  return (
    <CreatableSelect
      isClearable
      isSearchable
      isLoading={isLoading}
      options={selectOptions}
      value={selectedOption}
      onChange={(opt) => onChange(opt ? opt.value : null)}
      onCreateOption={onCreate}
      placeholder={placeholder}
      styles={customStyles}
      formatCreateLabel={(input) => `Create "${input}"`}
    />
  )
}
