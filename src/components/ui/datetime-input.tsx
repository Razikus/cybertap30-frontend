// components/ui/datetime-input.tsx
import { Input } from '@/components/ui/input'

interface DateTimeInputProps {
    value: string | null | undefined  // ISO string lub null/undefined
    onChange: (isoString: string) => void
    className?: string
}

export function DateTimeInput({ value, onChange, className }: DateTimeInputProps) {
    const localValue = value
        ? new Date(value).toLocaleString('sv').slice(0, 16).replace(' ', 'T')
        : ''

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            onChange(new Date(e.target.value).toISOString())
        } else {
            onChange('')
        }
    }

    return (
        <Input
            type="datetime-local"
            value={localValue}
            onChange={handleChange}
            className={className}
        />
    )
}