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
  multiValue: (base) => ({
    ...base,
    background: '#334155',
    borderRadius: '4px',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#e2e8f0',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#94a3b8',
    '&:hover': { background: '#475569', color: '#ef4444' },
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
  isMulti = false,
}) {
  const selectOptions = options.map((opt) => ({
    value: opt.id,
    label: opt.name,
  }))

  let selectedOption
  if (isMulti) {
    const vals = value || []
    selectedOption = selectOptions.filter((o) => vals.includes(o.value))
  } else {
    selectedOption = value
      ? selectOptions.find((o) => o.value === value) || null
      : null
  }

  const handleChange = (opt) => {
    if (isMulti) {
      onChange(opt ? opt.map((o) => o.value) : [])
    } else {
      onChange(opt ? opt.value : null)
    }
  }

  const handleCreate = async (inputValue) => {
    const created = await onCreate(inputValue)
    // For multi mode, return the created item so we can add it to selection
    return created
  }

  return (
    <CreatableSelect
      isClearable
      isSearchable
      isMulti={isMulti}
      isLoading={isLoading}
      options={selectOptions}
      value={selectedOption}
      onChange={handleChange}
      onCreateOption={handleCreate}
      placeholder={placeholder}
      styles={customStyles}
      formatCreateLabel={(input) => `Create "${input}"`}
    />
  )
}
